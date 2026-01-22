require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Testing email configuration...');
console.log('Mail Server:', process.env.MAIL_SERVER || 'smtp.gmail.com');
console.log('Mail Username:', process.env.EMAIL_USER || 'khushboopadmakar@gmail.com');
console.log('Mail Password:', process.env.EMAIL_PASS ? '***hidden***' : 'NOT SET');
console.log('');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'khushboopadmakar@gmail.com',
    pass: process.env.EMAIL_PASS || 'vxfldmmxyyzezefo'
  }
});

const mailOptions = {
  from: process.env.EMAIL_USER || 'khushboopadmakar@gmail.com',
  to: process.env.ADMIN_EMAIL || 'khushboopadmakar@gmail.com',
  subject: '✅ Test Email from Inventory System',
  html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f0fdf4; border-radius: 10px; border: 2px solid #22c55e;">
      <h2 style="color: #15803d;">✅ Email Configuration Working!</h2>
      <p>Your inventory management system is successfully configured to send email alerts.</p>
      
      <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1f2937;">Configuration Details:</h3>
        <p><strong>Email Server:</strong> smtp.gmail.com</p>
        <p><strong>From:</strong> ${process.env.EMAIL_USER || 'khushboopadmakar@gmail.com'}</p>
        <p><strong>Admin Email:</strong> ${process.env.ADMIN_EMAIL || 'khushboopadmakar@gmail.com'}</p>
      </div>
      
      <p style="color: #15803d; font-weight: bold;">You will now receive alerts when products reach low stock or go out of stock!</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">This is a test email from your Inventory Management System.</p>
    </div>
  `
};

console.log('Sending test email...');

transporter.sendMail(mailOptions)
  .then((info) => {
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('');
    console.log('Check your inbox at:', process.env.ADMIN_EMAIL || 'khushboopadmakar@gmail.com');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error sending email:', err.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check if EMAIL_USER and EMAIL_PASS are set correctly in .env');
    console.error('2. Make sure you are using Gmail App Password (not regular password)');
    console.error('3. Verify 2-Step Verification is enabled in your Google Account');
    process.exit(1);
  });