const { validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const {
  sendLowStockAlert,
  sendOutOfStockAlert
} = require('../utils/emailService'); // Make sure this path is correct

/**
 * @desc    Get all transactions
 * @route   GET /api/transactions
 * @access  Private (Admin = all, Employee = own)
 */
exports.getAllTransactions = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'employee') {
      query.user = req.user.id;
    }

    const transactions = await Transaction.find(query)
      .populate('product', 'name sku category price')
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get logged-in user's transactions
 * @route   GET /api/transactions/my-transactions
 * @access  Private
 */
exports.getMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .populate('product', 'name sku category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get single transaction
 * @route   GET /api/transactions/:id
 * @access  Private
 */
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('product', 'name sku category price')
      .populate('user', 'username email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (
      req.user.role === 'employee' &&
      transaction.user._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Create new transaction
 * @route   POST /api/transactions
 * @access  Private
 */
exports.createTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { type, product: productId, quantity, notes } = req.body;

    // Get product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Admin-only stock operations
    if (
      (type === 'stock-in' || type === 'stock-out') &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can manage stock'
      });
    }

    // Stock availability check
    if (
      (type === 'stock-out' || type === 'purchase') &&
      product.stock < quantity
    ) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${product.stock}`
      });
    }

    // Track previous stock
    const previousStock = product.stock;

    // Update stock
    if (type === 'stock-in') {
      product.stock += quantity;
    } else if (type === 'stock-out' || type === 'purchase') {
      product.stock -= quantity;
    }

    await product.save();

    // Create transaction
    const transaction = await Transaction.create({
      type,
      product: productId,
      productName: product.name,
      productSku: product.sku,
      quantity,
      amount: product.price * quantity,
      notes: notes || '',
      user: req.user.id,
      userName: req.user.username,
      previousStock,
      currentStock: product.stock
    });

    // 🔔 EMAIL ALERTS
    if (type === 'stock-out' || type === 'purchase') {
      // OUT OF STOCK
      if (product.stock === 0) {
        console.log('📧 Triggering OUT OF STOCK email...');
        await sendOutOfStockAlert(product, req.user, {
          previousStock,
          quantity,
          notes
        });
      }
      // LOW STOCK
      else if (product.stock <= product.minStock) {
        console.log('📧 Triggering LOW STOCK email...');
        await sendLowStockAlert(product, req.user, {
          previousStock,
          quantity,
          notes
        });
      }
    }

    await transaction.populate('product', 'name sku category price');
    await transaction.populate('user', 'username email');

    res.status(201).json({
      success: true,
      transaction
    });

  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
