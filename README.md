# QIUIKS HERBALS Website

A Next.js storefront starter connected to the existing Supabase project.

## Features
- Tamil / English language toggle
- Products and categories loaded from Supabase
- Search and category filtering
- Cart and WhatsApp order handoff
- Admin sign-in, add product, upload product photo, hide/show and delete products

## Local setup
1. Install Node.js (LTS) on your computer.
2. Copy `.env.example` to `.env.local`.
3. Add the Supabase Project URL and Publishable Key to `.env.local`.
4. Run `npm install`, then `npm run dev`.
5. Open http://localhost:3000

Never put a Supabase Secret key or database password in this project.

## Supabase assumptions
This starter expects:
- `categories`: `id`, `name`, optional `slug`
- `products`: `id`, `name`, `slug`, `description`, `price`, `size`, `image_url`, `category_id`, `is_active`, `stock_quantity`, `created_at`
- `admin_users`: `user_id` matching the Supabase Auth user's UUID
- Storage bucket: `qiuiks-products` (public read; admin-only upload policy)

If your `admin_users` table uses a different UUID column name, update the `.eq("user_id", currentUser.id)` line in `app/admin/page.tsx`.

## Before launch
- Confirm the public product SELECT policy permits reading active products.
- Confirm admin-only INSERT/UPDATE/DELETE policies on products and storage.
- Add real product photos, descriptions, pack sizes and prices in the Admin Panel.
- Test a WhatsApp order on your own phone before sharing the site.
- Add shipping charges / UPI payment workflow only after confirming the exact business rules.
