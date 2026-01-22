require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const { sendLowStockAlert, sendOutOfStockAlert } = require('./services/emailService');

const testAlert = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a low stock product
    const lowStockProduct = await Product.findOne({
      $expr: { $lte: ['$stock', '$minStock'] }
    });

    if (!lowStockProduct) {
      console.log('⚠️  No low stock products found!');
      console.log('Creating a test product...\n');

      // Create a test low stock product
      const testProduct = await Product.create({
        name: 'Test Low Stock Item',
        sku: 'TEST-LOW-001',
        category: 'Test',
        price: 10,
        stock: 3,
        minStock: 10,
        supplier: 'Test Supplier',
        description: 'Test product for low stock alerts'
      });

      console.log('✅ Created test product:');
      console.log(`   Name: ${testProduct.name}`);
      console.log(`   Stock: ${testProduct.stock}`);
      console.log(`   Min Stock: ${testProduct.minStock}\n`);

      console.log('🔔 Sending low stock alert...\n');
      const result = await sendLowStockAlert(testProduct);

      if (result.success) {
        console.log('✅ Alert sent successfully!');
        console.log(`   Message ID: ${result.messageId}`);
        console.log(`   Email sent to: ${process.env.ADMIN_EMAIL}`);
      } else {
        console.log('❌ Failed to send alert');
        console.log(`   Error: ${result.error}`);
      }
    } else {
      console.log('📦 Found low stock product:');
      console.log(`   Name: ${lowStockProduct.name}`);
      console.log(`   Stock: ${lowStockProduct.stock}`);
      console.log(`   Min Stock: ${lowStockProduct.minStock}\n`);

      console.log('🔔 Sending low stock alert...\n');
      
      let result;
      if (lowStockProduct.stock === 0) {
        console.log('Sending OUT OF STOCK alert...');
        result = await sendOutOfStockAlert(lowStockProduct);
      } else {
        console.log('Sending LOW STOCK alert...');
        result = await sendLowStockAlert(lowStockProduct);
      }

      if (result.success) {
        console.log('✅ Alert sent successfully!');
        console.log(`   Message ID: ${result.messageId}`);
        console.log(`   Email sent to: ${process.env.ADMIN_EMAIL}`);
      } else {
        console.log('❌ Failed to send alert');
        console.log(`   Error: ${result.error}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
};
testAlert();