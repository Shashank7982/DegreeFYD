# DegreeFYD: The Future of Academic Discovery

DegreeFYD is a premium, high-performance educational platform designed to bridge the gap between students and their ideal academic institutions. Built with a focus on visual excellence and technical precision, it offers a cinematic discovery experience for colleges, courses, and career outcomes.

---

## 🚀 Key Features

### 1. Elite Institution Discovery
- **Cinematic Landing Page**: Features high-fidelity parallax effects, floating decorative elements, and smooth scroll animations.
- **Elite Marquee**: Integrated horizontal scrolling marquee showcasing top-tier featured institutions with smart image fallback handling.
- **Real-time Navigation**: Instant search with neural-map suggestions powered by SWR.

### 2. Comprehensive Intelligence
- **College Analytics**: Detailed institutional profiles featuring performance spectrums (using Recharts) to visualize placement trends and average packages.
- **Protocol Tabs**: Structured data for Courses, Fee Structures, Strategic Placement Partners, and Eligibility Criteria.
- **Comparison Matrix**: A sophisticated tool allowing students to compare multiple colleges side-by-side with a persistent comparison bar.

### 3. Integrated Security & Roles
- **Dual-Mode Authentication**: Secure access for both Students and Administrative personnel.
- **Admin Dashboard**: A centralized command center for institutional management (Full CRUD operations).
- **Protected Protocols**: JWT-based security with bcrypt hashing for credential integrity.

### 4. Visual Excellence (UI/UX)
- **Glassmorphism Design**: Modern, translucent UI components with backdrop-blur effects.
- **Dynamic Theming**: Fully optimized Light and Dark modes with curated OKLCH color palettes.
- **Fluid Motion**: High-performance animations using Framer Motion (floating particles, parallax layers, and reveal-on-scroll).

---

## 🛠 Tech Stack

### Frontend (Next.js Core)
- **Framework**: [Next.js 16](https://nextjs.org/) (Turbopack)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Components**: [Radix UI](https://www.radix-ui.com/) / [Shadcn UI](https://ui.shadcn.com/)
- **Data Fetching**: [SWR](https://swr.vercel.app/)
- **Charts**: [Recharts](https://recharts.org/)

### Backend (Node.js API)
- **Engine**: [Node.js](https://nodejs.org/) / [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Security**: [JWT](https://jwt.io/), [Bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Middleware**: Custom CORS and Auth protocols.

---

## 📂 Project Structure

```text
├── Frontend/           # Next.js Application (Discovery & UI)
│   ├── app/            # App Router (Public, Auth, Admin routes)
│   ├── components/     # Reusable UI Architecture
│   ├── lib/            # API Integration & Utilities
│   └── public/         # Static Assets & Branding
│
├── backend/            # Express.js Server (API Core)
│   ├── routes/         # Endpoint Definitions
│   ├── controllers/    # Business Logic
│   ├── models/         # Database Schemas
│   └── middleware/     # Security Protocols
│
└── data.json           # Core Institutional Data Map
```

---

## ⚙️ Full System Setup

### 📋 Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **Database**: MongoDB instance (Atlas or Local)
- **Package Manager**: npm (comes with Node)

### 🧩 1. Backend Configuration
The backend handles authentication, data management, and the core API protocols.

1. **Navigate**: `cd backend`
2. **Install Assets**: `npm install`
3. **Environment**: Create a `.env` file in the `backend` root:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_neural_access_key_123
   ```
4. **Seed Database (Optional)**: If you need initial data:
   ```bash
   node seed.js
   ```
5. **Execution**: 
   - Development: `npm run dev` (with Nodemon)
   - Production: `npm start`

### 💻 2. Frontend Configuration
The frontend provides the high-fidelity discovery interface and admin dashboard.

1. **Navigate**: `cd Frontend`
2. **Install Assets**: `npm install`
3. **Internal Sync**: Create a `.env.local` file in the `Frontend` root:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```
4. **Execution**:
   - Development: `npm run dev`
   - Build for Production: `npm run build && npm start`

---

## 🏗 CI/CD Pipeline & Deployment

DegreeFYD is designed for modern cloud-native deployment with a structured pipeline:

### 🛠 Deployment Pipeline
1. **Validation Phase**:
   - **Linting**: `npm run lint` ensures code standards are met.
   - **Build Testing**: `next build` verifies the application can be optimized for production.
2. **Integation Phase**:
   - Continuous Integration (CI) triggers on every pull request to `main`.
   - Automated checks for dependency vulnerabilities.
### 🚀 Vercel Deployment (Step-by-Step)

To deploy this project to Vercel, you should set up **two separate Vercel projects** (one for the Backend and one for the Frontend) from the same repository.

#### 1. Deploy the Backend (API)
1. Go to your [Vercel Dashboard](https://vercel.com/new).
2. Import the `DegreeFYD` repository.
3. In the **Project Settings**:
   - **Project Name**: `degreefyd-backend`
   - **Root Directory**: Select `backend`.
   - **Framework Preset**: `Other`.
4. **Environment Variables**:
   - Add `MONGO_URI` (your MongoDB connection string).
   - Add `JWT_SECRET` (your JWT secret key).
5. **Click Deploy**. 
6. Copy the **Production URL** provided by Vercel.

#### 2. Deploy the Frontend (UI)
1. Go to [Vercel](https://vercel.com/new) again.
2. Import the same `DegreeFYD` repository.
3. In the **Project Settings**:
   - **Project Name**: `degreefyd-frontend`
   - **Root Directory**: Select `Frontend`.
   - **Framework Preset**: `Next.js`.
4. **Environment Variables**:
   - Add `NEXT_PUBLIC_API_URL` = `https://your-backend-url.vercel.app/api` (Use the URL from Step 1).
5. **Click Deploy**.

---

---

## 🎨 Branding & Identity
DegreeFYD uses a "Clean Scholarly" aesthetic:
- **Light Theme**: Clean Blue & White (Focus on clarity and focus).
- **Dark Theme**: Deep Blue & Black (Cinematic, high-tech academic feel).
- **Typography**: Inter / System UI with Heavy/Black weights for headers.

---

Designed and Developed with precision for the next generation of scholars.
