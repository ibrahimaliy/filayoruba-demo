# 👑 Fìlà Yorùbá — Handcrafted For Thoroughbred Gentlemen

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-7.9-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Neon Postgres](https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Paystack](https://img.shields.io/badge/Paystack-Payments-00C3F7?style=for-the-badge)](https://paystack.com/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**Fìlà Yorùbá** is an enterprise-grade digital luxury headwear house and omnichannel atelier. Crafted with modern web architecture and cultural aesthetics, it serves monarchs, dignitaries, grooms, and discerning gentlemen worldwide with authentic handcrafted Yoruba caps (*Gòbì*, *Abetíajá*, *Sénítò*, *Aṣọ-Òkè Sányán*, *Aláàárì*, *Ẹtù*, *Knitted*, and *Filástik*).

---

## 🌟 Live Demo & Showcase Highlights

This edition is specifically configured for portfolio evaluation, hiring managers, and prospective clients to test the full lifecycle of an order from customer purchase to omnichannel fulfillment:

### 🎯 Evaluator Quickstart & Cheatsheet

| Portal | URL | Demo Credentials / Test Info |
|---|---|---|
| **Customer Storefront** | [`/`](http://localhost:3000) | Browse authentic Yoruba caps, add to bag, test size guides |
| **Admin Operations Suite** | [`/admin/login`](http://localhost:3000/admin/login) | Click **"Fill Demo Credentials"** *(Super Admin privileges)* |
| **Paystack Sandbox Checkout** | [`/checkout`](http://localhost:3000/checkout) | Card: `4084 0840 8408 4081` • CVV: `408` • PIN: `3310` |
| **Self-Service Order Tracking** | [`/track-order`](http://localhost:3000/track-order) | Real-time status lookup, address updates & cancellation |

* **1-Click Admin Access**: The `/admin/login` page includes a pre-filled button that signs you in as Super Admin instantly without typing credentials.
* **Sandbox Checkout Helper**: Test order placement, email dispatching, inventory deduction, and acoustic bell notifications without real money.
* **Omnichannel Order Entry**: Record walk-in and social media sales directly into the fulfillment queue.

---

## 🏛️ Feature Tour

### 🛍️ Client Storefront
* **Heritage Collections**: Curated taxonomy (*Handwoven Aso-Oke*, *Royal & Ceremonial*, *Embroidered Velvet*, *Modern Contemporary*).
* **Precision Headwear Sizing**: Size guidelines from size 21" (XS) through 24.5" (XXXL) and traditional flexible fits.
* **Social Gifting & Sharing**: One-click sharing of individual caps, wishlists, or entire shopping bags to WhatsApp, X, and Facebook with rich OpenGraph cards.
* **Session Recovery**: Unfinished Paystack checkouts are saved in `localStorage` for instant one-click resumption.
* **Real-time Order Tracking (`/track-order`)**: Milestone tracker (*Pending* ➔ *Confirmed* ➔ *Crafting* ➔ *Shipped* ➔ *Delivered*).
* **Delivery Address Updates**: Customers can amend recipient details before an order enters the physical crafting stage.
* **Patron Review Ecosystem**: Verified buyer reviews, rating breakdowns, and community endorsements.

### 🛡️ Omnichannel Admin Suite (`/admin`)
* **Unified Metrics Dashboard**: Real-time Gross Revenue, AOV, Sales Channel breakdown, Order statuses, and Inventory health.
* **Omnichannel Order Entry**: Rapid-fire modal to record phone, walk-in, and social DM orders (WhatsApp, Instagram, X) with multiple payment methods (Bank Transfer, POS, Cash, Paystack).
* **Live Acoustic Bell Notification**: Sound alerts play across admin browser tabs when new orders arrive, with sound mute/unmute preferences persisted across sessions.
* **Advanced CSV Data Export**: 18-column detailed reporting (order numbers, patron contacts, delivery addresses, line items, SKU size, discount, and timeline) filtered by customizable date ranges.
* **Patron Management**: CRM list of patrons, lifetime spend, purchase history, and private administrative notes.
* **Role-Based Access Control**: Role hierarchy (*SUPER_ADMIN*, *ADMIN*, *MANAGER*) with constant-time cryptographic edge verification.

---

## 💻 Tech Stack & Architecture

| Layer | Technology | Description |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | High-performance React framework running with Turbopack |
| **Language** | TypeScript 5 | Strict typing throughout frontend, backend, and database layers |
| **UI & Styling** | React 19, Tailwind CSS v4, Lucide Icons | Premium artisanal theme with gold accents, Framer Motion animations |
| **State Management** | Zustand | Persistent local cart, wishlist, and active checkout states |
| **Database** | PostgreSQL on [Neon Serverless](https://neon.tech) | Scalable cloud PostgreSQL with pooling and instant branching |
| **ORM** | Prisma ORM 7 | Type-safe schema with `@prisma/adapter-pg` connection pooler |
| **Payments** | [Paystack](https://paystack.com) | Sandbox integration with HMAC-SHA512 webhook signature validation |
| **Transactional Email** | [Resend](https://resend.com) API | HTML order receipts and shipment updates (logs to terminal if omitted) |
| **Toasts & Feedback** | Sonner | Smooth, non-blocking toast notifications |

---

## 📁 Repository Structure

```text
filayoruba-demo/
├── prisma/
│   ├── schema.prisma           # Prisma PostgreSQL data models & omnichannel enums
│   └── seed.ts                 # Database seed script for collections & caps
├── public/
│   ├── images/                 # Hero banners, cap photography, and guides
│   └── uploads/                # Authentic product photography assets
├── scripts/
│   ├── seed-11-caps.mjs        # Production seed script for authentic cap catalogue
│   ├── reorganize-collections.mjs # Collection taxonomy organizer
│   ├── test-all-user-journeys.ts  # End-to-end user journey test suite
│   └── test-remaining-flows.ts    # Order cancellation & inventory test suite
├── src/
│   ├── app/                    # Next.js App Router (pages, layouts, and API routes)
│   │   ├── (storefront)/       # Customer pages (products, collections, cart, checkout)
│   │   ├── account/            # Customer OTP dashboard & profile
│   │   ├── admin/              # Omnichannel admin management portal
│   │   ├── track-order/        # Live order tracking, address updates & cancellation
│   │   └── api/                # REST & Webhook endpoints (Paystack, products, orders)
│   ├── components/             # Reusable UI components & design system
│   │   ├── admin/              # Admin modals, order drawers, realtime sound bells
│   │   ├── checkout/           # Paystack flow, step controllers, order summaries
│   │   ├── home/               # Hero carousels, heritage showcase, artisan banners
│   │   ├── layout/             # Navbar, footer, bag drawer, mobile navigation
│   │   └── share/              # WhatsApp, X, Facebook branded share dialogs
│   ├── hooks/                  # Custom React hooks (useAdminRealtime, useCart, etc.)
│   ├── lib/                    # Utilities, formatters, currency, and event bus
│   ├── server/                 # Server services, DB client, Paystack & auth helpers
│   └── store/                  # Zustand persistent client stores
├── .env.example                # Documented environment configuration template
├── DEMO_SETUP_GUIDE.md         # Step-by-step showcase setup instructions
├── next.config.ts              # Security headers, image optimization, proxy rules
└── package.json                # Project dependencies & scripts
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the project root (or copy `.env.example`):

```env
# -------------------------------------------------------------
# Database Connection (Neon Serverless PostgreSQL)
# -------------------------------------------------------------
DATABASE_URL="postgresql://<user>:<password>@<neon-pooler-host>/neondb?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://<user>:<password>@<neon-direct-host>/neondb?sslmode=require"

# -------------------------------------------------------------
# Paystack Payment Gateway (TEST MODE)
# -------------------------------------------------------------
PAYSTACK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_..."

# -------------------------------------------------------------
# Base Application URL
# -------------------------------------------------------------
APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# -------------------------------------------------------------
# Admin Portal Authentication
# -------------------------------------------------------------
ADMIN_PASSWORD=filayoruba_admin_secret_key_2026
ADMIN_SECRET_KEY=filayoruba_admin_secret_key_2026

# -------------------------------------------------------------
# Transactional Email (Optional - logs to terminal if omitted)
# -------------------------------------------------------------
RESEND_API_KEY=re_...
EMAIL_FROM="Fìlà Yorùbá <onboarding@resend.dev>"
ADMIN_NOTIFICATION_EMAIL="demo@filayoruba.com"
```

---

## 🚀 Quick Start (Local Setup)

### 1. Install Dependencies
```bash
npm install
```

### 2. Push Database Schema
```bash
npx prisma db push
```

### 3. Seed Product Catalogue & Collections
```bash
node scripts/seed-11-caps.mjs
node scripts/reorganize-collections.mjs
```

### 4. Start Development Server
```bash
npm run dev
```

* **Storefront**: [http://localhost:3000](http://localhost:3000)
* **Order Tracking**: [http://localhost:3000/track-order](http://localhost:3000/track-order)
* **Admin Suite**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login) *(Click "Fill Demo Credentials" to sign in)*

---

## 🧪 Automated Testing & Verification

```bash
# Run full user journey validation (Storefront -> Cart -> Paystack -> Fulfillment)
npx tsx scripts/test-all-user-journeys.ts

# Test order cancellation, address change, and stock rollback
npx tsx scripts/test-remaining-flows.ts

# Build production bundle to verify all static routes
npm run build
```

---

## 🚢 Deploying to Vercel

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: public showcase edition of Fila Yoruba"
   git branch -M main
   git remote add origin https://github.com/ibrahimaliy/filayoruba-demo.git
   git push -u origin main
   ```

2. Import the repository into [Vercel](https://vercel.com):
   - Add all environment variables from `.env` (`DATABASE_URL`, `DIRECT_URL`, `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `ADMIN_PASSWORD`, etc.).
   - Set `APP_URL` and `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL (e.g. `https://filayoruba-demo.vercel.app`).

3. Click **Deploy**.

---

## 👨‍💻 Author

**Ibrahim Aliy**  
*Full-Stack Software Engineer*  
* Portfolio: [ibrahim-aliy.vercel.app](https://ibrahim-aliy.vercel.app)  
* GitHub: [@ibrahimaliy](https://github.com/ibrahimaliy)

---

## 📜 License

Private and proprietary demo edition. Designed and developed exclusively for showcase and evaluation purposes.
