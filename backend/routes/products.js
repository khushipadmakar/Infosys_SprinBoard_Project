const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const app = require('../server');

// Helper function to check and trigger stock alerts
async function checkStockAlerts(product) {
  const sendLowStockAlert = app.get('sendLowStockAlert');
  const sendOutOfStockAlert = app.get('sendOutOfStockAlert');

  if (product.stock === 0) {
    await sendOutOfStockAlert(product);
  } else if (product.stock <= (product.minStock || 5)) {
    await sendLowStockAlert(product);
  }
}

// @route   GET /api/products
// @desc    Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Error fetching products', error: error.message });
  }
});

// @route   POST /api/products
// @desc    Create new product
router.post('/', async (req, res) => {
  try {
    const { name, sku, category, price, stock, minStock, supplier, description } = req.body;

    if (!name || !sku || !category || price === undefined || stock === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({ success: false, message: 'Product with this SKU already exists' });
    }

    const product = await Product.create({
      name,
      sku,
      category,
      price,
      stock,
      minStock: minStock || 5,
      supplier,
      description
    });

    await checkStockAlerts(product);

    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Error creating product', error: error.message });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
router.put('/:id', async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    await checkStockAlerts(product);

    res.json({ success: true, message: 'Product updated successfully', data: product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Error updating product', error: error.message });
  }
});

// @route   POST /api/products/buy/:id
// @desc    Simulate buying a product (reduce stock and trigger alerts)
router.post('/buy/:id', async (req, res) => {
  try {
    const { quantity } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Not enough stock available' });
    }

    product.stock -= quantity;
    await product.save();

    await checkStockAlerts(product);

    res.json({ success: true, message: 'Purchase successful', data: product });
  } catch (error) {
    console.error('Buy product error:', error);
    res.status(500).json({ success: false, message: 'Error buying product', error: error.message });
  }
});

// @route   GET /api/products/low-stock
// @desc    Get all low stock products
router.get('/low-stock', async (req, res) => {
  try {
    const products = await Product.find({ $expr: { $lte: ['$stock', '$minStock'] } }).sort({ stock: 1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Low stock fetch error:', error);
    res.status(500).json({ success: false, message: 'Error fetching low stock products', error: error.message });
  }
});

module.exports = router;