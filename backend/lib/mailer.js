const nodemailer = require('nodemailer');

let transporter = null;
let verifiedOnce = false;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  if (!verifiedOnce) {
    verifiedOnce = true;
    transporter.verify().then(() => {
      console.log('[mailer] Gmail SMTP transporter ready');
    }).catch((err) => {
      console.error('[mailer] Gmail SMTP verification failed:', err.message);
    });
  }

  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const fromName = process.env.MAIL_FROM_NAME || 'TourGenie';
  const user = process.env.GMAIL_USER;
  const t = getTransporter();

  if (!t) {
    console.log(`[mailer] (not configured) Would send to=${to} subject="${subject}"`);
    return { sent: false, reason: 'not_configured' };
  }

  try {
    await t.sendMail({
      from: `"${fromName}" <${user}>`,
      to,
      subject,
      html,
      text: text || undefined,
    });
    return { sent: true };
  } catch (err) {
    console.error(`[mailer] Failed to send to ${to}:`, err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendMail };
