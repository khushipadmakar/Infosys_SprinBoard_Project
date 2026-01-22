// Load transactions page
function loadTransactions() {
  const user = getCurrentUser();
  const systemData = getLocalData(CONFIG.LOCAL_STORAGE_KEY);
  let transactions = systemData.transactions || [];
  
  // Filter transactions based on user role
  if (user.role === 'employee') {
    transactions = transactions.filter(t => t.userId === user.id);
  }
  
  // Calculate summary
  const totalTransactions = transactions.length;
  const stockInCount = transactions.filter(t => t.type === 'stock-in').length;
  const stockOutCount = transactions.filter(t => t.type === 'stock-out').length;
  const purchaseCount = transactions.filter(t => t.type === 'purchase').length;
  const totalRevenue = transactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const content = `
    <div class="page-header">
      <div class="page-header-top">
        <div class="page-title-section">
          <h1 class="page-title">Transaction History</h1>
          <p class="page-subtitle">${user.role === 'employee' ? 'Your personal transaction history' : 'Track all inventory movements and purchases'}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="exportTransactionsToCSV()">
            <span class="btn-icon">📥</span>
            <span class="btn-text">Export CSV</span>
          </button>
        </div>
      </div>
    </div>
    
    <div class="transaction-summary">
      <div class="summary-card">
        <p class="summary-label">Total Transactions</p>
        <h3 class="summary-value">${formatNumber(totalTransactions)}</h3>
        <div class="summary-trend up">
          <span>📊</span>
          <span>${user.role === 'employee' ? 'Your transactions' : 'All time'}</span>
        </div>
      </div>
      
      ${user.role === 'admin' ? `
      <div class="summary-card">
        <p class="summary-label">Stock In</p>
        <h3 class="summary-value">${formatNumber(stockInCount)}</h3>
        <div class="summary-trend up">
          <span>↓</span>
          <span>Items added</span>
        </div>
      </div>
      
      <div class="summary-card">
        <p class="summary-label">Stock Out</p>
        <h3 class="summary-value">${formatNumber(stockOutCount)}</h3>
        <div class="summary-trend down">
          <span>↑</span>
          <span>Items removed</span>
        </div>
      </div>
      ` : ''}
      
      <div class="summary-card">
        <p class="summary-label">Purchases</p>
        <h3 class="summary-value">${formatNumber(purchaseCount)}</h3>
        <div class="summary-trend up">
          <span>🛒</span>
          <span>Completed</span>
        </div>
      </div>
      
      <div class="summary-card">
        <p class="summary-label">Total ${user.role === 'employee' ? 'Value' : 'Revenue'}</p>
        <h3 class="summary-value">${formatCurrency(totalRevenue)}</h3>
        <div class="summary-trend up">
          <span>💰</span>
          <span>From purchases</span>
        </div>
      </div>
    </div>
    
    <div class="search-filter-bar">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input type="text" id="transactionSearch" class="form-input" placeholder="Search transactions..." oninput="filterTransactions()">
      </div>
      <select id="typeFilter" class="form-select filter-select" onchange="filterTransactions()">
        <option value="">All Types</option>
        ${user.role === 'admin' ? `
        <option value="stock-in">Stock In</option>
        <option value="stock-out">Stock Out</option>
        ` : ''}
        <option value="purchase">Purchase</option>
      </select>
    </div>
    
    <div id="transactionsTable">
      ${renderTransactionsTable(transactions.slice().reverse())}
    </div>
  `;
  
  document.getElementById('mainContent').innerHTML = content;
}

// Render transactions table
function renderTransactionsTable(transactions) {
  const user = getCurrentUser();
  
  if (transactions.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <h3>No Transactions Found</h3>
        <p>Transaction history will appear here</p>
      </div>
    `;
  }
  
  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Amount</th>
            <th>Date & Time</th>
            ${user.role === 'admin' ? '<th>User</th>' : ''}
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map(transaction => `
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
                  <span class="quantity-change ${transaction.type === 'stock-in' ? 'positive' : 'negative'}">
                    ${transaction.type === 'stock-in' ? '+' : '-'}${transaction.quantity}
                  </span>
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
              ${user.role === 'admin' ? `
              <td>
                <div class="transaction-user">
                  <div class="user-avatar-small">${transaction.userName.charAt(0).toUpperCase()}</div>
                  <span class="user-name-small">${transaction.userName}</span>
                </div>
              </td>
              ` : ''}
              <td>
                <span class="transaction-notes" title="${transaction.notes}">${truncateText(transaction.notes, 30)}</span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Filter transactions
function filterTransactions() {
  const user = getCurrentUser();
  const searchTerm = document.getElementById('transactionSearch').value.toLowerCase();
  const typeFilter = document.getElementById('typeFilter').value;
  
  const systemData = getLocalData(CONFIG.LOCAL_STORAGE_KEY);
  let transactions = systemData.transactions || [];

  // Filter by user role
  if (user.role === 'employee') {
    transactions = transactions.filter(t => t.userId === user.id);
  }
  
  // Apply search filter
  if (searchTerm) {
    transactions = transactions.filter(t => 
      t.productName.toLowerCase().includes(searchTerm) ||
      t.productSku.toLowerCase().includes(searchTerm) ||
      t.userName.toLowerCase().includes(searchTerm) ||
      t.notes.toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply type filter
  if (typeFilter) {
    transactions = transactions.filter(t => t.type === typeFilter);
  }
  
  document.getElementById('transactionsTable').innerHTML = renderTransactionsTable(transactions.slice().reverse());
}

// Export transactions to CSV
function exportTransactionsToCSV() {
  const user = getCurrentUser();
  const systemData = getLocalData(CONFIG.LOCAL_STORAGE_KEY);
  let transactions = systemData.transactions || [];
  
  // Filter by user role
  if (user.role === 'employee') {
    transactions = transactions.filter(t => t.userId === user.id);
  }
  
  if (transactions.length === 0) {
    showToast('Export Failed', 'No transactions to export', 'warning');
    return;
  }
  
  const exportData = transactions.map(t => {
    const data = {
      Type: t.type === 'stock-in' ? 'Stock In' : t.type === 'stock-out' ? 'Stock Out' : 'Purchase',
      'Product Name': t.productName,
      SKU: t.productSku,
      Quantity: t.quantity,
      Amount: t.amount,
      Date: formatDate(t.createdAt),
      Time: formatTime(t.createdAt),
      Notes: t.notes
    };
    
    if (user.role === 'admin') {
      data.User = t.userName;
    }
    
    return data;
  });
  
  exportToCSV(exportData, `transactions_${user.role === 'employee' ? user.username : 'all'}`);
}

// ----------------------------
// LOW STOCK EMAIL ALERT LOGIC
// ----------------------------
function sendLowStockEmail(product) {
  if (!product) return;

  // Make sure EmailJS is initialized in your HTML
  // <script src="https://cdn.emailjs.com/dist/email.min.js"></script>
  // <script>emailjs.init("YOUR_PUBLIC_KEY");</script>
  
  emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
    product_name: product.name,
    product_sku: product.sku,
    current_stock: product.stock,
    min_stock: product.minStock,
    user_email: 'admin@example.com' // replace with admin email
  })
  .then(response => {
    console.log('Low stock email sent', response.status, response.text);
  })
  .catch(error => {
    console.error('Failed to send low stock email', error);
  });
}

// ----------------------------
// TRIGGER LOW STOCK EMAIL AFTER TRANSACTION
// ----------------------------
async function handleTransactionSubmit(e) {
  e.preventDefault();
  
  const formData = {
      product: document.getElementById('productSelect').value,
      type: document.getElementById('transactionType').value,
      quantity: parseInt(document.getElementById('quantity').value),
      notes: document.getElementById('notes').value
  };

  try {
      const response = await fetch(`${API_URL}/transactions`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
          showNotification('success', data.message);

          // If alert was sent, show additional notification
          if (data.alertSent) {
              showNotification('warning', `⚠️ ${data.message}`, 5000);
          }

          // Show stock update info and trigger low-stock email
          if (data.data.stockUpdate) {
              const { oldStock, newStock, minStock, isOutOfStock, isLowStock, productId } = data.data.stockUpdate;
              
              let stockMessage = `Stock updated: ${oldStock} → ${newStock}`;
              
              if (isOutOfStock) {
                  stockMessage += ` 🚨 OUT OF STOCK!`;
                  // Send email for out of stock
                  const systemData = getLocalData(CONFIG.LOCAL_STORAGE_KEY);
                  const product = systemData.products.find(p => p.id === productId);
                  if (product) sendLowStockEmail(product);
              } else if (isLowStock) {
                  stockMessage += ` ⚠️ Below minimum (${minStock})`;
                  const systemData = getLocalData(CONFIG.LOCAL_STORAGE_KEY);
                  const product = systemData.products.find(p => p.id === productId);
                  if (product) sendLowStockEmail(product);
              }
              
              showNotification('info', stockMessage, 5000);
          }

          // Reset form and refresh data
          e.target.reset();
          loadTransactions();
          loadProducts();
      } else {
          showNotification('error', data.message);
      }
  } catch (error) {
      showNotification('error', 'Failed to create transaction');
      console.error('Error:', error);
  }
}

// Notification helper function
function showNotification(type, message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        type === 'warning' ? 'bg-orange-500' :
        'bg-blue-500'
    } text-white`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, duration);
}
