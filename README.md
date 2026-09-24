# 💰 Budget Tracker

A modern, full-stack personal finance and budget management application. Built to help users track their expenses, set category-based monthly budgets, and visualize their spending habits through interactive charts and downloadable reports.

## ✨ Features

- **Secure Authentication:** JWT-based login and registration with HTTP-only cookies and automatic token refresh.
- **Interactive Dashboard:** Beautiful KPIs, pie charts for category spending, and daily/monthly trend line charts (powered by Recharts).
- **Expense Management:** Full CRUD operations for expenses with advanced data filtering (by date range, category, and min/max amount).
- **Budget Control:** Set custom monthly budget limits for different categories and track your percentage utilization in real-time.
- **Advanced Reporting:** Instantly generate Monthly or Yearly spending summaries and export your raw transaction data to CSV/Excel.
- **Premium UI/UX:** A responsive, glassmorphism-inspired design with modern gradients, interactive micro-animations, and clean typography.

## 🛠️ Tech Stack

**Frontend:**
- React 18 (Vite)
- TypeScript
- Axios (with interceptors for auth)
- Recharts (Data Visualization)
- Lucide React (Icons)
- Vanilla CSS (Custom Design System)

**Backend:**
- Node.js & Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT (JSON Web Tokens) & bcryptjs

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Create a new user account.
- `POST /api/auth/login` - Authenticate and receive an HTTP-only JWT.
- `POST /api/auth/logout` - Clear authentication cookies.
- `POST /api/auth/refresh` - Refresh access token.
- `GET /api/auth/me` - Get current authenticated user details.

### Expenses
- `GET /api/expenses` - Fetch all expenses. Supports query filters: `category`, `from`, `to`, `minAmount`, `maxAmount`.
- `POST /api/expenses` - Add a new expense (`category`, `amount`, `description`, `expense_date`).
- `GET /api/expenses/:id` - Fetch a single expense by ID.
- `PUT /api/expenses/:id` - Update an existing expense.
- `DELETE /api/expenses/:id` - Delete an expense.

### Budgets
- `GET /api/budgets` - Fetch budgets. Supports query filters: `month`, `year`.
- `POST /api/budgets` - Set a new budget limit (`category`, `amount`, `month`, `year`).
- `PUT /api/budgets/:id` - Update a budget limit.
- `DELETE /api/budgets/:id` - Delete a budget limit.

### Dashboard & Reports
- `GET /api/dashboard/summary` - Fetch KPI aggregates, category spending, and daily/monthly trends. Accepts `month` and `year` query parameters.
- `GET /api/reports/monthly` - Get deep analytics for a specific month. Pass `?format=csv` to download raw data.
- `GET /api/reports/yearly` - Get deep analytics for a specific year. Pass `?format=csv` to download raw data.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [PostgreSQL](https://www.postgresql.org/) installed on your machine.

### 1. Clone the repository
```bash
git clone https://github.com/mamonchw/budget-tracker.git
cd budget-tracker
```

### 2. Backend Setup
Navigate to the backend directory:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory and add the following variables:
```env
# Database connection string
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/budget_tracker"

# JWT Secrets
JWT_ACCESS_SECRET="your_super_secret_jwt_key"
JWT_REFRESH_SECRET="your_super_secret_refresh_key"

# Frontend URL for CORS
CLIENT_URL="http://localhost:5173"
```

Run database migrations and start the server:
```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```
*The backend will run on `http://localhost:5001`.*

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL="http://localhost:5001/api"
```

Start the Vite development server:
```bash
npm run dev
```
*The frontend will run on `http://localhost:5173`.*

---

## ☁️ Deployment

This application is ready to be deployed on platforms like **Render**, **Vercel**, or **Heroku**.

**Backend (Render Web Service):**
- **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
- **Start Command:** `npm run start`

**Frontend (Render Static Site):**
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- *Note:* Add a rewrite rule for `/*` to `/index.html` to support React Router.

## 📄 License
This project is licensed under the MIT License.
