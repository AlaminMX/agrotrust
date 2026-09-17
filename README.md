# AgroTrust

AgroTrust is a discovery and trust platform that connects verified farmers directly with buyers across Nigeria. Farmers list their produce with location, price, and availability; buyers browse, vet a farmer's profile, and reach out directly by phone, WhatsApp, or email to arrange the sale. AgroTrust doesn't process payments or handle delivery — it's the trusted directory that gets a buyer and a farmer talking.

## Features

**For buyers**
- Browse fresh produce by category and by state/area
- View a farmer's verified profile before reaching out
- Contact farmers directly via phone, WhatsApp, or email
- Flag suspicious listings or profiles

**For farmers**
- Create a farm profile and go through identity/farm verification
- List and manage products (price, unit, availability, photos)
- Get discovered by buyers searching their state or category
- Receive WhatsApp notifications on new interest

**For admins**
- Review and approve/reject farmer verification requests
- Moderate listings and handle user reports
- Manage locations, categories, and platform users

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- [shadcn-ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (Postgres, Auth, Storage, Edge Functions)
- [react-helmet-async](https://github.com/staylor/react-helmet-async) for per-page SEO metadata

## Getting started

**Requirements:** Node.js & npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

```sh
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd agrotrust

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# then fill in your Supabase project's URL, project ID, and publishable key

# 4. Start the dev server
npm run dev
```

## Available scripts

| Script | What it does |
|---|---|
| `npm run dev` | Starts the local dev server with hot reload |
| `npm run build` | Builds for production (also regenerates `public/sitemap.xml` first) |
| `npm run build:dev` | Production build in development mode, for debugging build output |
| `npm run generate-sitemap` | Regenerates `public/sitemap.xml` from live product/farmer data on its own |
| `npm run lint` | Runs ESLint across the project |
| `npm run preview` | Serves the built `dist/` folder locally |

## Deployment

The project deploys to [Vercel](https://vercel.com/). Push to your connected branch and Vercel builds and deploys automatically — make sure the same environment variables from `.env.example` are set in your Vercel project settings (Project → Settings → Environment Variables).

If you're on the default `*.vercel.app` domain, consider connecting a custom domain in Vercel's domain settings — it's more trustworthy to visitors and avoids search engines displaying "Vercel" as the site name instead of "AgroTrust."

## Project structure

```
src/
  components/   Reusable UI (including Seo.tsx for per-page metadata)
  pages/        Route-level pages (buyer, farmer, and admin views)
  hooks/        Shared React hooks (auth, etc.)
  integrations/ Supabase client setup
supabase/
  migrations/   Database schema history
  functions/    Edge functions (verification emails, WhatsApp notifications, account deletion)
scripts/
  generate-sitemap.mjs   Builds public/sitemap.xml from live Supabase data
```
