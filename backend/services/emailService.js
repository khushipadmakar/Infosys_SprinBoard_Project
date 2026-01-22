const nodemailer = require('nodemailer');

// Create transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_SERVER,
  port: process.env.MAIL_PORT,
  secure: false, // true only for 465
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD
  }
});

// Verify SMTP connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP ERROR:', error);
  } else {
    console.log('✅ SMTP READY - Email service initialized');
  }
});

// Send Low Stock Alert
const sendLowStockAlert = async (product, user, transaction) => {
  const alertUser = user || { name: 'System', email: process.env.ADMIN_EMAIL };
  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: `⚠️ LOW STOCK ALERT: ${product.name}`,
      html: `<h2>Low Stock Alert</h2>
             <p>Product: ${product.name}</p>
             <p>Current Stock: ${product.stock}</p>
             <p>Minimum Stock: ${product.minStock}</p>
             <p>Performed by: ${alertUser.name} (${alertUser.email})</p>
             <p>Quantity Removed: ${transaction.quantity || 0}</p>
             <p>Notes: ${transaction.notes || 'N/A'}</p>`
    });

    console.log(`✅ Low stock email sent for ${product.name}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send low stock email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send Out of Stock Alert
const sendOutOfStockAlert = async (product, user, transaction) => {
  const alertUser = user || { name: 'System', email: process.env.ADMIN_EMAIL };
  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: `🚨 OUT OF STOCK: ${product.name}`,
      html: `<h2>Out of Stock Alert</h2>
             <p>Product: ${product.name}</p>
             <p>Current Stock: ${product.stock}</p>
             <p>Performed by: ${alertUser.name} (${alertUser.email})</p>
             <p>Quantity Removed: ${transaction.quantity || 0}</p>
             <p>Notes: ${transaction.notes || 'N/A'}</p>`
    });

    console.log(`✅ Out-of-stock email sent for ${product.name}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send out-of-stock email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendLowStockAlert, sendOutOfStockAlert };
