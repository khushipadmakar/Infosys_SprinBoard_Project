const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const emailConfigController = require('../controllers/emailConfigController');
const { protect, authorize } = require('../middleware/auth');

// Validation rules
const emailConfigValidation = [
  body('mailUsername').isEmail().withMessage('Please enter a valid email'),
  body('mailPassword').notEmpty().withMessage('Password is required'),
  body('mailServer').notEmpty().withMessage('Mail server is required'),
  body('mailPort').isInt({ min: 1, max: 65535 }).withMessage('Invalid port number')
];

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Routes
router.get('/', emailConfigController.getEmailConfig);
router.post('/', emailConfigValidation, emailConfigController.createOrUpdateEmailConfig);
router.post('/test', emailConfigController.sendTestEmail);

module.exports = router;