const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { sendLowStockAlert, sendOutOfStockAlert } = require('../services/emailService');

/**
 * @route   POST /api/transactions
 * @desc    Create transaction (stock-in / stock-out / purchase)
 *          Automatically triggers low-stock/out-of-stock emails
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const { product: productId, type, quantity, amount, notes } = req.body;

    // Validate input
    if (!productId || !type || !quantity || !amount) {
      return res.status(400).json({ success: false, message: 'Product, type, quantity and amount are required' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Prevent negative stock
    if (type === 'stock-out' && product.stock < quantity) {
      return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${product.stock}` });
    }

    const oldStock = product.stock;

    // Update stock
    if (type === 'stock-in' || type === 'purchase') {
      product.stock += quantity;
    } else if (type === 'stock-out') {
      product.stock -= quantity;
    }

    await product.save();

    // Create transaction document
    const transaction = await Transaction.create({
      type,
      product: product._id,
      productName: product.name,
      productSku: product.sku,
      quantity,
      amount,
      notes,
      user: req.user.id,
      userName: req.user.name
    });

    // 🔔 EMAIL ALERTS
    if (type === 'stock-out') {
      if (product.stock === 0) {
        await sendOutOfStockAlert(product, req.user, { quantity, notes, previousStock: oldStock });
      } else if (product.stock <= product.minStock && oldStock > product.minStock) {
        await sendLowStockAlert(product, req.user, { quantity, notes, previousStock: oldStock });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction,
      stock: {
        previous: oldStock,
        current: product.stock,
        minStock: product.minStock
      }
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ success: false, message: 'Error creating transaction', error: error.message });
  }
});

module.exports = router;
