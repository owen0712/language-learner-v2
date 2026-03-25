# Polyglot Path

A Next.js language learner app for Japanese, Korean, and Thai with beginner, intermediate, and pro study paths.

## Features

- Beginner tracks cover character systems, pronunciation, and grammar foundations.
- Gemini-powered course generation through `app/api/course/route.ts`.
- Flashcard mode with proficiency tracking.
- Firebase progress persistence with localStorage fallback.
- Ready for Vercel deployment using `vercel.json`.

## Business-facing repository assistant documentation

For business stakeholders evaluating repository analysis workflows, see:

- `docs/business-user-guide.md` for a business user oriented workflow, outputs, and governance checklist.

## How API and Firebase connections work

This project uses two external integrations:

1. **Firebase Firestore** for saving learner progress from the client.
2. **Google Gemini API** for generating course content from the server-side API route.

The relevant files are:

- `lib/firebase.ts` initializes the Firebase app and Firestore client using public environment variables.
- `lib/progress.ts` writes progress data to Firestore when Firebase is configured.
- `app/api/course/route.ts` calls the Gemini API with `GEMINI_API_KEY`, uses `GEMINI_MODEL` to select the exact model, and falls back to local course data if the key is missing or the request fails.

## Prerequisites

Before connecting the app, make sure you have:

- Node.js 18+ installed.
- A Firebase project with Firestore enabled.
- A Google AI / Gemini API key.

## 1. Install dependencies

```bash
npm install
```

## 2. Create your local environment file

Copy the example environment file:

```bash
cp .env.example .env.local
```

Then fill in these values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

## 3. Connect Firebase

### Step A: Create or open a Firebase project

1. Go to the Firebase Console.
2. Create a project or open an existing one.
3. Add a **Web App** to the project.
4. Copy the Firebase SDK config values into `.env.local`.

### Step B: Enable Firestore

1. In Firebase, open **Firestore Database**.
2. Create the database.
3. Start in test mode for local development, or configure production rules for deployment.

### Step C: Map Firebase values to this project

Use the Firebase web app config values like this:

- `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
- `authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `storageBucket` → `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `messagingSenderId` → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `appId` → `NEXT_PUBLIC_FIREBASE_APP_ID`

### Step D: Understand the fallback behavior

If any Firebase value is missing, `lib/firebase.ts` does **not** initialize Firebase. In that case, the app falls back to `localStorage` instead of writing to Firestore.

## 4. Connect the Gemini API

This project calls the Gemini API from `app/api/course/route.ts`, not directly from the browser.

### Step A: Create an API key

1. Generate a Gemini / Google AI API key.
2. Add it to `.env.local` as:

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

### Step B: How the API is used

When the UI requests `/api/course`:

- The app validates the selected `language` and `level`.
- The route builds a prompt for course generation.
- The server sends a POST request to the Gemini `generateContent` endpoint using `GEMINI_MODEL` (default: `gemini-2.5-flash`).
- If the request succeeds, the generated course is returned.
- If the key is missing or Gemini fails, the app returns fallback course content.

This makes local development safe even before your API key is configured.

## 5. Run the app locally

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## 6. Verify your integrations

### Firebase check

Firebase is likely connected correctly if:

- the app starts without env-related issues,
- progress-saving no longer relies only on local browser storage,
- and Firestore receives progress documents during use.

### Gemini API check

Gemini is likely connected correctly if:

- generating a course returns AI-generated content,
- and the UI does not show the fallback message about adding `GEMINI_API_KEY`.

If Gemini is not configured, the app still works using fallback course data.

## Troubleshooting

### Firebase is not connecting

Check the following:

- all `NEXT_PUBLIC_FIREBASE_*` variables are present in `.env.local`,
- you restarted the dev server after editing env files,
- Firestore is enabled in your Firebase project,
- and the values came from the Firebase **Web App** config, not another platform.

### Gemini API is not connecting

Check the following:

- `GEMINI_API_KEY` is set in `.env.local`,
- `GEMINI_MODEL` matches a model your Gemini key can access,
- you restarted `npm run dev` after updating env values,
- the key has access to the Gemini API,
- and outbound requests are allowed in your environment.

### Environment variables are not being picked up

Make sure:

- the file is named `.env.local`,
- variables do not include extra quotes unless intended,
- and the Next.js dev server has been restarted.

## Vercel deployment

When deploying to Vercel:

1. Import the repository into Vercel.
2. Add every variable from `.env.example` to the Vercel project settings.
3. Redeploy the app after saving the environment variables.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

After that, add your Firebase config, Gemini API key, and optional Gemini model override to `.env.local`.
