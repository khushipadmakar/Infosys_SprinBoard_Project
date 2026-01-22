// Main Application Logic

// Global state
window.currentUser = null;
window.currentView = 'dashboard';

// Default config
const defaultConfig = {
  system_title: "Smart Inventory Management System",
  company_name: "Your Company Name",
  low_stock_message: "Items below minimum stock level"
};

// Initialize app
async function initializeApp() {
  // Initialize Data SDK
  const dataInitialized = await initializeDataSDK();
  if (!dataInitialized) {
    return;
  }

  // Initialize Element SDK
  await window.elementSdk.init({
    defaultConfig,
    onConfigChange: async (config) => {
      const title = config.system_title || defaultConfig.system_title;
      
      const systemTitleEl = document.getElementById('systemTitle');
      const sidebarTitleEl = document.getElementById('sidebarTitle');
      
      if (systemTitleEl) systemTitleEl.textContent = title;
      if (sidebarTitleEl) sidebarTitleEl.textContent = title;
    },
    mapToCapabilities: (config) => ({
      recolorables: [],
      borderables: [],
      fontEditable: undefined,
      fontSizeable: undefined
    }),
    mapToEditPanelValues: (config) => new Map([
      ['system_title', config.system_title || defaultConfig.system_title],
      ['low_stock_message', config.low_stock_message || defaultConfig.low_stock_message]
    ])
  });

  setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('signupForm').addEventListener('submit', handleSignup);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
  document.getElementById('stockForm').addEventListener('submit', handleStockSubmit);
  document.getElementById('purchaseForm').addEventListener('submit', handlePurchaseSubmit);
  document.getElementById('employeeForm').addEventListener('submit', handleEmployeeSubmit);
  
  document.getElementById('purchaseQuantity').addEventListener('input', updatePurchaseTotal);
}

// Render navigation
function renderNavigation() {
  const nav = document.getElementById('sidebarNav');
  let navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'products', icon: '📦', label: 'Products' },
    { id: 'transactions', icon: '📝', label: 'Transactions' },
    { id: 'reports', icon: '📈', label: 'Reports' }
  ];

  if (window.currentUser.role === 'admin') {
    navItems.push({ id: 'employees', icon: '👥', label: 'Employees' });
  }

  nav.innerHTML = navItems.map(item => `
    <div class="nav-item ${window.currentView === item.id ? 'active' : ''}" onclick="navigateTo('${item.id}')">
      <span class="nav-icon">${item.icon}</span>
      <span>${item.label}</span>
    </div>
  `).join('');
}

// Navigate to view
function navigateTo(view) {
  window.currentView = view;
  renderNavigation();
  
  if (view === 'dashboard') renderDashboard();
  else if (view === 'products') renderProducts();
  else if (view === 'transactions') renderTransactions();
  else if (view === 'employees') renderEmployees();
  else if (view === 'reports') renderReports();
}

// Render dashboard
function renderDashboard() {
  const products = getProductsWithStock();
  const transactions = allData.filter(d => d.type === 'transaction');
  const pendingApprovals = allData.filter(d => d.type === 'user' && d.role === 'employee' && !d.approved);
  
  // Filter transactions by user if employee
  let userTransactions = transactions;
  if (window.currentUser.role === 'employee') {
    userTransactions = transactions.filter(t => t.performedBy === window.currentUser.username);
  }
  
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.currentStock <= p.minStockLevel);
  const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.unitPrice), 0);
  
  const config = window.elementSdk?.config || defaultConfig;
  const lowStockMessage = config.low_stock_message || defaultConfig.low_stock_message;

  const content = `
    <div class="content-header">
      <h1>📊 Dashboard</h1>
      <p>Welcome back, <strong>${window.currentUser.username}</strong>! Here's your inventory overview.</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-icon">📦</span>
        <div class="stat-label">Total Products</div>
        <div class="stat-value">${totalProducts}</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">⚠️</span>
        <div class="stat-label">Low Stock Items</div>
        <div class="stat-value">${lowStockProducts.length}</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">💰</span>
        <div class="stat-label">Total Inventory Value</div>
        <div class="stat-value">$${totalValue.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">📝</span>
        <div class="stat-label">Your Transactions</div>
        <div class="stat-value">${userTransactions.length}</div>
      </div>
      ${window.currentUser.role === 'admin' ? `
        <div class="stat-card">
          <span class="stat-icon">👤</span>
          <div class="stat-label">Pending Approvals</div>
          <div class="stat-value">${pendingApprovals.length}</div>
        </div>
      ` : ''}
    </div>

    ${window.currentUser.role === 'admin' && pendingApprovals.length > 0 ? `
      <div class="alert-section">
        <div class="alert-header">
          <h2>👤 Pending Employee Approvals</h2>
        </div>
        ${pendingApprovals.map(user => `
          <div class="approval-card">
            <div class="approval-header">
              <h3 class="approval-name">${user.username}</h3>
              <span class="approval-badge">Pending</span>
            </div>
            <div class="approval-details">
              <p><strong>📧 Email:</strong> ${user.email}</p>
              <p><strong>🎯 Role:</strong> Employee</p>
              <p><strong>📅 Requested:</strong> ${new Date(user.createdAt).toLocaleString()}</p>
            </div>
            <div class="approval-actions">
              <button class="btn-approve" onclick='approveUser(${JSON.stringify(user)})'>✓ Approve</button>
              <button class="btn-reject" onclick='rejectUser(${JSON.stringify(user)})'>✗ Reject</button>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    ${lowStockProducts.length > 0 ? `
      <div class="alert-section">
        <div class="alert-header">
          <h2>⚠️ Low Stock Alerts</h2>
        </div>
        ${lowStockProducts.slice(0, 5).map(p => `
          <div class="alert-item">
            <h4>📦 ${p.productName}</h4>
            <p><strong>Current Stock:</strong> ${p.currentStock} | <strong>Minimum Required:</strong> ${p.minStockLevel} | ${lowStockMessage}</p>
          </div>
        `).join('')}
        ${lowStockProducts.length > 5 ? `<p style="text-align: center; margin-top: 12px; color: #64748b;">And ${lowStockProducts.length - 5} more items...</p>` : ''}
      </div>
    ` : ''}

    <div class="products-section">
      <div class="products-header">
        <h2>📝 Recent Transactions</h2>
        <button class="btn-add" onclick="navigateTo('transactions')">View All</button>
      </div>
      ${userTransactions.length > 0 ? userTransactions.reverse().slice(0, 5).map(t => {
        const product = referenceProducts.find(p => p.id === t.productId);
        const date = new Date(t.timestamp);
        return `
          <div class="transaction-item">
            <div class="transaction-info">
              <h4>${product ? product.name : 'Unknown Product'}</h4>
              <p>📅 ${date.toLocaleDateString()} ${date.toLocaleTimeString()} • 👤 By: ${t.performedBy}</p>
            </div>
            <div>
              <span class="transaction-badge badge-${t.transactionType}">${t.transactionType.toUpperCase()}</span>
              <strong style="margin-left: 12px; font-size: 16px;">${t.quantity} units</strong>
            </div>
          </div>
        `;
      }).join('') : `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <h3>No transactions yet</h3>
          <p>Transactions will appear here once you start managing inventory</p>
        </div>
      `}
    </div>
  `;

  document.getElementById('mainContent').innerHTML = content;
}

// Render employees (admin only)
function renderEmployees() {
  const employees = allData.filter(d => d.type === 'user' && d.role === 'employee');
  const admins = allData.filter(d => d.type === 'user' && d.role === 'admin');
  
  const content = `
    <div class="content-header">
      <h1>👥 Employee Management</h1>
      <p>Manage employee accounts and access</p>
    </div>

    <div class="products-section">
      <div class="products-header">
        <h2>All Employees (${employees.length})</h2>
        <button class="btn-add" onclick="openEmployeeModal()">+ Add Employee</button>
      </div>

      ${employees.length > 0 ? employees.map(emp => `
        <div class="employee-card">
          <div class="employee-header">
            <h3 class="employee-name">👤 ${emp.username}</h3>
            <span class="employee-role">${emp.approved ? '✅ Approved' : '⏳ Pending'}</span>
          </div>
          <div class="employee-details">
            <p><strong>📧 Email:</strong> ${emp.email}</p>
            <p><strong>📅 Created:</strong> ${new Date(emp.createdAt).toLocaleDateString()}</p>
            <p><strong>🎯 Status:</strong> ${emp.approved ? 'Active' : 'Waiting Approval'}</p>
          </div>
        </div>
      `).join('') : `
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <h3>No employees yet</h3>
          <p>Add employees to grant them access to the system</p>
        </div>
      `}
    </div>

    <div class="products-section" style="margin-top: 24px;">
      <div class="products-header">
        <h2>Administrators (${admins.length})</h2>
      </div>

      ${admins.map(admin => `
        <div class="employee-card">
          <div class="employee-header">
            <h3 class="employee-name">👑 ${admin.username}</h3>
            <span class="employee-role" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); color: #92400e;">Admin</span>
          </div>
          <div class="employee-details">
            <p><strong>📧 Email:</strong> ${admin.email}</p>
            <p><strong>📅 Created:</strong> ${new Date(admin.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('mainContent').innerHTML = content;
}

// Open employee modal
function openEmployeeModal() {
  document.getElementById('employeeForm').reset();
  document.getElementById('employeeModal').classList.add('active');
}

// Close employee modal
function closeEmployeeModal() {
  document.getElementById('employeeModal').classList.remove('active');
}

// Handle employee submit
async function handleEmployeeSubmit(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById('employeeSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading-spinner"></span> Creating...';
  
  const employeeData = {
    type: 'user',
    username: document.getElementById('empUsername').value,
    email: document.getElementById('empEmail').value,
    password: document.getElementById('empPassword').value,
    role: 'employee',
    approved: true,
    createdAt: new Date().toISOString()
  };

  const result = await window.dataSdk.create(employeeData);

  if (result.isOk) {
    closeEmployeeModal();
    showInlineMessage('Employee created successfully!', 'success');
  } else {
    showInlineMessage('Error creating employee. Please try again.', 'error');
  }
  
  submitBtn.disabled = false;
  submitBtn.textContent = 'Add Employee';
}

// Initialize app when page loads
window.addEventListener('load', initializeApp);