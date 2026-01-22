# Smart Inventory Management System

A comprehensive web-based inventory management system designed to manage products efficiently using role-based access control, real-time stock tracking, transaction management, and detailed reporting.

---

## 🚀 Features

### 🔐 Authentication & User Management

* Secure login and signup system
* Role-based access control (Admin & Employee)
* Admin approval required for employee registration
* Supports multiple users working simultaneously
* JWT-based authentication for secure session handling

---

### 📦 Product & Inventory Management

* **40 preloaded book products** across 5 categories:

  * Artificial Intelligence (8)
  * Machine Learning (8)
  * Data Science (8)
  * Web Development (8)
  * App Development (8)
* Add, update, view, and delete products (Admin only)
* Real-time stock tracking
* Stock-in and stock-out management
* Minimum stock level configuration
* Automatic low-stock alerts
* Purchase functionality for both Admin and Employee

---

### 🔄 Transaction Management

* Records all stock-in, stock-out, purchase, and sale transactions
* Automatically logs:

  * Product details
  * Transaction type
  * Quantity
  * Date & time
  * User performing the action
* Employees can view **only their own transactions**
* Admin can view **all transactions**
* Supports notes for each transaction
* Date-based filtering (Today, This Week, This Month)

---

### 📊 Reports & Analytics

* Available for both Admin and Employee (role-based)
* Real-time dashboard statistics:

  * Total products
  * Total transactions
  * Low-stock items
  * Total inventory value
* Category-wise inventory breakdown
* Low-stock report for restocking decisions
* Export options:

  * CSV
  * JSON
  * Full report access (Admin only)

---

### 🗄️ Database Integration

* Persistent data storage
* Real-time data synchronization
* Input validation and error handling
* Ensures data consistency and integrity

---

## 📁 Project Structure

```
smart-inventory-system/
├── frontend/
│   ├── index.html
│   ├── css/
│   │   ├── variables.css
│   │   ├── common.css
│   │   ├── login.css
│   │   ├── dashboard.css
│   │   ├── products.css
│   │   ├── transactions.css
│   │   └── reports.css
│   └── js/
│       ├── config.js
│       ├── utils.js
│       ├── auth.js
│       ├── dashboard.js
│       ├── products.js
│       ├── transactions.js
│       ├── reports.js
│       ├── employees.js
│       └── app.js
├── backend/
│   ├── server.js
│   ├── config.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── transactions.js
│   │   └── notifications.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Transaction.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   └── services/
│       └── emailService.js
└── package.json
```

---

## 🎯 User Roles

### 👑 Admin

* Full dashboard access
* Add, edit, delete products
* Record stock-in and stock-out
* View all transactions
* Generate full reports
* Manage employees
* Approve or reject employee registrations

### 👤 Employee

* View dashboard
* View product list
* Purchase products
* Record stock updates
* View **only their own transactions**
* Generate reports based on their own activity

---

## 🔐 Default Login Credentials

**Admin Account**

* Username: `admin`
* Password: `admin123`
* Role: Admin

---

## 🛠️ Technologies Used

* **HTML5** – Application structure
* **CSS3** – Styling and responsive design
* **JavaScript (ES6+)** – Frontend & backend logic
* **Node.js & Express.js** – Backend server
* **JWT** – Secure authentication and authorization

---

## 📊 Data Schema

### Users

```javascript
{
  username: string,
  email: string,
  password: string,
  role: "admin" | "employee",
  approved: boolean,
  createdAt: ISODate
}
```

### Products

```javascript
{
  id: string,
  sku: string,
  productName: string,
  category: string,
  supplier: string,
  unitPrice: number,
  currentStock: number,
  minStockLevel: number
}
```

### Transactions

```javascript
{
  productId: string,
  transactionType: "stock-in" | "stock-out" | "purchase" | "sale",
  quantity: number,
  performedBy: string,
  timestamp: ISODate,
  notes: string
}
```

---

## 🎨 UI & Design Highlights

* Modern and professional UI
* Responsive design for all screen sizes
* Dark sidebar navigation
* Smooth animations and transitions
* Color-coded indicators for stock status

---

## 🚦 Getting Started

1. Clone the repository
2. Install dependencies using `npm install`
3. Start the backend server
4. Open `index.html` in a modern web browser
5. Login using admin credentials or register a new employee

---

## 📈 Future Enhancements

* Interactive dashboard charts
* Email notifications for low stock
* Barcode / QR code scanning
* Advanced filtering and search
* Bulk product upload
* Excel import/export
* Mobile application support

---

## 📝 License

This project is developed for academic purposes and learning.

---

## 👨‍💻 Support

For any issues or queries, please contact the project team or refer to the project documentation.
