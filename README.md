# EECO CARE POS UI Demo

This zip contains a **frontend demo system** built in **Next.js + TypeScript + Tailwind CSS** with a UI style inspired by your reference image.

## What is included

- Dark and light mode
- Left sidebar navigation
- Top bar with search, notifications, profile card
- Dashboard with cards and charts
- All requested page routes as UI screens
- Working demo interactions on:
  - sidebar navigation
  - theme switching
  - POS cart add item action
- Reusable tables, cards, forms, reports, and admin pages

## Important note

This package is a **working frontend demo / prototype**, not the full backend SaaS platform yet.

It does **not** include:
- real authentication
- database
- NestJS backend
- Prisma schema
- tenant security
- real CRUD persistence

Those should be built next as separate backend work.

## Run locally

```bash
npm install
npm run dev
```

Then open:

```bash
http://localhost:3000
```

## Main routes

- `/dashboard`
- `/contacts/suppliers`
- `/contacts/customers`
- `/products/product-list`
- `/sell/pos-sales-screen`
- `/reports/sales-report`
- `/admin/user-management`

## Suggested next step

After reviewing the UI, build:
1. authentication
2. backend API
3. database schema
4. real module CRUD
5. multi-tenant business isolation
