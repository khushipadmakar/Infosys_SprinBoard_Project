// Utility Functions

// Show loading overlay
function showLoading(message = 'Processing...') {
  const overlay = document.getElementById('loadingOverlay');
  const loadingText = overlay.querySelector('.loading-text');
  loadingText.textContent = message;
  overlay.classList.remove('hidden');
}

// Hide loading overlay
function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.add('hidden');
}

// Show toast notification
function showToast(title, message, type = 'success') {
  const toast = document.getElementById('notificationToast');
  const toastTitle = document.getElementById('toastTitle');
  const toastMessage = document.getElementById('toastMessage');
  const toastIcon = document.getElementById('toastIcon');
  
  // Remove all type classes
  toast.classList.remove('success', 'error', 'warning', 'info');
  
  // Add type class
  toast.classList.add(type);
  
  // Set icon based on type
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  toastIcon.textContent = icons[type] || '✓';
  
  // Set content
  toastTitle.textContent = title;
  toastMessage.textContent = message;
  
  // Show toast
  toast.classList.remove('hidden');
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    hideToast();
  }, 5000);
}

// Hide toast notification
function hideToast() {
  const toast = document.getElementById('notificationToast');
  toast.classList.add('hidden');
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

// Format time
function formatTime(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Format date and time
function formatDateTime(dateString) {
  return `${formatDate(dateString)} at ${formatTime(dateString)}`;
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Get local storage data
function getLocalData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
}

// Set local storage data
function setLocalData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error writing to localStorage:', error);
    return false;
  }
}

// Remove local storage data
function removeLocalData(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
}

// Get current user from session
function getCurrentUser() {
  return getLocalData(CONFIG.SESSION_KEY);
}

// Check if user is logged in
function isLoggedIn() {
  return getCurrentUser() !== null;
}

// Check if user is admin
function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === 'admin';
}

// Filter array by search term
function filterBySearch(array, searchTerm, fields) {
  if (!searchTerm) return array;
  
  const term = searchTerm.toLowerCase();
  return array.filter(item => {
    return fields.some(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], item);
      return value && value.toString().toLowerCase().includes(term);
    });
  });
}

// Sort array by field
function sortByField(array, field, ascending = true) {
  return [...array].sort((a, b) => {
    const aVal = field.split('.').reduce((obj, key) => obj?.[key], a);
    const bVal = field.split('.').reduce((obj, key) => obj?.[key], b);
    
    if (aVal < bVal) return ascending ? -1 : 1;
    if (aVal > bVal) return ascending ? 1 : -1;
    return 0;
  });
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Validate email
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Calculate stock status
function getStockStatus(currentStock, minStock) {
  if (currentStock === 0) return 'out-of-stock';
  if (currentStock <= minStock) return 'low-stock';
  return 'in-stock';
}

// Get stock status badge HTML
function getStockStatusBadge(status) {
  const statusMap = {
    'in-stock': { text: 'In Stock', class: 'badge-success' },
    'low-stock': { text: 'Low Stock', class: 'badge-warning' },
    'out-of-stock': { text: 'Out of Stock', class: 'badge-error' }
  };
  
  const statusInfo = statusMap[status] || statusMap['in-stock'];
  return `
    <span class="stock-status ${status}">
      <span class="stock-status-dot"></span>
      ${statusInfo.text}
    </span>
  `;
}

// Export data to CSV
function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    showToast('Export Failed', 'No data to export', 'warning');
    return;
  }
  
  // Get headers
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  let csv = headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csv += values.join(',') + '\n';
  });
  
  // Create download link
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  showToast('Export Successful', `Data exported to ${a.download}`, 'success');
}

// Clone object deeply
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Truncate text
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

// Calculate percentage
function calculatePercentage(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

// Format number with commas
function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num);
}