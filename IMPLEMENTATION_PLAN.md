# 🏆 AMBITION NEWS PORTAL — MASTER IMPLEMENTATION PLAN
### छत्तीसगढ़ & मध्यप्रदेश Regional News PWA

> **Version**: 1.0  
> **Date**: September 2026  
> **Status**: Planning Phase  
> **Type**: Progressive Web App (PWA)

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Why We Are Building This](#2-why-we-are-building-this)
3. [Target Audience](#3-target-audience)
4. [Tech Stack](#4-tech-stack)
5. [Project Structure](#5-project-structure)
6. [Database Schema](#6-database-schema)
7. [Features List](#7-features-list)
8. [Security Plan](#8-security-plan)
9. [Scalability & Traffic Plan](#9-scalability--traffic-plan)
10. [PWA Plan](#10-pwa-plan)
11. [Social Media Integration](#11-social-media-integration)
12. [API Plan](#12-api-plan)
13. [Caching Strategy](#13-caching-strategy)
14. [Monitoring & Alerts](#14-monitoring--alerts)
15. [Disaster Recovery](#15-disaster-recovery)
16. [Legal & Compliance](#16-legal--compliance)
17. [Cost Plan](#17-cost-plan)
18. [Phased Build Timeline](#18-phased-build-timeline)
19. [Pre-Launch Checklist](#19-pre-launch-checklist)
20. [Open Questions](#20-open-questions)

---

## 1. PROJECT OVERVIEW

| Attribute           | Detail                                              |
|---------------------|-----------------------------------------------------|
| **Project Name**    | Ambition News Portal                                |
| **Type**            | Progressive Web App (PWA)                           |
| **Region**          | Chhattisgarh + Madhya Pradesh (India)               |
| **Language**        | Hindi (Primary) + English (Admin/Technical)         |
| **Districts**       | 33 CG + 55 MP = 88 Districts                        |
| **Users**           | Readers · Reporters · Editors · Admins              |
| **Frontend**        | React 18 + Vite + TypeScript + Tailwind CSS         |
| **Backend**         | Node.js + Express.js                                |
| **Database**        | MongoDB Atlas (Free Tier — 512MB)                   |
| **ODM**             | Mongoose                                            |
| **Auth**            | JWT + OTP via SMS (Phone Number Login)              |
| **Frontend Deploy** | Vercel (Free Tier)                                  |
| **Backend Deploy**  | Render (Free Tier)                                  |
| **Media CDN**       | Cloudinary (Free Tier — 25GB)                       |
| **Cache**           | Upstash Redis (Free Tier)                           |

### Vision Statement
> **"Ambition — छत्तीसगढ़ और मध्यप्रदेश की अपनी आवाज़ — हर जिले की, हर खबर की।"**  
> A fast, offline-capable, installable news portal that covers every district of CG & MP — where local reporters publish and local readers read.


---

## 2. WHY WE ARE BUILDING THIS

### The Problem
| Pain Point | Reality in CG + MP |
|---|---|
| 🗺️ Hyperlocal news ignored | National portals don't cover district-level events |
| 📵 Poor internet in rural areas | Many readers are on 2G/patchy 4G |
| 📱 Reporters use WhatsApp | No structured submission system exists |
| 🐌 Slow existing local sites | Current local portals are bloated and ad-heavy |
| 🌐 No Hindi-first PWA | No installable, offline-capable Hindi news app |
| 📰 Stories lost in groups | Important local news dies in WhatsApp groups |
| 🔔 No breaking alerts | Readers miss critical local events |

### The Solution
**Ambition** = Fast + Offline + Installable + Hindi-first + Reporter workflow + Push notifications

---

## 3. TARGET AUDIENCE

| Persona | Who | Need |
|---|---|---|
| 📱 Mobile Reader | 18–35 yr, smartphone-first | Fast loading, offline reading, installable |
| 🌾 Rural Reader | Villages, Tier-3 towns | Works on 2G, low data, Hindi |
| ✍️ Field Reporter | Ground-level journalists | Submit news from phone easily |
| 👨‍💼 Editor / Desk | Editorial review team | Review, approve/reject articles |
| 👑 Admin / Owner | Portal management | Full control, analytics, reporter mgmt |

---

## 4. TECH STACK

### Frontend (Deployed on Vercel — Free)
| Layer | Technology | Purpose |
|---|---|---|
| Framework | React 18 + Vite | Fast SPA + PWA build |
| Language | TypeScript | Type safety |
| Routing | React Router v6 | Client-side routing |
| Styling | Tailwind CSS | Utility-first CSS |
| UI Components | shadcn/ui | Pre-built accessible components |
| Icons | Lucide React | Icon library |
| Animations | Framer Motion | Page transitions |
| State | Zustand | Global state management |
| Forms | React Hook Form + Zod | Form handling + validation |
| Rich Editor | TipTap | Article content editor (admin) |
| HTTP Client | Axios | API calls to backend |
| PWA | vite-plugin-pwa (Workbox) | Service worker + offline |

### Backend (Deployed on Render — Free)
| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js 20 | JavaScript runtime |
| Framework | Express.js | REST API server |
| Language | TypeScript | Type safety |
| ODM | Mongoose | MongoDB schema + queries |
| Database | MongoDB Atlas (Free) | Primary data store — 512MB |
| Cache | Upstash Redis (Free) | API caching + rate limiting |
| Auth | JWT (jsonwebtoken) | Access + refresh tokens |
| OTP | Custom (bcrypt hash) | Phone OTP verify |
| SMS OTP | Fast2SMS / MSG91 | OTP delivery (India) |
| Media | Cloudinary | Image upload + CDN |
| Search | MongoDB Atlas Search | Hindi full-text search (built-in) |
| Push | web-push (VAPID) | Browser push notifications |
| Validation | Zod | Request body validation |
| Security | helmet + cors + express-rate-limit | Security headers |

### Infrastructure (100% Free Tier)
| Service | Plan | Limit |
|---|---|---|
| **Vercel** | Hobby (Free) | 100GB bandwidth, unlimited deploys |
| **Render** | Free | 512MB RAM, sleeps after 15min idle |
| **MongoDB Atlas** | Free (M0) | 512MB storage, shared cluster |
| **Cloudinary** | Free | 25GB storage, 25GB bandwidth |
| **Upstash Redis** | Free | 10,000 commands/day |
| **Fast2SMS** | Pay-per-use | ~₹0.15–0.25 per OTP |

> ⚠️ **Render Free Tier Note**: Free tier sleeps after 15 min of inactivity — first request after sleep takes ~30s to wake up. Upgrade to Starter (₹600/month) when traffic grows.

### Free Tier Workaround for Render Sleep
```
Solution: Cron job pings the backend every 14 minutes
Tool: cron-job.org (free) or UptimeRobot (free)
Endpoint: GET /api/health → returns { status: "ok" }
This keeps backend always awake on free tier
```

---

## 5. PROJECT STRUCTURE

> Two separate repos: **frontend** (React + Vite) and **backend** (Node + Express)

```
ANP/
├── frontend/                          # React + Vite PWA → Deploy on Vercel
│   ├── public/
│   │   ├── manifest.json              # PWA manifest
│   │   ├── offline.html               # Offline fallback
│   │   └── icons/
│   │       ├── icon-192.png
│   │       ├── icon-512.png
│   │       └── icon-maskable.png
│   │
│   ├── src/
│   │   ├── main.tsx                   # React entry point
│   │   ├── App.tsx                    # Router setup
│   │   │
│   │   ├── pages/                     # Route pages
│   │   │   ├── Home.tsx               # Homepage
│   │   │   ├── ArticleDetail.tsx      # /article/:slug
│   │   │   ├── Category.tsx           # /category/:slug
│   │   │   ├── District.tsx           # /district/:slug
│   │   │   ├── StatePage.tsx          # /chhattisgarh | /madhya-pradesh
│   │   │   ├── Search.tsx             # /search
│   │   │   ├── Videos.tsx             # /videos (YouTube)
│   │   │   ├── Bookmarks.tsx          # /bookmarks (offline)
│   │   │   ├── Login.tsx              # /login
│   │   │   ├── VerifyOtp.tsx          # /verify-otp
│   │   │   ├── reporter/
│   │   │   │   ├── Dashboard.tsx      # /reporter/dashboard
│   │   │   │   ├── Submit.tsx         # /reporter/submit
│   │   │   │   └── MyArticles.tsx     # /reporter/my-articles
│   │   │   └── admin/
│   │   │       ├── Dashboard.tsx      # /admin
│   │   │       ├── Articles.tsx       # /admin/articles
│   │   │       ├── Pending.tsx        # /admin/pending
│   │   │       ├── Reporters.tsx      # /admin/reporters
│   │   │       ├── Categories.tsx     # /admin/categories
│   │   │       ├── Districts.tsx      # /admin/districts
│   │   │       ├── Push.tsx           # /admin/push
│   │   │       └── Analytics.tsx      # /admin/analytics
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx         # Top nav + category tabs
│   │   │   │   ├── BreakingTicker.tsx # Scrolling breaking news bar
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── Sidebar.tsx        # Trending + social CTAs
│   │   │   ├── news/
│   │   │   │   ├── ArticleCard.tsx
│   │   │   │   ├── ArticleHero.tsx
│   │   │   │   ├── CategoryGrid.tsx
│   │   │   │   ├── DistrictSelector.tsx
│   │   │   │   └── RelatedArticles.tsx
│   │   │   ├── social/
│   │   │   │   ├── YouTubeSection.tsx
│   │   │   │   ├── YouTubeShorts.tsx
│   │   │   │   ├── LiveBanner.tsx
│   │   │   │   ├── InstagramFeed.tsx
│   │   │   │   ├── WhatsAppCTA.tsx
│   │   │   │   └── ShareMenu.tsx
│   │   │   ├── pwa/
│   │   │   │   ├── InstallPrompt.tsx
│   │   │   │   ├── OfflineBanner.tsx
│   │   │   │   └── UpdatePrompt.tsx
│   │   │   ├── reporter/
│   │   │   │   ├── ArticleForm.tsx
│   │   │   │   ├── PhotoUploader.tsx
│   │   │   │   └── StatusBadge.tsx
│   │   │   ├── admin/
│   │   │   │   ├── ArticleEditor.tsx  # TipTap editor
│   │   │   │   ├── PendingQueue.tsx
│   │   │   │   └── ReporterTable.tsx
│   │   │   └── ui/
│   │   │       ├── Button.tsx
│   │   │       ├── Badge.tsx
│   │   │       ├── Skeleton.tsx
│   │   │       └── BookmarkButton.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useOffline.ts          # Online/offline detection
│   │   │   ├── useBookmarks.ts        # IndexedDB bookmarks
│   │   │   ├── useInfiniteScroll.ts   # Scroll-based pagination
│   │   │   ├── usePushNotification.ts # Push subscribe
│   │   │   └── useInstallPrompt.ts    # PWA install
│   │   │
│   │   ├── api/
│   │   │   └── axios.ts               # Axios instance (base URL = Render backend)
│   │   │
│   │   ├── store/
│   │   │   └── useAppStore.ts         # Zustand global store
│   │   │
│   │   └── types/
│   │       └── index.ts               # TypeScript interfaces
│   │
│   ├── vite.config.ts                 # Vite + vite-plugin-pwa
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── .env                           # VITE_API_URL=https://your-backend.onrender.com
│   └── vercel.json                    # SPA routing fix for Vercel
│
└── backend/                           # Node + Express → Deploy on Render
    ├── src/
    │   ├── index.ts                   # Express app entry point
    │   │
    │   ├── config/
    │   │   ├── db.ts                  # MongoDB Atlas connection (Mongoose)
    │   │   ├── cloudinary.ts          # Cloudinary config
    │   │   └── redis.ts               # Upstash Redis config
    │   │
    │   ├── models/                    # Mongoose models
    │   │   ├── User.model.ts
    │   │   ├── Article.model.ts
    │   │   ├── Category.model.ts
    │   │   ├── District.model.ts
    │   │   ├── State.model.ts
    │   │   ├── OtpSession.model.ts
    │   │   ├── PushSubscription.model.ts
    │   │   └── SiteConfig.model.ts
    │   │
    │   ├── routes/                    # Express routers
    │   │   ├── auth.routes.ts         # /api/auth/*
    │   │   ├── article.routes.ts      # /api/articles/*
    │   │   ├── category.routes.ts     # /api/categories/*
    │   │   ├── district.routes.ts     # /api/districts/*
    │   │   ├── state.routes.ts        # /api/states/*
    │   │   ├── search.routes.ts       # /api/search
    │   │   ├── upload.routes.ts       # /api/upload
    │   │   ├── push.routes.ts         # /api/push/*
    │   │   ├── youtube.routes.ts      # /api/youtube/*
    │   │   └── admin.routes.ts        # /api/admin/*
    │   │
    │   ├── controllers/               # Route handlers
    │   │   ├── auth.controller.ts
    │   │   ├── article.controller.ts
    │   │   ├── admin.controller.ts
    │   │   └── push.controller.ts
    │   │
    │   ├── middleware/
    │   │   ├── auth.middleware.ts     # JWT verify
    │   │   ├── role.middleware.ts     # Role-based guard
    │   │   ├── rateLimit.middleware.ts # express-rate-limit
    │   │   └── validate.middleware.ts # Zod schema validation
    │   │
    │   ├── services/
    │   │   ├── otp.service.ts         # OTP generate + hash + verify
    │   │   ├── sms.service.ts         # Fast2SMS / MSG91 send
    │   │   ├── push.service.ts        # web-push VAPID
    │   │   ├── youtube.service.ts     # YouTube Data API v3
    │   │   └── cache.service.ts       # Upstash Redis helpers
    │   │
    │   └── utils/
    │       └── helpers.ts             # slugify, date format, etc.
    │
    ├── seeds/
    │   ├── states.seed.ts             # CG + MP seed data
    │   ├── districts.seed.ts          # All 88 districts
    │   └── categories.seed.ts         # 12 categories
    │
    ├── tsconfig.json
    ├── package.json
    ├── .env                           # All secrets
    └── render.yaml                    # Render deployment config
```

---

## 6. DATABASE SCHEMA (MongoDB + Mongoose)

```typescript
// ─── USER MODEL ─────────────────────────────────────────

const UserSchema = new Schema({
  phone:       { type: String, required: true, unique: true },
  name:        { type: String, required: true },
  nameHindi:   { type: String },
  role:        { type: String, enum: ['READER','REPORTER','EDITOR','ADMIN'], default: 'READER' },
  districtId:  { type: Schema.Types.ObjectId, ref: 'District' },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

// ─── STATE MODEL ────────────────────────────────────────

const StateSchema = new Schema({
  name:      { type: String, required: true, unique: true }, // "Chhattisgarh"
  nameHindi: { type: String, required: true },               // "छत्तीसगढ़"
  slug:      { type: String, required: true, unique: true }, // "chhattisgarh"
});

// ─── DISTRICT MODEL ─────────────────────────────────────

const DistrictSchema = new Schema({
  name:      { type: String, required: true },   // "Raipur"
  nameHindi: { type: String, required: true },   // "रायपुर"
  slug:      { type: String, required: true, unique: true },
  stateId:   { type: Schema.Types.ObjectId, ref: 'State', required: true },
});

// ─── CATEGORY MODEL ─────────────────────────────────────

const CategorySchema = new Schema({
  name:   { type: String, required: true, unique: true }, // "राजनीति"
  nameEn: { type: String, required: true },               // "Politics"
  slug:   { type: String, required: true, unique: true }, // "rajniti"
  icon:   { type: String },   // "🏛️"
  color:  { type: String },   // "#dc2626"
});

// ─── ARTICLE MODEL ──────────────────────────────────────

const ArticleSchema = new Schema({
  title:        { type: String, required: true },        // Hindi title
  titleEn:      { type: String },                        // English (optional)
  slug:         { type: String, required: true, unique: true },
  excerpt:      { type: String, required: true },        // Short summary
  content:      { type: Object, required: true },        // TipTap JSON
  coverImage:   { type: String },                        // Cloudinary URL
  stateId:      { type: Schema.Types.ObjectId, ref: 'State', required: true },
  districtId:   { type: Schema.Types.ObjectId, ref: 'District', required: true },
  categoryId:   { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  authorId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tags:         [{ type: String }],
  status:       { type: String, enum: ['DRAFT','REVIEW','PUBLISHED','REJECTED','ARCHIVED'], default: 'DRAFT' },
  isBreaking:   { type: Boolean, default: false },
  isFeatured:   { type: Boolean, default: false },
  views:        { type: Number, default: 0 },
  rejectedNote: { type: String },
  publishedAt:  { type: Date },
  deletedAt:    { type: Date },                          // Soft delete
}, { timestamps: true });

// Indexes for performance
ArticleSchema.index({ status: 1, publishedAt: -1 });
ArticleSchema.index({ districtId: 1, status: 1 });
ArticleSchema.index({ categoryId: 1, status: 1 });
ArticleSchema.index({ stateId: 1, status: 1 });
ArticleSchema.index({ isBreaking: 1, status: 1 });
ArticleSchema.index({ title: 'text', excerpt: 'text', tags: 'text' }); // Full-text search

// ─── OTP SESSION MODEL ──────────────────────────────────

const OtpSessionSchema = new Schema({
  phone:    { type: String, required: true },
  otpHash:  { type: String, required: true },  // bcrypt hashed OTP
  attempts: { type: Number, default: 0 },
  expiresAt:{ type: Date, required: true },    // 5 minutes TTL
}, { timestamps: true });

OtpSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB TTL auto-delete

// ─── PUSH SUBSCRIPTION MODEL ────────────────────────────

const PushSubscriptionSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User' },
  endpoint: { type: String, required: true, unique: true },
  p256dh:   { type: String, required: true },
  auth:     { type: String, required: true },
}, { timestamps: true });

// ─── SITE CONFIG MODEL ──────────────────────────────────

const SiteConfigSchema = new Schema({
  key:   { type: String, required: true, unique: true }, // "breaking_ticker_text"
  value: { type: String, required: true },
});
```

### Default Categories (Seed Data)
```
🏛️ राजनीति      (Politics)       slug: rajniti
🚔 अपराध        (Crime)          slug: apradh
🏗️ विकास कार्य  (Development)    slug: vikas
⚖️ न्यायालय     (Court/Legal)    slug: nyayalay
⚽ खेल          (Sports)         slug: khel
🎭 मनोरंजन      (Entertainment)  slug: manoranjan
📚 शिक्षा       (Education)      slug: shiksha
🌾 कृषि         (Agriculture)    slug: krishi
🏥 स्वास्थ्य    (Health)         slug: swasthya
💼 व्यापार      (Business)       slug: vyapar
🌦️ मौसम        (Weather)        slug: mausam
🔴 ब्रेकिंग     (Breaking)       slug: breaking
```

---




## 7. FEATURES LIST

### 🔴 Must Have — V1 Launch (52 Features)

#### Public Portal
- [ ] Hero/Featured article on homepage
- [ ] Breaking news scrolling ticker (auto-refresh 30s)
- [ ] Category tabs (12 categories)
- [ ] Latest news infinite scroll feed
- [ ] District quick filter
- [ ] State toggle (CG / MP)
- [ ] Full article detail page (Hindi)
- [ ] Cover image (Cloudinary CDN)
- [ ] Article metadata (reporter, district, time)
- [ ] WhatsApp share button (every article)
- [ ] Category pages (`/category/[slug]`)
- [ ] District pages (`/district/[slug]`)
- [ ] State pages (`/chhattisgarh`, `/madhya-pradesh`)
- [ ] Full-text Hindi search
- [ ] No results + empty states (Hindi messages)
- [ ] Correction notice on articles
- [ ] Related articles ("यह भी पढ़ें")

#### PWA
- [ ] manifest.json (valid PWA)
- [ ] App icons (192, 512, maskable)
- [ ] Splash screen
- [ ] Standalone display mode
- [ ] Offline fallback page
- [ ] Offline banner ("📵 No internet")
- [ ] Last 20 articles cached for offline
- [ ] Service worker registered

#### Push Notifications
- [ ] Breaking news auto-push (when editor marks breaking)
- [ ] Subscribe/unsubscribe prompt
- [ ] Unsubscribe option

#### Reporter App
- [ ] OTP login (phone number)
- [ ] Reporter dashboard (my articles)
- [ ] Submit article form (Hindi)
- [ ] Photo upload (camera/gallery)
- [ ] Save draft (auto-save)
- [ ] Submit for review
- [ ] Submission confirmation
- [ ] View rejection reason

#### Editor Dashboard
- [ ] Pending articles queue
- [ ] Approve article (one click)
- [ ] Reject with reason
- [ ] Edit article before publishing
- [ ] Mark as Breaking News
- [ ] Unpublish article

#### Admin Panel
- [ ] All articles CRUD
- [ ] Category management
- [ ] District management (88 districts)
- [ ] Breaking news ticker manager
- [ ] Add/manage reporters
- [ ] Role assignment
- [ ] Suspend reporter

#### UI / UX
- [ ] Dark mode (system + manual)
- [ ] Hindi-first UI (all labels)
- [ ] Responsive mobile-first design
- [ ] Image lazy loading
- [ ] Friendly Hindi error messages

#### Performance & SEO
- [ ] React Helmet (dynamic meta tags per article)
- [ ] Open Graph tags (WhatsApp/Facebook preview)
- [ ] Cloudinary CDN for all media
- [ ] Vite build optimization (code splitting, tree shaking)
- [ ] Noto Sans Devanagari preloaded
- [ ] React Query (smart data caching on client)
- [ ] Lazy loading images + components


---

### 🟠 Should Have — V2 (Month 2-3)

- [ ] Trending articles sidebar
- [ ] YouTube video section (homepage)
- [ ] YouTube Shorts strip
- [ ] Live stream auto-banner (🔴 LIVE)
- [ ] Instagram feed embed
- [ ] WhatsApp Channel join CTA
- [ ] Bookmark / Save for later (IndexedDB)
- [ ] Reading history (last 20)
- [ ] Social sharing (Facebook + Copy link)
- [ ] Loading skeleton screens
- [ ] Pull to refresh
- [ ] Background sync (offline submissions)
- [ ] Reporter location auto-fill (GPS)
- [ ] Multiple photo upload (up to 5)
- [ ] Category/district subscriptions (push)
- [ ] Admin broadcast push notification
- [ ] Reporter performance stats
- [ ] Article views count display
- [ ] Sitemap auto-generation
- [ ] Google News structured data

### 🟡 Nice to Have — V2+ (Month 3-4)
- [ ] Mandi rate widget (आज के मंडी भाव)
- [ ] Weather widget per district
- [ ] Font size control (A- / A / A+)
- [ ] Video full page (`/videos`)
- [ ] Photo gallery strip
- [ ] Search filters (district, category, date)
- [ ] Trending search keywords
- [ ] Article schedule (future publish)
- [ ] Analytics dashboard (admin)
- [ ] Instagram Story auto-generator
- [ ] Cross-post tool (one article → all platforms)
- [ ] Google AdSense integration
- [ ] Political ad disclosure label

### 🟢 Future — V3 (Month 6+)
- [ ] Live election results ticker
- [ ] District map view (clickable)
- [ ] Comments system
- [ ] Multilingual (English articles)
- [ ] Audio news (Hindi TTS)
- [ ] Reader accounts (cross-device sync)
- [ ] Personalized feed by district

---

## 8. SECURITY PLAN

### Authentication
```
Login Flow:
1. User enters phone number
2. OTP generated (6 digits) → hashed → stored in OtpSession (5 min expiry)
3. SMS sent via Fast2SMS / MSG91
4. User enters OTP → verified against hash
5. JWT token issued (24hr) + Refresh token (30 days)
6. Failed OTP 3x → IP blocked for 15 minutes
```

### API Security
| Protection | Implementation | Limit |
|---|---|---|
| Rate limiting | express-rate-limit + Upstash Redis | 100 req/min per IP |
| Input validation | Zod schemas | All endpoints |
| Auth middleware | JWT verify (jsonwebtoken) | All protected routes |
| Role check | Mongoose role field | Admin/Editor/Reporter routes |
| CORS | allowlist Vercel frontend URL only | Block third-party abuse |
| HTTPS | Enforced via Render + Vercel | All traffic |

### Content Security
| Risk | Defense |
|---|---|
| Fake news | Editor approval mandatory |
| XSS via content | DOMPurify sanitization |
| Script injection | TipTap strips `<script>` tags |
| NoSQL injection | Mongoose sanitization + `express-mongo-sanitize` |
| Image malware | Cloudinary scans all uploads |
| File bomb | Max 5MB, only jpg/png/webp |

### Infrastructure Security
- [ ] All secrets in Render environment variables (never in code)
- [ ] Admin panel: role-based middleware on Express routes
- [ ] MongoDB Atlas: IP allowlist (only Render's IPs)
- [ ] `npm audit` run in CI/CD pipeline
- [ ] helmet.js: security headers on all Express responses
- [ ] CORS: only allow `https://your-site.vercel.app`

### Environment Variables

**backend/.env** (on Render)
```env
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ambition

# JWT
JWT_SECRET=your_strong_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=30d

# SMS OTP
FAST2SMS_API_KEY=
# OR
MSG91_AUTH_KEY=
MSG91_TEMPLATE_ID=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Web Push (VAPID)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:admin@ambition.news

# YouTube
YOUTUBE_API_KEY=
YOUTUBE_CHANNEL_ID=

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-site.vercel.app
```

**frontend/.env** (on Vercel)
```env
VITE_API_URL=https://your-backend.onrender.com
VITE_VAPID_PUBLIC_KEY=
VITE_SITE_NAME=Ambition News
VITE_YT_CHANNEL_URL=https://youtube.com/@YourChannel
VITE_INSTAGRAM_URL=https://instagram.com/YourHandle
VITE_WHATSAPP_CHANNEL_URL=https://whatsapp.com/channel/...
```

---

## 9. SCALABILITY & TRAFFIC PLAN

### Architecture (Node + React + MongoDB)
```
User Browser (React PWA)
    ↓
Vercel CDN (Static assets + SPA)
    ↓ API calls (Axios)
Render (Node + Express backend)
    ↓
Upstash Redis (Cache — 30s TTL)
    ↓ [Cache miss only]
MongoDB Atlas (M0 Free → M10 Paid)
    ↓
Cloudinary (Images / Media)

```

### Caching Strategy
| Resource | Cache | TTL |
|---|---|---|
| Article detail pages | Vercel Edge + Cloudflare | 60 seconds |
| Homepage | Vercel Edge | 30 seconds |
| Category pages | Vercel Edge | 60 seconds |
| Breaking news ticker | Redis | 10 seconds |
| Article list API | Redis | 30 seconds |
| Static assets (JS/CSS) | CDN | 1 year (immutable) |
| Images | Cloudinary CDN | 30 days |
| YouTube videos | Redis | 1 hour |

### Traffic Spike Handling
| Scenario | Expected Spike | Defense |
|---|---|---|
| Election day | 200x | Edge cache absorbs 99% |
| Breaking crime news | 50x | Redis + CDN |
| Natural disaster | 100x | Cloudflare + Auto-scale Vercel |
| Viral article | 30x | Edge cache + CDN |

### Scaling Thresholds
| Users/day | Action | Cost |
|---|---|---|\
| < 1,000 | Free tiers only (Render + Atlas M0) | ₹0/month |
| 1K–10K | Upgrade MongoDB Atlas M10 + Render Starter | ~₹5,000/month |
| 10K–1L | Atlas M20 + Redis paid + Cloudinary Plus | ~₹15,000/month |
| 1L+ | Atlas dedicated cluster + Redis cluster | ~₹30,000/month |

---

## 10. PWA PLAN

### manifest.json
```json
{
  "name": "Ambition News — CG & MP",
  "short_name": "Ambition",
  "description": "छत्तीसगढ़ और मध्यप्रदेश की स्थानीय खबरें",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#dc2626",
  "lang": "hi",
  "dir": "ltr",
  "categories": ["news"],
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    {
      "src": "/icons/icon-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### Service Worker Cache Strategy
| Resource | Strategy | TTL |
|---|---|---|
| HTML Pages | Network First → Cache Fallback | 24 hours |
| Images | Cache First | 30 days |
| API `/api/articles` | Stale While Revalidate | 1 hour |
| Static JS/CSS | Cache First (immutable) | 1 year |
| Offline fallback | Cache only | Permanent |

### Offline Features
- Last 20 articles cached automatically
- Bookmarks stored in IndexedDB
- Reporter can write draft offline (syncs on reconnect)
- Offline banner shows cached articles

---

## 11. SOCIAL MEDIA INTEGRATION

### YouTube Integration
| Feature | Method | Priority |
|---|---|---|
| Latest videos on homepage | YouTube Data API v3 | V1 |
| Auto-fetch every hour | API + Redis cache | V1 |
| Subscribe CTA button | Deep link | V1 |
| YouTube Shorts strip | API filter (duration < 60s) | V2 |
| 🔴 LIVE auto-banner | API live status check | V2 |
| Full videos page `/videos` | API | V2 |

```
YouTube API Setup:
- YouTube Data API v3 (free — 10,000 quota/day)
- Fetch: latest 20 videos, subscriber count, live status
- Cache in Redis: 1 hour
- Channel ID stored in SiteConfig table
```

### Instagram Integration
| Feature | Method | Priority |
|---|---|---|
| Follow CTA button | Manual link | V1 |
| Instagram feed grid | Manual embed (V1) → API (V2) | V1/V2 |
| Reels strip | Instagram embed | V2 |
| Story auto-generator | Canvas API | V2 |

### WhatsApp Integration
| Feature | Method | Priority |
|---|---|---|
| Share button (every article) | wa.me deep link | V1 |
| WhatsApp Channel join CTA | Link | V1 |
| Breaking news broadcast | Manual (V1) → API (V2) | V1/V2 |

**WhatsApp Share Format:**
```
*{headline}*

{excerpt}

पूरी खबर पढ़ें 👇
{article_url}

_Ambition News — CG & MP_
```

### Facebook Integration
| Feature | Method | Priority |
|---|---|---|
| Share button | Facebook SDK / og: tags | V1 |
| Open Graph preview | Meta tags in `<head>` | V1 |
| Auto-post to page | Meta Graph API | V2 |

---

## 12. API PLAN

### Public APIs (No Auth Required)
```
GET  /api/articles              → List articles (paginated, filterable)
GET  /api/articles/[id]         → Single article
GET  /api/articles/slug/[slug]  → Article by slug
GET  /api/categories            → All categories
GET  /api/districts             → All districts (by state)
GET  /api/states                → CG + MP
GET  /api/search?q=             → Search articles
GET  /api/breaking              → Breaking news ticker items
GET  /api/youtube/videos        → Latest YouTube videos (cached)
GET  /api/youtube/live          → Is channel live?
```

### Reporter APIs (REPORTER + EDITOR + ADMIN role)
```
POST /api/articles              → Create/submit article
PUT  /api/articles/[id]         → Update own article (DRAFT only)
POST /api/upload                → Upload image to Cloudinary
GET  /api/reporter/articles     → My articles list
```

### Editor APIs (EDITOR + ADMIN role)
```
GET  /api/admin/pending         → Pending review queue
PUT  /api/admin/articles/[id]/approve  → Approve article
PUT  /api/admin/articles/[id]/reject   → Reject with reason
PUT  /api/admin/articles/[id]/breaking → Toggle breaking flag
```

### Admin APIs (ADMIN role only)
```
GET/POST/PUT/DELETE /api/admin/categories
GET/POST/PUT/DELETE /api/admin/districts
GET/POST/PUT/DELETE /api/admin/reporters
POST /api/push/send             → Broadcast push notification
GET  /api/admin/analytics       → Traffic + article stats
```

### Auth APIs
```
POST /api/auth/send-otp         → Send OTP to phone (rate limited: 3/hour)
POST /api/auth/verify-otp       → Verify OTP → return JWT
POST /api/auth/refresh          → Refresh JWT using refresh token
POST /api/auth/logout           → Clear session
```

---

## 13. CACHING STRATEGY

```
Layer 1: Cloudflare CDN    — Static assets, images
Layer 2: Vercel Edge Cache — HTML pages (30–60s)
Layer 3: Redis (Upstash)   — API responses (10–60s)
Layer 4: Browser Cache     — Service Worker (24hr offline)
Layer 5: IndexedDB         — Bookmarks + drafts (permanent)
```

---

## 14. MONITORING & ALERTS

| What | Tool | Alert |
|---|---|---|
| Site uptime | Better Uptime (free) | SMS if down > 1 min |
| JS errors | Sentry (free tier) | Email on new error |
| API response time | Vercel Analytics | Alert if p95 > 2s |
| Database load | MongoDB Atlas dashboard | Alert if connections > 80% |
| Traffic spike | Cloudflare Analytics | Alert on 10x spike |
| Failed OTPs | Custom logging | Alert if failure > 20% |

---

## 15. DISASTER RECOVERY

| Scenario | Recovery Time | Action |
|---|---|---|
| Bad deployment | < 5 min | Vercel rollback (1 click) |
| Wrong article published | < 1 min | Admin unpublish |
| Database corrupted | < 1 hr | Restore from MongoDB Atlas backup |
| DDoS attack | < 5 min | Cloudflare "Under Attack" mode |
| Accidental data delete | < 1 hr | Daily backup restore |

### Backup Schedule
| Data | Frequency | Retention | Where |
|---|---|---|---|
| MongoDB Atlas | Daily automatic (M10+) / Manual export (M0) | 7 days | Atlas Cloud |
| Media files | Real-time | Permanent | Cloudinary |
| Code | Every commit | Forever | GitHub |
| .env secrets | Manual | Always | Encrypted manager |

---

## 16. LEGAL & COMPLIANCE

### Required Pages
- [ ] Privacy Policy (IT Act 2000 + GDPR basics)
- [ ] Terms of Service
- [ ] Editorial Policy (how articles are verified)
- [ ] DMCA / Takedown Policy
- [ ] About Us (mandatory for news credibility)
- [ ] Grievance Officer name + contact (IT Rules 2021)

### Data Handling
| Data | How Stored | Retention |
|---|---|---|
| Phone numbers | Hashed in DB | Until account deleted |
| OTP codes | Hashed, auto-deleted | 5 minutes |
| IP addresses | Cloudflare logs | 30 days |
| Article content | Plain text in DB | Permanent (news archive) |

### DLT Registration (SMS Compliance)
> ⚠️ **Required**: Register OTP SMS template with TRAI DLT  
> Timeline: 2–3 weeks for approval  
> Provider: Fast2SMS or MSG91 (both support DLT)

---

## 17. COST PLAN

### Infrastructure Costs
| Stage | Users/day | Monthly Cost |
|---|---|---|
| Launch (free tiers) | < 1,000 | ₹500 (SMS only) |
| Growing | < 10,000 | ~₹6,500 |
| Popular | < 1 lakh | ~₹15,000 |
| Scale | 1 lakh+ | ~₹30,000 |

### Revenue Potential
| Source | When | Estimate |
|---|---|---|
| Local business ads | Month 2+ | ₹5,000–₹50,000/month |
| Political ads | Election season | ₹50,000–₹5,00,000 |
| Google AdSense | Month 3+ | ₹3,000–₹30,000/month |
| Sponsored articles | Month 2+ | ₹2,000–₹20,000/article |
| YouTube AdSense | 1K+ subscribers | ₹3,000–₹8,000/1L views |

---

## 18. PHASED BUILD TIMELINE

### Phase 0 — Foundation (Week 1–2)
- [ ] Project setup (React 18 + Vite + TypeScript + Tailwind)
- [ ] Node.js + Express backend setup
- [ ] MongoDB Atlas connection + Mongoose models
- [ ] Seed data (88 districts, 12 categories, 2 states)
- [ ] GitHub repo + CI/CD pipeline
- [ ] Vercel deployment setup
- [ ] Cloudflare DNS + SSL

### Phase 1 — Core Portal (Week 3–5)
- [ ] Homepage (hero, ticker, category tabs, news feed)
- [ ] Article detail page (Hindi, SSR)
- [ ] Category pages
- [ ] District pages
- [ ] State pages (CG + MP)
- [ ] Dark mode
- [ ] Responsive design
- [ ] Cloudinary image optimization

### Phase 2 — PWA + Push (Week 6)
- [ ] manifest.json
- [ ] App icons + splash screen
- [ ] Service worker (Workbox)
- [ ] Offline fallback
- [ ] Offline article cache
- [ ] Install prompt component
- [ ] Push notification subscribe
- [ ] Breaking news auto-push

### Phase 3 — Reporter + Editor (Week 7–8)
- [ ] OTP login system (SMS)
- [ ] Reporter dashboard
- [ ] Article submission form (Hindi)
- [ ] Photo upload (Cloudinary)
- [ ] Draft auto-save
- [ ] Editor approval queue
- [ ] Approve / Reject flow
- [ ] Breaking + Featured toggle

### Phase 4 — Admin Panel (Week 9)
- [ ] Admin dashboard
- [ ] All articles CRUD
- [ ] Reporter management
- [ ] Category + District management
- [ ] Breaking ticker manager
- [ ] Push broadcast tool

### Phase 5 — Security Hardening (Week 9–10)
- [ ] Rate limiting (Upstash)
- [ ] CSP headers
- [ ] Input validation (Zod on all APIs)
- [ ] OTP brute-force protection
- [ ] Role-based middleware
- [ ] DOMPurify content sanitization
- [ ] Load testing (k6)

### Phase 6 — Social Media (Week 10–11)
- [ ] YouTube API integration
- [ ] WhatsApp share buttons
- [ ] Open Graph meta tags
- [ ] Facebook share
- [ ] Instagram CTA
- [ ] WhatsApp Channel CTA

### Phase 7 — Search + SEO (Week 11)
- [ ] MongoDB Atlas Search (Hindi full-text — built-in, no extra setup)
- [ ] Sitemap auto-generation
- [ ] Schema.org NewsArticle markup
- [ ] Google News submission

### Phase 8 — Launch (Week 12)
- [ ] Seed 30+ articles
- [ ] Onboard 5 reporters
- [ ] All districts data complete
- [ ] Legal pages published
- [ ] DLT registration done
- [ ] Lighthouse score ≥ 90
- [ ] Load test passed
- [ ] Soft launch (CG first)
- [ ] Monitor for 1 week
- [ ] MP districts launch

---

## 19. PRE-LAUNCH CHECKLIST

### Security ✅
- [ ] All API routes rate-limited
- [ ] CSP headers configured
- [ ] HTTPS enforced everywhere
- [ ] Admin routes protected by role middleware
- [ ] OTP brute-force protection active
- [ ] DOMPurify content sanitization active
- [ ] All secrets in Vercel env vars (NOT in code)
- [ ] `npm audit` — zero critical vulnerabilities

### Performance ✅
- [ ] Lighthouse Performance ≥ 90
- [ ] Lighthouse PWA score = 100
- [ ] Lighthouse Accessibility ≥ 95
- [ ] All images via Cloudinary CDN
- [ ] Article pages cached at edge
- [ ] Load test passed (5,000 concurrent users)

### PWA ✅
- [ ] manifest.json valid (Chrome DevTools check)
- [ ] Service worker registered
- [ ] Install prompt tested on Android Chrome
- [ ] Install prompt tested on iOS Safari
- [ ] Offline reading tested on airplane mode
- [ ] Offline reading tested on 2G simulation
- [ ] Push notification delivered end-to-end

### Content ✅
- [ ] 30+ seed articles published
- [ ] All 12 categories have at least 2 articles
- [ ] At least 10 districts have articles
- [ ] Breaking ticker configured with live text

### Reporter ✅
- [ ] 5 reporters onboarded
- [ ] Reporters tested submission on their own phones
- [ ] Editor reviewed and approved a test article
- [ ] Rejection flow tested (reporter sees reason)

### Legal ✅
- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] Editorial Policy published
- [ ] Grievance Officer named (IT Rules 2021)
- [ ] DLT registration submitted (or approved)

### Monitoring ✅
- [ ] Sentry connected (errors tracked)
- [ ] Better Uptime monitoring active
- [ ] Vercel Analytics enabled
- [ ] Cloudflare Analytics enabled

---

## 20. OPEN QUESTIONS

Before development starts, confirm these:

| # | Question | Your Answer |
|---|---|---|
| 1 | Portal name — "Ambition" confirmed? | |
| 2 | Start with CG only or both CG + MP at launch? | |
| 3 | Brand color — Red `#dc2626` or different? | |
| 4 | Domain name ready? (e.g., ambition.news) | |
| 5 | YouTube Channel URL / Handle? | |
| 6 | Instagram Handle? | |
| 7 | WhatsApp Channel link? | |
| 8 | SMS provider — Fast2SMS or MSG91? | |
| 9 | Who is the admin (you only, or team)? | |
| 10 | Monetization in V1 — ads or free first? | |
| 11 | Content to seed — 30 articles ready? | |
| 12 | How many reporters at launch? | |

---

## DOCUMENT STATUS

| Section | Status |
|---|---|
| Product Discovery | ✅ Complete |
| Security Plan | ✅ Complete |
| Scalability Plan | ✅ Complete |
| Features List | ✅ Complete |
| Database Schema | ✅ Complete |
| Social Media Plan | ✅ Complete |
| Build Timeline | ✅ Complete |
| **Start Building** | ⏳ Awaiting Approval |

---

*Ambition News Portal — Master Implementation Plan v1.0*  
*Prepared: September 2026*

