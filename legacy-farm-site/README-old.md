# 🐔 Ods Makana Farm Services Website

A modern, responsive website for a poultry farming business, showcasing products, services, and farm information with an integrated Uber-like ordering and delivery tracking system.

## 🌐 Live Website

**Production URL:** [https://ods-makana-farm.surge.sh](https://ods-makana-farm.surge.sh)

**GitHub Repository:** [https://github.com/qqmakana/ods-makana](https://github.com/qqmakana/ods-makana)

## 📋 Overview

This website is designed for Ods Makana Farm Services, a premium poultry farming business specializing in:
- Farm fresh eggs
- Premium chicken meat
- Live chickens for breeding
- Organic fertilizer
- Farming consultation and education

## ✨ Features

### 🎨 Modern Design
- Clean, professional aesthetic
- Green color scheme reflecting nature and sustainability
- Smooth animations and transitions
- Fully responsive design for all devices

### 📱 Sections

1. **Hero Section** - Eye-catching landing with call-to-action buttons
2. **About Section** - Farm story with statistics (experience, birds, customers)
3. **Products Section** - Detailed product cards with features
4. **Services Section** - Comprehensive service offerings
5. **Farm Connect** - Uber-like ordering and delivery tracking system 🚚
6. **Gallery Section** - Visual showcase of the farm (placeholder images)
7. **Contact Section** - Contact form with business information
8. **Footer** - Quick links, newsletter signup, and social media

### 🚀 Interactive Features

- Sticky navigation with active section highlighting
- Mobile-responsive hamburger menu
- Scroll animations for cards and elements
- Animated statistics counters
- Working contact form with validation
- Newsletter subscription
- Notification system for user feedback
- Smooth scrolling between sections
- Gallery item interaction
- **Farm Connect Ordering System**:
  - Add products to cart with quantity selectors
  - Real-time cart calculations
  - Delivery information form
  - Live order tracking simulation
  - 4-stage delivery progress (Placed → Preparing → Out for Delivery → Delivered)
  - Driver information display
  - Animated delivery map with ETA countdown
  - Order notifications

## 🛠️ Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid, Flexbox, and animations
- **JavaScript (ES6+)** - Interactive functionality
- **Font Awesome 6** - Icons
- **Intersection Observer API** - Scroll animations

## 📂 File Structure

```
My Website/
│
├── index.html          # Main HTML file (569 lines)
├── styles.css          # All CSS styling (1333 lines)
├── script.js           # JavaScript functionality (568 lines)
└── README.md           # Project documentation
```

## 📞 Contact Information

- **Contact Person:** Ondela
- **Phone:** 060 502 9496
- **Email:** oddzmakana@gmail.com
- **Location:** Eastern Cape, South Africa

## 🚀 Getting Started

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/qqmakana/ods-makana.git
   cd ods-makana
   ```

2. Open `index.html` in a web browser
3. No build process or dependencies required!

### Local Development

Simply open `index.html` in your preferred browser. The website is built with vanilla HTML, CSS, and JavaScript - no build tools needed.

For a local server (optional):
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js http-server
npx http-server
```

Then visit `http://localhost:8000` in your browser.

## 🎯 Customization Guide

### Changing Business Information

1. **Company Name**: Search for "Ods Makana Farm Services" in `index.html` and replace with your farm name
2. **Contact Details**: Update the contact section in `index.html`:
   - Address
   - Phone number
   - Email
   - Business hours
3. **Social Media**: Update the social media links in the footer

### Changing Colors

All colors are defined as CSS variables in `styles.css`:

```css
:root {
    --primary-color: #2d6a4f;      /* Main green */
    --secondary-color: #52b788;     /* Light green */
    --accent-color: #f4a261;        /* Orange accent */
    --dark-color: #1b4332;          /* Dark green */
    --light-color: #d8f3dc;         /* Very light green */
}
```

### Adding Real Images

Replace the placeholder elements with actual images:

1. **Hero Background**: Update the `background` property in `.hero` class
2. **About Image**: Replace `.about-image-placeholder` with an `<img>` tag
3. **Gallery**: Replace `.gallery-placeholder` divs with actual images

Example:
```html
<!-- Replace placeholder -->
<div class="gallery-placeholder">...</div>

<!-- With actual image -->
<img src="images/farm-photo.jpg" alt="Farm description">
```

### Modifying Products/Services

Edit the product and service cards in `index.html`. Each card follows the same structure:

```html
<div class="product-card">
    <div class="product-icon">
        <i class="fas fa-icon-name"></i>
    </div>
    <h3>Product Name</h3>
    <p>Description</p>
    <ul class="product-features">
        <li><i class="fas fa-check"></i> Feature 1</li>
    </ul>
</div>
```

## 📧 Contact Form Integration

The contact form currently shows a success notification. To make it functional:

1. **Option 1 - FormSpree**: Sign up at [formspree.io](https://formspree.io/)
   ```html
   <form action="https://formspree.io/f/your-form-id" method="POST">
   ```

2. **Option 2 - EmailJS**: Use [EmailJS](https://www.emailjs.com/) for client-side email sending

3. **Option 3 - Backend API**: Connect to your own backend server

4. **Option 4 - Google Forms**: Embed or redirect to a Google Form

## 🌐 Deployment

This website is currently deployed on **Surge.sh** - a free static hosting service.

### Current Deployment
- **URL:** https://ods-makana-farm.surge.sh
- **Platform:** Surge.sh
- **CDN:** Global distribution
- **SSL:** Enabled (HTTPS)
- **Last Updated:** October 19, 2025

### Deploy Updates
To deploy changes to the live site:

```bash
cd "/Users/qaqambilemakana/Desktop/My Website"
npx surge . ods-makana-farm.surge.sh
```

### Alternative Deployment Options

#### GitHub Pages
1. Push code to GitHub repository
2. Go to Settings > Pages
3. Select branch and folder
4. Your site will be live at `https://yourusername.github.io/repository-name`

#### Netlify
1. Drag and drop the folder to [Netlify](https://netlify.com)
2. Or connect your GitHub repository
3. Instant deployment with custom domain support

#### Vercel
```bash
npx vercel --prod
```

### Other Hosting
Upload all files to any web hosting service via FTP or their dashboard.

## 🎨 Design Credits

- Icons: [Font Awesome](https://fontawesome.com/)
- Color Palette: Custom green-themed palette for agriculture/farming
- Fonts: System fonts (Segoe UI, etc.) for fast loading

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔄 Future Enhancements

Potential features to add:
- [ ] Blog section for farming tips and updates
- [x] Online ordering system with shopping cart ✅ (Farm Connect)
- [x] Live delivery tracking ✅ (Farm Connect)
- [ ] Customer testimonials slider
- [ ] Live chat support
- [ ] Multilingual support
- [ ] Admin dashboard for content management
- [ ] Integration with PayPal (connected via Rural Utility / your apps)
- [ ] Real-time inventory display
- [ ] Google Maps integration for real driver tracking
- [ ] Push notifications for order updates
- [ ] Order history and user accounts

## 📄 License

This project is free to use and modify for your personal or commercial projects.

## 🤝 Contributing

Feel free to fork this project and customize it for your own poultry farm or agricultural business!

## 📞 Support

For questions or issues with the website, please contact the developer or open an issue in the repository.

---

**Made with 💚 for sustainable farming**

