let currentProduct = null;
let currentStockProduct = null;
let currentPurchaseProduct = null;

// Load products page
function loadProducts() {
  const user = getCurrentUser();
  const systemData = getLocalData(CONFIG.LOCAL_STORAGE_KEY);
  const products = systemData.products || [];
  
  const content = `
    <div class="page-header">
      <div class="page-header-top">
        <div class="page-title-section">
          <h1 class="page-title">Product Management</h1>
          <p class="page-subtitle">Manage your inventory products and stock levels</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="exportProductsToCSV()">
            <span class="btn-icon">📥</span>
            <span class="btn-text">Export CSV</span>
          </button>
          ${user.role === 'admin' ? `
          <button class="btn btn-primary" onclick="openAddProductModal()">
            <span class="btn-icon">+</span>
            <span class="btn-text">Add Product</span>
          </button>
          ` : ''}
        </div>
      </div>
    </div>
    
    <div class="search-filter-bar">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input type="text" id="productSearch" class="form-input" placeholder="Search products by name, SKU, or category..." oninput="filterProducts()">
      </div>
      <select id="categoryFilter" class="form-select filter-select" onchange="filterProducts()">
        <option value="">All Categories</option>
        <option value="Artificial Intelligence">Artificial Intelligence</option>
        <option value="Machine Learning">Machine Learning</option>
        <option value="Data Science">Data Science</option>
        <option value="Web Development">Web Development</option>
        <option value="App Development">App Development</option>
      </select>
      <select id="stockFilter" class="form-select filter-select" onchange="filterProducts()">
        <option value="">All Stock Levels</option>
        <option value="in-stock">In Stock</option>
        <option value="low-stock">Low Stock</option>
        <option value="out-of-stock">Out of Stock</option>
      </select>
    </div>
    
    <div id="productsTable">
      ${renderProductsTable(products)}
    </div>
  `;
  
  document.getElementById('mainContent').innerHTML = content;
}

// Render products table
function renderProductsTable(products) {
  const user = getCurrentUser();
  
  if (products.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📦</div>
        <h3>No Products Found</h3>
        <p>Start by adding your first product to the inventory</p>
        ${user.role === 'admin' ? `
        <button class="btn btn-primary" onclick="openAddProductModal()">
          <span class="btn-icon">+</span>
          <span class="btn-text">Add Your First Product</span>
        </button>
        ` : ''}
      </div>
    `;
  }
  
  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Supplier</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(product => `
            <tr>
              <td>
                <div class="product-name-cell">
                  <span class="product-name">${product.name}</span>
                  <span class="product-sku">${product.sku}</span>
                </div>
              </td>
              <td>
                <span class="product-category-tag">
                  ${getCategoryIcon(product.category)} ${product.category}
                </span>
              </td>
              <td>${product.supplier}</td>
              <td>
                <span class="price-value">${formatCurrency(product.price)}</span>
              </td>
              <td>
                <div class="stock-info">
                  <span class="stock-current">${product.stock} units</span>
                  <span class="stock-min">Min: ${product.minStock}</span>
                </div>
              </td>
              <td>
                ${getStockStatusBadge(getStockStatus(product.stock, product.minStock))}
              </td>
              <td>
                <div class="table-actions">
                  ${user.role === 'admin' ? `
                  <button class="action-btn action-btn-stock" onclick='openStockModal(${JSON.stringify(product).replace(/'/g, "&apos;")})' title="Update Stock">📊 Stock</button>
                  ` : ''}
                  <button class="action-btn action-btn-view" onclick='openPurchaseModal(${JSON.stringify(product).replace(/'/g, "&apos;")})' title="Purchase">🛒 Buy</button>
                  ${user.role === 'admin' ? `
                  <button class="action-btn action-btn-edit" onclick='openEditProductModal(${JSON.stringify(product).replace(/'/g, "&apos;")})' title="Edit">✏️</button>
                  <button class="action-btn action-btn-delete" onclick='deleteProduct("${product.id}")' title="Delete">🗑️</button>
                  ` : ''}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Category icons
function getCategoryIcon(category) {
  const icons = {
    'Artificial Intelligence': '🤖',
    'Machine Learning': '🧠',
    'Data Science': '📊',
    'Web Development': '🌐',
    'App Development': '📱'
  };
  return icons[category] || '📦';
}

// Filter products
function filterProducts() {
  const searchTerm = document.getElementById('productSearch').value.toLowerCase();
  const categoryFilter = document.getElementById('categoryFilter').value;
  const stockFilter = document.getElementById('stockFilter').value;
  
  const systemData = getLocalData(CONFIG.LOCAL_STORAGE_KEY);
  let products = systemData.products || [];
  
  if (searchTerm) {
    products = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      p.sku.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm) ||
      p.supplier.toLowerCase().includes(searchTerm)
    );
  }
  
  if (categoryFilter) products = products.filter(p => p.category === categoryFilter);
  if (stockFilter) products = products.filter(p => getStockStatus(p.stock, p.minStock) === stockFilter);
  
  document.getElementById('productsTable').innerHTML = renderProductsTable(products);
}

// Add/Edit Product Modal
function openAddProductModal() {
  currentProduct = null;
  document.getElementById('productModalTitle').textContent = 'Add New Product';
  document.getElementById('productForm').reset();
  document.getElementById('productModal').classList.add('active');
}
function openEditProductModal(product) {
  currentProduct = product;
  document.getElementById('productModalTitle').textContent = 'Edit Product';
  document.getElementById('productName').value = product.name;
  document.getElementById('productSku').value = product.sku;
  document.getElementById('productCategory').value = product.category;
  document.getElementById('productSupplier').value = product.supplier;
  document.getElementById('productPrice').value = product.price;
  document.getElementById('productStock').value = product.stock;
  document.getElementById('productMinStock').value = product.minStock;
  document.getElementById('productModal').classList.add('active');
}
function closeProductModal() {
  document.getElementById('productModal').classList.remove('active');
  currentProduct = null;
}

// Product form submission
document.addEventListener('DOMContentLoaded', () => {
  const productForm = document.getElementById('productForm');
  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('productSubmitBtn');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading-spinner-inline"></span> Saving...';
      
      const formData = {
        name: document.getElementById('productName').value.trim(),
        sku: document.getElementById('productSku').value.trim().toUpperCase(),
        category: document.getElementById('productCategory').value,
        supplier: document.getElementById('productSupplier').value.trim(),
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        minStock: parseInt(document.getElementById('productMinStock').value)
      };
      
      await new Promise(resolve => setTimeout(resolve, 800));
      const systemData = getLocalData(CONFIG.LOCAL_STORAGE_KEY);
      
      if (currentProduct) {
        const index = systemData.products.findIndex(p => p.id === currentProduct.id);
        if (index !== -1) systemData.products[index] = {...currentProduct, ...formData, updatedAt: new Date().toISOString()};
        showToast('Success', 'Product updated successfully', 'success');
      } else {
        if (systemData.products.some(p => p.sku === formData.sku)) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
          showToast('Error', 'A product with this SKU already exists', 'error');
          return;
        }
        const newProduct = {id: generateId(), ...formData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()};
        systemData.products.push(newProduct);
        showToast('Success', 'Product added successfully', 'success');
      }
      
      setLocalData(CONFIG.LOCAL_STORAGE_KEY, systemData);
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      closeProductModal();
      loadProducts();
    });
  }
});

// Delete product functions
async function deleteProduct(productId) {
  const row = event.target.closest('tr');
  const actionCell = row.querySelector('.table-actions');
  const originalContent = actionCell.innerHTML;
  actionCell.innerHTML = `
    <div style="display: flex; gap: 0.5rem; align-items: center;">
      <span style="font-size: 0.75rem; color: var(--text-secondary);">Confirm?</span>
      <button class="action-btn action-btn-delete" onclick="confirmDeleteProduct('${productId}', this)">✓ Yes</button>
      <button class="action-btn action-btn-edit" onclick="cancelDeleteProduct(this, \`${originalContent.replace(/`/g, '\\`')}\`)">✕ No</button>
    </div>
  `;
}
async function confirmDeleteProduct(productId, btn) {
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner-inline"></span>';
  await new Promise(resolve => setTimeout(resolve, 500));
  const systemData = getLocalData(CONFIG.LOCAL_STORAGE_KEY);
  systemData.products = systemData.products.filter(p => p.id !== productId);
  setLocalData(CONFIG.LOCAL_STORAGE_KEY, systemData);
  showToast('Success', 'Product deleted successfully', 'success');
  loadProducts();
}
function cancelDeleteProduct(btn, originalContent) {
  const actionCell = btn.closest('.table-actions');
  actionCell.innerHTML = originalContent;
}

// Stock modal & submission
function openStockModal(product) {
  currentStockProduct = product;
  document.getElementById('stockModalTitle').textContent = `Update Stock - ${product.name}`;
  document.getElementById('stockForm').reset();
  document.getElementById('stockModal').classList.add('active');
}
function closeStockModal() {
  document.getElementById('stockModal').classList.remove('active');
  currentStockProduct = null;
}
document.addEventListener('DOMContentLoaded', () => {
  const stockForm = document.getElementById('stockForm');
  if (stockForm) {
    stockForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentStockProduct) return;
      const submitBtn = document.getElementById('stockSubmitBtn');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading-spinner-inline"></span> Updating...';
      
      const type = document.getElementById('transactionType').value;
      const quantity = parseInt(document.getElementById('stockQuantity').value);
      const notes = document.getElementById('stockNotes').value.trim();
      
      await new Promise(resolve => setTimeout(resolve, 800));
      const systemData = getLocalData(CONFIG.LOCAL_STORAGE_KEY);
      const productIndex = systemData.products.findIndex(p => p.id === currentStockProduct.id);
      
      if (productIndex !== -1) {
        const product = systemData.products[productIndex];
        if (type === 'stock-in') product.stock += quantity;
        else if (type === 'stock-out') {
          if (product.stock < quantity) { showToast('Error', 'Insufficient stock', 'error'); submitBtn.disabled = false; submitBtn.innerHTML = originalText; return; }
          product.stock -= quantity;
        }
        product.updatedAt = new Date().toISOString();
        systemData.transactions.push({
          id: generateId(), type, productId: product.id, productName: product.name, productSku: product.sku,
          quantity, amount: product.price * quantity, notes: notes || `${type === 'stock-in' ? 'Added' : 'Removed'} ${quantity} units`,
          userId: getCurrentUser().id, userName: getCurrentUser().username, createdAt: new Date().toISOString()
        });
        setLocalData(CONFIG.LOCAL_STORAGE_KEY, systemData);
        showToast('Success', `Stock ${type === 'stock-in' ? 'increased' : 'decreased'} successfully`, 'success');
      }
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      closeStockModal();
      loadProducts();
    });
  }
});

// Purchase modal & submission
function openPurchaseModal(product) {
  currentPurchaseProduct = product;
  document.getElementById('purchaseProductInfo').innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: start; padding: 1rem; background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--radius-lg);">
      <div>
        <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">${product.name}</h3>
        <p style="font-size: 0.875rem; color: var(--text-tertiary); margin-bottom: 0.25rem;">SKU: ${product.sku}</p>
        <p style="font-size: 0.875rem; color: var(--text-secondary);">Available: <strong>${product.stock} units</strong></p>
      </div>
      <div style="text-align: right;">
        <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 0.25rem;">Unit Price</p>
        <p style="font-size: 1.5rem; font-weight: 700; color: var(--primary-light);">${formatCurrency(product.price)}</p>
      </div>
    </div>
  `;
  document.getElementById('purchaseForm').reset();
  document.getElementById('purchaseTotalDisplay').innerHTML = '<strong>Total: $0.00</strong>';
  document.getElementById('purchaseModal').classList.add('active');
}
function closePurchaseModal() {
  document.getElementById('purchaseModal').classList.remove('active');
  currentPurchaseProduct = null;
}
function updatePurchaseTotal() {
  if (!currentPurchaseProduct) return;
  const quantity = parseInt(document.getElementById('purchaseQuantity').value) || 0;
  document.getElementById('purchaseTotalDisplay').innerHTML = `<strong>Total: ${formatCurrency(currentPurchaseProduct.price * quantity)}</strong>`;
}
document.addEventListener('DOMContentLoaded', () => {
  const purchaseForm = document.getElementById('purchaseForm');
  if (purchaseForm) {
    purchaseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentPurchaseProduct) return;
      const submitBtn = document.getElementById('purchaseSubmitBtn');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading-spinner-inline"></span> Processing...';
      
      const quantity = parseInt(document.getElementById('purchaseQuantity').value);
      const notes = document.getElementById('purchaseNotes').value.trim();
      
      if (quantity > currentPurchaseProduct.stock) { showToast('Error', 'Insufficient stock', 'error'); submitBtn.disabled = false; submitBtn.innerHTML = originalText; return; }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      const systemData = getLocalData(CONFIG.LOCAL_STORAGE_KEY);
      const productIndex = systemData.products.findIndex(p => p.id === currentPurchaseProduct.id);
      if (productIndex !== -1) {
        const product = systemData.products[productIndex];
        product.stock -= quantity;
        product.updatedAt = new Date().toISOString();
        systemData.transactions.push({
          id: generateId(), type: 'purchase', productId: product.id, productName: product.name, productSku: product.sku,
          quantity, amount: product.price * quantity, notes: notes || `Purchased ${quantity} units`,
          userId: getCurrentUser().id, userName: getCurrentUser().username, createdAt: new Date().toISOString()
        });
        setLocalData(CONFIG.LOCAL_STORAGE_KEY, systemData);
        showToast('Success', `Purchase completed! ${quantity} units of ${product.name}`, 'success');
      }
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      closePurchaseModal();
      loadProducts();
    });
  }
});

// Export to CSV
function exportProductsToCSV() {
  const systemData = getLocalData(CONFIG.LOCAL_STORAGE_KEY);
  const products = systemData.products || [];
  if (!products.length) { showToast('Export Failed', 'No products to export', 'warning'); return; }
  const exportData = products.map(p => ({
    Name: p.name, SKU: p.sku, Category: p.category, Supplier: p.supplier,
    Price: p.price, 'Current Stock': p.stock, 'Minimum Stock': p.minStock,
    Status: getStockStatus(p.stock, p.minStock), 'Created Date': formatDate(p.createdAt)
  }));
  exportToCSV(exportData, 'products');
}
