# GM Silver — Solution Architecture

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────────┐          ┌──────────────────────────────┐  │
│  │  React Native    │          │     Next.js Admin Panel      │  │
│  │  Mobile App      │          │     (Material UI)            │  │
│  │  iOS & Android   │          │     Vercel                   │  │
│  └────────┬─────────┘          └──────────────┬───────────────┘  │
└───────────┼────────────────────────────────────┼─────────────────┘
            │ HTTPS / REST                        │ HTTPS / REST
            ▼                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              NestJS REST API (Vercel)                    │    │
│  │   • JWT Authentication  • RBAC Guards                   │    │
│  │   • Rate Limiting        • Swagger Docs                 │    │
│  │   • DTOs / Validation    • Audit Interceptor            │    │
│  └───────┬────────────────────────────────────────┬────────┘    │
└──────────┼────────────────────────────────────────┼─────────────┘
           │ Prisma ORM                              │ Firebase SDK
           ▼                                         ▼
┌──────────────────────┐              ┌──────────────────────────┐
│   PostgreSQL DB      │              │   Firebase Cloud          │
│   (PlanetScale /     │              │   Messaging              │
│    Supabase /        │              │                          │
│    Railway)          │              └──────────────────────────┘
└──────────────────────┘
           │ S3 Compatible
           ▼
┌──────────────────────┐
│   Cloudflare R2      │
│   (Image & PDF       │
│    Storage)          │
└──────────────────────┘
```

---

## 2. Clean Architecture — Module Structure

```
src/
├── common/                    # Shared utilities
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── utils/
├── config/                    # App configuration
├── prisma/                    # Prisma client
└── modules/                   # Feature modules
    ├── auth/                  # Authentication
    ├── users/                 # User management
    ├── categories/            # Product categories
    ├── products/              # Product catalog
    ├── wishlist/              # User wishlist
    ├── cart/                  # Shopping cart
    ├── orders/                # Order management
    ├── invoices/              # Invoice generation
    ├── notifications/         # Push notifications
    ├── storage/               # Cloudflare R2
    ├── audit-logs/            # Audit logging
    ├── analytics/             # Analytics
    └── excel/                 # Import/Export
```

Each module follows:
```
module/
├── module.ts        # NestJS module
├── controller.ts    # REST endpoints
├── service.ts       # Business logic
├── dto/             # Request/Response DTOs
└── interfaces/      # TypeScript interfaces
```

---

## 3. Authentication Flow

```
Signup (email + password + 6-digit MPIN) → Pending Status
        ↓
Admin Approves User → Status: APPROVED → User notified via FCM
        ↓
MPIN Login (email + MPIN) → JWT Access Token (15min) + Refresh Token (7d)
        ↓
Forgot MPIN → Verify password → Set new MPIN → MPIN Login
        ↓
Token Refresh → Rotate refresh token (revoke old, issue new)
        ↓
Logout → Revoke refresh token
```

---

## 4. Order Flow

```
Customer: Add to Cart
        ↓
Customer: Checkout → Create Order (status: PENDING)
        ↓
FCM Notification → Owner/Admin notified
        ↓
Owner/Admin: Approve or Reject
        ↓
FCM Notification → Customer notified
        ↓
If Approved: Generate Invoice PDF → Upload to R2 → Save URL
        ↓
Order Status: COMPLETED
```

---

## 5. File Storage (Cloudflare R2)

```
Upload Flow:
Client → API → StorageService → R2 Bucket → Return public URL
                                              ↓
                                        DB saves image_url + storage_key

Delete Flow:
Admin deletes product → StorageService.deleteFile(storage_key) → R2
```

---

## 6. Security Architecture

| Mechanism             | Implementation                              |
|-----------------------|---------------------------------------------|
| Password Hashing      | bcrypt (rounds: 12)                         |
| MPIN Hashing          | bcrypt (rounds: 10)                         |
| Access Token          | JWT HS256, 15min expiry                     |
| Refresh Token         | UUID, 7d expiry, rotation + revocation      |
| RBAC                  | NestJS Guards + @Roles() decorator          |
| Rate Limiting         | @nestjs/throttler (60 req/min)              |
| Input Validation      | class-validator + class-transformer         |
| File Validation       | Mime type + size checks                     |
| CORS                  | Configured per environment                  |
| Helmet                | HTTP security headers                       |
| SQL Injection         | Prisma parameterized queries                |

---

## 7. Database Indexes Strategy

| Table          | Indexed Columns                              |
|----------------|----------------------------------------------|
| users          | email, status, role                          |
| products       | categoryId, isAvailable+isActive, sku       |
| orders         | userId, status, orderNumber                  |
| audit_logs     | userId, action, module, createdAt            |
| refresh_tokens | userId, token                                |
| wishlist       | userId + productId (unique composite)        |
| cart_items     | cartId + productId (unique composite)        |

---

## 8. API Versioning

All APIs are prefixed with `/api/v1`.

Base URL: `https://api.gmsilver.com/api/v1`

---

## 9. Deployment Architecture (Vercel)

```
GitHub Push → Vercel CI/CD
                ↓
        Backend (NestJS)     → Vercel Serverless Functions
        Admin Panel (Next.js) → Vercel Edge Network
                ↓
        Environment Variables → Vercel Project Settings
        Database Migration    → Run via CLI before deploy
```
