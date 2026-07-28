# GM Silver — B2B Silver Products Catalog & Ordering Platform

## Overview

GM Silver is a production-ready B2B Silver Products Catalog and Ordering Platform consisting of:

- **Mobile App** — React Native (iOS & Android)
- **Admin Panel** — Next.js
- **Backend API** — NestJS + Prisma + PostgreSQL
- **Storage** — Cloudflare R2
- **Notifications** — Firebase Cloud Messaging
- **Deployment** — Vercel

---

## Project Structure

```
gm-silver/
├── backend/           # NestJS REST API
├── admin-panel/       # Next.js Admin Dashboard
├── mobile/            # React Native Mobile App
├── docs/              # Architecture & Documentation
└── docker-compose.yml # Local Development
```

---

## Quick Start

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- pnpm / npm
- React Native CLI
- Cloudflare R2 Account
- Firebase Project

### 1. Clone & Install

```bash
# Backend
cd backend && npm install

# Admin Panel
cd admin-panel && npm install

# Mobile
cd mobile && npm install
```

### 2. Environment Variables

Use one root env file as the source of truth for local setup:

1. Copy `.env.shared.example` to `.env.shared`
2. Edit `.env.shared`
3. Run `start-local.bat` or `start.run.bat`

The startup script auto-generates:

- `backend/.env`
- `admin-panel/.env`
- `mobile/.env`

from `.env.shared`.

### 3. Database Setup

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### 4. Run Development Servers

```bash
# Backend (port 3001)
cd backend && npm run start:dev

# Admin Panel (port 3000)
cd admin-panel && npm run dev

# Mobile
cd mobile && npx react-native run-ios
# or
cd mobile && npx react-native run-android
```

---

## Tech Stack

| Layer         | Technology                          |
|---------------|-------------------------------------|
| Mobile        | React Native CLI, TypeScript        |
| State         | Redux Toolkit, RTK Query            |
| Navigation    | React Navigation 6                  |
| UI (Mobile)   | React Native Paper                  |
| Backend       | NestJS, TypeScript                  |
| ORM           | Prisma                              |
| Database      | PostgreSQL                          |
| Auth          | JWT + Refresh Tokens + MPIN         |
| Storage       | Cloudflare R2                       |
| PDF           | PDFKit                              |
| Notifications | Firebase Cloud Messaging            |
| Admin UI      | Next.js + Material UI               |
| Deployment    | Vercel                              |

---

## User Roles

| Role     | Permissions                                    |
|----------|------------------------------------------------|
| Admin    | Full system access                             |
| Owner    | Order approval, product management             |
| Customer | Browse, wishlist, cart, order                  |

---

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [ER Diagram](./docs/ER_DIAGRAM.md)
- [API Documentation](http://localhost:3001/api/docs)
- [Deployment Guide](./docs/DEPLOYMENT.md)
