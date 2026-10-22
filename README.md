# Exclusive Store

Full-stack e-commerce platform with customer storefront, admin dashboard, and in-store POS billing system.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-7-green?logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)

## 🛠️ Tech Stack

- **Frontend:** Next.js 16 (App Router), React, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT with httpOnly cookies
- **Payments:** Razorpay
- **Images:** Cloudinary
- **Icons:** React Icons

## ✨ Features

### Customer Storefront
- User signup, login, and email verification
- Forgot password / reset password with email
- Product browse, search, and category filter
- Product details with images and customer reviews
- Cart and wishlist
- Checkout with COD and Razorpay payment
- Order tracking with timeline
- Address management
- Account dashboard

### Admin Panel
- Dashboard with revenue, orders, customers, and products stats
- Product management (add / edit / delete)
- Category management
- Order management with shipping updates and tracking timeline
- Customer list
- Coupon management
- Review moderation
- Contact messages inbox
- In-app notification system
- Store settings

### POS System (Point of Sale)
- In-store billing for walk-in customers
- **Retail billing** at MRP
- **Wholesale billing** with per-product discount entered at billing time
- Live cart with quantity and discount controls
- Cash / Card / UPI payment options
- Bill preview, print, and PDF download
- POS orders tagged separately in the admin orders list
- Automatic stock decrement on every sale

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### Installation

\`\`\`bash
git clone https://github.com/singhal2222/exclusive-store.git
cd exclusive-store
npm install
\`\`\`

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

\`\`\`env
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
SECRET_KEY=your_jwt_secret_key

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email (for verification and password reset)
EMAIL_USER=your_email
EMAIL_PASSWORD=your_app_password
\`\`\`

### Run Locally

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Seed an Admin User

\`\`\`bash
node scripts/seedAdmin.mjs
\`\`\`

## 🔒 Admin Isolation

For data integrity and security, admin accounts are restricted to the admin panel only:

- Admins cannot place online orders — they must use the POS system for in-store sales
- All customer-facing routes are blocked for logged-in admins
- API-level guards prevent unauthorized order creation by admins

## 📸 Screenshots

*Coming soon — screenshots of the storefront, admin dashboard, and POS terminal will be added.*

## 📝 License

This project is built for educational and portfolio purposes.

## 👤 Author

**Yash Singhal**
- GitHub: [@singhal2222](https://github.com/singhal2222)
