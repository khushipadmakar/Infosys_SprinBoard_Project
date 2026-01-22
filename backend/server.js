require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const nodemailer = require('nodemailer');

const app = express();

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Connect MongoDB
connectDB();

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    uptime: process.uptime(),
    database: require('mongoose').connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV
  });
});

// ✅ Nodemailer setup
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_SERVER,
  port: process.env.MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD
  }
});

transporter.verify((error, success) => {
  if (error) console.error('❌ SMTP ERROR:', error);
  else console.log('✅ SMTP READY - Email service initialized');
});

// Email functions
async function sendLowStockAlert(product) {
  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: `⚠️ LOW STOCK ALERT: ${product.name}`,
      html: `<h3>Low Stock Alert</h3>
             <p>Product: ${product.name}</p>
             <p>Current Stock: ${product.stock}</p>`
    });
    console.log(`✅ Low stock email sent for ${product.name}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send low stock email:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendOutOfStockAlert(product) {
  try {
    const htmlTemplate = `
      <h2 style="color:#c9302c;">🚨 Out of Stock Alert</h2>
      <p>Dear Admin,</p>
      <p>The following product is now out of stock:</p>

      <table style="border-collapse:collapse;width:100%;max-width:500px;">
        <tr>
          <td style="border:1px solid #ddd;padding:8px;"><strong>Product Name</strong></td>
          <td style="border:1px solid #ddd;padding:8px;">${product.name}</td>
        </tr>
        <tr>
          <td style="border:1px solid #ddd;padding:8px;"><strong>Current Stock</strong></td>
          <td style="border:1px solid #ddd;padding:8px;">0</td>
        </tr>
      </table>

      <p>Please restock this item immediately to resume sales.</p>
      <p>Thank you,<br>Your Inventory Management System</p>
    `;

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: `🚨 OUT OF STOCK ALERT: ${product.name}`,
      html: htmlTemplate
    });

    console.log(`✅ Out-of-stock email sent for ${product.name}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send out-of-stock email:', error.message);
    return { success: false, error: error.message };
  }
}
app.set('sendLowStockAlert', sendLowStockAlert);
app.set('sendOutOfStockAlert', sendOutOfStockAlert);
// Expose globally


// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/users', require('./routes/users'));

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log('═══════════════════════════════════════════════════');
});

module.exports = app;
