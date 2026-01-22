const { validationResult } = require('express-validator');
const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, stockStatus } = req.query;
    
    // Build query
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } }
      ];
    }
    
    let products = await Product.find(query)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    
    // Filter by stock status if provided
    if (stockStatus) {
      products = products.filter(p => p.stockStatus === stockStatus);
    }
    
    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'username email');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin only)
exports.createProduct = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: req.body.sku.toUpperCase() });
    
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists'
      });
    }
    
    // Create product
    const product = await Product.create({
      ...req.body,
      sku: req.body.sku.toUpperCase(),
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
exports.updateProduct = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    let product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check if SKU is being changed and if it already exists
    if (req.body.sku && req.body.sku.toUpperCase() !== product.sku) {
      const existingProduct = await Product.findOne({ sku: req.body.sku.toUpperCase() });
      
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this SKU already exists'
        });
      }
    }
    
    // Update product
    product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, sku: req.body.sku ? req.body.sku.toUpperCase() : product.sku },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    await product.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update product stock
// @route   POST /api/products/:id/stock
// @access  Private (Admin only)
exports.updateStock = async (req, res) => {
  try {
    const { quantity, type } = req.body;
    
    if (!quantity || !type) {
      return res.status(400).json({
        success: false,
        message: 'Quantity and type are required'
      });
    }
    
    if (!['add', 'remove'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "add" or "remove"'
      });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Update stock
    if (type === 'add') {
      product.stock += parseInt(quantity);
    } else {
      if (product.stock < parseInt(quantity)) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock'
        });
      }
      product.stock -= parseInt(quantity);
    }
    
    await product.save();
    
    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};