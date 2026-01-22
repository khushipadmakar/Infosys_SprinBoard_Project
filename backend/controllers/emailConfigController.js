const { validationResult } = require('express-validator');
const EmailConfig = require('../models/EmailConfig');
const emailService = require('../services/emailService');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get email configuration
// @route   GET /api/email-config
// @access  Private (Admin only)
exports.getEmailConfig = asyncHandler(async (req, res, next) => {
  const config = await EmailConfig.findOne({ isActive: true });
  
  res.status(200).json({
    success: true,
    config: config ? {
      mailUsername: config.mailUsername,
      mailServer: config.mailServer,
      mailPort: config.mailPort,
      testEmail: config.testEmail,
      enableLowStockAlerts: config.enableLowStockAlerts,
      enableOutOfStockAlerts: config.enableOutOfStockAlerts,
      enableTransactionReceipts: config.enableTransactionReceipts,
      enableDailySummary: config.enableDailySummary,
      dailySummaryTime: config.dailySummaryTime
    } : null
  });
});

// @desc    Create or update email configuration
// @route   POST /api/email-config
// @access  Private (Admin only)
exports.createOrUpdateEmailConfig = asyncHandler(async (req, res, next) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse('Validation failed', 400));
  }
  
  const {
    mailUsername,
    mailPassword,
    mailServer,
    mailPort,
    testEmail,
    enableLowStockAlerts,
    enableOutOfStockAlerts,
    enableTransactionReceipts,
    enableDailySummary,
    dailySummaryTime
  } = req.body;
  
  // Check if config exists
  let config = await EmailConfig.findOne({ isActive: true }).select('+mailPassword');
  
  if (config) {
    // Update existing config
    config.mailUsername = mailUsername;
    if (mailPassword) config.mailPassword = mailPassword;
    config.mailServer = mailServer;
    config.mailPort = mailPort;
    config.testEmail = testEmail;
    config.enableLowStockAlerts = enableLowStockAlerts !== undefined ? enableLowStockAlerts : config.enableLowStockAlerts;
    config.enableOutOfStockAlerts = enableOutOfStockAlerts !== undefined ? enableOutOfStockAlerts : config.enableOutOfStockAlerts;
    config.enableTransactionReceipts = enableTransactionReceipts !== undefined ? enableTransactionReceipts : config.enableTransactionReceipts;
    config.enableDailySummary = enableDailySummary !== undefined ? enableDailySummary : config.enableDailySummary;
    config.dailySummaryTime = dailySummaryTime || config.dailySummaryTime;
    
    await config.save();
  } else {
    // Create new config
    config = await EmailConfig.create({
      mailUsername,
      mailPassword,
      mailServer,
      mailPort,
      testEmail,
      enableLowStockAlerts: enableLowStockAlerts !== undefined ? enableLowStockAlerts : true,
      enableOutOfStockAlerts: enableOutOfStockAlerts !== undefined ? enableOutOfStockAlerts : true,
      enableTransactionReceipts: enableTransactionReceipts !== undefined ? enableTransactionReceipts : false,
      enableDailySummary: enableDailySummary !== undefined ? enableDailySummary : false,
      dailySummaryTime: dailySummaryTime || '18:00',
      isActive: true
    });
  }
  
  // Reinitialize email service with new config
  await emailService.reinitialize();
  
  res.status(200).json({
    success: true,
    message: 'Email configuration saved successfully',
    config: {
      mailUsername: config.mailUsername,
      mailServer: config.mailServer,
      mailPort: config.mailPort,
      testEmail: config.testEmail,
      enableLowStockAlerts: config.enableLowStockAlerts,
      enableOutOfStockAlerts: config.enableOutOfStockAlerts,
      enableTransactionReceipts: config.enableTransactionReceipts,
      enableDailySummary: config.enableDailySummary,
      dailySummaryTime: config.dailySummaryTime
    }
  });
});

// @desc    Send test email
// @route   POST /api/email-config/test
// @access  Private (Admin only)
exports.sendTestEmail = asyncHandler(async (req, res, next) => {
  const { testEmail } = req.body;
  
  if (!testEmail) {
    return next(new ErrorResponse('Test email address is required', 400));
  }
  
  const result = await emailService.sendTestEmail(testEmail);
  
  if (result.success) {
    res.status(200).json({
      success: true,
      message: 'Test email sent successfully'
    });
  } else {
    return next(new ErrorResponse(result.message || 'Failed to send test email', 500));
  }
});