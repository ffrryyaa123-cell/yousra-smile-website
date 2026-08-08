import nodemailer from 'nodemailer';

export interface ContactSubmission {
  name: string;
  email: string;
  subject: string;
  message: string;
}

let transporter: nodemailer.Transporter | null = null;

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const getConfig = () => {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 465);
  const from = process.env.SMTP_FROM?.trim() || user;
  const contactEmail = process.env.CONTACT_EMAIL?.trim() || user;
  const secureValue = process.env.SMTP_SECURE?.trim().toLowerCase();

  if (
    !host
    || !user
    || !pass
    || !from
    || !contactEmail
    || !Number.isInteger(port)
    || port < 1
    || port > 65_535
    || (secureValue && secureValue !== 'true' && secureValue !== 'false')
  ) {
    return null;
  }

  return {
    host,
    port,
    secure: secureValue
      ? secureValue === 'true'
      : port === 465,
    user,
    pass,
    from,
    contactEmail,
  };
};

const getTransporter = () => {
  const config = getConfig();
  if (!config) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
      disableFileAccess: true,
      disableUrlAccess: true,
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000,
    });
  }

  return { transporter, config };
};

export const isSmtpConfigured = () => Boolean(getConfig());

export const verifySmtpConnection = async () => {
  const mail = getTransporter();
  if (!mail) return false;
  await mail.transporter.verify();
  return true;
};

export const sendContactNotification = async (submission: ContactSubmission) => {
  const mail = getTransporter();
  if (!mail) return false;

  const safeName = escapeHtml(submission.name);
  const safeEmail = escapeHtml(submission.email);
  const safeSubject = escapeHtml(submission.subject);
  const safeMessage = escapeHtml(submission.message).replaceAll('\n', '<br>');
  const mailSubject = submission.subject.replace(/[\r\n]+/g, ' ');

  await mail.transporter.sendMail({
    from: mail.config.from,
    to: mail.config.contactEmail,
    replyTo: submission.email,
    subject: `[Yousra Smile] ${mailSubject}`,
    text: `Name: ${submission.name}\nEmail: ${submission.email}\nSubject: ${submission.subject}\n\n${submission.message}`,
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.7">
      <h2>رسالة جديدة من موقع Yousra Smile</h2>
      <p><strong>الاسم:</strong> ${safeName}</p>
      <p><strong>البريد:</strong> ${safeEmail}</p>
      <p><strong>الموضوع:</strong> ${safeSubject}</p>
      <hr><p>${safeMessage}</p>
    </div>`,
  });

  return true;
};

export const sendNewsletterConfirmation = async (email: string) => {
  const mail = getTransporter();
  if (!mail) return false;

  await mail.transporter.sendMail({
    from: mail.config.from,
    to: email,
    replyTo: mail.config.contactEmail,
    subject: 'تم الاشتراك في نشرة Yousra Smile',
    text: 'شكرًا لاشتراكك في نشرة Yousra Smile. ستصلك أحدث المراجعات والعروض.',
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.7">
      <h2>أهلًا بك في Yousra Smile</h2>
      <p>تم تسجيل بريدك بنجاح. ستصلك أحدث المراجعات والعروض المختارة.</p>
    </div>`,
  });

  return true;
};

export const sendStaffReply = async (to: string, subject: string, message: string) => {
  const mail = getTransporter();
  if (!mail) return false;

  const safeMessage = escapeHtml(message).replaceAll('\n', '<br>');
  const mailSubject = subject.replace(/[\r\n]+/g, ' ');
  await mail.transporter.sendMail({
    from: mail.config.from,
    to,
    replyTo: mail.config.contactEmail,
    subject: `رد: ${mailSubject}`,
    text: message,
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.7">
      <p>${safeMessage}</p>
      <hr><p style="color:#666">فريق Yousra Smile</p>
    </div>`,
  });

  return true;
};
