
// Load employees page
function loadEmployees() {
  const user = getCurrentUser();
  
  if (user.role !== 'admin') {
    document.getElementById('mainContent').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔒</div>
        <h3>Access Denied</h3>
        <p>This page is only accessible to administrators</p>
      </div>
    `;
    return;
  }
  
  const systemData = getLocalData(CONFIG.LOCAL_STORAGE_KEY);
  const employees = systemData.users.filter(u => u.role === 'employee');
  
  const content = `
    <div class="page-header">
      <div class="page-header-top">
        <div class="page-title-section">
          <h1 class="page-title">Employee Management</h1>
          <p class="page-subtitle">Manage employee accounts and permissions</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="openAddEmployeeModal()">
            <span class="btn-icon">+</span>
            <span class="btn-text">Add Employee</span>
          </button>
        </div>
      </div>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-info">
            <p class="stat-label">Total Employees</p>
            <h3 class="stat-value">${employees.length}</h3>
          </div>
          <div class="stat-icon primary">👥</div>
        </div>
        <div class="stat-footer">
          <span class="stat-change">Active accounts</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-info">
            <p class="stat-label">Total Users</p>
            <h3 class="stat-value">${systemData.users.length}</h3>
          </div>
          <div class="stat-icon success">👤</div>
        </div>
        <div class="stat-footer">
          <span class="stat-change">Including admins</span>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Employees List</h2>
      </div>
      <div class="card-body">
        ${employees.length > 0 ? `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Join Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${employees.map(emp => `
                  <tr>
                    <td>
                      <div class="transaction-user">
                        <div class="user-avatar-small">${emp.username.charAt(0).toUpperCase()}</div>
                        <span class="user-name-small">${emp.username}</span>
                      </div>
                    </td>
                    <td>${emp.email}</td>
                    <td>
                      <span class="badge badge-info">
                        👔 Employee
                      </span>
                    </td>
                    <td>${emp.createdAt ? formatDate(emp.createdAt) : 'N/A'}</td>
                    <td>
                      <button class="action-btn action-btn-delete" onclick='deleteEmployee(${emp.id})'>
                        🗑️ Remove
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-state-icon">👥</div>
            <h3>No Employees Yet</h3>
            <p>Add your first employee to get started</p>
          </div>
        `}
      </div>
    </div>
  `;
  
  document.getElementById('mainContent').innerHTML = content;
}

// Open add employee modal
function openAddEmployeeModal() {
  document.getElementById('employeeForm').reset();
  document.getElementById('employeeModal').classList.add('active');
}

// Close employee modal
function closeEmployeeModal() {
  document.getElementById('employeeModal').classList.remove('active');
}

// Handle employee form submission
document.addEventListener('DOMContentLoaded', () => {
  const employeeForm = document.getElementById('employeeForm');
  
  if (employeeForm) {
    employeeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = document.getElementById('employeeSubmitBtn');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading-spinner-inline"></span> Adding...';
      
      const username = document.getElementById('empUsername').value.trim();
      const email = document.getElementById('empEmail').value.trim();
      const password = document.getElementById('empPassword').value;
      
      // Validate
      if (!isValidEmail(email)) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        showToast('Error', 'Please enter a valid email address', 'error');
        return;
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const systemData = getLocalData(CONFIG.LOCAL_STORAGE_KEY);
      
      // Check if username exists
      const usernameExists = systemData.users.some(u => u.username === username);
      if (usernameExists) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        showToast('Error', 'Username already exists', 'error');
        return;
      }
      
      // Check if email exists
      const emailExists = systemData.users.some(u => u.email === email);
      if (emailExists) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        showToast('Error', 'Email already exists', 'error');
        return;
      }
      
      // Add employee
      const newEmployee = {
        id: systemData.users.length + 1,
        username,
        email,
        password,
        role: 'employee',
        createdAt: new Date().toISOString()
      };
      
      systemData.users.push(newEmployee);
      setLocalData(CONFIG.LOCAL_STORAGE_KEY, systemData);
      
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      
      showToast('Success', 'Employee added successfully', 'success');
      closeEmployeeModal();
      loadEmployees();
    });
  }
});

// Delete employee
async function deleteEmployee(employeeId) {
  // Create inline confirmation
  const row = event.target.closest('tr');
  const actionCell = row.querySelector('td:last-child');
  const originalContent = actionCell.innerHTML;
  
  actionCell.innerHTML = `
    <div style="display: flex; gap: 0.5rem; align-items: center;">
      <span style="font-size: 0.75rem; color: var(--text-secondary);">Confirm?</span>
      <button class="action-btn action-btn-delete" onclick="confirmDeleteEmployee(${employeeId}, this)">
        ✓ Yes
      </button>
      <button class="action-btn action-btn-edit" onclick="cancelDeleteEmployee(this, \`${originalContent.replace(/`/g, '\\`')}\`)">
        ✕ No
      </button>
    </div>
  `;
}

// Confirm delete employee
async function confirmDeleteEmployee(employeeId, btn) {
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner-inline"></span>';
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const systemData = getLocalData(CONFIG.LOCAL_STORAGE_KEY);
  systemData.users = systemData.users.filter(u => u.id !== employeeId);
  setLocalData(CONFIG.LOCAL_STORAGE_KEY, systemData);
  
  showToast('Success', 'Employee removed successfully', 'success');
  loadEmployees();
}

// Cancel delete employee
function cancelDeleteEmployee(btn, originalContent) {
  const actionCell = btn.closest('td');
  actionCell.innerHTML = originalContent;
}