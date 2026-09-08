# 👑 Fìlà Yorùbá — Showcase / Demo Edition Setup Guide

Welcome to the public showcase edition of **Fìlà Yorùbá**. This version is specifically optimized for portfolio reviewers, hiring managers, and prospective clients to interact with both the luxury customer storefront and the live omnichannel back-office operations console without exposing commercial production data.

---

## 🌟 Included Demo Enhancements

1. **1-Click Admin Access**: The `/admin/login` page includes a pre-filled **"Fill Demo Credentials"** button for instant evaluation.
2. **Paystack Sandbox Helper**: The checkout flow displays test payment credentials (`4084 0840 8408 4081`) so visitors can test order placement, receipt generation, and real-time order tracking (`/track-order`) without spending actual money.
3. **Showcase Nav Link**: Direct navigation links to `/admin/login` so reviewers can seamlessly switch between the customer bag and workshop order fulfillment.

---

## 🚀 Quick Setup (Under 3 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Connect a Free Neon PostgreSQL Database
1. Go to [Neon.tech](https://neon.tech) and create a free account (no credit card required).
2. Click **Create Project** and name it `filayoruba-demo`.
3. In your Neon dashboard, copy the connection details:
   - Check **"Pooled connection"** and paste the string into `DATABASE_URL` in `.env`.
   - Copy the direct connection string and paste into `DIRECT_URL` in `.env`.

### 3. Push Database Schema & Seed Catalogue
```bash
# Push Prisma schema to your demo Neon database
npx prisma db push

# Seed authentic handcrafted Yoruba caps catalogue
node scripts/seed-11-caps.mjs
```

### 4. Run Locally
```bash
npm run dev
```

* **Storefront**: [http://localhost:3000](http://localhost:3000)
* **Self-Service Tracking**: [http://localhost:3000/track-order](http://localhost:3000/track-order)
* **Admin Operations Suite**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)  
  *(Click "Fill Demo Credentials" to sign in as Super Admin instantly)*

---

## 🚢 Deploying to Vercel (Public Showcase)

### 1. Push to GitHub
```bash
git add .
git commit -m "feat: public showcase edition of Fila Yoruba"
git branch -M main
git remote add origin https://github.com/ibrahimaliy/filayoruba-demo.git
git push -u origin main
```

### 2. Import into Vercel
1. In the Vercel dashboard, click **"Add New" ➔ "Project"** and select `filayoruba-demo`.
2. Under **Environment Variables**, copy values from your secure `.env`:
   - `DATABASE_URL` (Neon PostgreSQL connection string)
   - `DIRECT_URL` (Direct Neon PostgreSQL connection string)
   - `PAYSTACK_SECRET_KEY` (`sk_test_...` from Paystack Dashboard)
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (`pk_test_...` from Paystack Dashboard)
   - `APP_URL` (`https://<your-vercel-domain>.vercel.app`)
   - `NEXT_PUBLIC_APP_URL` (`https://<your-vercel-domain>.vercel.app`)
   - `ADMIN_PASSWORD` (Strong random password for superadmin recovery)
   - `ADMIN_SECRET_KEY` (Strong 64-char random hex key for signing session tokens)
   - `DEMO_ADMIN_PASSWORD` (`fila_demo_reviewer_2026` throwaway password for portfolio evaluators)
   - `ENABLE_DEMO_LOGIN` (`true` to enable the 1-click reviewer sandbox)
3. Click **Deploy**.

> 💡 **Reviewer Sandbox Note:** Reviewers evaluating your portfolio can use the built-in **"Instant 1-Click Demo Login"** on the admin login page (`/admin/login`). Your actual `ADMIN_PASSWORD` and `ADMIN_SECRET_KEY` remain 100% private.

---

## 🔗 Linking to Your Portfolio (`ibrahim-aliy.vercel.app`)

Once deployed, update the project buttons on your portfolio page:
- **"Visit Live Storefront"** ➔ `https://filayoruba-demo.vercel.app`
- **"Open Admin Console (Demo Access)"** ➔ `https://filayoruba-demo.vercel.app/admin/login`
- **"GitHub Repository"** ➔ `https://github.com/ibrahimaliy/filayoruba-demo`

This gives hiring managers and clients instant proof of your full-stack engineering skills!