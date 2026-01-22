const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();
    await Transaction.deleteMany();
    
    console.log('🗑️  Data cleared');
    
    // Create users
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });
    
    const employee = await User.create({
      username: 'employee',
      email: 'employee@example.com',
      password: 'emp123',
      role: 'employee'
    });
    
    console.log('✅ Users created');
    
    // Create products
    const products = await Product.create([
      {
        name: 'AI Development Kit',
        sku: 'AI-001',
        category: 'Artificial Intelligence',
        supplier: 'Tech Solutions Inc',
        price: 299.99,
        stock: 50,
        minStock: 10,
        createdBy: admin._id
      },
      {
        name: 'Machine Learning Toolkit',
        sku: 'ML-002',
        category: 'Machine Learning',
        supplier: 'Data Corp',
        price: 199.99,
        stock: 30,
        minStock: 15,
        createdBy: admin._id
      },
      {
        name: 'Data Analytics Suite',
        sku: 'DS-003',
        category: 'Data Science',
        supplier: 'Analytics Pro',
        price: 399.99,
        stock: 8,
        minStock: 10,
        createdBy: admin._id
      },
      {
        name: 'Web Development Package',
        sku: 'WEB-004',
        category: 'Web Development',
        supplier: 'WebTech Ltd',
        price: 149.99,
        stock: 100,
        minStock: 20,
        createdBy: admin._id
      },
      {
        name: 'Mobile App Framework',
        sku: 'APP-005',
        category: 'App Development',
        supplier: 'Mobile Solutions',
        price: 249.99,
        stock: 0,
        minStock: 5,
        createdBy: admin._id
      }
    ]);
    
    console.log('✅ Products created');
    
    // Create some transactions
    await Transaction.create([
      {
        type: 'stock-in',
        product: products[0]._id,
        productName: products[0].name,
        productSku: products[0].sku,
        quantity: 50,
        amount: 0,
        notes: 'Initial stock',
        user: admin._id,
        userName: admin.username
      },
      {
        type: 'purchase',
        product: products[0]._id,
        productName: products[0].name,
        productSku: products[0].sku,
        quantity: 2,
        amount: products[0].price * 2,
        notes: 'Customer order #1001',
        user: employee._id,
        userName: employee.username
      },
      {
        type: 'purchase',
        product: products[1]._id,
        productName: products[1].name,
        productSku: products[1].sku,
        quantity: 1,
        amount: products[1].price,
        notes: 'Customer order #1002',
        user: employee._id,
        userName: employee.username
      }
    ]);
    
    console.log('✅ Transactions created');
    
    console.log('🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();

