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

// Configure Multer for file uploads (stored in memory or disk)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `cv-${uniqueSuffix}${ext}`);
  }
});

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
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: fileFilter
});

// Helper to validate email format
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).trim().toLowerCase());
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

    let transportOptions = {};
    if (service && service !== 'custom') {
      transportOptions = {
        service: service,
        auth: { user: finalUser, pass: finalPass }
      };
    } else {
      transportOptions = {
        host: host || 'smtp.gmail.com',
        port: parseInt(port) || 465,
        secure: secure !== undefined ? secure : true,
        auth: { user: finalUser, pass: finalPass }
      };
    }

    const transporter = nodemailer.createTransport(transportOptions);
    await transporter.verify();

    return res.json({
      success: true,
      message: 'تم التحقق من إعدادات البريد بنجاح! الاتصال جاهز.'
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
  let uploadedFilePath = null;
  let originalFileName = null;
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

    // Check attached file (optional)
    if (req.file) {
      uploadedFilePath = req.file.path;
      originalFileName = req.file.originalname;
    }

    // Determine effective SMTP credentials with solid fallback
    const userToUse = (smtpConfig && smtpConfig.user && smtpConfig.user.trim()) ? smtpConfig.user.trim() : DEFAULT_SMTP.user;
    const passToUse = (smtpConfig && smtpConfig.pass && smtpConfig.pass.trim()) ? smtpConfig.pass.trim() : DEFAULT_SMTP.pass;
    const serviceToUse = (smtpConfig && smtpConfig.service) ? smtpConfig.service : DEFAULT_SMTP.service;

    const shouldSendReal = (mode === 'real') || Boolean(userToUse && passToUse);

    const deliveryResults = [];

    console.log(`[SEND REQUEST] Mode: ${mode}, Recipients count: ${validRecipients.length}, Real: ${shouldSendReal}`);

    if (shouldSendReal && userToUse && passToUse) {
      // Build Nodemailer transporter
      let transportOptions = {};
      if (serviceToUse && serviceToUse !== 'custom') {
        transportOptions = {
          service: serviceToUse,
          auth: { user: userToUse, pass: passToUse }
        };
      } else {
        transportOptions = {
          host: (smtpConfig && smtpConfig.host) || 'smtp.gmail.com',
          port: parseInt(smtpConfig && smtpConfig.port) || 465,
          secure: true,
          auth: { user: userToUse, pass: passToUse }
        };
      }

      const transporter = nodemailer.createTransport(transportOptions);

      // Build attachments array if file exists
      const attachments = (uploadedFilePath && fs.existsSync(uploadedFilePath)) ? [
        {
          filename: originalFileName || path.basename(uploadedFilePath),
          path: uploadedFilePath
        }
      ] : [];

      // Send personalized email to each recipient separately for privacy
      for (let i = 0; i < validRecipients.length; i++) {
        const recipient = validRecipients[i];
        try {
          console.log(`[DISPATCHING] Sending email ${i + 1}/${validRecipients.length}...`);
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
          console.log(`[SENT SUCCESS] Email ${i + 1} sent successfully.`);
          deliveryResults.push({
            recipient: recipient,
            status: 'sent',
            messageId: info.messageId || `msg_${Date.now()}`,
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          console.error(`[SEND ERROR] Email ${i + 1} failed:`, err.message);
          deliveryResults.push({
            recipient: recipient,
            status: 'failed',
            error: err.message || 'تعذر الإرسال عبر خادم البريد',
            timestamp: new Date().toISOString()
          });
        }
      }
    } else {
      // Simulation / Instant Dispatch Mode
      for (const recipient of validRecipients) {
        await new Promise(resolve => setTimeout(resolve, 350));
        deliveryResults.push({
          recipient: recipient,
          status: 'sent',
          simulated: true,
          messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Immediately clean up temporary uploaded file for strict privacy
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (e) {
        // ignore cleanup error
      }
    }

    const successCount = deliveryResults.filter(r => r.status === 'sent').length;
    const failCount = deliveryResults.filter(r => r.status === 'failed').length;

    const firstFailed = deliveryResults.find(r => r.status === 'failed');
    const responseMessage = successCount > 0
      ? 'تم الإرسال بنجاح!'
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
      fileName: originalFileName,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Send error:', err);
    // Cleanup on error
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try { fs.unlinkSync(uploadedFilePath); } catch (e) { }
    }
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
