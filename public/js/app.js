// API Configuration
const API_URL = 'http://localhost:5000/api/v1';

// State management
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let shops = [];
let services = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupEventListeners();
    if (authToken) {
        fetchCurrentUser();
    }
    loadShops();
});

// Initialize App
function initApp() {
    // Set minimum date for reservation to today
    const dateInput = document.getElementById('reservation-date');
    if (dateInput) {
        dateInput.min = new Date().toISOString().split('T')[0];
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelector('.hamburger')?.addEventListener('click', toggleMobileMenu);
    
    // Auth buttons
    document.getElementById('btn-login')?.addEventListener('click', () => openModal('login-modal'));
    document.getElementById('btn-register')?.addEventListener('click', () => openModal('register-modal'));
    document.getElementById('btn-logout')?.addEventListener('click', logout);
    document.getElementById('footer-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        openModal('login-modal');
    });
    
    // Modal switches
    document.getElementById('switch-to-register')?.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('login-modal');
        openModal('register-modal');
    });
    document.getElementById('switch-to-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('register-modal');
        openModal('login-modal');
    });
    
    // Form submissions
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);
    document.getElementById('reservation-form')?.addEventListener('submit', handleReservation);
    
    // Service selection change
    document.getElementById('reservation-service')?.addEventListener('change', showServiceDetails);
    
    // Search
    document.getElementById('shop-search')?.addEventListener('input', debounce(handleSearch, 300));
    
    // Close modals
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });
    
    // Close modal on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal.id);
        });
    });
    
    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// API Functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };
    
    if (authToken) {
        config.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || data.msg || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth Functions
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: { email, password }
        });
        
        authToken = data.token;
        localStorage.setItem('authToken', authToken);
        currentUser = data.user || { email };
        
        updateUIForLoggedInUser();
        closeModal('login-modal');
        showToast('Login successful!', 'success');
        
        // Clear form
        document.getElementById('login-form').reset();
    } catch (error) {
        showToast(error.message || 'Login failed', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const telephone = document.getElementById('register-telephone').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: { name, email, telephone, password, role: 'user' }
        });
        
        authToken = data.token;
        localStorage.setItem('authToken', authToken);
        currentUser = { name, email };
        
        updateUIForLoggedInUser();
        closeModal('register-modal');
        showToast('Registration successful!', 'success');
        
        document.getElementById('register-form').reset();
    } catch (error) {
        showToast(error.message || 'Registration failed', 'error');
    }
}

async function fetchCurrentUser() {
    try {
        const data = await apiRequest('/auth/me');
        currentUser = data.data;
        updateUIForLoggedInUser();
    } catch (error) {
        // Token invalid, clear it
        logout();
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    updateUIForLoggedOutUser();
    showToast('Logged out successfully', 'success');
}

function updateUIForLoggedInUser() {
    document.getElementById('btn-login').style.display = 'none';
    document.getElementById('btn-register').style.display = 'none';
    document.getElementById('user-menu').style.display = 'flex';
    document.getElementById('nav-reservations').style.display = 'block';
    
    if (currentUser) {
        document.getElementById('user-name').textContent = currentUser.name || currentUser.email;
    }
}

function updateUIForLoggedOutUser() {
    document.getElementById('btn-login').style.display = 'block';
    document.getElementById('btn-register').style.display = 'block';
    document.getElementById('user-menu').style.display = 'none';
    document.getElementById('nav-reservations').style.display = 'none';
    document.getElementById('user-name').textContent = '';
}

// Shop Functions
async function loadShops() {
    try {
        const data = await apiRequest('/shops');
        shops = data.data || [];
        renderShops(shops);
    } catch (error) {
        showToast('Failed to load shops', 'error');
        renderShops([]);
    }
}

function renderShops(shopsToRender) {
    const grid = document.getElementById('shops-grid');
    
    if (!shopsToRender || shopsToRender.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-store-slash"></i>
                <p>No shops found</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = shopsToRender.map(shop => `
        <div class="shop-card" data-shop-id="${shop._id}">
            <div class="shop-image">
                <i class="fas fa-spa"></i>
            </div>
            <div class="shop-info">
                <h3>${shop.name}</h3>
                <div class="shop-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${shop.location}
                </div>
                <p style="color: var(--text-light); font-size: 0.9rem; margin-bottom: 1rem;">${shop.address}</p>
                <div class="shop-meta">
                    <span class="shop-hours">
                        <i class="fas fa-clock"></i> ${shop.openTime} - ${shop.closeTime}
                    </span>
                    <span class="shop-price">฿${shop.priceRangeMin} - ฿${shop.priceRangeMax}</span>
                </div>
                <div class="shop-actions">
                    <button class="btn btn-outline" onclick="viewShopServices('${shop._id}')">
                        <i class="fas fa-list"></i> Services
                    </button>
                    <button class="btn btn-primary" onclick="openReservationModal('${shop._id}')">
                        <i class="fas fa-calendar-check"></i> Book
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const filtered = shops.filter(shop => 
        shop.name.toLowerCase().includes(query) ||
        shop.location.toLowerCase().includes(query) ||
        shop.address.toLowerCase().includes(query)
    );
    renderShops(filtered);
}

// Services Functions
async function viewShopServices(shopId) {
    try {
        const data = await apiRequest(`/shops/${shopId}`);
        const shop = data.data;
        
        if (shop.services && shop.services.length > 0) {
            let servicesHtml = shop.services.map(service => `
                <div class="service-details" style="margin-bottom: 1rem; padding: 1rem; background: var(--bg-light); border-radius: var(--radius-sm);">
                    <h4>${service.name}</h4>
                    <div class="service-detail-row">
                        <span class="service-detail-label">Area:</span>
                        <span class="service-detail-value">${service.area}</span>
                    </div>
                    <div class="service-detail-row">
                        <span class="service-detail-label">Duration:</span>
                        <span class="service-detail-value">${service.duration} mins</span>
                    </div>
                    <div class="service-detail-row">
                        <span class="service-detail-label">Oil:</span>
                        <span class="service-detail-value">${service.oil}</span>
                    </div>
                    <div class="service-detail-row">
                        <span class="service-detail-label">Price:</span>
                        <span class="service-detail-value" style="color: var(--primary-color); font-weight: 600;">฿${service.price}</span>
                    </div>
                    ${service.description ? `<p style="margin-top: 0.5rem; color: var(--text-light); font-size: 0.9rem;">${service.description}</p>` : ''}
                </div>
            `).join('');
            
            // Show in a temporary modal or alert
            showToast(`Services loaded for ${shop.name}`, 'success');
        } else {
            showToast('No services available for this shop', 'error');
        }
    } catch (error) {
        showToast('Failed to load services', 'error');
    }
}

// Reservation Functions
async function openReservationModal(shopId) {
    if (!authToken) {
        showToast('Please login to make a reservation', 'error');
        openModal('login-modal');
        return;
    }
    
    try {
        // Get shop details
        const shopData = await apiRequest(`/shops/${shopId}`);
        const shop = shopData.data;
        
        // Get services for this shop
        const servicesData = await apiRequest(`/shops/${shopId}/services`);
        const shopServices = servicesData.data || [];
        
        // Update modal with shop info
        document.getElementById('reservation-shop-info').innerHTML = `
            <div style="background: var(--bg-light); padding: 1rem; border-radius: var(--radius-sm); margin-bottom: 1.5rem;">
                <h4>${shop.name}</h4>
                <p style="color: var(--text-light); margin: 0;"><i class="fas fa-map-marker-alt"></i> ${shop.location}</p>
            </div>
        `;
        
        // Populate services dropdown
        const serviceSelect = document.getElementById('reservation-service');
        serviceSelect.innerHTML = '<option value="">Choose a service...</option>' +
            shopServices.map(service => `
                <option value="${service._id}" data-price="${service.price}" data-duration="${service.duration}" data-area="${service.area}" data-oil="${service.oil}">
                    ${service.name} - ฿${service.price} (${service.duration} mins)
                </option>
            `).join('');
        
        // Store shop ID
        serviceSelect.dataset.shopId = shopId;
        
        // Clear service details
        document.getElementById('service-details').style.display = 'none';
        
        openModal('reservation-modal');
    } catch (error) {
        showToast('Failed to load reservation data', 'error');
    }
}

function showServiceDetails(e) {
    const selected = e.target.selectedOptions[0];
    const detailsDiv = document.getElementById('service-details');
    
    if (!selected.value) {
        detailsDiv.style.display = 'none';
        return;
    }
    
    detailsDiv.innerHTML = `
        <h4>Service Details</h4>
        <div class="service-detail-row">
            <span class="service-detail-label">Area:</span>
            <span class="service-detail-value">${selected.dataset.area}</span>
        </div>
        <div class="service-detail-row">
            <span class="service-detail-label">Duration:</span>
            <span class="service-detail-value">${selected.dataset.duration} minutes</span>
        </div>
        <div class="service-detail-row">
            <span class="service-detail-label">Oil Type:</span>
            <span class="service-detail-value">${selected.dataset.oil}</span>
        </div>
        <div class="service-detail-row">
            <span class="service-detail-label">Price:</span>
            <span class="service-detail-value" style="color: var(--primary-color); font-size: 1.25rem;">฿${selected.dataset.price}</span>
        </div>
    `;
    detailsDiv.style.display = 'block';
}

async function handleReservation(e) {
    e.preventDefault();
    
    const serviceSelect = document.getElementById('reservation-service');
    const shopId = serviceSelect.dataset.shopId;
    const serviceId = serviceSelect.value;
    const date = document.getElementById('reservation-date').value;
    
    if (!serviceId) {
        showToast('Please select a service', 'error');
        return;
    }
    
    try {
        await apiRequest('/reservations', {
            method: 'POST',
            body: {
                shop: shopId,
                service: serviceId,
                resvDate: new Date(date).toISOString()
            }
        });
        
        closeModal('reservation-modal');
        showToast('Reservation created successfully!', 'success');
        document.getElementById('reservation-form').reset();
        document.getElementById('service-details').style.display = 'none';
    } catch (error) {
        showToast(error.message || 'Failed to create reservation', 'error');
    }
}

async function loadReservations() {
    if (!authToken) return;
    
    try {
        const data = await apiRequest('/reservations');
        const reservations = data.data || [];
        renderReservations(reservations);
    } catch (error) {
        showToast('Failed to load reservations', 'error');
    }
}

function renderReservations(reservations) {
    const container = document.getElementById('reservations-list');
    
    if (!reservations || reservations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <p>No reservations yet</p>
                <a href="#shops" class="btn btn-primary" style="margin-top: 1rem;">Find a Shop</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = reservations.map(resv => {
        const statusClass = {
            'pending': 'status-pending',
            'confirmed': 'status-confirmed',
            'completed': 'status-confirmed',
            'cancelled': 'status-cancelled'
        }[resv.status] || 'status-pending';
        
        const date = new Date(resv.resvDate).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        return `
            <div class="reservation-card">
                <div class="reservation-info">
                    <h4>${resv.shop?.name || 'Unknown Shop'}</h4>
                    <div class="reservation-meta">
                        <span><i class="fas fa-spa"></i> ${resv.service?.name || 'Unknown Service'}</span>
                        <span><i class="fas fa-calendar"></i> ${date}</span>
                    </div>
                </div>
                <span class="status-badge ${statusClass}">${resv.status}</span>
            </div>
        `;
    }).join('');
}

// UI Helpers
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('active');
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

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

// Load reservations when My Reservations section is shown
document.getElementById('nav-reservations')?.addEventListener('click', () => {
    document.getElementById('my-reservations').style.display = 'block';
    loadReservations();
});
