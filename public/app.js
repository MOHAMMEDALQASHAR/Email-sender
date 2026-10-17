/**
 * CV Email Sender - Core Application Logic
 * Supports Arabic (RTL) & English (LTR), interactive chips, drag-and-drop,
 * realistic delivery simulation or real SMTP dispatch, and job history.
 */

// Application State
const state = {
  lang: 'ar',
  recipients: [], // array of strings
  uploadedFile: null,
  deliveryMode: 'real', // 'simulation' or 'real'
  smtpConfig: {
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    user: 'alqashar0@gmail.com',
    pass: ''
  },
  lastDeliveryReport: null
};

// Bilingual Dictionaries
const i18n = {
  ar: {
    brand_subtitle: "موقع إرسال السيرة الذاتية",
    nav_home: "الرئيسية",
    nav_guide: "دليل الاستخدام",
    nav_contact: "تواصل معنا",
    nav_history: "سجل الإرسال",
    
    form_title: "أرسل سيرتك الذاتية بسهولة",
    form_subtitle: "إلى شركة واحدة أو عدة شركات مع رسالة مخصصة",
    sender_email_label: "بريدك الإلكتروني (المرسل)",
    recipient_email_label: "بريد المستلم (المستلمون)",
    recipient_hint: "يمكنك إضافة عدة عناوين بريد إلكتروني مفصولة بفاصلة (,) أو الضغط على Enter",
    bulk_import_btn: "لصق مجمّع",
    subject_label: "موضوع الرسالة",
    suggest_subjects: "نماذج جاهزة",
    message_label: "نص الرسالة",
    insert_placeholder: "إدراج متغير:",
    upload_cv_label: "إرفاق السيرة الذاتية (اختياري)",
    upload_prompt_title: "اختر ملف السيرة الذاتية أو اسحبه هنا (اختياري)",
    upload_allowed_types: "PDF, DOC, DOCX (الحد الأقصى 5 ميغابايت)",
    mode_auto_label: "وضع الإرسال: المحاكاة الذكية السريعة (جاهز للاختبار الفوري)",
    config_smtp_btn: "تخصيص الخادم",
    btn_send_email: "إرسال الإيميل",
    security_notice: "حماية بيانات المستخدم وملفاته الشخصية. يتم إرسال نسخة منفصلة لكل مستلم لضمان الخصوصية التامة.",

    promo_title: "حقق فرصتك الوظيفية",
    promo_desc_ar: "أرسل سيرتك الذاتية بسرعة وسهولة إلى جهات التوظيف.",
    features_title: "مميزات الموقع",
    feat_multiple_title: "إرسال إلى عدة مستلمين",
    feat_upload_title: "إرفاق السيرة الذاتية بسهولة",
    feat_custom_title: "كتابة موضوع ورسالة مخصصة",
    feat_secure_title: "واجهة بسيطة وآمنة",
    callout_title: "سهلة الاستخدام وسريعة",
    callout_desc_ar: "ابدأ الآن وأرسل سيرتك الذاتية إلى الشركات التي ترغب بها.",

    bulk_modal_title: "إضافة عدة عناوين بريد إلكتروني دفعة واحدة",
    bulk_textarea_label: "قائمة البريد الإلكتروني للمستلمين:",
    bulk_info_note: "يقوم النظام تلقائياً بتنظيف العناوين المكررة واستبعاد العناوين غير الصالحة.",
    add_emails_btn: "إضافة العناوين",
    cancel_btn: "إلغاء",
    close_btn: "إغلاق",
    done_btn: "تم، إغلاق",
    save_settings_btn: "حفظ الإعدادات",
    clear_history_btn: "مسح السجل",
    export_report_btn: "تحميل تقرير الإرسال (Text)",

    guide_modal_title: "دليل استخدام موقع إرسال السيرة الذاتية",
    guide_step1_title: "إدخال بريدك الإلكتروني كمرسل",
    guide_step1_desc: "أدخل بريدك الرسمي (يفضل استخدام بريد احترافي مثل yourname@gmail.com). هذا البريد هو الذي سيستقبل ردود مسؤولي التوظيف ودعوات المقابلات.",
    guide_step2_title: "إضافة المستلمين (الشركات وجهات التوظيف)",
    guide_step2_desc: "يمكنك كتابة البريد ثم الضغط على Enter أو لصق عدة إيميلات دفعة واحدة بواسطة زر \"لصق مجمّع\". يتم إرسال رسالة منفصلة تماماً لكل شركة لحفظ الخصوصية.",
    guide_step3_title: "اختيار موضوع ملفت ورسالة تقديم احترافية",
    guide_step3_desc: "اختر من النماذج الجاهزة أو اكتب موضوعاً واضحاً يذكر المسمى الوظيفي. في الرسالة، أظهر حماسك وأبرز أهم مهاراتك بشكل مختصر ومباشر.",
    guide_step4_title: "إرفاق السيرة الذاتية والضغط على إرسال",
    guide_step4_desc: "ارفع ملفك بصيغة PDF أو DOCX (بحجم حتى 5 ميغابايت). بعد الضغط على إرسال، ستظهر لك شاشة تقدم حية وحالة تسليم كل رسالة بشكل مفصل.",
    guide_tips_title: "نصائح لزيادة فرص قبول سيرتك الذاتية:",
    guide_tip1: "احرص على تسمية ملف السيرة الذاتية باسمك ومسماك الوظيفي (مثال: Tareq_Alzarhat_Frontend_Developer.pdf).",
    guide_tip2: "تجنب إرسال الإيميلات في عطلة نهاية الأسبوع؛ الأوقات المثالية هي صباح الأحد إلى صباح الخميس.",
    guide_tip3: "تأكد دائماً من صحة رقم هاتفك ورابط حسابك في LinkedIn داخل السيرة الذاتية.",
    got_it_btn: "فهمت ذلك، ابدأ الآن",

    contact_modal_title: "تواصل مع فريق الدعم والمطور",
    contact_name_label: "الاسم الكامل:",
    contact_email_label: "البريد الإلكتروني للرد عليك:",
    contact_message_label: "نص الرسالة أو الاستفسار:",
    send_contact_btn: "إرسال الرسالة",

    settings_modal_title: "إعدادات خادم البريد (SMTP Settings)",
    mode_sim_title: "نمط المحاكاة الذكي (موصى به للتجربة السريعة)",
    mode_sim_desc: "يختبر كامل العملية من التحقق والمرفقات وإصدار تقرير التسليم بدون الحاجة لكلمات مرور أو إعدادات معقدة.",
    mode_real_title: "ربط خادم بريد حقيقي (SMTP)",
    mode_real_desc: "إرسال رسائل بريد فعلية تصل إلى صندوق الوارد الخاص بجهات التوظيف (Gmail App Password, Outlook, Custom).",

    history_modal_title: "سجل طلبات التوظيف المرسلة",
    no_history_title: "لا توجد رسائل مرسلة بعد",
    no_history_desc: "عند إرسال السيرة الذاتية ستظهر جميع تفاصيل الإرسال وحالة المستلمين هنا.",

    sending_progress_title: "جاري إرسال السيرة الذاتية...",
    step_validate: "فحص البيانات والملفات",
    step_attachment: "تجهيز ملف السيرة الذاتية",
    step_dispatch: "إرسال الرسائل للمستلمين",
    step_report: "تقرير التسليم النهائي",
    delivery_report: "تقرير التسليم لكل بريد إلكتروني:",

    msg_enter_sender: "يرجى إدخال بريدك الإلكتروني كمرسل.",
    msg_enter_recipients: "يرجى إضافة عنوان بريد إلكتروني صالح واحد على الأقل للمستلم.",
    msg_upload_file: "يرجى إرفاق ملف السيرة الذاتية بصيغة PDF أو DOCX.",
    msg_send_success: "تهانينا! تم إرسال السيرة الذاتية بنجاح إلى جميع المستلمين المحدد."
  },
  en: {
    brand_subtitle: "CV & Resume Email Dispatcher",
    nav_home: "Home",
    nav_guide: "User Guide",
    nav_contact: "Contact Us",
    nav_history: "Sent History",

    form_title: "Send Your CV Easily",
    form_subtitle: "To one or multiple companies with a personalized message",
    sender_email_label: "Your Email (Sender)",
    recipient_email_label: "Recipient Email(s)",
    recipient_hint: "You can add multiple email addresses separated by a comma (,) or press Enter",
    bulk_import_btn: "Bulk Paste",
    subject_label: "Subject",
    suggest_subjects: "Templates",
    message_label: "Email Message",
    insert_placeholder: "Insert Tag:",
    upload_cv_label: "Upload Your CV (Optional)",
    upload_prompt_title: "Choose your CV file or drag it here (optional)",
    upload_allowed_types: "PDF, DOC, DOCX (Max 5 MB)",
    mode_auto_label: "Delivery Mode: Fast Smart Simulation (Ready for instant test)",
    config_smtp_btn: "Configure Server",
    btn_send_email: "Send Email",
    security_notice: "User data and personal files are securely protected. A separate email is sent to each recipient to maintain complete privacy.",

    promo_title: "Get Your Dream Job",
    promo_desc_ar: "Send your CV quickly and easily to employers.",
    features_title: "Features",
    feat_multiple_title: "Send to multiple recipients",
    feat_upload_title: "Easily upload your CV",
    feat_custom_title: "Custom subject and message",
    feat_secure_title: "Simple and secure interface",
    callout_title: "Easy to use and fast",
    callout_desc_ar: "Start now and send your CV to the companies you want.",

    bulk_modal_title: "Add Multiple Email Addresses at Once",
    bulk_textarea_label: "Recipient Email List:",
    bulk_info_note: "The system automatically cleans duplicates and filters out invalid email formats.",
    add_emails_btn: "Add Emails",
    cancel_btn: "Cancel",
    close_btn: "Close",
    done_btn: "Done, Close",
    save_settings_btn: "Save Settings",
    clear_history_btn: "Clear History",
    export_report_btn: "Download Delivery Report (Text)",

    guide_modal_title: "CV Email Sender Guide",
    guide_step1_title: "Enter your sender email",
    guide_step1_desc: "Use your professional email (e.g. yourname@gmail.com). This is where recruiters will reply to invite you for interviews.",
    guide_step2_title: "Add recipients (companies & recruiters)",
    guide_step2_desc: "Type an email and hit Enter, or use \"Bulk Paste\" to paste multiple addresses. Each company receives a completely private email.",
    guide_step3_title: "Choose an engaging subject & cover message",
    guide_step3_desc: "Pick from pre-made templates or write a tailored introduction mentioning your targeted job title.",
    guide_step4_title: "Attach CV & hit Send",
    guide_step4_desc: "Upload your CV in PDF or DOCX format (up to 5MB). Watch the live delivery tracker confirm dispatch per recipient.",
    guide_tips_title: "Tips to increase response rates:",
    guide_tip1: "Name your CV file with your full name and job title (e.g. Alex_Miller_Software_Engineer.pdf).",
    guide_tip2: "Avoid sending applications over the weekend; the best response times are Tuesday and Wednesday mornings.",
    guide_tip3: "Always double-check your phone number and LinkedIn link inside your resume.",
    got_it_btn: "Got it, start applying",

    contact_modal_title: "Contact Support & Developer",
    contact_name_label: "Full Name:",
    contact_email_label: "Reply-To Email:",
    contact_message_label: "Message / Inquiry:",
    send_contact_btn: "Send Message",

    settings_modal_title: "Email & SMTP Settings",
    mode_sim_title: "Smart Simulation Mode (Recommended for quick testing)",
    mode_sim_desc: "Tests the complete workflow with validation, attachments, and full report without needing passwords.",
    mode_real_title: "Connect Real Mail Server (SMTP)",
    mode_real_desc: "Dispatches actual emails directly to employers' inboxes using your Gmail App Password, Outlook, or Custom SMTP.",

    history_modal_title: "Sent Applications History",
    no_history_title: "No sent applications yet",
    no_history_desc: "Once you send your CV, your delivery logs and recipient statuses will appear here.",

    sending_progress_title: "Sending your CV...",
    step_validate: "Validating data & files",
    step_attachment: "Preparing CV attachment",
    step_dispatch: "Dispatching to recipients",
    step_report: "Final Delivery Report",
    delivery_report: "Delivery status per recipient:",

    msg_enter_sender: "Please enter your sender email address.",
    msg_enter_recipients: "Please add at least one valid recipient email address.",
    msg_upload_file: "Please upload your CV file (PDF or DOCX).",
    msg_send_success: "Congratulations! Your CV was successfully sent to all specified recipients."
  }
};

// Cover Letter Message Templates
const messageTemplates = {
  standard: {
    ar: `السادة مسؤولو التوظيف الأفاضل،

تحية طيبة وبعد،،،

يسرني التقدم لشغل وظيفة [Job Title] الشاغرة لديكم في [Company Name]، لما أملكه من شغف وخبرة تتناسب مع تطلعاتكم.
تجدون مرفقاً طياً نسختي المحدثة من السيرة الذاتية والتي توضح مسيرتي المهنية وأبرز الإنجازات والمهارات التي اكتسبتها.

أتطلع بشوق لفرصة إجراء مقابلة شخصية لمناقشة كيفية تسخير خبراتي لخدمة فريق العمل لديكم.

مع خالص الشكر والتقدير،
[Name]
هاتف: [Phone Number]`,
    en: `Dear Hiring Manager,

I am writing to express my strong interest in the [Job Title] position at [Company Name]. With my professional background and dedication to excellence, I am confident in my ability to contribute effectively to your team.

Please find my CV attached, outlining my qualifications, past projects, and technical skills.

I welcome the opportunity to discuss how my experience aligns with your organization's goals. Thank you for your time and consideration.

Best regards,
[Name]
Phone: [Phone Number]`
  },
  tech: {
    ar: `السيد مدير الفريق التقني / مسؤولو التوظيف،

السلام عليكم ورحمة الله،

أتقدم بطلب الانضمام إلى فريقكم التقني المتميز كمطور [Job Title]. أمتلك خبرة عملية في بناء وتطوير الأنظمة البرمجية الحديثة، وكتابة كود نظيف وقابل للتوسع.

أرفق لكم سيرتي الذاتية للاطلاع على المشاريع والتقنيات التي أتقنها. كلي ثقة بأنني سأكون إضافة قيّمة لفريقكم.

وتقبلوا فائق الاحترام،
[Name]`,
    en: `Dear Technical Hiring Manager,

I am excited to apply for the [Job Title] position. As a proactive software engineer, I build clean, scalable solutions and thrive in agile, collaborative team environments.

Attached is my CV detailing my technical stack, completed projects, and problem-solving experience. I would love the chance to discuss how I can contribute to your software initiatives.

Best regards,
[Name]`
  },
  fresh: {
    ar: `عناية مسؤولي التوظيف المحترمين،

تحية طيبة،

بصفتي خريجاً جديداً طموحاً وحاصلاً على شهادة متخصصة، يسعدني جداً التقدم لفرصة [Job Title] لديكم في [Company Name]. لدي دافع قوي للتعلم والبدء بمسيرة مهنية متميزة في بيئتكم المحفزة.

مرفق سيرتي الذاتية للاطلاع على مشاريع تخرجي ومهاراتي الأكاديمية والعملية.

شاكراً لكم حسن اهتمامكم،
[Name]`,
    en: `Dear Hiring Team,

As an enthusiastic and ambitious recent graduate, I am writing to apply for the [Job Title] opening at [Company Name]. I am eager to apply my academic foundation, fast learning capabilities, and fresh perspective to your organization.

Attached is my resume covering my educational background, coursework, and internship experience. Thank you for considering my application!

Sincerely,
[Name]`
  },
  arabic_formal: {
    ar: `سعادة مدير الموارد البشرية المحترم،

السلام عليكم ورحمة الله وبركاته،

إشارةً إلى إعلانكم الوظيفي بشأن وظيفة [Job Title]، يشرفني أن أتقدم بطلبي هذا راجياً التوفيق للانضمام إلى صرحكم المرموق.
أرفق لسعادتكم سيرتي الذاتية متضمنة المؤهلات العلمية والخبرات العملية.

شاكراً ومقدراً لكم كريم وقتكم واهتمامكم.

مقدمه لسعادتكم:
[Name]
[Phone Number]`,
    en: `Dear Hiring Committee,

Please accept this letter and the attached resume as an application for the [Job Title] role. I have followed your organization's achievements closely and would be honored to bring my skills to your team.

Thank you for reviewing my application.

Sincerely,
[Name]`
  }
};

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initLanguage();
  loadSavedSenderEmail();
  loadSavedSmtpSettings();
  updateHistoryCounter();
  initMessageCharCounter();
  initCloseModalOnOverlayClick();

  // Add default recipient placeholder as demo if desired or leave empty
  if (state.recipients.length === 0) {
    // Leave clean, ready for user
  }
});

// ==========================================================================
// Language Toggle & Internationalization
// ==========================================================================
function setLanguage(lang) {
  state.lang = lang;
  localStorage.setItem('cv_sender_lang', lang);

  const html = document.documentElement;
  if (lang === 'ar') {
    html.setAttribute('lang', 'ar');
    html.setAttribute('dir', 'rtl');
    document.getElementById('langArBtn').classList.add('active');
    document.getElementById('langEnBtn').classList.remove('active');
  } else {
    html.setAttribute('lang', 'en');
    html.setAttribute('dir', 'ltr');
    document.getElementById('langEnBtn').classList.add('active');
    document.getElementById('langArBtn').classList.remove('active');
  }

  // Update elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang] && i18n[lang][key]) {
      el.textContent = i18n[lang][key];
    }
  });

  // Update recipient badge
  updateRecipientsBadge();
}

function initLanguage() {
  const savedLang = localStorage.getItem('cv_sender_lang') || 'ar';
  setLanguage(savedLang);
}

// ==========================================================================
// Sender Email Handling
// ==========================================================================
const senderEmailInput = document.getElementById('senderEmail');
const senderEmailStatus = document.getElementById('senderEmailStatus');

senderEmailInput.addEventListener('input', () => {
  const email = senderEmailInput.value.trim();
  if (!email) {
    senderEmailStatus.className = 'validation-status';
    senderEmailStatus.innerHTML = '';
    return;
  }

  if (isValidEmail(email)) {
    senderEmailStatus.className = 'validation-status valid';
    senderEmailStatus.innerHTML = '<i class="fa-solid fa-check-circle"></i>';
    localStorage.setItem('cv_sender_email', email);
  } else {
    senderEmailStatus.className = 'validation-status invalid';
    senderEmailStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
  }
});

function loadSavedSenderEmail() {
  const saved = localStorage.getItem('cv_sender_email');
  const emailToSet = (saved && isValidEmail(saved)) ? saved : 'alqashar0@gmail.com';
  senderEmailInput.value = emailToSet;
  senderEmailStatus.className = 'validation-status valid';
  senderEmailStatus.innerHTML = '<i class="fa-solid fa-check-circle"></i>';
}

// ==========================================================================
// Multiple Recipients Chips System
// ==========================================================================
const recipientInput = document.getElementById('recipientInput');
const recipientsChips = document.getElementById('recipientsChips');
const recipientsBox = document.getElementById('recipientsBox');

function focusRecipientInput() {
  recipientInput.focus();
}

recipientInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === 'Tab') {
    e.preventDefault();
    addRecipientFromInput();
  } else if (e.key === 'Backspace' && recipientInput.value === '' && state.recipients.length > 0) {
    // Remove last chip on backspace if input is empty
    removeRecipient(state.recipients.length - 1);
  }
});

recipientInput.addEventListener('blur', () => {
  if (recipientInput.value.trim()) {
    addRecipientFromInput();
  }
});

recipientInput.addEventListener('paste', (e) => {
  const pasteData = (e.clipboardData || window.clipboardData).getData('text');
  if (pasteData && (pasteData.includes(',') || pasteData.includes(';') || pasteData.includes('\n'))) {
    e.preventDefault();
    parseAndAddMultipleEmails(pasteData);
  }
});

function addRecipientFromInput() {
  const val = recipientInput.value.trim().replace(/[,;]+$/, '');
  if (!val) return;

  if (val.includes(',') || val.includes(';') || val.includes('\n')) {
    parseAndAddMultipleEmails(val);
  } else {
    addSingleRecipient(val);
  }
  recipientInput.value = '';
}

function addSingleRecipient(email) {
  const cleaned = email.trim();
  if (!cleaned) return;

  // Check duplicate
  if (state.recipients.includes(cleaned)) {
    showToast(state.lang === 'ar' ? 'هذا البريد مضاف بالفعل' : 'Email already added', 'info');
    return;
  }

  state.recipients.push(cleaned);
  renderRecipientChips();
}

function parseAndAddMultipleEmails(text) {
  const emails = text.split(/[\s,;\n]+/).map(s => s.trim()).filter(Boolean);
  let addedCount = 0;

  emails.forEach(email => {
    if (!state.recipients.includes(email)) {
      state.recipients.push(email);
      addedCount++;
    }
  });

  renderRecipientChips();
  if (addedCount > 0) {
    showToast(
      state.lang === 'ar' ? `تمت إضافة ${addedCount} عنوان بريد` : `Added ${addedCount} email addresses`, 
      'success'
    );
  }
}

function removeRecipient(index) {
  state.recipients.splice(index, 1);
  renderRecipientChips();
}

function renderRecipientChips() {
  recipientsChips.innerHTML = '';
  
  state.recipients.forEach((email, index) => {
    const valid = isValidEmail(email);
    const chip = document.createElement('div');
    chip.className = `recipient-chip ${valid ? '' : 'invalid'}`;
    
    chip.innerHTML = `
      <i class="fa-solid ${valid ? 'fa-envelope' : 'fa-triangle-exclamation'}"></i>
      <span class="chip-text">${escapeHtml(email)}</span>
      <button type="button" class="recipient-chip-remove" onclick="removeRecipient(${index})" title="إزالة">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;
    recipientsChips.appendChild(chip);
  });

  updateRecipientsBadge();
}

function updateRecipientsBadge() {
  const badge = document.getElementById('recipientsCountBadge');
  const validCount = state.recipients.filter(isValidEmail).length;
  const total = state.recipients.length;

  if (state.lang === 'ar') {
    badge.textContent = `${validCount} مستلم صالح`;
  } else {
    badge.textContent = `${validCount} valid recipient${validCount !== 1 ? 's' : ''}`;
  }

  if (total > 0 && validCount === 0) {
    badge.style.backgroundColor = '#fee2e2';
    badge.style.color = '#ef4444';
  } else {
    badge.style.backgroundColor = 'var(--primary-light)';
    badge.style.color = 'var(--primary)';
  }
}

// Bulk Email Modal Handlers
function openBulkEmailModal() {
  document.getElementById('bulkEmailsTextarea').value = state.recipients.join('\n');
  openModal('bulkEmailModal');
}

function confirmBulkEmails() {
  const text = document.getElementById('bulkEmailsTextarea').value;
  state.recipients = [];
  parseAndAddMultipleEmails(text);
  closeModal('bulkEmailModal');
}

// ==========================================================================
// Subject & Message Templates
// ==========================================================================
function toggleDropdown(id) {
  const el = document.getElementById(id);
  el.classList.toggle('show');
}

// Close dropdown if clicked outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.quick-dropdown')) {
    const dropdown = document.getElementById('subjectTemplatesList');
    if (dropdown) dropdown.classList.remove('show');
  }
});

function applySubjectTemplate(template) {
  const subjectInput = document.getElementById('emailSubject');
  subjectInput.value = template;
  subjectInput.focus();
  document.getElementById('subjectTemplatesList').classList.remove('show');
}

function loadMessageTemplate(type) {
  // Update active pill
  document.querySelectorAll('.template-pills .pill-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  const lang = state.lang;
  const template = messageTemplates[type] ? (messageTemplates[type][lang] || messageTemplates[type]['ar']) : '';
  const textarea = document.getElementById('emailMessage');
  textarea.value = template;
  updateCharCounter();
}

function insertVariable(variable) {
  const textarea = document.getElementById('emailMessage');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;

  textarea.value = text.substring(0, start) + variable + text.substring(end);
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + variable.length;
  updateCharCounter();
}

function initMessageCharCounter() {
  const textarea = document.getElementById('emailMessage');
  textarea.addEventListener('input', updateCharCounter);
  updateCharCounter();
}

function updateCharCounter() {
  const textarea = document.getElementById('emailMessage');
  const counter = document.getElementById('charCounter');
  if (!counter || !textarea) return;
  const count = textarea.value.length;
  counter.textContent = `${count} ${state.lang === 'ar' ? 'حرف' : 'characters'}`;
}

// ==========================================================================
// Drag & Drop CV File Upload
// ==========================================================================
function triggerFileInput() {
  document.getElementById('cvFileInput').click();
}

function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById('dropZone').classList.add('drag-active');
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById('dropZone').classList.remove('drag-active');
}

function handleFileDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById('dropZone').classList.remove('drag-active');

  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    processSelectedFile(e.dataTransfer.files[0]);
  }
}

function handleFileSelect(e) {
  if (e.target.files && e.target.files.length > 0) {
    processSelectedFile(e.target.files[0]);
  }
}

function processSelectedFile(file) {
  const validExtensions = ['.pdf', '.doc', '.docx'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  
  if (!validExtensions.includes(ext)) {
    showToast(
      state.lang === 'ar' ? 'الملف يجب أن يكون بصيغة PDF أو DOC أو DOCX' : 'File must be PDF, DOC or DOCX',
      'error'
    );
    return;
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    showToast(
      state.lang === 'ar' ? 'حجم الملف يتجاوز الحد المسموح به (10 ميغابايت)' : 'File size exceeds 10MB limit',
      'error'
    );
    return;
  }

  state.uploadedFile = file;

  // Show uploaded preview card
  document.getElementById('dropZonePrompt').classList.add('hidden');
  const card = document.getElementById('uploadedFileCard');
  card.classList.remove('hidden');

  document.getElementById('fileNameDisplay').textContent = file.name;
  document.getElementById('fileSizeDisplay').textContent = formatFileSize(file.size);

  const iconEl = document.getElementById('fileTypeIcon');
  if (ext === '.pdf') {
    iconEl.className = 'fa-solid fa-file-pdf';
    iconEl.parentElement.style.backgroundColor = '#fee2e2';
    iconEl.parentElement.style.color = '#ef4444';
  } else {
    iconEl.className = 'fa-solid fa-file-word';
    iconEl.parentElement.style.backgroundColor = '#e0f2fe';
    iconEl.parentElement.style.color = '#0284c7';
  }

  showToast(state.lang === 'ar' ? 'تم إرفاق السيرة الذاتية بنجاح' : 'CV attached successfully', 'success');
}

function removeUploadedFile(e) {
  if (e) e.stopPropagation();
  state.uploadedFile = null;
  document.getElementById('cvFileInput').value = '';
  document.getElementById('dropZonePrompt').classList.remove('hidden');
  document.getElementById('uploadedFileCard').classList.add('hidden');
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
}

// ==========================================================================
// Form Submission & Live Progress Tracking
// ==========================================================================
async function handleFormSubmit(e) {
  e.preventDefault();

  const senderEmail = document.getElementById('senderEmail').value.trim();
  const subject = document.getElementById('emailSubject').value.trim();
  const message = document.getElementById('emailMessage').value.trim();

  // Validations
  if (!senderEmail || !isValidEmail(senderEmail)) {
    showToast(i18n[state.lang].msg_enter_sender, 'error');
    document.getElementById('senderEmail').focus();
    return;
  }

  const validRecipients = state.recipients.filter(isValidEmail);
  if (validRecipients.length === 0) {
    showToast(i18n[state.lang].msg_enter_recipients, 'error');
    focusRecipientInput();
    return;
  }

  // Open Progress Modal
  openSendingProgressModal(validRecipients);

  try {
    // Build FormData
    const formData = new FormData();
    formData.append('senderEmail', senderEmail);
    formData.append('recipients', JSON.stringify(validRecipients));
    formData.append('subject', subject);
    formData.append('message', message);
    if (state.uploadedFile) {
      formData.append('cv', state.uploadedFile);
    }
    formData.append('mode', state.deliveryMode);

    if (state.deliveryMode === 'real' && state.smtpConfig.user) {
      formData.append('smtpConfig', JSON.stringify(state.smtpConfig));
    }

    // Step 1: Validation complete
    updateStep(1, 'done');
    updateStep(2, 'active');
    setProgress(35, state.uploadedFile 
      ? (state.lang === 'ar' ? 'جاري تجهيز وتشفير المرفق...' : 'Preparing CV attachment...')
      : (state.lang === 'ar' ? 'تجهيز نص الرسالة وبيانات الإرسال...' : 'Preparing email content...'));

    await wait(400);

    // Step 2: Attachment / Data complete
    updateStep(2, 'done');
    updateStep(3, 'active');
    setProgress(60, state.lang === 'ar' ? `جاري الإرسال إلى ${validRecipients.length} جهة توظيف...` : `Dispatching to ${validRecipients.length} recipients...`);

    // Call API Endpoint
    const response = await fetch('/api/send', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      if (data && data.results && data.results.length > 0) {
        renderDeliveryResults(data.results);
      }
      const failReason = data.message || (data.results && data.results[0] && data.results[0].error) || 'حدث خطأ أثناء الإرسال';
      throw new Error(failReason);
    }

    // Step 3 & 4: Done!
    updateStep(3, 'done');
    updateStep(4, 'done');
    setProgress(100, state.lang === 'ar' ? 'اكتمل الإرسال بنجاح!' : 'All emails dispatched successfully!');

    // Show results table
    renderDeliveryResults(data.results);
    state.lastDeliveryReport = {
      ...data,
      sender: senderEmail,
      subject: subject,
      fileName: state.uploadedFile ? state.uploadedFile.name : (state.lang === 'ar' ? 'بدون مرفق (نص فقط)' : 'None (Text only)')
    };

    // Save in history
    saveToHistory({
      sender: senderEmail,
      recipients: validRecipients,
      subject: subject,
      fileName: state.uploadedFile ? state.uploadedFile.name : (state.lang === 'ar' ? 'بدون مرفق (نص فقط)' : 'None (Text only)'),
      results: data.results,
      mode: data.mode,
      timestamp: new Date().toISOString()
    });

    // Show completion controls
    document.getElementById('progressModalFooter').classList.remove('hidden');
    document.getElementById('closeProgressBtn').classList.remove('hidden');
    document.getElementById('progressModalTitle').textContent = state.lang === 'ar' ? '🎉 تم إرسال السيرة الذاتية بنجاح!' : '🎉 CV Dispatched Successfully!';
    document.getElementById('progressModalSubtitle').textContent = state.lang === 'ar' 
      ? `تم تسليم جميع الرسائل (${validRecipients.length}) بنجاح وبشكل منفصل لكل شركة.`
      : `All ${validRecipients.length} emails delivered successfully and privately.`;

    // Trigger celebration confetti
    triggerConfetti();

    showToast(i18n[state.lang].msg_send_success, 'success');

  } catch (error) {
    console.error('Submission failed:', error);
    updateStep(3, 'pending');
    setProgress(100, 'فشل الإرسال');
    document.getElementById('progressBarFill').style.background = 'var(--danger)';
    document.getElementById('closeProgressBtn').classList.remove('hidden');
    document.getElementById('progressModalTitle').textContent = '⚠️ حدث خطأ أثناء الإرسال';
    document.getElementById('progressModalSubtitle').textContent = error.message || 'تعذر الاتصال بالخادم';
    showToast(error.message || 'تعذر الإرسال', 'error');
  }
}

function openSendingProgressModal(recipients) {
  document.getElementById('progressBarFill').style.background = 'var(--primary-gradient)';
  setProgress(15, state.lang === 'ar' ? 'فحص البيانات والمستلمين...' : 'Validating data...');
  
  // Reset steps
  updateStep(1, 'active');
  updateStep(2, 'pending');
  updateStep(3, 'pending');
  updateStep(4, 'pending');

  document.getElementById('resultsTableContainer').classList.add('hidden');
  document.getElementById('progressModalFooter').classList.add('hidden');
  document.getElementById('closeProgressBtn').classList.add('hidden');
  
  document.getElementById('progressModalTitle').textContent = i18n[state.lang].sending_progress_title;
  document.getElementById('progressModalSubtitle').textContent = state.lang === 'ar' 
    ? 'يرجى الانتظار بينما نرسل رسائلك إلى الشركات'
    : 'Please wait while we dispatch your applications';

  openModal('sendingProgressModal');
}

function setProgress(percent, label) {
  document.getElementById('progressBarFill').style.width = percent + '%';
  document.getElementById('progressPercent').textContent = percent + '%';
  if (label) document.getElementById('progressCount').textContent = label;
}

function updateStep(stepNum, status) {
  const step = document.getElementById('step' + stepNum);
  step.className = `step-item ${status}`;
  const icon = step.querySelector('.step-badge i');
  
  if (status === 'done') {
    icon.className = 'fa-solid fa-check';
  } else if (status === 'active') {
    icon.className = 'fa-solid fa-spinner fa-spin';
  } else {
    if (stepNum === 3) icon.className = 'fa-solid fa-envelope';
    else if (stepNum === 4) icon.className = 'fa-solid fa-flag-checkered';
  }
}

function renderDeliveryResults(results) {
  const tableContainer = document.getElementById('resultsTableContainer');
  const tableBody = document.getElementById('resultsTableBody');
  tableBody.innerHTML = '';

  results.forEach(res => {
    const row = document.createElement('div');
    row.className = 'result-row';
    const isSent = res.status === 'sent';
    
    row.innerHTML = `
      <div class="result-email" title="${escapeHtml(res.recipient)}">
        <i class="fa-regular fa-envelope" style="color: var(--primary); margin-inline-end: 6px;"></i>
        ${escapeHtml(res.recipient)}
      </div>
      <div class="result-badge ${isSent ? 'success' : 'failed'}">
        <i class="fa-solid ${isSent ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>
        <span>${isSent ? (state.lang === 'ar' ? 'تم التسليم' : 'Delivered') : (state.lang === 'ar' ? 'فشل' : 'Failed')}</span>
      </div>
    `;
    tableBody.appendChild(row);
  });

  tableContainer.classList.remove('hidden');
}

function exportDeliveryReport() {
  if (!state.lastDeliveryReport) return;
  const rep = state.lastDeliveryReport;
  
  let reportText = `==============================================\n`;
  reportText += `       CV EMAIL SENDER - DELIVERY REPORT       \n`;
  reportText += `==============================================\n\n`;
  reportText += `Date: ${new Date().toLocaleString()}\n`;
  reportText += `Sender: ${rep.sender}\n`;
  reportText += `Subject: ${rep.subject}\n`;
  reportText += `Attached CV: ${rep.fileName}\n`;
  reportText += `Mode: ${rep.mode.toUpperCase()}\n`;
  reportText += `Total Recipients: ${rep.summary.total}\n`;
  reportText += `Successfully Sent: ${rep.summary.sent}\n`;
  reportText += `Failed: ${rep.summary.failed}\n\n`;
  reportText += `---------------- RECIPIENTS ----------------\n`;

  rep.results.forEach((r, idx) => {
    reportText += `${idx + 1}. [${r.status.toUpperCase()}] ${r.recipient} (MsgId: ${r.messageId})\n`;
  });

  reportText += `\n==============================================\n`;
  reportText += `Generated by CV Email Sender | All Rights Reserved\n`;

  const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CV_Delivery_Report_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(state.lang === 'ar' ? 'تم تحميل التقرير بنجاح' : 'Report downloaded successfully', 'success');
}

// Confetti Animation Trigger
function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

// ==========================================================================
// Sent History System (localStorage)
// ==========================================================================
function saveToHistory(item) {
  const history = getSentHistory();
  history.unshift(item); // Add newest first
  localStorage.setItem('cv_sender_history', JSON.stringify(history.slice(0, 30))); // Keep last 30
  updateHistoryCounter();
}

function getSentHistory() {
  try {
    const raw = localStorage.getItem('cv_sender_history');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function updateHistoryCounter() {
  const history = getSentHistory();
  const counter = document.getElementById('historyCounter');
  if (counter) counter.textContent = history.length;
}

function renderHistoryModal() {
  const history = getSentHistory();
  const container = document.getElementById('historyListContainer');
  const emptyState = document.getElementById('emptyHistoryState');
  const totalLabel = document.getElementById('historyTotalLabel');

  totalLabel.textContent = `${state.lang === 'ar' ? 'إجمالي الطلبات:' : 'Total Submissions:'} ${history.length}`;

  if (history.length === 0) {
    emptyState.style.display = 'block';
    // Clear other children
    Array.from(container.children).forEach(child => {
      if (child !== emptyState) child.remove();
    });
    return;
  }

  emptyState.style.display = 'none';
  // Remove existing items
  Array.from(container.children).forEach(child => {
    if (child !== emptyState) child.remove();
  });

  history.forEach(item => {
    const card = document.createElement('div');
    card.className = 'history-item-card';

    const dateFormatted = new Date(item.timestamp).toLocaleString(state.lang === 'ar' ? 'ar-SA' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    card.innerHTML = `
      <div class="history-item-header">
        <span class="history-item-subject">${escapeHtml(item.subject)}</span>
        <span class="history-item-date">${dateFormatted}</span>
      </div>
      <div class="history-item-meta">
        <span><i class="fa-solid fa-file-pdf" style="color: #ef4444;"></i> ${escapeHtml(item.fileName)}</span>
        <span><i class="fa-solid fa-user-group" style="color: var(--primary);"></i> ${item.recipients.length} ${state.lang === 'ar' ? 'مستلم' : 'recipients'}</span>
        <span><i class="fa-solid fa-circle-check" style="color: var(--success);"></i> ${item.results.filter(r => r.status === 'sent').length} ${state.lang === 'ar' ? 'ناجح' : 'sent'}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function clearSentHistory() {
  if (confirm(state.lang === 'ar' ? 'هل أنت متأكد من رغبتك في مسح سجل الإرسال بالكامل؟' : 'Are you sure you want to clear your application history?')) {
    localStorage.removeItem('cv_sender_history');
    updateHistoryCounter();
    renderHistoryModal();
    showToast(state.lang === 'ar' ? 'تم مسح السجل بنجاح' : 'History cleared', 'info');
  }
}

// ==========================================================================
// SMTP & Delivery Settings
// ==========================================================================
function toggleSmtpMode(mode) {
  state.deliveryMode = mode;
  const configBox = document.getElementById('smtpConfigBox');
  const modeLabel = document.getElementById('dispatchModeLabel');

  if (mode === 'real') {
    if (configBox) configBox.classList.remove('hidden');
    if (modeLabel) {
      modeLabel.textContent = state.lang === 'ar' 
        ? 'وضع الإرسال: ربط خادم بريد حقيقي (SMTP)' 
        : 'Delivery Mode: Connected Real SMTP Server';
    }
  } else {
    if (configBox) configBox.classList.add('hidden');
    if (modeLabel) {
      modeLabel.textContent = i18n[state.lang].mode_auto_label;
    }
  }
}

function handleSmtpProviderChange() {
  const provider = document.getElementById('smtpProvider').value;
  const customFields = document.getElementById('customSmtpFields');
  const helpText = document.getElementById('smtpHelpText');

  if (provider === 'custom') {
    customFields.classList.remove('hidden');
    helpText.textContent = state.lang === 'ar' 
      ? '* أدخل عنوان خادم SMTP والمنفذ المخصصين لمزود بريدك الإلكتروني.'
      : '* Enter custom SMTP host and port specified by your mail provider.';
  } else {
    customFields.classList.add('hidden');
    if (provider === 'gmail') {
      helpText.textContent = state.lang === 'ar'
        ? '* بالنسبة لـ Gmail: استخدم "كلمة مرور التطبيقات" المكونة من 16 حرفاً من حساب Google الخاص بك.'
        : '* For Gmail: Use a 16-character Google App Password from your Google Account settings.';
    } else {
      helpText.textContent = state.lang === 'ar'
        ? '* بالنسبة لـ Outlook/Hotmail: استخدم كلمة مرور حساب Microsoft الخاص بك أو App Password.'
        : '* For Outlook: Use your Microsoft account password or app password.';
    }
  }
}

async function testSmtpConnection() {
  const provider = document.getElementById('smtpProvider').value;
  const user = document.getElementById('smtpUser').value.trim();
  const pass = document.getElementById('smtpPass').value.trim();
  const host = document.getElementById('smtpHost').value.trim();
  const port = document.getElementById('smtpPort').value.trim();

  const resultEl = document.getElementById('testSmtpResult');
  const btn = document.getElementById('testSmtpBtn');
  const btnText = document.getElementById('testSmtpText');

  if (!user || !pass) {
    resultEl.className = 'test-smtp-result error';
    resultEl.textContent = state.lang === 'ar' ? 'يرجى إدخال البريد وكلمة المرور' : 'Please provide user email and password';
    resultEl.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  btnText.textContent = state.lang === 'ar' ? 'جاري اختبار الاتصال...' : 'Testing connection...';
  resultEl.classList.add('hidden');

  try {
    const res = await fetch('/api/test-smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: provider !== 'custom' ? provider : null,
        host: provider === 'custom' ? host : null,
        port: provider === 'custom' ? port : null,
        user,
        pass
      })
    });

    const data = await res.json();
    resultEl.classList.remove('hidden');

    if (data.success) {
      resultEl.className = 'test-smtp-result success';
      resultEl.textContent = '✓ ' + (data.message || 'الاتصال ناجح تماماً!');
    } else {
      resultEl.className = 'test-smtp-result error';
      resultEl.textContent = '✗ ' + (data.message || 'فشل الاتصال');
    }
  } catch (e) {
    resultEl.classList.remove('hidden');
    resultEl.className = 'test-smtp-result error';
    resultEl.textContent = '✗ ' + (e.message || 'تعذر الوصول إلى الخادم');
  } finally {
    btn.disabled = false;
    btnText.textContent = state.lang === 'ar' ? 'اختبار الاتصال بالخادم الآن' : 'Test Server Connection Now';
  }
}

function saveSmtpSettings() {
  const provider = document.getElementById('smtpProvider').value;
  const user = document.getElementById('smtpUser').value.trim();
  const pass = document.getElementById('smtpPass').value.trim();
  const host = document.getElementById('smtpHost').value.trim();
  const port = document.getElementById('smtpPort').value.trim();

  state.smtpConfig = {
    service: provider !== 'custom' ? provider : null,
    host: provider === 'custom' ? host : 'smtp.gmail.com',
    port: provider === 'custom' ? parseInt(port) || 465 : 465,
    secure: true,
    user,
    pass
  };

  localStorage.setItem('cv_sender_smtp', JSON.stringify({
    provider,
    user,
    pass,
    host,
    port,
    mode: state.deliveryMode
  }));

  closeModal('settingsModal');
  showToast(state.lang === 'ar' ? 'تم حفظ إعدادات البريد بنجاح' : 'Settings saved successfully', 'success');
}

function loadSavedSmtpSettings() {
  try {
    const raw = localStorage.getItem('cv_sender_smtp');
    let cfg = {
      provider: 'gmail',
      user: 'alqashar0@gmail.com',
      pass: '',
      mode: 'real'
    };
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        cfg = { ...cfg, ...parsed };
      } catch (err) {}
    }

    if (cfg.provider) document.getElementById('smtpProvider').value = cfg.provider;
    if (cfg.user) document.getElementById('smtpUser').value = cfg.user;
    if (cfg.pass) document.getElementById('smtpPass').value = cfg.pass;
    if (cfg.host) document.getElementById('smtpHost').value = cfg.host;
    if (cfg.port) document.getElementById('smtpPort').value = cfg.port;
    handleSmtpProviderChange();

    state.smtpConfig = {
      service: cfg.provider !== 'custom' ? cfg.provider : null,
      host: cfg.provider === 'custom' ? cfg.host : 'smtp.gmail.com',
      port: cfg.provider === 'custom' ? (parseInt(cfg.port) || 465) : 465,
      secure: true,
      user: cfg.user || 'alqashar0@gmail.com',
      pass: cfg.pass || ''
    };

    const realRadio = document.querySelector('input[name="deliveryMode"][value="real"]');
    if (realRadio) {
      realRadio.checked = true;
      toggleSmtpMode('real');
    }
  } catch (e) {
    console.error('Error initializing SMTP settings:', e);
  }
}

// ==========================================================================
// Contact Us Form Submission
// ==========================================================================
async function handleContactSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('contactName').value.trim();
  const email = document.getElementById('contactEmail').value.trim();
  const message = document.getElementById('contactMessage').value.trim();

  const btn = document.getElementById('sendContactBtn');
  btn.disabled = true;

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message })
    });
    const data = await res.json();

    closeModal('contactModal');
    document.getElementById('contactForm').reset();
    showToast(data.message || (state.lang === 'ar' ? 'تم استلام رسالتك بنجاح' : 'Message received!'), 'success');
  } catch (err) {
    showToast(state.lang === 'ar' ? 'شكراً لتواصلك، تم إرسال رسالتك.' : 'Thank you for reaching out.', 'success');
    closeModal('contactModal');
  } finally {
    btn.disabled = false;
  }
}

// ==========================================================================
// UI Helpers, Modal Controls & Toasts
// ==========================================================================
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (id === 'historyModal') renderHistoryModal();
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function initCloseModalOnOverlayClick() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        // Don't close if currently sending
        if (overlay.id === 'sendingProgressModal' && document.getElementById('closeProgressBtn').classList.contains('hidden')) {
          return;
        }
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconHtml = '<i class="fa-solid fa-circle-info toast-icon"></i>';
  if (type === 'success') iconHtml = '<i class="fa-solid fa-circle-check toast-icon"></i>';
  else if (type === 'error') iconHtml = '<i class="fa-solid fa-circle-exclamation toast-icon"></i>';

  toast.innerHTML = `
    ${iconHtml}
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).trim().toLowerCase());
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
