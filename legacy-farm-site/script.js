// ============================================
// Navigation Functionality
// ============================================

// Mobile menu toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    
    // Animate hamburger
    const spans = hamburger.querySelectorAll('span');
    spans[0].style.transform = navMenu.classList.contains('active') 
        ? 'rotate(-45deg) translate(-5px, 6px)' 
        : 'rotate(0) translate(0, 0)';
    spans[1].style.opacity = navMenu.classList.contains('active') ? '0' : '1';
    spans[2].style.transform = navMenu.classList.contains('active') 
        ? 'rotate(45deg) translate(-5px, -6px)' 
        : 'rotate(0) translate(0, 0)';
});

// Close mobile menu when clicking a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const spans = hamburger.querySelectorAll('span');
        spans[0].style.transform = 'rotate(0) translate(0, 0)';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'rotate(0) translate(0, 0)';
    });
});

// ============================================
// Active Navigation Link on Scroll
// ============================================

const sections = document.querySelectorAll('section[id]');

function setActiveNav() {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => link.classList.remove('active'));
            if (navLink) {
                navLink.classList.add('active');
            }
        }
    });
}

window.addEventListener('scroll', setActiveNav);

// ============================================
// Navbar Background on Scroll
// ============================================

const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ============================================
// Scroll Animations (Intersection Observer)
// ============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards and major elements
const animatedElements = document.querySelectorAll(`
    .product-card,
    .service-card,
    .gallery-item,
    .stat-item,
    .contact-item
`);

animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ============================================
// Contact Form Handling
// ============================================

const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const message = document.getElementById('message').value;

    // Basic validation
    if (!name || !email || !message) {
        showNotification('Please fill in all required fields!', 'error');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address!', 'error');
        return;
    }

    // Simulate form submission (in real app, this would send to server)
    showNotification('Thank you! Your message has been sent successfully. We\'ll get back to you soon!', 'success');
    
    // Reset form
    contactForm.reset();
});

// ============================================
// Newsletter Form Handling
// ============================================

const newsletterForm = document.querySelector('.newsletter-form');

if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const emailInput = newsletterForm.querySelector('input[type="email"]');
        const email = emailInput.value;

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Please enter a valid email address!', 'error');
            return;
        }

        showNotification('Thank you for subscribing to our newsletter!', 'success');
        emailInput.value = '';
    });
}

// ============================================
// Notification System
// ============================================

function showNotification(message, type = 'success') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;

    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '100px',
        right: '20px',
        background: type === 'success' ? '#2d6a4f' : '#e63946',
        color: '#fff',
        padding: '1.5rem 2rem',
        borderRadius: '10px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        zIndex: '10000',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        maxWidth: '400px',
        animation: 'slideIn 0.3s ease',
        fontSize: '1rem'
    });

    // Add to page
    document.body.appendChild(notification);

    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: #fff;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
    `;
    
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Add notification animations to document
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    .notification i {
        font-size: 1.5rem;
    }
`;
document.head.appendChild(style);

// ============================================
// Smooth Scroll Enhancement
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            const navHeight = navbar.offsetHeight;
            const targetPosition = target.offsetTop - navHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ============================================
// Gallery Item Click Handler
// ============================================

const galleryItems = document.querySelectorAll('.gallery-item');

galleryItems.forEach(item => {
    item.addEventListener('click', () => {
        const placeholder = item.querySelector('.gallery-placeholder p');
        const imageName = placeholder ? placeholder.textContent : 'Gallery Image';
        showNotification(`You clicked on: ${imageName}. In a full implementation, this would open a lightbox.`, 'success');
    });
});

// ============================================
// Counter Animation for Stats
// ============================================

function animateCounter(element, target, duration = 2000) {
    let current = 0;
    const increment = target / (duration / 16);
    const suffix = element.textContent.replace(/[0-9]/g, '');
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + suffix;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current) + suffix;
        }
    }, 16);
}

// Observe stat items for counter animation
const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
            const h4 = entry.target.querySelector('h4');
            const text = h4.textContent;
            const number = parseInt(text.replace(/[^0-9]/g, ''));
            
            if (number) {
                entry.target.classList.add('counted');
                animateCounter(h4, number);
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-item').forEach(stat => {
    statObserver.observe(stat);
});

// ============================================
// Page Load Animation
// ============================================

window.addEventListener('load', () => {
    // Add fade-in class to hero elements with delay
    const heroElements = document.querySelectorAll('.hero-title, .hero-subtitle, .hero-buttons');
    heroElements.forEach((el, index) => {
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 300 * (index + 1));
    });
});

// ============================================
// Farm Connect - Order Management
// ============================================

const cart = {
    items: [],
    deliveryFee: 30.00
};

// Get all order items
const orderItems = document.querySelectorAll('.order-item');

orderItems.forEach(item => {
    const increaseBtn = item.querySelector('.btn-increase');
    const decreaseBtn = item.querySelector('.btn-decrease');
    const quantitySpan = item.querySelector('.quantity');
    const productName = item.dataset.product;
    const price = parseFloat(item.dataset.price);

    increaseBtn.addEventListener('click', () => {
        let quantity = parseInt(quantitySpan.textContent);
        quantity++;
        quantitySpan.textContent = quantity;
        updateCart(productName, price, quantity);
    });

    decreaseBtn.addEventListener('click', () => {
        let quantity = parseInt(quantitySpan.textContent);
        if (quantity > 0) {
            quantity--;
            quantitySpan.textContent = quantity;
            updateCart(productName, price, quantity);
        }
    });
});

function updateCart(productName, price, quantity) {
    // Find if product already in cart
    const existingItem = cart.items.find(item => item.name === productName);
    
    if (existingItem) {
        if (quantity === 0) {
            // Remove item from cart
            cart.items = cart.items.filter(item => item.name !== productName);
        } else {
            existingItem.quantity = quantity;
        }
    } else if (quantity > 0) {
        cart.items.push({ name: productName, price, quantity });
    }

    updateCartDisplay();
}

function updateCartDisplay() {
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + (subtotal > 0 ? cart.deliveryFee : 0);

    document.getElementById('subtotal').textContent = `R${subtotal.toFixed(2)}`;
    document.getElementById('total').textContent = `R${total.toFixed(2)}`;

    // Enable/disable place order button
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    placeOrderBtn.disabled = subtotal === 0;
}

// ============================================
// Place Order & Start Tracking
// ============================================

const placeOrderBtn = document.getElementById('placeOrderBtn');
const orderStatus = document.getElementById('orderStatus');
const noOrderMessage = document.getElementById('noOrderMessage');
const driverInfo = document.getElementById('driverInfo');

placeOrderBtn.addEventListener('click', () => {
    const address = document.getElementById('deliveryAddress').value;
    const phone = document.getElementById('deliveryPhone').value;

    // Validation
    if (!address || !phone) {
        showNotification('Please fill in delivery address and phone number!', 'error');
        return;
    }

    if (cart.items.length === 0) {
        showNotification('Please add items to your order!', 'error');
        return;
    }

    // Generate order ID
    const orderId = Math.floor(10000 + Math.random() * 90000);
    document.getElementById('orderId').textContent = orderId;

    // Show success notification
    showNotification('Order placed successfully! Tracking your delivery now.', 'success');

    // Show order status, hide no order message
    noOrderMessage.style.display = 'none';
    orderStatus.style.display = 'block';

    // Start order progression simulation
    simulateOrderProgress();

    // Scroll to tracking
    document.getElementById('farmconnect').scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Clear cart after a delay
    setTimeout(() => {
        resetCart();
    }, 1000);
});

function resetCart() {
    // Reset all quantities
    document.querySelectorAll('.quantity').forEach(q => q.textContent = '0');
    cart.items = [];
    updateCartDisplay();
    
    // Clear delivery info
    document.getElementById('deliveryAddress').value = '';
    document.getElementById('deliveryPhone').value = '';
    document.getElementById('deliveryNotes').value = '';
}

// ============================================
// Order Progress Simulation
// ============================================

function simulateOrderProgress() {
    const steps = [
        { id: 'step1', badge: 'Placed', time: 0 },
        { id: 'step2', badge: 'Preparing', time: 3000 },
        { id: 'step3', badge: 'Out for Delivery', time: 8000, showDriver: true },
        { id: 'step4', badge: 'Delivered', time: 20000 }
    ];

    let currentStep = 0;

    // Reset all steps
    document.querySelectorAll('.timeline-item').forEach((item, index) => {
        if (index === 0) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    driverInfo.style.display = 'none';

    const progressInterval = setInterval(() => {
        currentStep++;
        
        if (currentStep >= steps.length) {
            clearInterval(progressInterval);
            showNotification('Order delivered successfully! Enjoy your fresh products! 🎉', 'success');
            return;
        }

        const step = steps[currentStep];
        
        // Update badge
        document.getElementById('statusBadge').textContent = step.badge;
        
        // Activate timeline item
        document.getElementById(step.id).classList.add('active');

        // Show driver info when out for delivery
        if (step.showDriver) {
            driverInfo.style.display = 'flex';
            // Start ETA countdown
            startETACountdown(15);
        }

    }, steps[currentStep + 1] ? steps[currentStep + 1].time : 0);
}

function startETACountdown(minutes) {
    let totalSeconds = minutes * 60;
    const etaElement = document.getElementById('eta');

    const countdown = setInterval(() => {
        totalSeconds -= 30; // Decrease faster for demo
        
        if (totalSeconds <= 0) {
            clearInterval(countdown);
            etaElement.textContent = 'Arriving now!';
            return;
        }

        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        etaElement.textContent = `${mins} mins`;
    }, 1000);
}

// ============================================
// Call Driver Button
// ============================================

document.querySelector('.btn-call-driver')?.addEventListener('click', () => {
    showNotification('Calling driver... (Demo mode)', 'success');
});

// ============================================
// Console Welcome Message
// ============================================

console.log('%c🐔 Welcome to Ods Makana Farm Services! 🐔', 'color: #2d6a4f; font-size: 20px; font-weight: bold;');
console.log('%cFresh, Organic, and Sustainably Raised', 'color: #52b788; font-size: 14px;');
console.log('%c🚚 Farm Connect is now available!', 'color: #f4a261; font-size: 14px;');

