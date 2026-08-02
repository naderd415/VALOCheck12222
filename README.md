# VALO Check - AI Smart Value Inspector

**Live:** <https://valocheck.online>

**Keywords:** Used Item AI Inspector, Fair Price Calculator, VALO Check AI, AI valuation, Used phone check, Car inspection.

Pure Frontend + Firebase — Serverless AI-powered used product inspection platform.

## Architecture

```
Browser (Client)
  │
  ├── Gemini API (direct fetch) ─── Tier 1: gemini-2.5-flash
  │                                   Tier 2: gemini-1.5-flash
  │                                   Tier 3: OpenRouter (gemini-2.0-flash-001)
  │
  ├── Firebase (CDN compat SDK) ─── Auth + Firestore (config, analytics)
  │
  └── ipwho.is ──────────────────── Client-side geo detection
```

**No backend server. No Vercel. No Express. No Node.js.**

## File Structure

```
valo-check/
├── index.html                    Main HTML (skeleton, Firebase SDKs)
├── public/
│   ├── style.css                 All UI styles (dark theme, responsive)
│   └── main.js                   All logic (Gemini, Firebase, compression, UI)
├── admin/
│   └── index.html                Admin dashboard (Firebase Auth + Firestore CRUD)
├── .github/workflows/
│   └── deploy.yml                GitHub Actions → Firebase Hosting auto-deploy
├── firebase.json                 Firebase Hosting config (rewrites, headers)
├── manifest.json                 PWA manifest (installable)
├── sw.js                         Service worker (cache-first static)
├── icons/
│   ├── icon-192.svg              PWA icon
│   └── icon-512.svg              PWA icon
├── about.html                    About page
├── privacy.html                  Privacy policy
├── terms.html                    Terms of use
├── cookies.html                  Cookie policy
├── sitemap.xml                   SEO sitemap
├── robots.txt                    Crawler directives
└── README.md                     This file
```

## Developer's Map (for AI Agents & Maintainers)

### Core Logic Flow

```
index.html
  └── Loads Firebase SDKs (app, auth, firestore) in <head>
  └── Loads public/main.js at end of <body>

public/main.js
  ├── FIREBASE_CONFIG (hardcoded) ─── Initializes Firebase app + Firestore
  ├── onSnapshot listeners ────────── Syncs 8 config docs from Firestore:
  │     features, limits, api_keys, ads, adsense, ad_settings, categories, store
  ├── callGeminiAPI() ─────────────── 3-tier fallback AI call:
  │     Tier 1: Gemini 2.5 Flash (all keys)
  │     Tier 2: Gemini 1.5 Flash (all keys)
  │     Tier 3: OpenRouter (google/gemini-2.0-flash-001)
  ├── buildPrompt() ───────────────── Forces market research per user country
  ├── parseGeminiResponse() ───────── JSON parse → return {error: true} on failure
  ├── displayResults() ────────────── Renders score, price, defects, advice
  ├── exportReportPdf() ───────────── Hidden iframe print (background:#fff!important)
  └── logVisitor() ────────────────── Writes to Firestore analytics/visitors/logs

admin/index.html
  ├── Firebase Auth ───────────────── Login: naderd415@gmail.com / 01024926212
  ├── Firestore CRUD ──────────────── Manages all config docs listed above
  └── Real-time analytics ─────────── onSnapshot visitor log + stats
```

### Key Configuration Points

| File | What to change |
|------|---------------|
| `public/main.js` lines 42-48 | Firebase config (project ID, API key) |
| `admin/index.html` first <script> block | Same Firebase config |
| `public/main.js` CONFIG (top) | Gemini models list, OpenRouter URL |
| Firestore `config/` docs | Features, limits, API keys, ads, etc. |

### Adding New API Keys

1. Open `/admin` → Log in with `naderd415@gmail.com` / `01024926212`
2. Go to **API Keys** section
3. Click **Add Key** → Enter name + key → Save
4. Key is stored in Firestore `config/api_keys`
5. Frontend picks it up via `onSnapshot` (realtime, no reload needed)

### Deployment

```bash
# One-time setup
npm install -g firebase-tools
firebase login
firebase init hosting

# Deploy
firebase deploy --only hosting

# Or push to main branch (GitHub Actions auto-deploys)
git push origin main
```

## Admin Panel

- **URL:** `/admin`
- **Login:** `naderd415@gmail.com` / `01024926212`
- **Sections:**
  - API Key Management (add/remove/toggle Gemini + OpenRouter keys)
  - Feature Toggles (camera, ads, multi-lang, PDF, sell mode)
  - Daily Limits (max scans per device per day)
  - Ad Management (add/remove/toggle trigger ads by type)
  - Ad Settings (delay, master toggle)
  - AdSense Code Injection
  - Category Enable/Disable
  - Store Products Management
  - Real-time Visitor Analytics (live log + total stats)
  - Change Password

## Cost

| Service | Cost |
|---------|------|
| Firebase Hosting | Free (Spark plan) |
| Firestore | Free (1GB, 50K reads/day) |
| Gemini API | Free (1500 requests/day) |
| OpenRouter | ~$0.10/1M tokens (fallback only) |
| Custom Domain | ~$10/year |
| **Total** | **~$10/year** |

## Security

- API keys stored in Firestore (Firebase Auth protected writes)
- Client-side image compression — no images uploaded to server
- No images stored — ephemeral in-memory processing only
- Firebase Auth for admin panel (email/password)
- Firestore security rules enforce admin-only writes
- Service worker cache-first for static assets only
- Session-based ad triggers (once per session per action)

---

**Built with passion by the VALO Check Team**
