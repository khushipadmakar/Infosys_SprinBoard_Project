// Configuration
const CONFIG = {
  API_BASE_URL: 'http://localhost:3000/api',
  LOCAL_STORAGE_KEY: 'inventory_system',
  SESSION_KEY: 'user_session',
  LOW_STOCK_THRESHOLD: 10,
  EMAIL_NOTIFICATIONS_ENABLED: true,
  PAGINATION_LIMIT: 50,
  DEMO_MODE: true // Set to false in production
};

// Demo users (for development)
const DEMO_USERS = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    email: 'admin@inventory.com',
    role: 'admin'
  },
  {
    id: 2,
    username: 'employee',
    password: 'emp123',
    email: 'employee@inventory.com',
    role: 'employee'
  }
];

// API endpoints
const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  LOGOUT: '/auth/logout',
  
  // Products
  PRODUCTS: '/products',
  PRODUCT_BY_ID: (id) => `/products/${id}`,
  
  // Transactions
  TRANSACTIONS: '/transactions',
  TRANSACTION_BY_ID: (id) => `/transactions/${id}`,
  
  // Reports
  REPORTS: '/reports',
  INVENTORY_REPORT: '/reports/inventory',
  SALES_REPORT: '/reports/sales',
  
  // Notifications
  NOTIFICATIONS: '/notifications',
  SEND_EMAIL: '/notifications/email'
};