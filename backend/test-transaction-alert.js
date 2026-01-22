require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Transaction = require('./models/Transaction');
const User = require('./models/User');
const { sendLowStockAlert, sendOutOfStockAlert } = require('./services/emailService');

const testTransactionAlert = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find admin user
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('Creating admin user...');
      admin = await User.create({
        name: 'Admin User',
        email: 'admin@inventory.com',
        password: 'admin123',
        role: 'admin'
      });
    }

    // Create test product
    console.log('Creating test product with stock: 15, minStock: 10\n');
    
    const product = await Product.create({
      name: 'Test Product for Alert',
      sku: `TEST-ALERT-${Date.now()}`,
      category: 'Test',
      price: 50,
      stock: 15,
      minStock: 10,
      supplier: 'Test Supplier',
      description: 'Testing automatic alerts'
    });

    console.log(`✅ Product created: ${product.name}`);
    console.log(`   Initial Stock: ${product.stock}`);
    console.log(`   Min Stock: ${product.minStock}\n`);

    // Simulate OUT transaction that triggers low stock
    console.log('📦 Creating OUT transaction (quantity: 7)');
    console.log('   This should drop stock from 15 to 8 (below minimum of 10)\n');

    const oldStock = product.stock;
    product.stock -= 7;
    const newStock = product.stock;
    await product.save();

    await Transaction.create({
      product: product._id,
      type: 'OUT',
      quantity: 7,
      user: admin._id,
      notes: 'Test transaction to trigger alert'
    });

    console.log(`✅ Transaction created`);
    console.log(`   Old Stock: ${oldStock}`);
    console.log(`   New Stock: ${newStock}`);
    console.log(`   Status: ${newStock <= product.minStock ? '⚠️  LOW STOCK' : '✅ OK'}\n`);

    if (newStock <= product.minStock && oldStock > product.minStock) {
      console.log('🔔 Sending LOW STOCK alert...\n');
      const result = await sendLowStockAlert(product);
      
      if (result.success) {
        console.log('✅ LOW STOCK alert sent successfully!');
        console.log(`   To: ${process.env.ADMIN_EMAIL}`);
        console.log(`   Message ID: ${result.messageId}\n`);
      } else {
        console.log('❌ Failed to send alert:', result.error);
      }
    }

    // Now trigger OUT OF STOCK
    console.log('📦 Creating another OUT transaction (quantity: 8)');
    console.log('   This should drop stock from 8 to 0 (OUT OF STOCK)\n');

    const oldStock2 = product.stock;
    product.stock -= 8;
    const newStock2 = product.stock;
    await product.save();

    await Transaction.create({
      product: product._id,
      type: 'OUT',
      quantity: 8,
      user: admin._id,
      notes: 'Test transaction to trigger OUT OF STOCK'
    });

    console.log(`✅ Transaction created`);
    console.log(`   Old Stock: ${oldStock2}`);
    console.log(`   New Stock: ${newStock2}`);
    console.log(`   Status: ${newStock2 === 0 ? '🚨 OUT OF STOCK' : '⚠️  LOW STOCK'}\n`);

    if (newStock2 === 0) {
      console.log('🔔 Sending OUT OF STOCK alert...\n');
      const result = await sendOutOfStockAlert(product);
      
      if (result.success) {
        console.log('✅ OUT OF STOCK alert sent successfully!');
        console.log(`   To: ${process.env.ADMIN_EMAIL}`);
        console.log(`   Message ID: ${result.messageId}\n`);
      } else {
        console.log('❌ Failed to send alert:', result.error);
      }
    }

    console.log('✅ Test completed! Check your email inbox.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testTransactionAlert();