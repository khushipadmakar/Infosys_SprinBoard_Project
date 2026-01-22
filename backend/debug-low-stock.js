require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const checkProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all products
    const allProducts = await Product.find();
    console.log(`📦 Total Products: ${allProducts.length}\n`);

    if (allProducts.length === 0) {
      console.log('⚠️  No products in database!');
      console.log('Add a product first with stock <= minStock\n');
      process.exit(0);
    }

    // Show all products
    console.log('All Products:');
    console.log('═══════════════════════════════════════════════════\n');
    allProducts.forEach(product => {
      const isLowStock = product.stock <= product.minStock;
      console.log(`📦 ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Current Stock: ${product.stock}`);
      console.log(`   Min Stock: ${product.minStock}`);
      console.log(`   Status: ${isLowStock ? '🚨 LOW STOCK' : '✅ OK'}`);
      console.log('');
    });

    // Find low stock products using the same query as the alert system
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stock', '$minStock'] }
    });

    console.log('═══════════════════════════════════════════════════');
    console.log(`\n⚠️  Low Stock Products: ${lowStockProducts.length}\n`);

    if (lowStockProducts.length === 0) {
      console.log('💡 To test alerts, create a product with:');
      console.log('   - stock: 5');
      console.log('   - minStock: 10');
    } else {
      console.log('Low Stock Products that should trigger alerts:');
      lowStockProducts.forEach(product => {
        console.log(`   🚨 ${product.name} - Stock: ${product.stock}/${product.minStock}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkProducts();


