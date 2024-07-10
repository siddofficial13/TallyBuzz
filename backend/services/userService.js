const {createTransporter} = require('../config/mailerConfig.js');

const sendEmail = async (recipientEmail, resetLink) => {
  let transporter = createTransporter();

  let mailOptions = {
    from: process.env.GMAIL_USER,
    to: recipientEmail,
    subject: 'Password Reset',
    text: `Click the following link to reset your password: ${resetLink}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully');
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};

module.exports = sendEmail;
