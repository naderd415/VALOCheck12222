# VALO Check — Smart Value Inspector

**Live:** <https://besttoolshub.online>

AI-powered used-product inspection platform. Upload a photo and get an instant fair-price analysis with defect detection, repair cost estimates, and negotiation advice — all from the browser via Google Gemini AI.

## Architecture

**Pure Frontend + Firebase** — no backend server.

```
Browser
  ├── Gemini API (direct) ─── Multi-key rotation, model fallback
  ├── Firebase SDK (CDN) ─── Auth + Firestore (config, ads, analytics)
  └── ipwho.is ────────────── Client-side geo detection
```

### File Structure

```
valo-check/
├── index.html               Main HTML (meta, JSON-LD, body)
├── public/
│   ├── style.css            All CSS
│   └── main.js              All logic (Gemini, Firebase, compression, UI)
├── admin/
│   └── index.html           Admin panel (Firebase Auth + Firestore CRUD)
├── manifest.json            PWA manifest
├── sw.js                    Service worker (cache-first static)
├── icons/                   PWA icons (SVG)
├── about.html               About page
├── privacy.html             Privacy policy
├── cookies.html             Cookie policy
├── terms.html               Terms of use
├── firebase.json            Firebase Hosting config
├── sitemap.xml              SEO sitemap
├── robots.txt               Crawler directives
└── README.md                This file
```

## Features

- **Direct Gemini AI** — Client-side calls with multi-key rotation and model fallback (gemini-2.5-flash → gemini-1.5-flash)
- **Instant Image Compression** — HTML5 Canvas compression on file selection, zero mobile lag
- **Firebase Backend** — Auth, Firestore, real-time analytics (no custom server)
- **Dynamic Ad System** — Admin-managed session-based ad triggers
- **Smart Buyer Assistant** — Budget-based product suggestions per category
- **Built-in Store** — Admin-managed product listings with WhatsApp integration
- **Dark/Light Mode** — Theme toggle with localStorage persistence
- **10 Product Categories** — Phone, Laptop, Car, Scooter, Fridge, AC, Washer, PC, Headphones, Monitor
- **10 Global Markets** — EG, US, AU, SA, AE, GB, DE, FR, CN, ES
- **6 Languages** — Arabic, English, French, German, Chinese, Spanish
- **PDF Report** — Professional inspection certificate
- **Admin Panel** — Firebase Auth protected
- **PWA** — Installable, offline-ready service worker
- **SEO Optimized** — JSON-LD, sitemap, robots.txt, compliance pages

## Quick Start

### 1. Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy --only hosting
```

### 2. Open Admin Panel

Go to `https://besttoolshub.online/admin`

- **Email:** `naderd415@gmail.com`
- **Password:** `01024926212`
- Change password immediately after first login.

### 3. How to Add New API Keys (via Admin Panel)

1. Log in to the Admin Panel at `/admin`.
2. Scroll to the **API Keys** section.
3. Click **"Add API Key"**.
4. Enter a **Name** (e.g., "Gemini Key 1") and paste your **Key** (starts with `AIza...`).
5. Click **Save** — the key is stored securely in Firestore.
6. Toggle keys on/off with the switch. Active keys are used in rotation by the frontend.

> The app ships with a default Gemini key pre-seeded. You can add more keys for higher rate limits or replace it entirely.

### 4. Configure Firebase (if cloning)

Edit the `FIREBASE_CONFIG` in both `public/main.js` and `admin/index.html`:

```js
{
  apiKey: "AIzaSyDvaasGECJAlGDg2-KNnasJfzok1Fs7iro",
  authDomain: "valo-check.firebaseapp.com",
  projectId: "valo-check",
  storageBucket: "valo-check.firebasestorage.app",
  messagingSenderId: "595305842951",
  appId: "1:595305842951:web:6acce617e0080f521c9da2"
}
```

## Admin Panel Capabilities

| Section | Description |
|---------|-------------|
| **Firebase Config** | Override Firebase settings from Firestore |
| **API Keys** | Add/remove/toggle Gemini API keys (stored in Firestore) |
| **Feature Toggles** | Camera, sell mode, multi-lang, PDF reports, ads |
| **Daily Limits** | Set max scans per day per device |
| **Ad Management** | Add/remove/toggle ad links, position types, master trigger |
| **AdSense** | Inject AdSense code into header/footer |
| **Ad Settings** | Delay, mobile-only, trigger enable |
| **Categories** | Enable/disable product categories |
| **Store** | Add/edit/delete products with WhatsApp link |
| **Visitor Analytics** | Real-time visitor log via Firestore onSnapshot |
| **Export/Import** | Download/upload all settings as JSON |
| **Change Password** | Firebase Auth password update |

## Cost

| Item | Cost |
|------|------|
| Firebase Hosting | **Free** (Spark plan) |
| Firestore | **Free** (1GB storage, 50K reads/day) |
| Gemini API | **Free** (1500 requests/day) |
| Custom Domain | ~$10/year |
| **Total** | **~$10/year** |

## Security

- API keys stored in Firestore (Firebase Auth protected write access)
- Client-side image compression (no images uploaded to server)
- No images stored on server — ephemeral, in-memory only
- Firebase Auth for admin panel
- Firestore security rules enforce admin-only writes
- Session-based ad triggers (once per session per action)

---

**Built with passion by the VALO Check Team**
