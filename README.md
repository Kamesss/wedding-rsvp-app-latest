# James & Amber — Wedding RSVP Portal

An editorial wedding invitation and RSVP portal with animated wax seal envelope opening, household/party RSVP management, event schedule, venue guides, attire palette, and dual-backend support (Local Node.js + SQLite and Cloudflare Workers + D1).

---

## Features

- **Personalized Guest Lookup**: Guests enter their full name as written on their invitation to find their reservation.
- **Household & Multi-Guest Management**: Primary contacts can confirm or decline attendance on behalf of each family member within their allotted seat count.
- **Cinematic Wax Seal Envelope Animation**: Interactive wax seal break and letter unveiling prior to browsing the wedding details.
- **Comprehensive Wedding Guide**:
  - Interactive schedule of events (Ceremony, Cocktail Hour, Reception)
  - Church and reception venue locations with Google Maps shortcuts
  - Attire guidelines and dress code color palette (Sage, Forest Green, Earthy Olive, Warm Nude)
  - Frequently Asked Questions
  - Wishing well & gift registry modal
- **Dual-Runtime Architecture**:
  - **Local / Full-Stack Node**: Express server (`server.ts`) with Vite dev middleware and built-in SQLite (`node:sqlite`).
  - **Edge Deployment**: Cloudflare Workers (`worker.ts`) and Cloudflare D1 distributed SQLite database (`wrangler.toml`).

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Lucide Icons, Redux Toolkit
- **Backend (Node.js)**: Express 4, `tsx`, Node.js built-in `node:sqlite` (or `wedding.sqlite` file)
- **Backend (Edge)**: Cloudflare Workers, Cloudflare D1 Database, Wrangler
- **Styling**: Editorial typography (Fraunces, Playfair Display, Euphoria Script, Quicksand) with Burgundy and Denim Blue wedding palettes

---

## Getting Started (Local Development)

### Prerequisites

- **Node.js**: v20.0.0 or higher (Node v22+ recommended for built-in SQLite support)
- **npm**: v9+ (or `pnpm` / `bun`)

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd <repository-folder>
npm install
```

### 2. Run the Development Server

Start the local full-stack server (runs Express on port 3000 with Vite middleware):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note**: On first run, the local SQLite database (`wedding.sqlite`) will automatically be created and seeded with sample guest parties.

### 3. Build for Production

To create an optimized client bundle:

```bash
npm run build
```

To run the local production server serving the built assets from `dist/`:

```bash
npm run start
```

---

## Test & Demo Guests

The database comes pre-seeded with sample guest households to test different RSVP scenarios:

| Guest Name | Household / Party | Reserved Seats | Current Status |
| :--- | :--- | :---: | :--- |
| **John Sekiro** | The Sekiro Family | 4 seats | Pending (John, Elena, Lucas, Maya) |
| **Maria Gonzalez** | Maria Gonzalez & Family | 2 seats | Pending (Maria, Carlos) |
| **David Chen** | The Chen Family | 3 seats | Accepted (David, Sarah, Chloe) |
| **Marcus Vance** | Marcus Vance | 1 seat | Pending (Solo guest) |

*Tip: Search for **John Sekiro** on the login page to test a multi-member family RSVP submission.*

---

## Cloudflare Workers & D1 Deployment (Optional)

This project includes complete configuration to run on Cloudflare Workers with a Cloudflare D1 SQLite database.

### 1. Authenticate with Cloudflare

```bash
npx wrangler login
```

### 2. Create the D1 Database

```bash
npx wrangler d1 create wedding-rsvp-db
```

Wrangler will output your unique `database_id`.

### 3. Update `wrangler.toml`

Open `wrangler.toml` and ensure your `database_id` matches:

```toml
[[d1_databases]]
binding = "DB"
database_name = "wedding-rsvp-db"
database_id = "<YOUR-D1-DATABASE-UUID>"
```

### 4. Initialize Database Schema & Seed Data

Execute `schema.sql` against your remote D1 database:

```bash
npx wrangler d1 execute wedding-rsvp-db --remote --file=./schema.sql
```

*(For local D1 development, pass `--local` instead of `--remote`)*

### 5. Deploy to Cloudflare

```bash
npm run deploy:cloudflare
```

Your app will be built and deployed directly to Cloudflare Workers with static assets served from `dist/`.

---

## Database Schema

The database consists of two normalized tables:

### `parties` Table
- `id` (TEXT, PK): Unique party ID (e.g. `party-sekiro`)
- `party_name` (VARCHAR): Name on invitation (e.g. `The Sekiro Family`)
- `access_token` (VARCHAR, UNIQUE): Secret URL token for direct access
- `max_reserved_seats` (INT): Seat count cap for the party
- `is_submitted` (BOOLEAN): `1` once the party has finalized their RSVP
- `submitted_at` (TIMESTAMP): Date and time of submission
- `notes` (TEXT): Optional message, dietary notes, or wishes for the couple
- `created_at` (TIMESTAMP): Creation timestamp

### `guests` Table
- `id` (TEXT, PK): Unique guest ID
- `party_id` (TEXT, FK): References `parties(id)` with `ON DELETE CASCADE`
- `first_name` (VARCHAR): Guest first name
- `last_name` (VARCHAR): Guest last name
- `is_primary_contact` (BOOLEAN): `1` if the guest is the head of household
- `rsvp_status` (VARCHAR): `'pending'`, `'accepted'`, or `'declined'`
- `created_at` (TIMESTAMP): Creation timestamp

---

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/validate-guest` | Validates a guest by full name and returns their party and co-guests. |
| `GET` | `/api/party/:partyId` | Retrieves party details and guest roster by Party ID. |
| `GET` | `/api/party/token/:token` | Retrieves party details by unique invitation token. |
| `POST` | `/api/rsvp/submit` | Submits accepted/declined statuses for all party members and notes. |
| `GET` | `/api/admin/parties` | Returns overall attendance stats, seat counts, and guest lists. |
| `POST` | `/api/admin/reset` | Resets the database to default seed state (useful for demonstrations). |
| `GET` | `/api/hero-image` | Retrieves current custom hero image status and URL. |
| `POST` | `/api/hero-image` | Uploads a custom hero photo for the wedding landing page. |

---

## Project Structure

```
├── public/                 # Static assets (images, icons)
│   └── assets/images/      # Wedding photography & placeholders
├── server/
│   └── db.ts               # Local SQLite database helpers & schema
├── src/
│   ├── components/         # React UI components
│   │   ├── LoginPage.tsx          # Guest lookup screen
│   │   ├── WaxEnvelopeOverlay.tsx # Animated wax seal invitation
│   │   ├── WeddingMainPage.tsx    # Main wedding portal
│   │   ├── RegistryModal.tsx      # Gift registry modal
│   │   ├── RsvpModal.tsx          # Pop-up RSVP manager
│   │   └── D1InfoModal.tsx        # D1 integration guide modal
│   ├── store/              # Redux Toolkit & RTK Query API slice
│   ├── types.ts            # TypeScript data models
│   ├── App.tsx             # Root application orchestrator
│   └── main.tsx            # React DOM entry point
├── schema.sql              # Cloudflare D1 SQL schema and seeds
├── server.ts               # Express full-stack dev/production server
├── worker.ts               # Cloudflare Worker for edge deployment
├── wrangler.toml           # Cloudflare Workers & D1 configuration
└── package.json            # Scripts and dependencies
```

---

## Available Scripts

- `npm run dev`: Runs the local full-stack server on `http://localhost:3000` with HMR.
- `npm run build`: Compiles TypeScript and creates optimized production client build in `dist/`.
- `npm run start`: Runs production Express server using Node's SQLite engine.
- `npm run lint`: Runs TypeScript validation (`tsc --noEmit`).
- `npm run deploy:cloudflare`: Builds client and deploys to Cloudflare Workers with D1 binding.
- `npm run clean`: Cleans generated build artifacts.

---

## License

Private project for James & Amber's Wedding Celebration.
