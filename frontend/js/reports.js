
// Load reports page
function loadReports() {
  const systemData = getLocalData(CONFIG.LOCAL_STORAGE_KEY);
  const products = systemData.products || [];
  const transactions = systemData.transactions || [];
  
  // Calculate metrics
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalTransactions = transactions.length;
  const totalRevenue = transactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Get category breakdown
  const categoryBreakdown = {};
  products.forEach(p => {
    if (!categoryBreakdown[p.category]) {
      categoryBreakdown[p.category] = {
        count: 0,
        value: 0,
        stock: 0
      };
    }
    categoryBreakdown[p.category].count++;
    categoryBreakdown[p.category].value += p.price * p.stock;
    categoryBreakdown[p.category].stock += p.stock;
  });
  
  // Top products by value
  const topProductsByValue = products
    .map(p => ({
      ...p,
      totalValue: p.price * p.stock
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10);
  
  // Top products by stock
  const topProductsByStock = products
    .slice()
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 10);
  
  const content = `
    <div class="page-header">
      <div class="page-header-top">
        <div class="page-title-section">
          <h1 class="page-title">Reports & Analytics</h1>
          <p class="page-subtitle">Comprehensive insights into your inventory performance</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="exportFullReport()">
            <span class="btn-icon">📥</span>
            <span class="btn-text">Export Full Report</span>
          </button>
        </div>
      </div>
    </div>
    
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon">📦</div>
        <h3 class="metric-value">${formatNumber(totalProducts)}</h3>
        <p class="metric-label">Total Products</p>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">📊</div>
        <h3 class="metric-value">${formatNumber(totalStock)}</h3>
        <p class="metric-label">Total Units</p>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">💰</div>
        <h3 class="metric-value">${formatCurrency(totalValue)}</h3>
        <p class="metric-label">Inventory Value</p>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">⚠️</div>
        <h3 class="metric-value">${formatNumber(lowStockCount)}</h3>
        <p class="metric-label">Low Stock Items</p>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">🚫</div>
        <h3 class="metric-value">${formatNumber(outOfStockCount)}</h3>
        <p class="metric-label">Out of Stock</p>
      </div>
      
      <div class="metric-card">
        <div class="metric-icon">💵</div>
        <h3 class="metric-value">${formatCurrency(totalRevenue)}</h3>
        <p class="metric-label">Total Revenue</p>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Category Breakdown</h2>
      </div>
      <div class="card-body">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Products</th>
                <th>Total Stock</th>
                <th>Total Value</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(categoryBreakdown).map(([category, data]) => `
                <tr>
                  <td>
                    <span class="product-category-tag">
                      ${getCategoryIcon(category)} ${category}
                    </span>
                  </td>
                  <td><strong>${data.count}</strong> products</td>
                  <td><strong>${formatNumber(data.stock)}</strong> units</td>
                  <td><strong>${formatCurrency(data.value)}</strong></td>
                  <td>
                    <span class="badge badge-info">
                      ${calculatePercentage(data.value, totalValue)}%
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <div class="content-grid">
      <div class="content-col-6">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Top Products by Value</h2>
          </div>
          <div class="card-body">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Stock</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  ${topProductsByValue.slice(0, 5).map(p => `
                    <tr>
                      <td>
                        <div class="product-name-cell">
                          <span class="product-name">${p.name}</span>
                          <span class="product-sku">${p.sku}</span>
                        </div>
                      </td>
                      <td>${formatNumber(p.stock)} units</td>
                      <td><strong>${formatCurrency(p.totalValue)}</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <div class="content-col-6">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Top Products by Stock</h2>
          </div>
          <div class="card-body">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${topProductsByStock.slice(0, 5).map(p => `
                    <tr>
                      <td>
                        <div class="product-name-cell">
                          <span class="product-name">${p.name}</span>
                          <span class="product-sku">${p.sku}</span>
                        </div>
                      </td>
                      <td><strong>${formatNumber(p.stock)}</strong> units</td>
                      <td>${getStockStatusBadge(getStockStatus(p.stock, p.minStock))}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('mainContent').innerHTML = content;
}

// Export full report
function exportFullReport() {
  const systemData = getLocalData(CONFIG.LOCAL_STORAGE_KEY);
  const products = systemData.products || [];
  
  if (products.length === 0) {
    showToast('Export Failed', 'No data to export', 'warning');
    return;
  }
  
  const exportData = products.map(p => ({
    Name: p.name,
    SKU: p.sku,
    Category: p.category,
    Supplier: p.supplier,
    'Unit Price': p.price,
    'Current Stock': p.stock,
    'Minimum Stock': p.minStock,
    'Total Value': p.price * p.stock,
    Status: getStockStatus(p.stock, p.minStock),
    'Created Date': formatDate(p.createdAt),
    'Last Updated': formatDate(p.updatedAt)
  }));
  
  exportToCSV(exportData, 'inventory_report');
}