
// Show dashboard
function showDashboard() {
  const loginPage = document.getElementById('loginPage');
  const dashboardPage = document.getElementById('dashboardPage');
  
  loginPage.classList.add('hidden');
  dashboardPage.classList.remove('hidden');
  
  initializeDashboard();
}

// Initialize dashboard
function initializeDashboard() {
  const user = getCurrentUser();
  
  if (!user) {
    logout();
    return;
  }
  
  // Update user info in sidebar
  updateUserInfo(user);
  
  // Generate navigation based on role
  generateNavigation(user.role);
  
  // Load default view (overview)
  loadOverview();
  
  // Setup logout button
  setupLogout();
}

// Update user info in sidebar
function updateUserInfo(user) {
  document.getElementById('userName').textContent = user.username;
  document.getElementById('userRole').textContent = user.role === 'admin' ? 'Administrator' : 'Employee';
  document.getElementById('userAvatar').textContent = user.username.charAt(0).toUpperCase();
  document.getElementById('userInfo').textContent = `Logged in as ${user.role}`;
}

// Generate navigation
function generateNavigation(role) {
  const nav = document.getElementById('sidebarNav');
  
  const navItems = [
    { id: 'overview', icon: '📊', text: 'Overview', roles: ['admin', 'employee'] },
    { id: 'products', icon: '📦', text: 'Products', roles: ['admin', 'employee'] },
    { id: 'transactions', icon: '📋', text: 'Transactions', roles: ['admin', 'employee'] },
    { id: 'reports', icon: '📈', text: 'Reports', roles: ['admin'] },
    { id: 'employees', icon: '👥', text: 'Employees', roles: ['admin'] },
    // { id: 'settings', icon: '⚙️', text: 'Settings', roles: ['admin'] }
  ];
  
  const filteredItems = navItems.filter(item => item.roles.includes(role));
  
  nav.innerHTML = filteredItems.map(item => `
    <button class="nav-item" data-view="${item.id}" onclick="navigateToView('${item.id}')">
      <span class="nav-item-icon">${item.icon}</span>
      <span class="nav-item-text">${item.text}</span>
    </button>
  `).join('');
  
  // Set first item as active
  nav.querySelector('.nav-item').classList.add('active');
}

// Navigate to view
function navigateToView(viewId) {
  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  document.querySelector(`[data-view="${viewId}"]`).classList.add('active');
  
  // Load view
  switch (viewId) {
    case 'overview':
      loadOverview();
      break;
    case 'products':
      loadProducts();
      break;
    case 'transactions':
      loadTransactions();
      break;
    case 'reports':
      loadReports();
      break;
    case 'employees':
      loadEmployees();
      break;
    case 'settings':
      loadSettings();
      break;
    default:
      loadOverview();
  }
}

// Load overview
function loadOverview() {
  const systemData = getLocalData(CONFIG.LOCAL_STORAGE_KEY);
  const products = systemData.products || [];
  const transactions = systemData.transactions || [];
  
  // Calculate stats
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockItems = products.filter(p => p.stock <= p.minStock && p.stock > 0).length;
  const outOfStockItems = products.filter(p => p.stock === 0).length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  
  // Recent transactions
  const recentTransactions = transactions.slice(-5).reverse();
  
  // Low stock products
  const lowStockProducts = products
    .filter(p => p.stock <= p.minStock)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);
  
  const content = `
    <div class="page-header">
      <div class="page-header-top">
        <div class="page-title-section">
          <h1 class="page-title">Dashboard Overview</h1>
          <p class="page-subtitle">Welcome back! Here's what's happening with your inventory.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="window.location.reload()">
            <span class="btn-icon">🔄</span>
            <span class="btn-text">Refresh</span>
          </button>
        </div>
      </div>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-info">
            <p class="stat-label">Total Products</p>
            <h3 class="stat-value">${formatNumber(totalProducts)}</h3>
          </div>
          <div class="stat-icon primary">📦</div>
        </div>
        <div class="stat-footer">
          <span class="stat-change positive">↑ Active products</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-info">
            <p class="stat-label">Total Stock</p>
            <h3 class="stat-value">${formatNumber(totalStock)}</h3>
          </div>
          <div class="stat-icon success">📊</div>
        </div>
        <div class="stat-footer">
          <span class="stat-change">Units in inventory</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-info">
            <p class="stat-label">Low Stock Items</p>
            <h3 class="stat-value">${formatNumber(lowStockItems)}</h3>
          </div>
          <div class="stat-icon warning">⚠️</div>
        </div>
        <div class="stat-footer">
          <span class="stat-change negative">⚡ Needs attention</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-info">
            <p class="stat-label">Out of Stock</p>
            <h3 class="stat-value">${formatNumber(outOfStockItems)}</h3>
          </div>
          <div class="stat-icon error">🚫</div>
        </div>
        <div class="stat-footer">
          <span class="stat-change negative">⚠️ Urgent restock</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-info">
            <p class="stat-label">Inventory Value</p>
            <h3 class="stat-value">${formatCurrency(totalValue)}</h3>
          </div>
          <div class="stat-icon success">💰</div>
        </div>
        <div class="stat-footer">
          <span class="stat-change positive">↑ Total value</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-info">
            <p class="stat-label">Transactions</p>
            <h3 class="stat-value">${formatNumber(transactions.length)}</h3>
          </div>
          <div class="stat-icon primary">📋</div>
        </div>
        <div class="stat-footer">
          <span class="stat-change">All time</span>
        </div>
      </div>
    </div>
    
    <div class="content-grid">
      <div class="content-col-8">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Recent Transactions</h2>
            <button class="btn btn-secondary btn-small" onclick="navigateToView('transactions')">
              View All →
            </button>
          </div>
          <div class="card-body">
            ${recentTransactions.length > 0 ? `
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${recentTransactions.map(t => `
                      <tr>
                        <td>
                          <div class="transaction-type-cell">
                            <div class="transaction-icon ${t.type}">
                              ${t.type === 'stock-in' ? '↓' : t.type === 'stock-out' ? '↑' : '🛒'}
                            </div>
                            <span>${t.type === 'stock-in' ? 'Stock In' : t.type === 'stock-out' ? 'Stock Out' : 'Purchase'}</span>
                          </div>
                        </td>
                        <td>${t.productName}</td>
                        <td>
                          <span class="quantity-change ${t.type === 'stock-in' || t.type === 'purchase' ? 'positive' : 'negative'}">
                            ${t.type === 'stock-in' || t.type === 'purchase' ? '+' : '-'}${t.quantity}
                          </span>
                        </td>
                        <td>${formatDate(t.createdAt)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>No Recent Transactions</h3>
                <p>Transaction history will appear here</p>
              </div>
            `}
          </div>
        </div>
      </div>
      
      <div class="content-col-4">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Low Stock Alerts</h2>
            <button class="btn btn-secondary btn-small" onclick="navigateToView('products')">
              Manage →
            </button>
          </div>
          <div class="card-body">
            ${lowStockProducts.length > 0 ? `
              <div style="display: flex; flex-direction: column; gap: 1rem;">
                ${lowStockProducts.map(p => `
                  <div style="padding: 1rem; background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--radius-lg);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                      <div>
                        <p style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">${p.name}</p>
                        <p style="font-size: 0.75rem; color: var(--text-tertiary);">${p.sku}</p>
                      </div>
                      ${getStockStatusBadge(getStockStatus(p.stock, p.minStock))}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.875rem;">
                      <span style="color: var(--text-secondary);">Current: <strong>${p.stock}</strong></span>
                      <span style="color: var(--text-tertiary);">Min: ${p.minStock}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="empty-state">
                <div class="empty-state-icon">✓</div>
                <h3>All Good!</h3>
                <p>No low stock items</p>
              </div>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('mainContent').innerHTML = content;
}

// Setup logout
function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        logout();
      }
    });
  }
}