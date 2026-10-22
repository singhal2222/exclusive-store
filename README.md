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

```bash
git clone https://github.com/singhal2222/exclusive-store.git
cd exclusive-store
npm install
