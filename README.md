# VALO Check - Smart Value Inspector

**Live:** [besttoolshub.online](https://besttoolshub.online)

AI-powered platform for inspecting used products via photos. Protects buyers from scams and helps sellers price items fairly. Supports 8 product categories, 10+ global markets with local currencies, and 6 languages.

## Features

- **Direct Gemini AI** — Client-side calls to Google Gemini API with multi-key rotation and model fallback (2.5-flash → 2.0-flash → 1.5-flash)
- **Instant Image Compression** — HTML5 Canvas compression fires immediately on file selection, zero mobile lag
- **Firebase Backend** — Auth, Firestore, real-time visitor analytics via Firebase (no custom server)
- **Dynamic Ad System** — Admin-managed ad triggers on upload click and scan button click (session-based, once per session)
- **Smart Buyer Assistant** — Budget-based product suggestions per category
- **Built-in Store** — Admin-managed product listings with WhatsApp integration
- **Dark/Light Mode** — Theme toggle with localStorage persistence
- **8 Product Categories** — Phone, Laptop, Car, Scooter, Fridge, AC, Washer, PC
- **10 Global Markets** — EG, US, AU, SA, AE, GB, DE, FR, CN, ES
- **6 Languages** — Arabic, English, French, German, Chinese, Spanish
- **PDF Report Generation** — Printable inspection reports via html2pdf.js
- **Admin Panel** — Firebase Auth protected, full control over features, ads, API keys, categories, store, and visitor analytics
- **SEO Optimized** — JSON-LD structured data, sitemap, robots.txt, compliance pages

## Architecture

This is a **pure frontend** application — no backend server required. Deploys to any static host (Vercel, Netlify, GitHub Pages, Cloudflare Pages).

```
Client (browser)
  │
  ├── Gemini API (direct) ─── Multi-key rotation + model fallback
  │
  ├── Firebase SDK (CDN) ─── Auth + Firestore (config, ads, analytics)
  │
  └── ipwho.is ──── Client-side geo detection
```

### File Structure

```
valo-check/
├── index.html              ← Main HTML (meta, JSON-LD, body)
├── public/
│   ├── style.css           ← All CSS (variables, layout, responsive)
│   └── main.js             ← All client logic (Gemini, Firebase, compression, UI)
├── admin/
│   └── index.html          ← Admin panel (Firebase Auth + Firestore)
├── about.html              ← About page
├── privacy.html            ← Privacy policy
├── cookies.html            ← Cookie policy
├── terms.html              ← Terms of use
├── sitemap.xml             ← SEO sitemap
├── robots.txt              ← Crawler directives
└── README.md               ← This file
```

## Quick Start

### 1. Get Gemini API Key
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google
3. Create a new API key
4. Copy the key (starts with `AIza...`)

### 2. Deploy
```bash
# Option A: Vercel
npx vercel --prod

# Option B: Netlify
netlify deploy --prod

# Option C: GitHub Pages
# Push to repo → enable Pages in settings

# Option D: Any static host
# Upload the entire project folder
```

### 3. Configure API Keys
1. Open `/admin` panel
2. Login with `admin@besttoolshub.online` / `valo2026`
3. Go to **API Keys** section
4. Add your Gemini API key(s)
5. The app calls Gemini directly from the browser — no server env vars needed

### 4. Access Admin Panel
- **URL:** `/admin`
- **Email:** `admin@besttoolshub.online`
- **Password:** `valo2026`
- Change password immediately after first login

## Admin Panel

- **Firebase Auth** — Email/password login
- **API Key Management** — Add/remove/toggle Gemini API keys
- **Feature Toggles** — Camera, sell mode, multi-lang, PDF reports, ads
- **Ad Management** — Add/remove/sort ad links, position types (header/mid/footer/upload-trigger/scan-trigger)
- **Ad Trigger Master Toggle** — Enable/disable all ad pop-unders globally
- **AdSense Code Injection** — Paste AdSense script for header/footer
- **Category Management** — Enable/disable product categories
- **Store Management** — Add/edit/delete products
- **Visitor Analytics** — Real-time visitor log via Firestore onSnapshot
- **Settings Export/Import** — JSON download/upload from Firestore
- **Change Password** — Firebase Auth + Firestore update

## Cost

| Item | Cost |
|------|------|
| Static Hosting | **Free** (Vercel/Netlify/Cloudflare) |
| Firebase | **Free** (Spark plan — 1GB storage, 50K reads/day) |
| Gemini API | **Free** (1500 req/day) |
| Custom Domain | ~$10/year |
| **Total** | **~$10/year** |

## SEO & Compliance

- JSON-LD WebApplication structured data
- robots.txt with crawl permissions
- sitemap.xml with all pages
- Privacy Policy, Cookie Policy, Terms of Use, About Us
- Meta tags optimized for social sharing (OG + Twitter Cards)

## Security

- API keys stored in Firestore (admin-managed, not in code)
- Client-side image compression (reduces API load)
- No images stored on server
- Firebase Auth for admin access
- Session-based ad triggers (once per session per action)

---

**Built with passion by the VALO Check Team**
© 2026 - All rights reserved
