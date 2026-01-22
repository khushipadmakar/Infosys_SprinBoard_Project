
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/reports/dashboard
// @desc    Get dashboard statistics
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    // Total products
    const totalProducts = await Product.countDocuments();

    // Low stock products
    const lowStockProducts = await Product.countDocuments({
      $expr: { $lte: ['$stock', '$minStock'] }
    });

    // Out of stock products
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });

    // Total inventory value
    const products = await Product.find();
    const totalValue = products.reduce((sum, product) => {
      return sum + (product.price * product.stock);
    }, 0);

    // Recent transactions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentTransactions = await Transaction.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Transactions by type
    const inTransactions = await Transaction.countDocuments({ type: 'IN' });
    const outTransactions = await Transaction.countDocuments({ type: 'OUT' });

    // Categories distribution
    const categories = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$stock'] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalProducts,
          lowStockProducts,
          outOfStockProducts,
          totalValue: totalValue.toFixed(2)
        },
        transactions: {
          recent: recentTransactions,
          in: inTransactions,
          out: outTransactions
        },
        categories
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// @route   GET /api/reports/inventory
// @desc    Get inventory report
// @access  Private
router.get('/inventory', protect, async (req, res) => {
  try {
    const products = await Product.find().sort({ stock: 1 });

    const report = {
      totalProducts: products.length,
      totalValue: 0,
      lowStock: [],
      outOfStock: [],
      byCategory: {}
    };

    products.forEach(product => {
      // Calculate total value
      report.totalValue += product.price * product.stock;

      // Check stock levels
      if (product.stock === 0) {
        report.outOfStock.push(product);
      } else if (product.stock <= product.minStock) {
        report.lowStock.push(product);
      }

      // Group by category
      if (!report.byCategory[product.category]) {
        report.byCategory[product.category] = {
          count: 0,
          totalStock: 0,
          totalValue: 0
        };
      }
      report.byCategory[product.category].count += 1;
      report.byCategory[product.category].totalStock += product.stock;
      report.byCategory[product.category].totalValue += product.price * product.stock;
    });

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating inventory report',
      error: error.message
    });
  }
});

// @route   GET /api/reports/transactions
// @desc    Get transactions report
// @access  Private
router.get('/transactions', protect, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    // Build query
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .populate('product', 'name sku category price')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      total: transactions.length,
      inCount: 0,
      outCount: 0,
      inQuantity: 0,
      outQuantity: 0
    };

    transactions.forEach(transaction => {
      if (transaction.type === 'IN') {
        stats.inCount += 1;
        stats.inQuantity += transaction.quantity;
      } else {
        stats.outCount += 1;
        stats.outQuantity += transaction.quantity;
      }
    });

    res.json({
      success: true,
      data: {
        transactions,
        statistics: stats
      }
    });
  } catch (error) {
    console.error('Transactions report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating transactions report',
      error: error.message
    });
  }
});

// @route   GET /api/reports/low-stock
// @desc    Get low stock report
// @access  Private
router.get('/low-stock', protect, async (req, res) => {
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stock', '$minStock'] }
    }).sort({ stock: 1 });

    const outOfStockProducts = lowStockProducts.filter(p => p.stock === 0);
    const criticalStockProducts = lowStockProducts.filter(p => p.stock > 0);

    res.json({
      success: true,
      data: {
        total: lowStockProducts.length,
        outOfStock: {
          count: outOfStockProducts.length,
          products: outOfStockProducts
        },
        critical: {
          count: criticalStockProducts.length,
          products: criticalStockProducts
        }
      }
    });
  } catch (error) {
    console.error('Low stock report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating low stock report',
      error: error.message
    });
  }
});

// @route   GET /api/reports/category/:category
// @desc    Get report for specific category
// @access  Private
router.get('/category/:category', protect, async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });

    const report = {
      category: req.params.category,
      totalProducts: products.length,
      totalStock: 0,
      totalValue: 0,
      lowStock: 0,
      outOfStock: 0,
      products: products
    };

    products.forEach(product => {
      report.totalStock += product.stock;
      report.totalValue += product.price * product.stock;
      if (product.stock === 0) report.outOfStock += 1;
      else if (product.stock <= product.minStock) report.lowStock += 1;
    });

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Category report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating category report',
      error: error.message
    });
  }
});

// @route   GET /api/reports/product/:productId
// @desc    Get detailed product report
// @access  Private
router.get('/product/:productId', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get all transactions for this product
    const transactions = await Transaction.find({ product: req.params.productId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      totalTransactions: transactions.length,
      totalIn: 0,
      totalOut: 0,
      currentStock: product.stock,
      currentValue: product.price * product.stock
    };

    transactions.forEach(transaction => {
      if (transaction.type === 'IN') {
        stats.totalIn += transaction.quantity;
      } else {
        stats.totalOut += transaction.quantity;
      }
    });

    res.json({
      success: true,
      data: {
        product,
        statistics: stats,
        transactions
      }
    });
  } catch (error) {
    console.error('Product report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating product report',
      error: error.message
    });
  }
});

// @route   GET /api/reports/trends
// @desc    Get inventory trends
// @access  Private (Admin only)
router.get('/trends', protect, authorize('admin'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get transactions grouped by date
    const transactions = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type'
          },
          quantity: { $sum: '$quantity' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Trends report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating trends report',
      error: error.message
    });
  }
});

module.exports = router;