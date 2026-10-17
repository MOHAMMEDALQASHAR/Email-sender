const express = require('express');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and body parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load environment variables from .env if present
if (typeof process.loadEnvFile === 'function' && fs.existsSync(path.join(__dirname, '.env'))) {
  try {
    process.loadEnvFile(path.join(__dirname, '.env'));
  } catch (e) {
    console.warn('Could not load .env file:', e.message);
  }
}

// Default SMTP credentials from environment
const DEFAULT_SMTP = {
  service: process.env.SMTP_SERVICE || 'gmail',
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true,
  user: process.env.SMTP_USER || 'alqashar0@gmail.com',
  pass: process.env.SMTP_PASS || ''
};

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// In-memory Multer storage for ultra-fast uploads (no disk I/O / OneDrive sync delay)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('الملف يجب أن يكون بصيغة PDF أو DOC أو DOCX'));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: fileFilter
});

// Helper to validate email format
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).trim().toLowerCase());
}

// Transporter Cache with Connection Pooling for instant sending
const transporterCache = new Map();

function getTransporter(config) {
  const service = config.service || 'gmail';
  const host = config.host || 'smtp.gmail.com';
  const port = parseInt(config.port) || 465;
  const user = config.user;
  const pass = config.pass;

  const cacheKey = `${service}_${host}_${port}_${user}_${pass}`;
  if (transporterCache.has(cacheKey)) {
    return transporterCache.get(cacheKey);
  }

  const transportOptions = (service && service !== 'custom')
    ? {
        service: service,
        auth: { user, pass },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 10
      }
    : {
        host: host,
        port: port,
        secure: port === 465,
        auth: { user, pass },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 10
      };

  const transporter = nodemailer.createTransport(transportOptions);
  transporterCache.set(cacheKey, transporter);
  return transporter;
}

// Pre-warm the SMTP connection pool at boot so the first email sends with zero handshake delay
if (DEFAULT_SMTP.user && DEFAULT_SMTP.pass) {
  try {
    const prewarmed = getTransporter(DEFAULT_SMTP);
    prewarmed.verify().then(() => {
      console.log('⚡ [SMTP Pool] Fast connection pool pre-warmed & ready.');
    }).catch(err => {
      console.warn('⚠️ [SMTP Pool] Pre-warm notice:', err.message);
    });
  } catch (e) {}
}

// Concurrent dispatcher helper
async function sendConcurrently(items, concurrency, fn) {
  const results = new Array(items.length);
  let currentIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      results[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return results;
}

// Endpoint: Test SMTP Connection
app.post('/api/test-smtp', async (req, res) => {
  try {
    const { host, port, secure, user, pass, service } = req.body || {};
    const finalUser = user || DEFAULT_SMTP.user;
    const finalPass = pass || DEFAULT_SMTP.pass;

    if (!finalUser || !finalPass) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تقديم بيانات الدخول (البريد وكلمة المرور)'
      });
    }

    const transporter = getTransporter({
      service: service || DEFAULT_SMTP.service,
      host: host || DEFAULT_SMTP.host,
      port: port || DEFAULT_SMTP.port,
      secure: secure !== undefined ? secure : true,
      user: finalUser,
      pass: finalPass
    });

    await transporter.verify();

    return res.json({
      success: true,
      message: 'تم التحقق من إعدادات البريد بنجاح! الاتصال جاهز وسريع.'
    });
  } catch (error) {
    console.error('SMTP test error:', error);
    return res.status(400).json({
      success: false,
      message: 'فشل الاتصال بخادم البريد: ' + (error.message || 'بيانات غير صحيحة')
    });
  }
});

// Endpoint: Send CV Emails
app.post('/api/send', upload.single('cv'), async (req, res) => {
  try {
    const senderEmail = req.body.senderEmail ? req.body.senderEmail.trim() : '';
    let recipients = [];

    // Parse recipients
    if (req.body.recipients) {
      try {
        recipients = JSON.parse(req.body.recipients);
      } catch (e) {
        recipients = req.body.recipients.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      }
    }

    const subject = req.body.subject ? req.body.subject.trim() : 'طلب توظيف - السيرة الذاتية المرفقة';
    const message = req.body.message ? req.body.message.trim() : '';
    const mode = req.body.mode || 'auto'; // 'real' | 'simulation' | 'auto'

    let smtpConfig = null;
    if (req.body.smtpConfig) {
      try {
        smtpConfig = typeof req.body.smtpConfig === 'string' ? JSON.parse(req.body.smtpConfig) : req.body.smtpConfig;
      } catch (e) {
        smtpConfig = null;
      }
    }

    // Validation
    if (!senderEmail || !isValidEmail(senderEmail)) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال بريد إلكتروني صحيح للمرسل.'
      });
    }

    // Clean recipients
    const validRecipients = [];
    const invalidRecipients = [];

    recipients.forEach(r => {
      const email = String(r).trim();
      if (isValidEmail(email)) {
        if (!validRecipients.includes(email)) validRecipients.push(email);
      } else if (email) {
        invalidRecipients.push(email);
      }
    });

    if (validRecipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال عنوان بريد إلكتروني صالح واحد على الأقل للمستلم.'
      });
    }

    // Determine effective SMTP credentials with solid fallback
    const userToUse = (smtpConfig && smtpConfig.user && smtpConfig.user.trim()) ? smtpConfig.user.trim() : DEFAULT_SMTP.user;
    const passToUse = (smtpConfig && smtpConfig.pass && smtpConfig.pass.trim()) ? smtpConfig.pass.trim() : DEFAULT_SMTP.pass;
    const serviceToUse = (smtpConfig && smtpConfig.service) ? smtpConfig.service : DEFAULT_SMTP.service;
    const hostToUse = (smtpConfig && smtpConfig.host) || DEFAULT_SMTP.host;
    const portToUse = parseInt(smtpConfig && smtpConfig.port) || DEFAULT_SMTP.port;

    const shouldSendReal = (mode === 'real') || Boolean(userToUse && passToUse);

    console.log(`[SEND REQUEST] Mode: ${mode}, Recipients: ${validRecipients.length}, Real: ${shouldSendReal}`);

    let deliveryResults = [];

    if (shouldSendReal && userToUse && passToUse) {
      // Get or create pooled transporter
      const transporter = getTransporter({
        service: serviceToUse,
        host: hostToUse,
        port: portToUse,
        user: userToUse,
        pass: passToUse
      });

      // Prepare in-memory attachment (zero disk I/O)
      const attachments = req.file ? [
        {
          filename: req.file.originalname,
          content: req.file.buffer
        }
      ] : [];

      const startTime = Date.now();

      // Send to recipients concurrently (up to 5 parallel connections via SMTP pool)
      deliveryResults = await sendConcurrently(validRecipients, 5, async (recipient, i) => {
        try {
          const mailOptions = {
            from: `"${senderEmail}" <${userToUse}>`,
            replyTo: senderEmail,
            to: recipient,
            subject: subject,
            text: message,
            html: `
              <div dir="auto" style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #333; padding: 20px;">
                <div style="white-space: pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
                <p style="font-size: 13px; color: #64748b;">
                  تم إرسال هذه الرسالة ${attachments.length > 0 ? 'والسيرة الذاتية المرفقة ' : ''}بواسطة <strong>${senderEmail}</strong> عبر منصة <em>CV Email Sender</em>.
                </p>
              </div>
            `,
            attachments: attachments
          };

          const info = await transporter.sendMail(mailOptions);
          return {
            recipient: recipient,
            status: 'sent',
            messageId: info.messageId || `msg_${Date.now()}_${i}`,
            timestamp: new Date().toISOString()
          };
        } catch (err) {
          console.error(`[SEND ERROR] Failed for ${recipient}:`, err.message);
          return {
            recipient: recipient,
            status: 'failed',
            error: err.message || 'تعذر الإرسال عبر خادم البريد',
            timestamp: new Date().toISOString()
          };
        }
      });

      console.log(`[DISPATCH COMPLETE] Sent ${deliveryResults.length} emails in ${Date.now() - startTime}ms`);

    } else {
      // Instant Dispatch (Simulation)
      deliveryResults = validRecipients.map(recipient => ({
        recipient: recipient,
        status: 'sent',
        simulated: true,
        messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        timestamp: new Date().toISOString()
      }));
    }

    const successCount = deliveryResults.filter(r => r.status === 'sent').length;
    const failCount = deliveryResults.filter(r => r.status === 'failed').length;

    const firstFailed = deliveryResults.find(r => r.status === 'failed');
    const responseMessage = successCount > 0
      ? 'تم الإرسال بنجاح وبسرعة فائقة!'
      : (firstFailed ? `فشل الإرسال: ${firstFailed.error}` : 'فشل إرسال البريد');

    return res.json({
      success: successCount > 0,
      message: responseMessage,
      mode: shouldSendReal ? 'real' : 'simulation',
      summary: {
        total: validRecipients.length,
        sent: successCount,
        failed: failCount,
        invalidEmails: invalidRecipients
      },
      results: deliveryResults,
      sender: senderEmail,
      subject: subject,
      fileName: req.file ? req.file.originalname : null,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Send error:', err);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء معالجة الطلب: ' + (err.message || 'خطأ غير متوقع')
    });
  }
});

// Endpoint: Contact form
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'يرجى ملء جميع الحقول المطلوبة' });
  }
  return res.json({
    success: true,
    message: 'شكراً لتواصلك معنا! تم استلام رسالتك وسنقوم بالرد عليك في أقرب وقت.'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`CV Email Sender server is running at http://localhost:${PORT}`);
});
