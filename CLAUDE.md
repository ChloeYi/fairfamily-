# FairFamily — Claude Code Project Guide

## What this app does
FairFamily is a React web app (+ Capacitor Android) that helps parents track fairness across their children — spending, gifts, experiences, milestones. It uses Claude AI for photo scanning and fairness analysis.

## Tech stack
- React 19 + React Router 7
- Firebase Auth + Firestore (real-time)
- Anthropic SDK (`claude-sonnet-4-6`) with `dangerouslyAllowBrowser: true`
- Capacitor for Android packaging
- Custom i18n system (English + Korean)

## Key file locations
- `src/App.jsx` — routes, bottom nav, global components (LangToggle, FAQBot)
- `src/firebase.js` — Firebase config (reads from `.env`)
- `src/hooks/useLanguage.js` — language toggle hook, auto-detects via IP
- `src/languages/en.js` / `ko.js` — all UI strings
- `src/seedMarketingData.js` — seeds demo data to `marketing/demo/children` (NOT user data)
- `src/components/FAQBot.jsx` — floating FAQ chatbot

## Firestore data structure
- Real user data: `users/{uid}/children/{childId}/logs/`
- Marketing demo data: `marketing/demo/children/` (Emma, Liam, Zoe — never shown to users)

## Environment variables (in `.env`, never commit)
```
REACT_APP_FIREBASE_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN
REACT_APP_FIREBASE_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID
REACT_APP_ANTHROPIC_KEY
```

## Run the app
```bash
npm start        # dev server on localhost:3000
npm run build    # production build
npx cap sync     # sync to Android
npx cap open android  # open in Android Studio
```

## Important notes
- `.env` is gitignored — never commit it
- `android/` folder is gitignored — regenerate with `npx cap add android`
- `build/` is gitignored — regenerate with `npm run build`
- Marketing data is seeded once on app load, tracked by `localStorage.getItem("marketingDataSeeded")`
- Language defaults to `"en"` immediately, then checks IP only if no localStorage value exists
