# OTP SaaS Web Application

A production-ready OTP generation and distribution system built with Node.js (Fastify) and Next.js.

## 🚀 Features

- **OTP Generation**: 4-6 digit codes with Redis caching and PostgreSQL persistence.
- **Manual & Automatic OTP**: REST API for manual requests and BullMQ-based cron jobs for automatic generation.
- **Panel Distribution**: Distributes OTPs to 4 external panels via API with retry logic.
- **Dashboard**: Real-time analytics, charts (Recharts), and logs tracking.
- **Security**: API Key-based authentication and rate limiting.
- **Scalability**: Handles 10,000+ OTPs per day using async queues and Redis.

## 🛠️ Tech Stack

- **Backend**: Node.js, Fastify, Prisma, PostgreSQL, Redis, BullMQ
- **Frontend**: Next.js (App Router), Tailwind CSS, Recharts, Lucide Icons
- **Language**: TypeScript

## 📂 Project Structure

- `/apps/api`: Fastify backend
- `/apps/web`: Next.js frontend
- `/packages/db`: Prisma schema and database client
- `/packages/queue`: BullMQ setup and shared queue logic

## ⚙️ Setup Instructions

### Prerequisites

- Node.js (v18+)
- PostgreSQL
- Redis

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup environment variables:
   Copy `.env.example` to `.env` in the root and configure your database and redis URLs.
4. Setup the database:
   ```bash
   npm run db:push
   npm run db:seed
   ```
5. Start the development servers:
   - Backend: `npm run dev:api`
   - Frontend: `npm run dev:web`

## 📊 API Documentation

### Generate OTP
- **Endpoint**: `POST /otp/generate`
- **Headers**: `x-api-key: your-api-key`
- **Body**:
  ```json
  {
    "area": "London",
    "panel_id": "optional-panel-uuid"
  }
  ```

### Get Stats
- **Endpoint**: `GET /otp/stats`
- **Headers**: `x-api-key: your-api-key`

## 🛡️ Security

- All endpoints are protected by `x-api-key` middleware.
- Rate limiting is applied to prevent abuse (default: 100 req/min).
- OTPs are stored with a 5-minute TTL in Redis.
