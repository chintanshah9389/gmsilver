# GM Silver Backend

## Run Local

1. Copy .env.example to .env
2. Install dependencies

npm install

3. Run migrations

npx prisma migrate dev

4. Seed data

npm run prisma:seed

5. Start server

npm run start:dev

## API Docs

https://gmsilver-production.up.railway.app/api/docs

## Core Modules

- auth
- users
- categories
- products
- wishlist
- cart
- orders
- invoices
- notifications
- storage (Cloudflare R2)
- audit-logs
- analytics
- excel
