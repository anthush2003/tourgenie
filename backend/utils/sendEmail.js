const { sendMail } = require('../lib/mailer');

const sendEmail = async (options) => {
  const result = await sendMail({
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  });
  
  if (!result.sent) {
    throw new Error(result.reason || 'Email could not be sent');
  }
};

module.exports = sendEmail;
