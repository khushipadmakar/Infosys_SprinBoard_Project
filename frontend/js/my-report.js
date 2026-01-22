
// Load employee's personal report
function loadMyReport() {
  const user = getCurrentUser();
  
  if (user.role !== 'employee') {
    document.getElementById('mainContent').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔒</div>
        <h3>Access Denied</h3>
        <p>This page is only accessible to employees</p>
      </div>
    `;
    return;
  }
  
  const systemData = getLocalData(CONFIG.LOCAL_STORAGE_KEY);
  const products = systemData.products || [];
  
  // Filter transactions for current employee only
  const myTransactions = systemData.transactions.filter(t => t.userId === user.id);
  
  // Calculate personal metrics
  const totalTransactions = myTransactions.length;
  const purchaseTransactions = myTransactions.filter(t => t.type === 'purchase');
  const totalPurchases = purchaseTransactions.length;
  const totalRevenue = purchaseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalItemsSold = purchaseTransactions.reduce((sum, t) => sum + t.quantity, 0);
  
  // Get product performance for employee
  const productPerformance = {};
  purchaseTransactions.forEach(t => {
    if (!productPerformance[t.productId]) {
      productPerformance[t.productId] = {
        productName: t.productName,
        productSku: t.productSku,
        quantity: 0,
        revenue: 0,
        transactions: 0
      };
    }
    productPerformance[t.productId].quantity += t.quantity;
    productPerformance[t.productId].revenue += t.amount;
    productPerformance[t.productId].transactions++;
  });
  
  const topProducts = Object.values(productPerformance)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  
  // Get recent transactions
  const recentTransactions = myTransactions
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);
  
  const content = `
    <div class="page-header">
      <div class="page-header-top">
        <div class="page-title-section">
          <h1 class="page-title">My Performance Report</h1>
          <p class="page-subtitle">Your personal transaction history and performance metrics</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="exportMyReport()">
            <span class="btn-icon">📥</span>
            <span class="btn-text">Export My Report</span>
          </button>
        </div>
      </div>
    </div>
    
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon">📋</div>
        <h3 class="metric-value">${formatNumber(totalTransactions)}</h3>
        <p class="metric-label">Total Transactions</p>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">🛒</div>
        <h3 class="metric-value">${formatNumber(totalPurchases)}</h3>
        <p class="metric-label">Total Purchases</p>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">📦</div>
        <h3 class="metric-value">${formatNumber(totalItemsSold)}</h3>
        <p class="metric-label">Items Sold</p>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">💰</div>
        <h3 class="metric-value">${formatCurrency(totalRevenue)}</h3>
        <p class="metric-label">Total Revenue Generated</p>
      </div>
    </div>
    
    ${topProducts.length > 0 ? `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">My Top Selling Products</h2>
      </div>
      <div class="card-body">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Transactions</th>
                <th>Units Sold</th>
                <th>Revenue Generated</th>
              </tr>
            </thead>
            <tbody>
              ${topProducts.map(p => `
                <tr>
                  <td>
                    <div class="product-name-cell">
                      <span class="product-name">${p.productName}</span>
                      <span class="product-sku">${p.productSku}</span>
                    </div>
                  </td>
                  <td><strong>${formatNumber(p.transactions)}</strong> transactions</td>
                  <td><strong>${formatNumber(p.quantity)}</strong> units</td>
                  <td><strong>${formatCurrency(p.revenue)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    ` : ''}
    
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Recent Transactions</h2>
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
                  <th>Amount</th>
                  <th>Date & Time</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${recentTransactions.map(transaction => `
                  <tr>
                    <td>
                      <div class="transaction-type-cell">
                        <div class="transaction-icon ${transaction.type}">
                          ${transaction.type === 'stock-in' ? '↓' : transaction.type === 'stock-out' ? '↑' : '🛒'}
                        </div>
                        <div class="transaction-details">
                          <span class="transaction-type">
                            ${transaction.type === 'stock-in' ? 'Stock In' : transaction.type === 'stock-out' ? 'Stock Out' : 'Purchase'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="product-name-cell">
                        <span class="product-name">${transaction.productName}</span>
                        <span class="product-sku">${transaction.productSku}</span>
                      </div>
                    </td>
                    <td>
                      <div class="transaction-quantity">
                        <span class="quantity-value">${transaction.quantity}</span>
                      </div>
                    </td>
                    <td>
                      <span class="transaction-amount">${formatCurrency(transaction.amount)}</span>
                    </td>
                    <td>
                      <div class="transaction-date">
                        <span class="date-day">${formatDate(transaction.createdAt)}</span>
                        <span class="date-time">${formatTime(transaction.createdAt)}</span>
                      </div>
                    </td>
                    <td>
                      <span class="transaction-notes" title="${transaction.notes}">${truncateText(transaction.notes, 30)}</span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <h3>No Transactions Yet</h3>
            <p>Your transaction history will appear here</p>
          </div>
        `}
      </div>
    </div>
  `;
  
  document.getElementById('mainContent').innerHTML = content;
}

// Export employee's personal report
function exportMyReport() {
  const user = getCurrentUser();
  const systemData = getLocalData(CONFIG.LOCAL_STORAGE_KEY);
  const myTransactions = systemData.transactions.filter(t => t.userId === user.id);
  
  if (myTransactions.length === 0) {
    showToast('Export Failed', 'No data to export', 'warning');
    return;
  }
  
  const exportData = myTransactions.map(t => ({
    Type: t.type === 'stock-in' ? 'Stock In' : t.type === 'stock-out' ? 'Stock Out' : 'Purchase',
    'Product Name': t.productName,
    SKU: t.productSku,
    Quantity: t.quantity,
    Amount: t.amount,
    Date: formatDate(t.createdAt),
    Time: formatTime(t.createdAt),
    Notes: t.notes
  }));
  
  exportToCSV(exportData, `my_report_${user.username}`);
}