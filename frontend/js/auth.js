// Authentication Functions

// Initialize demo data
function initializeDemoData() {
  // Check if data already exists
  let systemData = getLocalData(CONFIG.LOCAL_STORAGE_KEY);
  
  if (!systemData) {
    // Create initial system data
    systemData = {
      users: [...DEMO_USERS],
      products: generateDemoProducts(),
      transactions: [],
      settings: {
        emailNotifications: true,
        lowStockThreshold: 10,
        currency: 'USD'
      }
    };
    
    setLocalData(CONFIG.LOCAL_STORAGE_KEY, systemData);
  }
  
  return systemData;
}

// Generate demo products
function generateDemoProducts() {
  return [
    {
      id: generateId(),
      name: 'AI Development Kit Pro',
      sku: 'AI-DEV-001',
      category: 'Artificial Intelligence',
      supplier: 'Tech Innovations Ltd',
      price: 2499.99,
      stock: 45,
      minStock: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      name: 'Machine Learning Toolkit',
      sku: 'ML-TK-002',
      category: 'Machine Learning',
      supplier: 'Data Science Corp',
      price: 1899.50,
      stock: 8,
      minStock: 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      name: 'Neural Network Training System',
      sku: 'NN-TRS-003',
      category: 'Artificial Intelligence',
      supplier: 'AI Solutions Inc',
      price: 3299.00,
      stock: 25,
      minStock: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      name: 'Data Analytics Platform',
      sku: 'DA-PLT-004',
      category: 'Data Science',
      supplier: 'Analytics Pro',
      price: 1599.99,
      stock: 0,
      minStock: 12,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      name: 'Full Stack Web Framework',
      sku: 'WEB-FSK-005',
      category: 'Web Development',
      supplier: 'WebTech Systems',
      price: 899.00,
      stock: 150,
      minStock: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

// Login function
async function login(username, password, role) {
  showLoading('Logging in...');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    const systemData = initializeDemoData();
    
    // Find user
    const user = systemData.users.find(u => 
      u.username === username && 
      u.password === password && 
      u.role === role
    );
    
    if (!user) {
      hideLoading();
      return {
        success: false,
        message: 'Invalid credentials. Please check your username, password, and role.'
      };
    }
    
    // Create session
    const session = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      loginTime: new Date().toISOString()
    };
    
    setLocalData(CONFIG.SESSION_KEY, session);
    
    hideLoading();
    return {
      success: true,
      user: session,
      message: 'Login successful!'
    };
    
  } catch (error) {
    hideLoading();
    console.error('Login error:', error);
    return {
      success: false,
      message: 'An error occurred during login. Please try again.'
    };
  }
}

// Signup function
async function signup(username, email, password, role) {
  showLoading('Creating account...');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    const systemData = initializeDemoData();
    
    // Check if username already exists
    const existingUser = systemData.users.find(u => u.username === username);
    if (existingUser) {
      hideLoading();
      return {
        success: false,
        message: 'Username already exists. Please choose a different username.'
      };
    }
    
    // Check if email already exists
    const existingEmail = systemData.users.find(u => u.email === email);
    if (existingEmail) {
      hideLoading();
      return {
        success: false,
        message: 'Email already registered. Please use a different email.'
      };
    }
    
    // Validate email
    if (!isValidEmail(email)) {
      hideLoading();
      return {
        success: false,
        message: 'Please enter a valid email address.'
      };
    }
    
    // Create new user
    const newUser = {
      id: systemData.users.length + 1,
      username,
      email,
      password,
      role,
      createdAt: new Date().toISOString()
    };
    
    systemData.users.push(newUser);
    setLocalData(CONFIG.LOCAL_STORAGE_KEY, systemData);
    
    hideLoading();
    return {
      success: true,
      message: 'Account created successfully! You can now log in.'
    };
    
  } catch (error) {
    hideLoading();
    console.error('Signup error:', error);
    return {
      success: false,
      message: 'An error occurred during signup. Please try again.'
    };
  }
}

// Logout function
function logout() {
  removeLocalData(CONFIG.SESSION_KEY);
  window.location.reload();
}

// Switch auth tab
function switchAuthTab(tab) {
  const loginTab = document.querySelector('.auth-tab:first-child');
  const signupTab = document.querySelector('.auth-tab:last-child');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const authMessage = document.getElementById('authMessage');
  
  // Clear message
  authMessage.className = 'auth-message';
  authMessage.textContent = '';
  
  if (tab === 'login') {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
  } else {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
  }
}

// Toggle password visibility
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const toggle = input.parentElement.querySelector('.toggle-icon');
  
  if (input.type === 'password') {
    input.type = 'text';
    toggle.textContent = '👁️‍🗨️';
  } else {
    input.type = 'password';
    toggle.textContent = '👁️';
  }
}

// Handle login form submission
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const authMessage = document.getElementById('authMessage');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      const role = document.getElementById('role').value;
      
      if (!username || !password || !role) {
        authMessage.className = 'auth-message error';
        authMessage.textContent = 'Please fill in all fields.';
        return;
      }
      
      const result = await login(username, password, role);
      
      if (result.success) {
        authMessage.className = 'auth-message success';
        authMessage.textContent = result.message;
        
        // Redirect to dashboard
        setTimeout(() => {
          showDashboard();
        }, 500);
      } else {
        authMessage.className = 'auth-message error';
        authMessage.textContent = result.message;
      }
    });
  }
  
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('signupUsername').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;
      const role = document.getElementById('signupRole').value;
      
      if (!username || !email || !password || !role) {
        authMessage.className = 'auth-message error';
        authMessage.textContent = 'Please fill in all fields.';
        return;
      }
      
      if (password.length < 6) {
        authMessage.className = 'auth-message error';
        authMessage.textContent = 'Password must be at least 6 characters long.';
        return;
      }
      
      const result = await signup(username, email, password, role);
      
      authMessage.className = result.success ? 'auth-message success' : 'auth-message error';
      authMessage.textContent = result.message;
      
      if (result.success) {
        // Switch to login tab after successful signup
        setTimeout(() => {
          switchAuthTab('login');
          signupForm.reset();
        }, 2000);
      }
    });
  }
});

