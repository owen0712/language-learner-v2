# Learning Hub (EN/中文)

A Next.js learning application with bilingual UI (English + Chinese), Firebase email/password authentication, an admin page, and financial news aggregation from Bloomberg and Yahoo Finance.

## Features

- English/Chinese language toggle.
- Email/password login and registration with Firebase Auth.
- Admin page (`/admin`) controlled by `NEXT_PUBLIC_ADMIN_EMAILS`.
- Learning topics:
  1. Men reproductive health, hormones, and sexual knowledge
  2. Trading, investment, and finance knowledge
  3. Financial planner knowledge
- Server-side API route to fetch latest top 20 finance headlines from Bloomberg + Yahoo Finance.

## Environment variables

Copy `.env.example` into `.env.local` and fill in your Firebase config:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com
```

## Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.
