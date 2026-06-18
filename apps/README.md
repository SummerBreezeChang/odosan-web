# Odosan

A privacy-first AI home-maintenance concierge for first-time homeowners. Snap a photo of a problem → Gemini diagnoses it and gives a fair price → we match a vetted local pro → the homeowner stays anonymous until they choose to connect.

## The name

お父さん (otōsan) — Japanese for "father." The "home dad" you can call.

## Tech Stack

- **Frontend**: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4
- **Database**: PostgreSQL (Neon) via `@neondatabase/serverless`
- **AI**: Google Gemini API for photo diagnosis
- **Deployment**: Vercel (web), with PWA support
- **Hackathon requirements**:
  - H0 "Hack the Zero Stack": PostgreSQL database, Vercel deployment ✓
  - Build with Gemini XPRIZE: Gemini API integration ✓

## Quick Start

### Prerequisites

1. **Gemini API Key** — Get one from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Database** — PostgreSQL database (automatically provisioned via Neon)

### Installation

1. Clone and install dependencies:
```bash
yarn install
```

2. Set up environment variables:
```bash
# Required environment variable
GEMINI_API_KEY=your_gemini_api_key_here

# DATABASE_URL is auto-provisioned by the platform
```

3. Seed the database with East Bay providers:
```bash
# Start the dev server first
yarn dev

# Then call the seed endpoint
curl -X POST http://localhost:3000/api/seed-providers
```

4. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
/apps/web/src/
├── app/
│   ├── page.tsx                    # Homeowner flow (intake → diagnose → match → consent)
│   ├── how-it-works/page.tsx      # 4-step explainer
│   ├── privacy/page.tsx           # Privacy & security details
│   ├── home/page.tsx              # Maintenance log (My Home)
│   ├── provider/page.tsx          # Provider lead inbox
│   └── api/
│       ├── diagnose/route.ts      # Gemini API integration
│       ├── providers/route.ts     # Match providers by category + neighborhood
│       ├── leads/route.ts         # Create/fetch leads
│       └── seed-providers/route.ts # Seed East Bay provider data
└── components/
    ├── Navigation.tsx             # Global nav
    └── DateDisplay.tsx            # Client-side date formatting
```

## Core Features

### 1. Diagnosis-first
AI analyzes the problem and tells you what's wrong, the scope, and a fair price *before* you talk to anyone.

### 2. Privacy-first
Homeowners stay completely anonymous until they choose a provider. No lead spam.

### 3. Progressive disclosure
Providers see:
- Problem description + scope + photos (EXIF-stripped)
- Neighborhood only (not exact address)

Providers never see:
- Name, phone, email, or exact address
- …until the homeowner consents

### 4. Photo metadata protection
Photos are resized client-side and EXIF/GPS data is stripped before upload.

## API Endpoints

### `POST /api/diagnose`
- Input: `FormData` with `category`, `description`, `neighborhood`, optional `photo`
- Output: `{ issue, severity, recommendedCategory, scopeOfWork, fairPriceRange, diyOrPro, explanation }`
- Logs every Gemini call for cost tracking

### `GET /api/providers?category=plumbing_drainage&neighborhood=Berkeley`
- Returns top 3 matched providers for the category + neighborhood
- Prioritizes verified providers, then by rating

### `POST /api/leads`
- Creates a lead record
- Body: `{ category, problem, scope, fair_price_range, severity, neighborhood, chosen_provider_id? }`
- Returns: `{ lead_id, status }`

### `GET /api/leads?provider_id=xxx`
- Returns leads for a specific provider (provider-side inbox)

### `POST /api/seed-providers`
- Seeds 20 sample East Bay providers across 9 categories
- Idempotent (won't duplicate if already seeded)

## Database Schema

### `providers`
```sql
provider_id           TEXT PRIMARY KEY
name                  TEXT NOT NULL
category              TEXT NOT NULL
subcategories         TEXT[]
areas_served          TEXT[] (neighborhoods)
phone                 TEXT
website               TEXT
google_maps_url       TEXT
rating                DECIMAL(2,1)
source_platform       TEXT
verification_status   TEXT (verified | unverified | rejected)
notes                 TEXT
created_at            TIMESTAMP
```

### `leads`
```sql
lead_id               TEXT PRIMARY KEY
category              TEXT NOT NULL
problem               TEXT NOT NULL
scope                 TEXT NOT NULL
fair_price_range      TEXT NOT NULL
severity              TEXT (urgent | soon | monitor)
neighborhood          TEXT NOT NULL
photo_keys            TEXT[] (future: S3 keys)
status                TEXT (open | connected)
chosen_provider_id    TEXT (FK → providers)
created_at            TIMESTAMP
```

### `jobs`
```sql
job_id                TEXT PRIMARY KEY
lead_id               TEXT (FK → leads)
provider_id           TEXT (FK → providers)
final_cost            DECIMAL(10,2)
before_photo          TEXT
after_photo           TEXT
completed_at          TIMESTAMP
next_maintenance_due  DATE
created_at            TIMESTAMP
```

## Launch Market

**East Bay neighborhoods:**
- Berkeley
- North Oakland / Rockridge
- Albany
- El Cerrito
- Kensington
- Piedmont
- Emeryville
- Alameda

Target: First-time homeowners, $1M–$2M single-family homes, 30–45 years old.

## Service Categories

**Core 3 (MVP):**
- Plumbing & Drainage
- Gutters & Drainage
- Landscaping & Yard

**Fast-follow:**
- Roofing
- Electrical
- HVAC
- Pest Control
- Handyman
- Painting

## Revenue Model

- **Homeowners:** Free
- **Providers:** Pay only when a homeowner connects (charged per accepted lead)
- **Future:** Verified Pro listing fee, homeowner maintenance plan subscription

## Cost Guardrails

- Log every Gemini API call (see console logs in `/api/diagnose`)
- One diagnosis per user submission
- Client-side EXIF stripping reduces upload bandwidth
- Use local Postgres for search/matching (no external API calls except Gemini)

## PWA Support

The app is installable as a Progressive Web App:
- Manifest at `/public/manifest.json`
- Service worker ready for offline support (future)
- Works on mobile home screen

## Hackathon Deliverables

### H0 "Hack the Zero Stack" (Jun 29, 2026)
- ✅ Full-stack app
- ✅ PostgreSQL database (Neon)
- ✅ Vercel deployment
- ✅ Track 2: Monetizable B2B (provider-pay model)

### Build with Gemini XPRIZE (Aug 17, 2026)
- ✅ Gemini API integration for diagnosis
- ⏳ Real revenue from real users (requires launch + provider onboarding)
- ⏳ Optional: iOS app (future)

## Development

```bash
# Install dependencies
yarn install

# Run dev server (web)
yarn dev

# Build for production
yarn build

# Start production server
yarn start
```

## Deployment

The app is deployed on Vercel. Required environment variable:
- `GEMINI_API_KEY` - Get from [Google AI Studio](https://aistudio.google.com/app/apikey)

## Future Enhancements

- [ ] Auth (email/password for homeowners, separate provider auth)
- [ ] S3 photo storage
- [ ] Masked phone relay (Twilio)
- [ ] Stripe payment processing for provider charges
- [ ] Live Google Places API ingestion for provider verification
- [ ] Service worker for offline diagnosis caching
- [ ] SMS/email notifications for lead updates
- [ ] iOS app (SwiftUI, same backend)

## Privacy & Security

- Photos: EXIF-stripped client-side before upload
- Progressive disclosure: providers see neighborhood only, never exact address
- Consent gate: contact shared only after homeowner approval
- HTTPS in transit, encrypted at rest
- No data selling, no third-party sharing

## License

Proprietary — Hackathon submission for H0 & XPRIZE

---

Built with ❤️ in the East Bay
