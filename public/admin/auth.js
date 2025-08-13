// Admin Authentication System
class AuthManager {
    constructor() {
        this.apiBase = '/api';
        this.initializeEventListeners();
        this.checkExistingAuth();
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Form submissions
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(e.target);
        });

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister(e.target);
        });

        // Setup field error clearing
        this.setupFieldErrorClearing();
    }

    // Switch between login and register tabs
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.querySelector(`[data-form="${tabName}"]`).classList.add('active');

        // Clear error messages
        this.clearAllErrors();
    }

    // Check if user is already authenticated
    checkExistingAuth() {
        const accessToken = localStorage.getItem('admin_access_token');
        if (accessToken) {
            // Verify token is still valid
            this.verifyToken(accessToken).then(valid => {
                if (valid) {
                    this.redirectToDashboard();
                } else {
                    // Try to refresh token
                    this.refreshAccessToken();
                }
            });
        }
    }

    // Verify if token is valid
    async verifyToken(token) {
        try {
            const response = await fetch(`${this.apiBase}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Handle login form submission
    async handleLogin(form) {
        const formData = new FormData(form);
        const data = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        this.showLoading();
        
        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                // Store tokens
                this.storeTokens(result.access_token, result.refresh_token);
                this.storeUserInfo(result.user);
                
                // Redirect to dashboard
                this.redirectToDashboard();
            } else {
                this.handleErrorResponse(result, 'login');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Có lỗi xảy ra. Vui lòng thử lại.');
        }

        this.hideLoading();
    }

    // Handle register form submission
    async handleRegister(form) {
        const formData = new FormData(form);
        const data = {
            email: formData.get('email'),
            username: formData.get('username'),
            password: formData.get('password'),
            display_name: formData.get('display_name') || undefined
        };

        this.showLoading();
        
        try {
            const response = await fetch(`${this.apiBase}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                // Store tokens
                this.storeTokens(result.access_token, result.refresh_token);
                this.storeUserInfo(result.user);
                
                // Redirect to dashboard
                this.redirectToDashboard();
            } else {
                this.handleErrorResponse(result, 'register');
            }
        } catch (error) {
            console.error('Register error:', error);
            this.showError('Có lỗi xảy ra. Vui lòng thử lại.');
        }

        this.hideLoading();
    }

    // Store authentication tokens
    storeTokens(accessToken, refreshToken) {
        localStorage.setItem('admin_access_token', accessToken);
        localStorage.setItem('admin_refresh_token', refreshToken);
        
        // Set token expiration check
        this.scheduleTokenRefresh();
    }

    // Store user information
    storeUserInfo(user) {
        localStorage.setItem('admin_user', JSON.stringify(user));
    }

    // Get stored access token
    getAccessToken() {
        return localStorage.getItem('admin_access_token');
    }

    // Get stored refresh token
    getRefreshToken() {
        return localStorage.getItem('admin_refresh_token');
    }

    // Get stored user info
    getUserInfo() {
        const userStr = localStorage.getItem('admin_user');
        return userStr ? JSON.parse(userStr) : null;
    }

    // Refresh access token using refresh token
    async refreshAccessToken() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            this.logout();
            return false;
        }

        try {
            const response = await fetch(`${this.apiBase}/auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${refreshToken}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                
                // Update access token
                localStorage.setItem('admin_access_token', result.access_token);
                
                // Schedule next refresh
                this.scheduleTokenRefresh();
                
                return true;
            } else {
                // Refresh failed, logout user
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            this.logout();
            return false;
        }
    }

    // Schedule automatic token refresh
    scheduleTokenRefresh() {
        // Clear existing timeout
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
        }

        // JWT tokens typically expire in 1 hour, refresh after 50 minutes
        const refreshTime = 50 * 60 * 1000; // 50 minutes
        
        this.refreshTimeout = setTimeout(() => {
            this.refreshAccessToken();
        }, refreshTime);
    }

    // Logout user
    logout() {
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_user');
        
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
        }
        
        // Redirect to login if on dashboard
        if (window.location.pathname === '/admin') {
            window.location.href = '/admin/auth';
        }
    }

    // Redirect to dashboard
    redirectToDashboard() {
        window.location.href = '/admin';
    }

    // Show loading state
    showLoading() {
        document.getElementById('loading').style.display = 'block';
        document.querySelectorAll('.auth-btn').forEach(btn => {
            btn.disabled = true;
        });
    }

    // Hide loading state
    hideLoading() {
        document.getElementById('loading').style.display = 'none';
        document.querySelectorAll('.auth-btn').forEach(btn => {
            btn.disabled = false;
        });
    }

    // Show error message
    showError(message) {
        const errorElement = document.getElementById('error-message');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    // Hide error message
    hideError() {
        document.getElementById('error-message').style.display = 'none';
    }

    // Handle error responses with validation details
    handleErrorResponse(result, formType) {
        const error = result.error || {};
        
        // Clear previous errors
        this.clearAllErrors();
        
        // Handle validation errors
        if (error.code === 'VALIDATION_ERROR' && error.details) {
            this.showValidationErrors(error.details, formType);
        } else {
            // Show general error message
            this.showError(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        }
    }

    // Show validation errors for specific fields
    showValidationErrors(validationDetails, formType) {
        let hasErrors = false;
        
        validationDetails.forEach(detail => {
            const fieldName = detail.field;
            const fieldErrorId = `${formType}-${fieldName}-error`;
            const fieldInputId = `${formType}-${fieldName}`;
            
            const errorElement = document.getElementById(fieldErrorId);
            const inputElement = document.getElementById(fieldInputId);
            
            if (errorElement && inputElement) {
                errorElement.textContent = detail.message;
                errorElement.style.display = 'block';
                inputElement.classList.add('error');
                hasErrors = true;
            }
        });
        
        // If some fields don't have specific error elements, show general error
        if (!hasErrors || validationDetails.length === 0) {
            this.showError('Vui lòng kiểm tra lại thông tin đã nhập.');
        }
    }

    // Clear all error messages and styling
    clearAllErrors() {
        // Hide general error message
        this.hideError();
        
        // Clear field-specific errors
        document.querySelectorAll('.field-error').forEach(errorElement => {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        });
        
        // Remove error styling from inputs
        document.querySelectorAll('.form-control.error').forEach(input => {
            input.classList.remove('error');
        });
    }

    // Clear errors when user starts typing
    setupFieldErrorClearing() {
        document.querySelectorAll('.form-control').forEach(input => {
            input.addEventListener('input', () => {
                // Clear error for this specific field
                const fieldErrorId = input.id + '-error';
                const errorElement = document.getElementById(fieldErrorId);
                
                if (errorElement) {
                    errorElement.style.display = 'none';
                    errorElement.textContent = '';
                }
                
                input.classList.remove('error');
            });
        });
    }
}

// Global auth manager instance
window.authManager = new AuthManager();

// Make functions available globally for potential external use
window.logout = () => window.authManager.logout();
window.refreshToken = () => window.authManager.refreshAccessToken(); 