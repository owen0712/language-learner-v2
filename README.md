# Polyglot Path

A Next.js language learner app for Japanese, Korean, and Thai with beginner, intermediate, and pro study paths.

## Features

- Beginner tracks cover character systems, pronunciation, and grammar foundations.
- Gemini-powered course generation through `app/api/course/route.ts`.
- Flashcard mode with proficiency tracking.
- Firebase progress persistence with localStorage fallback.
- Ready for Vercel deployment using `vercel.json`.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Add Firebase web app credentials and a `GEMINI_API_KEY`.
3. Install dependencies:

   ```bash
   npm install
   npm run dev
   ```

## Vercel deployment

- Import the repository into Vercel.
- Add the variables from `.env.example` in the Vercel dashboard.
- Deploy; the app uses the Next.js framework preset from `vercel.json`.
