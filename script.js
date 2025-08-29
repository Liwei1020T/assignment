// ============================================
// MAIN APPLICATION INITIALIZATION
// ============================================

$(document).ready(function () {
    initApp();
    loadGlobalData();
    updateCartCounter();
    checkLoginStatus();
    updateUsernameDisplay();
    setupEventListeners();
    console.log('🚀 PC Zone initialized with Simple Data Loading');
});

// ============================================
// GLOBAL VARIABLES & DATA STORAGE
// ============================================

let products = {
    laptops: [],
    accessories: [],
};

let productsLoaded = false;
let comparisonList = [];

// ============================================
// DATA LOADING & MANAGEMENT
// ============================================

async function loadGlobalData() {
    if (productsLoaded) {
        console.log('✅ Data already loaded');
        return;
    }

    console.log('🚀 Loading data from JSONBin...');
    showGlobalLoadingIndicator();

    try {
        const JSONBIN_BIN_ID = '68ad7eb2d0ea881f4065d8e3';
        const JSONBIN_ACCESS_KEY = '$2a$10$2IacNVpOQ9PMLevdFJnq9uT6hDoHvSwLMGdenoZ09nZIhNtCA5yMS';
        const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`;

        const response = await $.ajax({
            url: JSONBIN_URL,
            method: 'GET',
            headers: { 'X-Access-Key': JSONBIN_ACCESS_KEY },
            dataType: 'json',
            timeout: 10000
        });

        products = response.record;
        productsLoaded = true;

        console.log('✅ Data loaded successfully:', {
            laptops: products.laptops?.length || 0,
            accessories: products.accessories?.length || 0
        });

        hideGlobalLoadingIndicator();
        loadCurrentPageProducts();

    } catch (error) {
        console.error('❌ Failed to load from JSONBin:', error);
        hideGlobalLoadingIndicator();
        loadCurrentPageProducts();
    }
}

// ============================================
// LOADING INDICATORS & UI FEEDBACK
// ============================================

function showGlobalLoadingIndicator() {
    const containers = ['featuredProducts', 'bestSellProducts', 'laptopProducts', 'accessoryProducts'];
    containers.forEach(containerId => {
        const container = $(`#${containerId}`);
        if (container.length) {
            container.html(`
                <div class="col-12 text-center p-5">
                    <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <h5 class="text-muted">Loading Products...</h5>
                    <p class="text-muted">Fetching latest data from server</p>
                </div>
            `);
        }
    });
}

function hideGlobalLoadingIndicator() {
    console.log('✅ Hiding loading indicators');
}

// ============================================
// PAGE-SPECIFIC PRODUCT LOADING
// ============================================

function loadCurrentPageProducts() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    setTimeout(() => {
        if (currentPage.includes('home')) {
            loadFeaturedProducts();
        } else if (currentPage.includes('laptop')) {
            loadLaptops();
        } else if (currentPage.includes('accessories')) {
            loadAccessories();
        } else if (currentPage.includes('bestsellers')) {
            loadBestSellers();
        }
    }, 500);
}

// ============================================
// USER MANAGEMENT
// ============================================

function getUsers() {
    const raw = localStorage.getItem('users');
    try {
        const users = raw ? JSON.parse(raw) : [];
        return Array.isArray(users) ? users : [];
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function findUserByEmail(email) {
    const users = getUsers();
    return users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
}

// Migration for older data model
(function migrateRegisteredUser() {
    const legacy = localStorage.getItem('registeredUser');
    if (legacy) {
        try {
            const user = JSON.parse(legacy);
            if (user && user.email) {
                const users = getUsers();
                if (!findUserByEmail(user.email)) {
                    users.push({ name: user.name || '', email: user.email, password: '__legacy_no_password__' });
                    saveUsers(users);
                }
            }
            localStorage.removeItem('registeredUser');
        } catch { }
    }
})();

// ============================================
// APPLICATION INITIALIZATION & SETUP
// ============================================

function initApp() {
    initEmailJS();
    
    if (!localStorage.getItem('welcomeShown')) {
        setTimeout(() => {
            showAlert('Welcome to PC Zone! Enjoy shopping with us.', 'success', 'global');
            localStorage.setItem('welcomeShown', 'true');
        }, 1000);
    }

    const statusMessage = sessionStorage.getItem('statusMessage');
    if (statusMessage) {
        showAlert(statusMessage, 'info', 'global');
        sessionStorage.removeItem('statusMessage');
    }

    sessionStorage.setItem('sessionStart', new Date().toISOString());
    setCookie('visitorId', generateId(), 7);
    setCookie('lastVisit', new Date().toISOString(), 7);
}

async function showPage(pageId) {
    $('.current-page, .hidden-page').removeClass('current-page').addClass('hidden-page');
    $(`#${pageId}-page`).removeClass('hidden-page').addClass('current-page');
    $('.navbar-nav .nav-link').removeClass('active');
    $(`.navbar-nav .nav-link[onclick="showPage('${pageId}')"]`).addClass('active');
    window.scrollTo(0, 0);
    sessionStorage.setItem('currentPage', pageId);
    await loadPageContent(pageId);
}

async function loadPageContent(pageId) {
    if (!productsLoaded) {
        console.log('⏳ Waiting for global data to load...');
        setTimeout(() => loadPageContent(pageId), 500);
        return;
    }

    console.log(`📄 Loading content for ${pageId}`);
    
    switch (pageId) {
        case 'home': loadFeaturedProducts(); break;
        case 'best-sell': loadBestSellers(); break;
        case 'laptop': loadLaptops(); break;
        case 'accessories': loadAccessories(); break;
        case 'cart': loadCart(); break;
    }
}

function loadFeaturedProducts() {
    if (!productsLoaded) {
        setTimeout(loadFeaturedProducts, 500);
        return;
    }

    console.log('📄 Loading featured products');
    const featured = [...products.laptops.slice(0, 2), ...products.accessories.slice(0, 2)];
    renderProducts(featured, 'featuredProducts');
}

function loadBestSellers() {
    if (!productsLoaded) {
        setTimeout(loadBestSellers, 500);
        return;
    }

    console.log('📄 Loading best sellers');
    const bestSellers = [...products.laptops.filter(p => p.bestSeller), ...products.accessories.filter(p => p.bestSeller)];
    renderProducts(bestSellers, 'bestSellProducts');
}

function loadLaptops() {
    if (!productsLoaded) {
        setTimeout(loadLaptops, 500);
        return;
    }

    console.log('📄 Loading laptops');
    renderProducts(products.laptops, 'laptopProducts');
    setupLaptopFilters();
}

function loadAccessories() {
    if (!productsLoaded) {
        setTimeout(loadAccessories, 500);
        return;
    }

    console.log('📄 Loading accessories');
    renderProducts(products.accessories, 'accessoryProducts');
}

// ============================================
// PRODUCT RENDERING & DISPLAY
// ============================================

function renderProducts(productList, containerId) {
    const container = $(`#${containerId}`);
    container.empty();

    if (productList.length === 0) {
        container.html('<div class="col-12 text-center"><p>No products found.</p></div>');
        return;
    }

    productList.forEach(product => {
        const showCompare = containerId === 'laptopProducts';

        const productCard = `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="card product-card h-100">
                    ${showCompare ? `
                        <div class="comparison-checkbox">
                            <input type="checkbox" class="compare-checkbox" 
                                   id="compare-${product.id}" 
                                   onchange="handleCompareChange(${product.id})">
                            <label for="compare-${product.id}">Compare</label>
                        </div>
                    ` : ''}
                    <img src="${product.image}" class="card-img-top" alt="${product.name}">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${product.name}</h5>
                        <div class="mt-auto">
                            <div class="mb-2">
                                <span class="price">RM${product.price}</span>
                                ${product.oldPrice ? `<span class="old-price ms-2">RM${product.oldPrice}</span>` : ''}
                            </div>
                            <button class="btn btn-link view-details w-100 mb-2" 
                                    onclick="showProductDetails(${product.id})">
                                View Details
                            </button>
                            <button class="btn btn-primary w-100" onclick="addToCart(${product.id})">
                                <i class="fas fa-cart-plus me-2"></i>Add to Cart
                            </button>
                        </div>
                    </div>
                    ${product.bestSeller ? '<div class="position-absolute top-0 end-0 bg-warning text-dark px-2 py-1 m-2 rounded"><small>Best Seller</small></div>' : ''}
                </div>
            </div>
        `;
        container.append(productCard);
    });
}

async function showProductDetails(productId) {
    try {
        const product = await findProductById(productId);

        if (!product) {
            showAlert('Product not found!', 'error');
            return;
        }

        const modal = $('#productModal');
        if (modal.length === 0) {
            showAlert('Product details are not available on this page.', 'warning');
            return;
        }

        modal.find('.modal-title').text(product.name);
        modal.find('.product-image').attr('src', product.image);
        modal.find('.product-price').html(`
            RM${product.price}
            ${product.oldPrice ? `<small class="text-muted text-decoration-line-through ms-2">RM${product.oldPrice}</small>` : ''}
        `);

        if (product.description) {
            modal.find('.product-description').html(product.description);
        }

        if (product.specs && product.specs.length > 0) {
            const specsList = modal.find('.specs-list');
            specsList.empty();
            product.specs.forEach(spec => {
                specsList.append(`<li>${spec}</li>`);
            });
        } else {
            modal.find('.product-description').html(`
                <p>High-quality ${product.category} from our premium collection.</p>
                <p><strong>Price:</strong> $${product.price}</p>
                <p><strong>Category:</strong> ${product.category}</p>
            `);

            modal.find('.specs-list').html('<li>Detailed specifications coming soon</li>');
        }

        modal.find('.add-to-cart-btn').attr('onclick', `addToCart(${productId})`);

        if (modal.find('.social-share-container').length === 0) {
            const socialShareHTML = `
                <div class="social-share-container mt-4">
                    <div class="social-share-title">Share this product</div>
                    <div class="social-share-buttons">
                        <a href="#" class="social-share-btn social-facebook" onclick="shareProduct('facebook', ${productId})">
                            <i class="fab fa-facebook-f"></i>
                        </a>
                        <a href="#" class="social-share-btn social-twitter" onclick="shareProduct('twitter', ${productId})">
                            <i class="fab fa-twitter"></i>
                        </a>
                        <a href="#" class="social-share-btn social-whatsapp" onclick="shareProduct('whatsapp', ${productId})">
                            <i class="fab fa-whatsapp"></i>
                        </a>
                        <a href="#" class="social-share-btn social-copy" onclick="copyLink()">
                            <i class="fas fa-copy"></i>
                        </a>
                    </div>
                </div>
            `;
            modal.find('.product-details').append(socialShareHTML);
        }

        const bootstrapModal = new bootstrap.Modal(modal[0]);
        bootstrapModal.show();

        console.log('✅ Product details shown for product ID:', productId);

    } catch (error) {
        console.error('❌ Error showing product details:', error);
        showAlert('Error loading product details. Please try again.', 'error');
    }
}

// SIMPLE SOCIAL SHARING
// ============================================

async function shareProduct(platform, productId) {
    const product = await findProductById(productId);
    if (!product) return;

    const url = window.location.href;
    const text = `Check out ${product.name} for RM${product.price} at PC Zone!`;

    let shareUrl = '';
    
    switch(platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
            break;
    }

    if (shareUrl) {
        window.location.href = shareUrl;
        console.log(`✅ Shared ${product.name} on ${platform}`);
    }
}

function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        showAlert('Link copied!', 'success');
    }).catch(() => {
        showAlert('Could not copy link', 'error');
    });
}

function setupLaptopFilters() {
    $('#laptopSort').on('change', function () {
        const sortBy = $(this).val();
        sortLaptops(sortBy);
    });

    $('#laptopSearch').on('input', function () {
        const searchTerm = $(this).val().toLowerCase();
        filterLaptops(searchTerm);
    });
}

async function sortLaptops(sortBy) {
    if (!productsLoaded) {
        await loadGlobalData();
    }

    let sortedLaptops = [...products.laptops];

    switch (sortBy) {
        case 'price-low':
            sortedLaptops.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            sortedLaptops.sort((a, b) => b.price - a.price);
            break;
        case 'name':
        default:
            sortedLaptops.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }

    renderProducts(sortedLaptops, 'laptopProducts');
}

async function filterLaptops(searchTerm) {
    if (!productsLoaded) {
        await loadGlobalData();
    }

    const filteredLaptops = products.laptops.filter(laptop =>
        laptop.name.toLowerCase().includes(searchTerm)
    );
    renderProducts(filteredLaptops, 'laptopProducts');
}

// ============================================
// SHOPPING CART MANAGEMENT
// ============================================

async function addToCart(productId) {
    const product = await findProductById(productId);
    if (!product) return;

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCounter();
    showAlert(`${product.name} added to cart!`, 'success');
}

function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCounter();
    loadCart();
}

function updateQuantity(productId, newQuantity) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const item = cart.find(item => item.id === productId);

    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            localStorage.setItem('cart', JSON.stringify(cart));
            loadCart();
        }
    }
}

function updateCartCounter() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    $('#cartCounter').text(totalItems);
}

function loadCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItems = $('#cartItems');

    if (cart.length === 0) {
        cartItems.html(`
            <div class="text-center py-5">
                <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                <h4>Your cart is empty</h4>
                <p class="text-muted">Add some products to get started!</p>
                <button class="btn btn-primary" onclick="window.location.href = 'laptops.html'">Start Shopping</button>
            </div>
        `);
        updateCartSummary(0, 0, 0);
        return;
    }

    cartItems.empty();
    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const cartItem = `
            <div class="row align-items-center mb-3 pb-3 border-bottom">
                <div class="col-md-2">
                    <img src="${item.image}" class="img-fluid rounded" alt="${item.name}">
                </div>
                <div class="col-md-4">
                    <h6>${item.name}</h6>
                    <p class="text-muted mb-0">${item.price}</p>
                </div>
                <div class="col-md-3">
                    <div class="input-group">
                        <button class="btn btn-outline-secondary" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <input type="text" class="form-control text-center" value="${item.quantity}" readonly>
                        <button class="btn btn-outline-secondary" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <div class="col-md-2 text-end">
                    <strong>${itemTotal}</strong>
                </div>
                <div class="col-md-1 text-end">
                    <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        cartItems.append(cartItem);
    });

    const tax = subtotal * 0.1;
    const shipping = subtotal > 100 ? 0 : 10;
    const total = subtotal + tax + shipping;

    updateCartSummary(subtotal, tax, shipping, total);
}

function updateCartSummary(subtotal, tax, shipping, total = null) {
    $('#subtotal').text(`${subtotal.toFixed(2)}`);
    $('#tax').text(`${tax.toFixed(2)}`);
    $('#shipping').text(shipping === 0 ? 'FREE' : `${shipping.toFixed(2)}`);
    if (total !== null) {
        $('#total').text(`${total.toFixed(2)}`);
    }
}

function checkout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        showAlert('Your cart is empty!', 'warning');
        return;
    }

    if (!isLoggedIn()) {
        showAlert('Please login to proceed with checkout.', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }

    window.location.href = 'payment.html';
}

// ============================================
// CONTACT FORM & EMAIL
// ============================================

function handleContactForm() {
    console.log('🔧 Contact form submitted');
    
    const name = $('input[name="name"]').val().trim();
    const email = $('input[name="email"]').val().trim();
    const subject = $('input[name="subject"]').val().trim();
    const message = $('textarea[name="message"]').val().trim();
    
    console.log('Form values:', { name, email, subject, message });
    
    if (!name || !email || !subject || !message) {
        console.log('❌ Validation failed - empty fields');
        showAlert('Please fill in all fields before submitting.', 'warning', 'contact-page');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.log('❌ Invalid email format');
        showAlert('Please enter a valid email address.', 'warning', 'contact-page');
        return;
    }
    
    const submitBtn = $('#contactForm button[type="submit"]');
    const originalText = submitBtn.html();
    submitBtn.html('<i class="fas fa-spinner fa-spin me-2"></i>Sending...').prop('disabled', true);
    
    const serviceID = 'service_oqx32rg';
    const templateID = 'template_i2p175l';
    const userID = 'wfJ5vWRCznlqf9nLN';
    
    const templateParams = {
        title: subject,
        name: name,
        email: email,
        message: message
    };
    
    console.log('📧 Sending email with corrected params:', templateParams);
    
    emailjs.send(serviceID, templateID, templateParams, userID)
        .then(function(response) {
            console.log('✅ Email sent successfully:', response.status, response.text);
            
            submitBtn.html(originalText).prop('disabled', false);
            showAlert('Thank you for your message! We will get back to you soon.', 'success', 'contact-page');
            $('#contactForm')[0].reset();
            
        })
        .catch(function(error) {
            console.error('❌ Failed to send email:', error);
            
            submitBtn.html(originalText).prop('disabled', false);
            
            let errorMessage = 'Sorry, there was an error sending your message.';
            
            if (error.status === 412) {
                errorMessage = 'Email service authentication failed. Please try again later.';
            } else if (error.status === 400) {
                errorMessage = 'Invalid email data. Please check your inputs and try again.';
            } else if (error.text) {
                errorMessage = `Error: ${error.text}`;
            }
            
            showAlert(errorMessage, 'danger', 'contact-page');
        });
}

function initEmailJS() {
    emailjs.init('wfJ5vWRCznlqf9nLN');
    console.log('📧 EmailJS initialized');
}

// ============================================
// EVENT LISTENERS & USER INTERACTIONS
// ============================================

function setupEventListeners() {
    $('#loginForm').on('submit', function (e) {
        e.preventDefault();
        handleLogin();
    });

    $('#signupForm').on('submit', function (e) {
        e.preventDefault();
        handleSignup();
    });

    $('#contactForm').on('submit', function (e) {
        e.preventDefault();
        handleContactForm();
    });

    $(document).on('click', '#loginPasswordToggle, #signupPasswordToggle, #confirmPasswordToggle', function () {
        const target = $($(this).data('target'));
        const isPassword = target.attr('type') === 'password';
        target.attr('type', isPassword ? 'text' : 'password');
        const icon = $(this).find('i');
        icon.toggleClass('fa-eye fa-eye-slash');
    });

    $(document).on('keydown keyup', '#loginPassword', function (e) {
        const isCaps = e.getModifierState && e.getModifierState('CapsLock');
        $('#loginCapsWarning').toggleClass('d-none', !isCaps);
    });

    $(document).on('input', '#signupPassword', function () {
        updatePasswordStrength($(this).val());
    });
}

function handleLogin() {
    const email = $('#loginEmail').val().trim();
    const password = $('#loginPassword').val();
    const rememberMe = $('#rememberMe').is(':checked');

    if (!email || !password) {
        showAlert('Please enter valid credentials!', 'danger', 'login-page');
        return;
    }

    const user = findUserByEmail(email);
    if (!user || user.password !== password) {
        $('#loginEmail').addClass('is-invalid');
        $('#loginPassword').addClass('is-invalid');
        $('#loginEmailFeedback').text('Email or password is incorrect.');
        $('#loginPasswordFeedback').text('Email or password is incorrect.');
        showAlert('Incorrect email or password.', 'danger', 'login-page');
        return;
    }

    const userData = {
        name: user.name || '',
        email: user.email,
        loginTime: new Date().toISOString(),
        rememberMe: rememberMe
    };

    sessionStorage.setItem('user', JSON.stringify(userData));

    if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(userData));
    } else {
        localStorage.removeItem('user');
    }

    setLoading('#loginSubmitBtn', '#loginSpinner', true);

    showAlert('Login successful!', 'success', 'login-page');
    updateLoginStatus();

    setTimeout(() => {
        window.location.href = 'index.html';
    }, 800);
}

function handleSignup() {
    const name = $('#signupName').val().trim();
    const email = $('#signupEmail').val().trim();
    const password = $('#signupPassword').val();
    const confirmPassword = $('#confirmPassword').val();

    if (!name || !email || !password || !confirmPassword) {
        if (!name) { $('#signupName').addClass('is-invalid'); $('#signupNameFeedback').text('Please enter your full name.'); }
        if (!email) { $('#signupEmail').addClass('is-invalid'); $('#signupEmailFeedback').text('Please enter your email.'); }
        if (!password) { $('#signupPassword').addClass('is-invalid'); $('#signupPasswordFeedback').text('Please enter a password.'); }
        if (!confirmPassword) { $('#confirmPassword').addClass('is-invalid'); $('#confirmPasswordFeedback').text('Please confirm your password.'); }
        showAlert('Please fill all fields!', 'danger', 'signup-page');
        return;
    }

    if (password !== confirmPassword) {
        $('#confirmPassword').addClass('is-invalid');
        $('#confirmPasswordFeedback').text('Passwords do not match.');
        showAlert('Passwords do not match!', 'danger', 'signup-page');
        return;
    }

    if (password.length < 6) {
        $('#signupPassword').addClass('is-invalid');
        $('#signupPasswordFeedback').text('Password must be at least 6 characters.');
        showAlert('Password must be at least 6 characters.', 'danger', 'signup-page');
        return;
    }

    if (findUserByEmail(email)) {
        $('#signupEmail').addClass('is-invalid');
        $('#signupEmailFeedback').text('An account with this email already exists.');
        showAlert('An account with this email already exists.', 'danger', 'signup-page');
        return;
    }

    const users = getUsers();
    const newUser = { name, email, password };
    users.push(newUser);
    saveUsers(users);

    const sessionUser = { name, email, signupTime: new Date().toISOString() };
    sessionStorage.setItem('user', JSON.stringify(sessionUser));

    setLoading('#signupSubmitBtn', '#signupSpinner', true);

    showEnhancedSignupSuccess(name);
    updateLoginStatus();

    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2500);
}

function showEnhancedSignupSuccess(userName) {
    const successHTML = `
        <div id="signup-success-overlay" class="signup-success-enhanced">
            <div class="success-card">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2>Welcome to PC Zone!</h2>
                <h3>Hello ${userName}! 👋</h3>
                <p>Your account has been created successfully.<br>
                   You're now logged in and ready to shop!</p>
                <div class="loading-dots">
                    <span></span><span></span><span></span>
                </div>
                <p class="redirect-text">Redirecting to homepage...</p>
            </div>
        </div>
    `;

    $('body').append(successHTML);
    addSignupSuccessStyles();

    setTimeout(() => {
        $('#signup-success-overlay').addClass('show');
    }, 100);
}

function addSignupSuccessStyles() {
    if ($('#signup-success-styles').length) return;
    const styles = `
        <style id="signup-success-styles">
            .signup-success-enhanced {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: all 0.4s ease;
            }

            .signup-success-enhanced.show {
                opacity: 1;
                visibility: visible;
            }

            .success-card {
                background: white;
                padding: 3rem 2rem;
                border-radius: 20px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,0.2);
                max-width: 400px;
                width: 90%;
                transform: scale(0.8) translateY(30px);
                transition: all 0.5s ease;
            }

            .signup-success-enhanced.show .success-card {
                transform: scale(1) translateY(0);
            }

            .success-icon {
                font-size: 4rem;
                color: #28a745;
                margin-bottom: 1rem;
                animation: bounceIn 0.6s ease 0.3s both;
            }

            .success-card h2 {
                color: #333;
                margin-bottom: 0.5rem;
                font-weight: 700;
                animation: slideInUp 0.5s ease 0.5s both;
            }

            .success-card h3 {
                color: #666;
                margin-bottom: 1rem;
                font-weight: 500;
                animation: slideInUp 0.5s ease 0.7s both;
            }

            .success-card p {
                color: #777;
                line-height: 1.6;
                margin-bottom: 1.5rem;
                animation: slideInUp 0.5s ease 0.9s both;
            }

            .loading-dots {
                display: flex;
                justify-content: center;
                gap: 5px;
                margin-bottom: 1rem;
            }

            .loading-dots span {
                width: 8px;
                height: 8px;
                background: #667eea;
                border-radius: 50%;
                animation: dotPulse 1.4s infinite both;
            }

            .loading-dots span:nth-child(2) {
                animation-delay: 0.2s;
            }

            .loading-dots span:nth-child(3) {
                animation-delay: 0.4s;
            }

            .redirect-text {
                font-size: 0.9rem;
                color: #999;
                margin: 0;
            }

            @keyframes bounceIn {
                0% { 
                    transform: scale(0);
                    opacity: 0;
                }
                50% { 
                    transform: scale(1.1);
                }
                100% { 
                    transform: scale(1);
                    opacity: 1;
                }
            }

            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes dotPulse {
                0%, 80%, 100% {
                    transform: scale(0.8);
                    opacity: 0.5;
                }
                40% {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            @media (max-width: 480px) {
                .success-card {
                    padding: 2rem 1.5rem;
                    margin: 1rem;
                }
                
                .success-icon {
                    font-size: 3rem;
                }
            }
        </style>
    `;

    $('head').append(styles);
}

// ============================================
// USER AUTHENTICATION & SESSION MANAGEMENT
// ============================================

function checkLoginStatus() {
    updateLoginStatus();
}

function isLoggedIn() {
    return Boolean(localStorage.getItem('user') || sessionStorage.getItem('user'));
}

function updateLoginStatus() {
    const loggedIn = isLoggedIn();
    const $loginNav = $('#loginNav');
    const $userNav = $('#userNav');

    console.log('Login status:', loggedIn);
    console.log('LoginNav found:', $loginNav.length);
    console.log('UserNav found:', $userNav.length);

    if ($loginNav.length) $loginNav.toggle(!loggedIn);
    if ($userNav.length) $userNav.toggle(loggedIn);

    updateUsernameDisplay();
}

function updateUsernameDisplay() {
    const userData = getCurrentUser();
    const username = userData ? (userData.name || userData.email || 'User') : 'Guest';

    const $currentUser = $('#currentUser');
    if ($currentUser.length) {
        $currentUser.text(username);
    }
}

function getCurrentUser() {
    let userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userData) {
        try {
            return JSON.parse(userData);
        } catch (e) {
            return null;
        }
    }
    return null;
}

function setLoading(buttonSelector, spinnerSelector, isLoading) {
    const $btn = $(buttonSelector);
    const $spinner = $(spinnerSelector);
    $btn.prop('disabled', isLoading);
    $spinner.toggleClass('d-none', !isLoading);
}

function updatePasswordStrength(password) {
    const score = getPasswordScore(password);
    const $bar = $('#passwordStrengthBar');
    const $text = $('#passwordStrengthText');
    let width = 0, cls = 'bg-danger', label = 'Weak';
    if (score >= 3) { width = 60; cls = 'bg-warning'; label = 'Fair'; }
    if (score >= 4) { width = 80; cls = 'bg-info'; label = 'Good'; }
    if (score >= 5) { width = 100; cls = 'bg-success'; label = 'Strong'; }
    if (score < 3) { width = 30; cls = 'bg-danger'; label = 'Weak'; }
    $bar.removeClass('bg-danger bg-warning bg-info bg-success').addClass(cls).css('width', width + '%');
    $text.text(label + ' password');
}

function getPasswordScore(pw) {
    let score = 0;
    if (pw.length >= 6) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
}

function logout() {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    updateLoginStatus();
    showAlert('You have been logged out successfully!', 'info');
    showPage('home');
}

function findProductById(id) {
    const allProducts = [...products.laptops, ...products.accessories];
    return allProducts.find(product => product.id === id);
}

// ============================================
// UTILITY FUNCTIONS & HELPERS
// ============================================

function showAlert(message, type, container = 'global') {
    let alertContainer;
    
    if (container === 'contact-page') {
        alertContainer = $('#globalAlertContainer');
    } else if (container === 'global') {
        alertContainer = $('#globalAlertContainer');
    } else {
        alertContainer = $('#globalAlertContainer');
    }
    
    if (!alertContainer.length) {
        alertContainer = $('<div id="globalAlertContainer" class="container mt-3"></div>');
        $('main').prepend(alertContainer);
    }
    
    alertContainer.empty();

    const alert = $(`
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `);

    alertContainer.append(alert);
    alertContainer.show();

    setTimeout(() => {
        alert.alert('close');
    }, 5000);
}

function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

$(window).on('resize', function () {
    if ($(window).width() < 768) {
        $('.product-card').addClass('mb-3');
    } else {
        $('.product-card').removeClass('mb-3');
    }
});

// ============================================
// PRODUCT COMPARISON SYSTEM 
// ============================================

function handleCompareChange(productId) {
    const checkbox = $(`#compare-${productId}`);

    if (checkbox.is(':checked')) {
        if (comparisonList.length >= 3) {
            checkbox.prop('checked', false);
            showAlert('You can only compare up to 3 laptops at once', 'warning');
            return;
        }
        comparisonList.push(productId);
        console.log('✅ Added product to comparison:', productId);
    } else {
        comparisonList = comparisonList.filter(id => id !== productId);
        console.log('✅ Removed product from comparison:', productId);
    }

    updateCompareFloat();
}

function updateCompareFloat() {
    let compareFloat = $('#compareFloat');
    
    // Create the floating comparison bar if it doesn't exist
    if (compareFloat.length === 0) {
        const floatingHTML = `
            <div id="compareFloat" class="position-fixed bottom-0 end-0 m-3 bg-primary text-white p-3 rounded shadow d-none" style="z-index: 1050;">
                <div class="d-flex align-items-center">
                    <span class="me-2">Compare (<span id="compareCount">0</span>/3)</span>
                    <button class="btn btn-light btn-sm me-2" onclick="showComparison()">
                        <i class="fas fa-balance-scale me-1"></i>Compare
                    </button>
                    <button class="btn btn-outline-light btn-sm" onclick="clearComparison()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        $('body').append(floatingHTML);
        compareFloat = $('#compareFloat');
    }
    
    const compareCount = $('#compareCount');

    if (comparisonList.length > 0) {
        compareFloat.removeClass('d-none');
        compareCount.text(comparisonList.length);
    } else {
        compareFloat.addClass('d-none');
    }
}

async function showComparison() {
    if (comparisonList.length === 0) {
        showAlert('Please select products to compare', 'warning');
        return;
    }

    // Create comparison modal if it doesn't exist
    let compareModal = $('#compareModal');
    if (compareModal.length === 0) {
        const modalHTML = `
            <div class="modal fade" id="compareModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Product Comparison</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="table-responsive">
                                <table class="table comparison-table">
                                    <tbody></tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="clearComparison()">Clear All</button>
                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        $('body').append(modalHTML);
        compareModal = $('#compareModal');
    }

    try {
        // Get products for comparison
        const products = await Promise.all(
            comparisonList.map(async id => await findProductById(id))
        );

        const tbody = $('.comparison-table tbody');
        tbody.empty();

        // Product images and names row
        const headerRow = $('<tr><td><strong>Product</strong></td></tr>');
        products.forEach(product => {
            if (product) {
                headerRow.append(`
                    <td class="text-center">
                        <img src="${product.image}" alt="${product.name}" style="width: 100px; height: 100px; object-fit: cover;" class="mb-2 rounded">
                        <h6>${product.name}</h6>
                        <p class="text-primary fw-bold mb-0">RM${product.price}</p>
                        ${product.oldPrice ? `<small class="text-muted text-decoration-line-through">RM${product.oldPrice}</small>` : ''}
                    </td>
                `);
            }
        });
        tbody.append(headerRow);

        // Comparison rows
        const comparisonRows = [
            { label: 'Category', getValue: (p) => p.category || 'N/A' },
            { label: 'Price', getValue: (p) => `RM${p.price}` },
            { label: 'Specifications', getValue: (p) => p.specs ? p.specs.join('<br>') : 'No specifications available' },
            { label: 'Best Seller', getValue: (p) => p.bestSeller ? '✅ Yes' : '❌ No' }
        ];

        comparisonRows.forEach(row => {
            const tr = $(`<tr><td><strong>${row.label}</strong></td></tr>`);
            products.forEach(product => {
                if (product) {
                    tr.append(`<td>${row.getValue(product)}</td>`);
                }
            });
            tbody.append(tr);
        });

        // Action row
        const actionRow = $('<tr><td><strong>Actions</strong></td></tr>');
        products.forEach(product => {
            if (product) {
                actionRow.append(`
                    <td class="text-center">
                        <button class="btn btn-primary btn-sm mb-2 w-100" onclick="addToCart(${product.id})">
                            <i class="fas fa-cart-plus me-1"></i>Add to Cart
                        </button>
                        <br>
                        <button class="btn btn-outline-danger btn-sm w-100" onclick="removeFromComparison(${product.id})">
                            <i class="fas fa-times me-1"></i>Remove
                        </button>
                    </td>
                `);
            }
        });
        tbody.append(actionRow);

        const bootstrapModal = new bootstrap.Modal(compareModal[0]);
        bootstrapModal.show();

        console.log('✅ Comparison modal shown with products:', products.map(p => p?.name));

    } catch (error) {
        console.error('❌ Error showing comparison:', error);
        showAlert('Error loading comparison data', 'error');
    }
}

function removeFromComparison(productId) {
    $(`#compare-${productId}`).prop('checked', false);
    comparisonList = comparisonList.filter(id => id !== productId);
    updateCompareFloat();
    
    // Refresh the comparison modal if it's open
    if ($('#compareModal').hasClass('show')) {
        showComparison();
    }
    
    console.log('✅ Removed from comparison:', productId);
}

function clearComparison() {
    
    comparisonList.forEach(id => {
        $(`#compare-${id}`).prop('checked', false);
    });
    comparisonList = [];
    updateCompareFloat();
    
    // Hide the modal if it's open
    const modal = bootstrap.Modal.getInstance(document.getElementById('compareModal'));
    if (modal) {
        modal.hide();
    }
    
    console.log('✅ Cleared all comparisons');
}

// ============================================
// NEWSLETTER SUBSCRIPTION SYSTEM
// ============================================

function handleNewsletterSubscription() {
    const emailInput = document.getElementById('newsletterEmail');
    const subscribeBtn = document.getElementById('subscribeBtn');
    const email = emailInput.value.trim();

    if (!email) {
        showEmailError('Please enter your email address.');
        return;
    }

    if (!isValidEmail(email)) {
        showEmailError('Please enter a valid email address.');
        return;
    }

    const existingEmails = getStoredEmails();
    if (existingEmails.includes(email)) {
        showEmailError('This email is already subscribed to our newsletter.');
        return;
    }

    subscribeBtn.classList.add('loading');
    emailInput.disabled = true;

    setTimeout(() => {
        saveEmailToStorage(email);
        
        emailInput.value = '';
        emailInput.disabled = false;
        subscribeBtn.classList.remove('loading');
        
        showNewsletterSuccessModal();
        
        console.log('✅ Newsletter subscription successful for:', email);
    }, 1500);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function getStoredEmails() {
    const stored = localStorage.getItem('newsletterEmails');
    return stored ? JSON.parse(stored) : [];
}

function saveEmailToStorage(email) {
    const existingEmails = getStoredEmails();
    existingEmails.push({
        email: email,
        subscribedAt: new Date().toISOString(),
        status: 'active'
    });
    localStorage.setItem('newsletterEmails', JSON.stringify(existingEmails));
}

function showEmailError(message) {
    const emailInput = document.getElementById('newsletterEmail');
    
    emailInput.style.borderColor = '#dc3545';
    emailInput.style.boxShadow = '0 0 0 0.2rem rgba(220,53,69,.25)';
    
    let errorDiv = document.querySelector('.newsletter-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'newsletter-error mt-2 text-danger small';
        emailInput.parentElement.parentElement.appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.animation = 'fadeInUp 0.3s ease-out';
    
    setTimeout(() => {
        emailInput.style.borderColor = '';
        emailInput.style.boxShadow = '';
        if (errorDiv) {
            errorDiv.remove();
        }
    }, 3000);
    
    emailInput.focus();
}

function showNewsletterSuccessModal() {
    const modal = new bootstrap.Modal(document.getElementById('newsletterSuccessModal'));
    modal.show();
    
    setTimeout(() => {
        createConfettiEffect();
    }, 800);
}

function createConfettiEffect() {
    const confettiColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b'];
    
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 8px;
                height: 8px;
                background: ${confettiColors[Math.floor(Math.random() * confettiColors.length)]};
                top: 20%;
                left: ${Math.random() * 100}%;
                z-index: 9999;
                border-radius: 50%;
                pointer-events: none;
                animation: confettiFall 3s ease-out forwards;
            `;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }, i * 50);
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes confettiFall {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

