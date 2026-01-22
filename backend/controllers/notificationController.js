const Product = require('../models/Product');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const EmailConfig = require('../models/EmailConfig');
const emailService = require('../services/emailService');
const { asyncHandler } = require('../middleware/errorHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Send test notification
// @route   POST /api/notifications/test
// @access  Private (Admin only)
exports.sendTestNotification = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return next(new ErrorResponse('Email address is required', 400));
  }

  const result = await emailService.sendTestEmail(email);

  if (!result.success) {
    return next(new ErrorResponse(result.message, 500));
  }

  res.status(200).json({
    success: true,
    message: 'Test email sent successfully',
    data: result
  });
});

// @desc    Send low stock alert for specific product
// @route   POST /api/notifications/low-stock-alert/:productId
// @access  Private (Admin only)
exports.sendLowStockNotification = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  // Get admin emails
  const admins = await User.find({ role: 'admin', isActive: true });
  const adminEmails = admins.map(admin => admin.email);

  if (adminEmails.length === 0) {
    return next(new ErrorResponse('No active admin users found', 404));
  }

  const result = await emailService.sendLowStockAlert(product, adminEmails);

  if (!result.success) {
    return next(new ErrorResponse(result.message, 500));
  }

  res.status(200).json({
    success: true,
    message: 'Low stock alert sent successfully',
    sentTo: adminEmails.length,
    data: result
  });
});

// @desc    Send out of stock alert for specific product
// @route   POST /api/notifications/out-of-stock-alert/:productId
// @access  Private (Admin only)
exports.sendOutOfStockNotification = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  // Get admin emails
  const admins = await User.find({ role: 'admin', isActive: true });
  const adminEmails = admins.map(admin => admin.email);

  if (adminEmails.length === 0) {
    return next(new ErrorResponse('No active admin users found', 404));
  }

  const result = await emailService.sendOutOfStockAlert(product, adminEmails);

  if (!result.success) {
    return next(new ErrorResponse(result.message, 500));
  }

  res.status(200).json({
    success: true,
    message: 'Out of stock alert sent successfully',
    sentTo: adminEmails.length,
    data: result
  });
});

// @desc    Send welcome email to new employee
// @route   POST /api/notifications/welcome-email/:userId
// @access  Private (Admin only)
exports.sendWelcomeNotification = asyncHandler(async (req, res, next) => {
  const { tempPassword } = req.body;

  if (!tempPassword) {
    return next(new ErrorResponse('Temporary password is required', 400));
  }

  const user = await User.findById(req.params.userId);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  const result = await emailService.sendWelcomeEmail(user, tempPassword);

  if (!result.success) {
    return next(new ErrorResponse(result.message, 500));
  }

  res.status(200).json({
    success: true,
    message: 'Welcome email sent successfully',
    data: result
  });
});

// @desc    Send transaction receipt
// @route   POST /api/notifications/transaction-receipt/:transactionId
// @access  Private
exports.sendTransactionReceiptNotification = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.transactionId)
    .populate('user', 'email username');

  if (!transaction) {
    return next(new ErrorResponse('Transaction not found', 404));
  }

  // Check authorization
  if (req.user.role !== 'admin' && transaction.user._id.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to send this receipt', 403));
  }

  const result = await emailService.sendTransactionReceipt(
    transaction,
    transaction.user.email
  );

  if (!result.success) {
    return next(new ErrorResponse(result.message, 500));
  }

  res.status(200).json({
    success: true,
    message: 'Transaction receipt sent successfully',
    data: result
  });
});

// @desc    Send daily summary to all admins
// @route   POST /api/notifications/daily-summary
// @access  Private (Admin only)
exports.sendDailySummaryNotification = asyncHandler(async (req, res, next) => {
  // Calculate summary data
  const products = await Product.find();
  
  const inStock = products.filter(p => p.stock > p.minStock).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  // Get today's transactions
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const todayTransactions = await Transaction.find({
    createdAt: { $gte: startOfDay }
  });

  const stockIn = todayTransactions.filter(t => t.type === 'stock-in').length;
  const stockOut = todayTransactions.filter(t => t.type === 'stock-out').length;
  const purchases = todayTransactions.filter(t => t.type === 'purchase').length;
  const revenue = todayTransactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + t.amount, 0);

  const summary = {
    inStock,
    lowStock,
    outOfStock,
    todayTransactions: todayTransactions.length,
    stockIn,
    stockOut,
    purchases,
    revenue
  };

  // Get admin emails
  const admins = await User.find({ role: 'admin', isActive: true });
  const adminEmails = admins.map(admin => admin.email);

  if (adminEmails.length === 0) {
    return next(new ErrorResponse('No active admin users found', 404));
  }

  const result = await emailService.sendDailySummary(summary, adminEmails);

  if (!result.success) {
    return next(new ErrorResponse(result.message, 500));
  }

  res.status(200).json({
    success: true,
    message: 'Daily summary sent successfully',
    sentTo: adminEmails.length,
    summary,
    data: result
  });
});

// @desc    Get notification settings
// @route   GET /api/notifications/settings
// @access  Private (Admin only)
exports.getNotificationSettings = asyncHandler(async (req, res, next) => {
  const config = await EmailConfig.findOne({ isActive: true });

  res.status(200).json({
    success: true,
    settings: config ? {
      enableLowStockAlerts: config.enableLowStockAlerts,
      enableOutOfStockAlerts: config.enableOutOfStockAlerts,
      enableTransactionReceipts: config.enableTransactionReceipts,
      enableDailySummary: config.enableDailySummary,
      dailySummaryTime: config.dailySummaryTime
    } : null
  });
});

// @desc    Update notification settings
// @route   PUT /api/notifications/settings
// @access  Private (Admin only)
exports.updateNotificationSettings = asyncHandler(async (req, res, next) => {
  const {
    enableLowStockAlerts,
    enableOutOfStockAlerts,
    enableTransactionReceipts,
    enableDailySummary,
    dailySummaryTime
  } = req.body;

  let config = await EmailConfig.findOne({ isActive: true });

  if (!config) {
    return next(new ErrorResponse('Email configuration not found', 404));
  }

  config.enableLowStockAlerts = enableLowStockAlerts ?? config.enableLowStockAlerts;
  config.enableOutOfStockAlerts = enableOutOfStockAlerts ?? config.enableOutOfStockAlerts;
  config.enableTransactionReceipts = enableTransactionReceipts ?? config.enableTransactionReceipts;
  config.enableDailySummary = enableDailySummary ?? config.enableDailySummary;
  config.dailySummaryTime = dailySummaryTime || config.dailySummaryTime;

  await config.save();

  res.status(200).json({
    success: true,
    message: 'Notification settings updated successfully',
    settings: {
      enableLowStockAlerts: config.enableLowStockAlerts,
      enableOutOfStockAlerts: config.enableOutOfStockAlerts,
      enableTransactionReceipts: config.enableTransactionReceipts,
      enableDailySummary: config.enableDailySummary,
      dailySummaryTime: config.dailySummaryTime
    }
  });
});

// @desc    Send bulk alerts for all low/out of stock products
// @route   POST /api/notifications/bulk-alerts
// @access  Private (Admin only)
exports.sendBulkStockAlerts = asyncHandler(async (req, res, next) => {
  const emailConfig = await EmailConfig.findOne({ isActive: true });
  
  if (!emailConfig) {
    return next(new ErrorResponse('Email configuration not found', 404));
  }

  // Get admin emails
  const admins = await User.find({ role: 'admin', isActive: true });
  const adminEmails = admins.map(admin => admin.email);

  if (adminEmails.length === 0) {
    return next(new ErrorResponse('No active admin users found', 404));
  }

  const products = await Product.find();
  
  const alerts = {
    lowStock: [],
    outOfStock: []
  };

  // Send alerts for out of stock products
  if (emailConfig.enableOutOfStockAlerts) {
    const outOfStockProducts = products.filter(p => p.stock === 0);
    
    for (const product of outOfStockProducts) {
      const result = await emailService.sendOutOfStockAlert(product, adminEmails);
      alerts.outOfStock.push({
        product: product.name,
        success: result.success
      });
    }
  }

  // Send alerts for low stock products
  if (emailConfig.enableLowStockAlerts) {
    const lowStockProducts = products.filter(
      p => p.stock > 0 && p.stock <= p.minStock
    );
    
    for (const product of lowStockProducts) {
      const result = await emailService.sendLowStockAlert(product, adminEmails);
      alerts.lowStock.push({
        product: product.name,
        success: result.success
      });
    }
  }

  res.status(200).json({
    success: true,
    message: 'Bulk alerts sent successfully',
    sentTo: adminEmails.length,
    alerts: {
      outOfStock: alerts.outOfStock.length,
      lowStock: alerts.lowStock.length
    },
    details: alerts
  });
});