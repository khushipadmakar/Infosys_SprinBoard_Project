const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    
    // Get products stats
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({
      $expr: { $lte: ['$stock', '$minStock'] }
    });
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });
    
    // Get transaction stats
    let transactionQuery = {};
    if (!isAdmin) {
      transactionQuery.user = req.user.id;
    }
    
    const totalTransactions = await Transaction.countDocuments(transactionQuery);
    const purchaseTransactions = await Transaction.find({ 
      ...transactionQuery, 
      type: 'purchase' 
    });
    
    const totalRevenue = purchaseTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Get recent transactions
    const recentTransactions = await Transaction.find(transactionQuery)
      .populate('product', 'name sku')
      .populate('user', 'username')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Admin-only stats
    let adminStats = {};
    if (isAdmin) {
      const totalEmployees = await User.countDocuments({ role: 'employee' });
      const stockInCount = await Transaction.countDocuments({ type: 'stock-in' });
      const stockOutCount = await Transaction.countDocuments({ type: 'stock-out' });
      
      adminStats = {
        totalEmployees,
        stockInCount,
        stockOutCount
      };
    }
    
    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        totalTransactions,
        totalRevenue,
        purchaseCount: purchaseTransactions.length,
        ...adminStats
      },
      recentTransactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get employee performance report
// @route   GET /api/reports/employee-performance
// @access  Private (Admin only)
exports.getEmployeePerformance = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' });
    
    const performanceData = await Promise.all(
      employees.map(async (employee) => {
        const transactions = await Transaction.find({ user: employee._id });
        const purchases = transactions.filter(t => t.type === 'purchase');
        
        const totalTransactions = transactions.length;
        const totalPurchases = purchases.length;
        const totalRevenue = purchases.reduce((sum, t) => sum + t.amount, 0);
        const totalItemsSold = purchases.reduce((sum, t) => sum + t.quantity, 0);
        
        return {
          employee: {
            id: employee._id,
            username: employee.username,
            email: employee.email
          },
          stats: {
            totalTransactions,
            totalPurchases,
            totalRevenue,
            totalItemsSold
          }
        };
      })
    );
    
    res.status(200).json({
      success: true,
      count: performanceData.length,
      data: performanceData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get product performance report
// @route   GET /api/reports/product-performance
// @access  Private (Admin only)
exports.getProductPerformance = async (req, res) => {
  try {
    const products = await Product.find();
    
    const performanceData = await Promise.all(
      products.map(async (product) => {
        const transactions = await Transaction.find({ product: product._id });
        const purchases = transactions.filter(t => t.type === 'purchase');
        
        const totalSold = purchases.reduce((sum, t) => sum + t.quantity, 0);
        const totalRevenue = purchases.reduce((sum, t) => sum + t.amount, 0);
        const totalTransactions = transactions.length;
        
        return {
          product: {
            id: product._id,
            name: product.name,
            sku: product.sku,
            category: product.category,
            currentStock: product.stock,
            stockStatus: product.stockStatus
          },
          stats: {
            totalSold,
            totalRevenue,
            totalTransactions
          }
        };
      })
    );
    
    // Sort by revenue
    performanceData.sort((a, b) => b.stats.totalRevenue - a.stats.totalRevenue);
    
    res.status(200).json({
      success: true,
      count: performanceData.length,
      data: performanceData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get employee's own performance
// @route   GET /api/reports/my-performance
// @access  Private
exports.getMyPerformance = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .populate('product', 'name sku category')
      .sort({ createdAt: -1 });
    
    const purchases = transactions.filter(t => t.type === 'purchase');
    
    const totalTransactions = transactions.length;
    const totalPurchases = purchases.length;
    const totalRevenue = purchases.reduce((sum, t) => sum + t.amount, 0);
    const totalItemsSold = purchases.reduce((sum, t) => sum + t.quantity, 0);
    
    // Get product performance
    const productPerformance = {};
    purchases.forEach(t => {
      const productId = t.product._id.toString();
      if (!productPerformance[productId]) {
        productPerformance[productId] = {
          product: t.product,
          quantity: 0,
          revenue: 0,
          transactions: 0
        };
      }
      productPerformance[productId].quantity += t.quantity;
      productPerformance[productId].revenue += t.amount;
      productPerformance[productId].transactions++;
    });
    
    const topProducts = Object.values(productPerformance)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    res.status(200).json({
      success: true,
      stats: {
        totalTransactions,
        totalPurchases,
        totalRevenue,
        totalItemsSold
      },
      topProducts,
      recentTransactions: transactions.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};