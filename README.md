# Agency SEO Intelligence Platform

One operating system for SEO agencies: every client in one workspace, with Search Console, GA4, Google Business Profile, leads, bookings, keyword tracking, a manual SEO work log, an AI SEO analyst (Claude), and a branded monthly report generator.

Stack: Next.js 14 (App Router) · TypeScript · TailwindCSS · Prisma · PostgreSQL (Supabase) · NextAuth (Google OAuth) · Recharts · Claude API · Vercel.

## What works out of the box (Phase 1)

- Full PostgreSQL schema for the entire product (see `prisma/schema.prisma`)
- Google sign-in (NextAuth + Prisma adapter) with role field on users
- Agency overview dashboard and per-client workspaces with KPI cards and traffic charts
- Leads, bookings, keywords (with position history + movement), and the manual SEO work log, all via REST APIs (single items or bulk arrays for CSV/Sheets/webhook imports)
- AI SEO analyst: `POST /api/ai/insights` gathers a month of real client data and has Claude write a consultant-grade analysis, or answer ad-hoc questions ("Why did clicks decrease?")
- Monthly report generator: `POST /api/reports/generate` builds an editable, sectioned report (cover, executive summary, KPIs, work-log table, manual notes, action plan) stored as JSON

## What needs your accounts/approval (Phase 2)

- **Search Console + GA4 live sync**: code is in `src/lib/google/`. You need a Google Cloud project with those APIs enabled and OAuth consent verified. Store per-client tokens in `IntegrationAccount`.
- **Google Business Profile**: Google gates these APIs behind a manual access-request form (takes days to weeks). Until approved, record GBP metrics via `MetricSnapshot` manually or CSV.
- **Server-side PDF/PPT/Excel export**: reports render as branded HTML (print-to-PDF works immediately). Add Playwright or @react-pdf for server PDFs, and exceljs/pptxgenjs for Excel/PowerPoint, when needed.
- **White-label theming UI**: the `Agency` model already stores logo, colors, and footer; wire them into the report view.

## Local setup

```bash
npm install
cp .env.example .env   # fill in Supabase, Google OAuth, Anthropic values
npx prisma db push     # creates all tables
npm run dev
```

## Key API routes

| Route | Purpose |
| --- | --- |
| `GET/POST /api/clients` | List/create clients |
| `GET/POST /api/leads?clientId=` | Leads (POST accepts an array for imports) |
| `GET/POST /api/bookings?clientId=` | Bookings (array imports supported) |
| `GET/POST /api/keywords?clientId=` | Keywords with movement calculation |
| `GET/POST /api/worklog?clientId=&month=YYYY-MM` | Manual SEO work log |
| `POST /api/ai/insights` | `{clientId, month, question?}` AI analysis |
| `GET/POST /api/reports/generate` | Build/list monthly reports |

See `DEPLOYMENT.md` for the Vercel + Supabase + Google Cloud walkthrough.

## Environment variables

- **ANTHROPIC_API_KEY**: Add your Anthropic API key to `.env.local` at the project root. This repository already ignores `.env` and `.env.local`.
