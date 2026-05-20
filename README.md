# FairFamily 👨‍👩‍👧‍👦

> Are you being fair to all your children? FairFamily helps parents track spending, gifts, experiences, and milestones across all their kids — and gives AI-powered fairness insights.

---

## Features

- **Dashboard** — Fairness score, spending overview, and Life Graph for each child
- **Kids** — Add, view, and delete children with emoji & color avatars
- **Log** — Record gifts, experiences, milestones, and notes; scan photos with AI to auto-fill details
- **AI Advice** — Claude AI analyzes your family data and gives honest fairness insights
- **FAQ Bot** — Floating chatbot with help articles and a contact form
- **Korean / English** — Full bilingual support with automatic language detection
- **Firebase** — Per-user private data, real-time sync, secure auth

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7 |
| Styling | CSS-in-JS, glassmorphism, DM Sans font |
| AI | Anthropic Claude (`claude-sonnet-4-6`) |
| Backend | Firebase Auth + Firestore |
| Mobile | Capacitor (Android) |
| i18n | Custom hook (`useLanguage`) with `en.js` / `ko.js` |

---

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/ChloeYi/fairfamily-.git
cd fairfamily-
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root:
```
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_ANTHROPIC_KEY=your_anthropic_key
```

### 4. Run the app
```bash
npm start
```

---

## Project Structure

```
src/
├── components/
│   └── FAQBot.jsx          # Floating FAQ chatbot
├── screens/
│   ├── DashboardScreen.jsx
│   ├── KidsScreen.jsx
│   ├── PhotoLogScreen.jsx
│   ├── AIAdviceScreen.jsx
│   ├── ChildRoomScreen.jsx
│   ├── ChatOnboardingScreen.jsx
│   ├── EmotionalOnboardingScreen.jsx
│   └── Welcome3Screen.jsx
├── hooks/
│   └── useLanguage.js      # i18n hook
├── languages/
│   ├── en.js               # English translations
│   └── ko.js               # Korean translations
├── firebase.js             # Firebase config (reads from .env)
├── seedMarketingData.js    # Demo data for marketing (separate from user data)
└── App.jsx                 # Routes + bottom nav
```

---

## Environment Variables

Never commit your `.env` file. It contains API keys and Firebase credentials.
See `.env.example` for the required variable names.

---

## Contact

Questions or feedback? Email: chloe.heydayii@gmail.com
