const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const {
  sendTestEmail,
  sendLowStockAlert,
  sendOutOfStockAlert,
  sendDailyLowStockSummary
} = require('../services/emailService');

// @route   POST /api/notifications/test
// @desc    Send test email
// @access  Private (Admin only)
router.post('/test', protect, authorize('admin'), async (req, res) => {
  try {
    const { email } = req.body;
    const toEmail = email || req.user.email;

    console.log('📧 Sending test email to:', toEmail);
    const result = await sendTestEmail(toEmail);

    if (result.success) {
      res.json({
        success: true,
        message: `Test email sent successfully to ${toEmail}`,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test email',
      error: error.message
    });
  }
});

// @route   POST /api/notifications/low-stock/:productId
// @desc    Send low stock alert for specific product
// @access  Private (Admin only)
router.post('/low-stock/:productId', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('📧 Sending low stock alert for:', product.name);
    const result = await sendLowStockAlert(product);

    if (result.success) {
      res.json({
        success: true,
        message: 'Low stock alert sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send low stock alert',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Low stock alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending low stock alert',
      error: error.message
    });
  }
});

// @route   POST /api/notifications/out-of-stock/:productId
// @desc    Send out of stock alert for specific product
// @access  Private (Admin only)
router.post('/out-of-stock/:productId', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('📧 Sending out of stock alert for:', product.name);
    const result = await sendOutOfStockAlert(product);

    if (result.success) {
      res.json({
        success: true,
        message: 'Out of stock alert sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send out of stock alert',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Out of stock alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending out of stock alert',
      error: error.message
    });
  }
});

// @route   POST /api/notifications/daily-summary
// @desc    Send daily low stock summary
// @access  Private (Admin only)
router.post('/daily-summary', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('📧 Generating daily low stock summary...');
    
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stock', '$minStock'] }
    }).sort({ stock: 1 });

    if (lowStockProducts.length === 0) {
      return res.json({
        success: true,
        message: 'No low stock products to report'
      });
    }

    const result = await sendDailyLowStockSummary(lowStockProducts);

    if (result.success) {
      res.json({
        success: true,
        message: `Daily summary sent successfully (${lowStockProducts.length} products)`,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send daily summary',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Daily summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending daily summary',
      error: error.message
    });
  }
});

// @route   GET /api/notifications/check-alerts
// @desc    Check and send alerts for low/out of stock products
// @access  Private (Admin only)
router.get('/check-alerts', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('🔍 Checking for low stock products...');
    
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stock', '$minStock'] }
    });

    const alerts = {
      sent: 0,
      failed: 0,
      products: []
    };

    for (const product of lowStockProducts) {
      let result;
      
      if (product.stock === 0) {
        console.log(`📧 Sending out of stock alert for: ${product.name}`);
        result = await sendOutOfStockAlert(product);
      } else {
        console.log(`📧 Sending low stock alert for: ${product.name}`);
        result = await sendLowStockAlert(product);
      }

      if (result.success) {
        alerts.sent += 1;
      } else {
        alerts.failed += 1;
      }

      alerts.products.push({
        product: product.name,
        sku: product.sku,
        stock: product.stock,
        sent: result.success
      });
    }

    res.json({
      success: true,
      message: `Checked ${lowStockProducts.length} products`,
      data: alerts
    });
  } catch (error) {
    console.error('Check alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking alerts',
      error: error.message
    });
  }
});

module.exports = router;