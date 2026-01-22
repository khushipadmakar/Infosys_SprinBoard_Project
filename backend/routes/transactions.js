const express = require('express');
const router = express.Router();

const Transaction = require('../models/Transaction');
const Product = require('../models/Product');

const { protect } = require('../middleware/auth');
const {
  sendLowStockAlert,
  sendOutOfStockAlert
} = require('../services/emailService');

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('product', 'name sku')
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions'
    });
  }
});

/**
 * @route   GET /api/transactions/:id
 * @desc    Get single transaction
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('product', 'name sku')
      .populate('user', 'name email role');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction'
    });
  }
});

/**
 * @route   POST /api/transactions
 * @desc    Create transaction (IN / OUT) + trigger stock alerts
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const { product, type, quantity, notes } = req.body;

    // Basic validation
    if (!product || !type || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Product, type and quantity are required'
      });
    }

    if (!['IN', 'OUT'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Transaction type must be IN or OUT'
      });
    }

    // Fetch product
    const productDoc = await Product.findById(product);
    if (!productDoc) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const oldStock = productDoc.stock;
    const wasAboveMinStock = oldStock > productDoc.minStock;

    // Prevent negative stock
    if (type === 'OUT' && oldStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${oldStock}`
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      product,
      type,
      quantity,
      notes,
      user: req.user.id
    });

    // Update stock
    if (type === 'IN') {
      productDoc.stock += quantity;
    } else {
      productDoc.stock -= quantity;
    }

    const newStock = productDoc.stock;
    await productDoc.save();

    // Email context
    const transactionContext = {
      quantity,
      previousStock: oldStock,
      notes
    };

    let alertSent = false;
    let alertType = null;

    // 🔔 EMAIL ALERT LOGIC (ONLY FOR OUT)
    if (type === 'OUT') {
      if (newStock === 0) {
        const result = await sendOutOfStockAlert(
          productDoc,
          req.user,
          transactionContext
        );

        if (result.success) {
          alertSent = true;
          alertType = 'OUT_OF_STOCK';
        }
      } else if (newStock <= productDoc.minStock && wasAboveMinStock) {
        const result = await sendLowStockAlert(
          productDoc,
          req.user,
          transactionContext
        );

        if (result.success) {
          alertSent = true;
          alertType = 'LOW_STOCK';
        }
      }
    }

    // Populate for response
    await transaction.populate('product', 'name sku');
    await transaction.populate('user', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      alertSent,
      alertType,
      data: {
        transaction,
        stock: {
          previous: oldStock,
          current: newStock,
          minStock: productDoc.minStock,
          isLowStock: newStock <= productDoc.minStock,
          isOutOfStock: newStock === 0
        }
      }
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating transaction'
    });
  }
});

/**
 * @route   GET /api/transactions/product/:productId
 * @desc    Get transactions by product
 * @access  Private
 */
router.get('/product/:productId', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      product: req.params.productId
    })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    console.error('Get product transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product transactions'
    });
  }
});

module.exports = router;
