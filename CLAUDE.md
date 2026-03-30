# CLAUDE.md — TradeBooks

## Project Overview
TradeBooks is a flat-rate pricebook generator for small trade contractors (HVAC, plumbing, electrical). Contractors create professional flat-rate pricebooks by importing their parts catalog, setting markup percentages, and generating mobile-friendly pricebooks they can use in the field on tablets or print as PDFs.

**Tagline:** "Professional pricebooks in minutes, not months. $29/mo."

## Tech Stack
- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Database**: Supabase (Postgres + Auth)
- **Auth**: Supabase Google OAuth + email/password
- **Styling**: Tailwind CSS + shadcn/ui
- **PDF Generation**: @react-pdf/renderer or jspdf
- **Deployment**: Vercel
- **Payments**: Stripe (add later — free trial first)

## Architecture
```
src/
├── app/
│   ├── page.tsx              # Landing page (marketing)
│   ├── layout.tsx            # Root layout
│   ├── auth/
│   │   ├── login/page.tsx    # Login page
│   │   ├── signup/page.tsx   # Signup page
│   │   └── callback/route.ts # OAuth callback
│   ├── dashboard/
│   │   ├── page.tsx          # Dashboard overview
│   │   └── layout.tsx        # Dashboard layout with sidebar
│   ├── pricebooks/
│   │   ├── page.tsx          # List all pricebooks
│   │   ├── new/page.tsx      # Create new pricebook
│   │   └── [id]/
│   │       ├── page.tsx      # View/edit pricebook
│   │       └── field/page.tsx # Mobile field view (tablet optimized)
│   ├── parts/
│   │   ├── page.tsx          # Parts catalog management
│   │   └── import/page.tsx   # CSV import
│   └── api/
│       ├── pricebook/
│       │   └── pdf/route.ts  # Generate PDF export
│       └── parts/
│           └── import/route.ts # CSV import handler
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   ├── landing/              # Landing page sections
│   ├── pricebook/            # Pricebook-specific components
│   │   ├── PricebookBuilder.tsx
│   │   ├── CategoryEditor.tsx
│   │   ├── PartRow.tsx
│   │   ├── MarkupCalculator.tsx
│   │   └── FieldView.tsx     # Tablet-optimized field view
│   └── parts/
│       ├── PartsTable.tsx
│       ├── PartForm.tsx
│       └── CSVImporter.tsx
├── lib/
│   ├── supabase.ts           # Supabase browser client
│   ├── supabase-server.ts    # Supabase server client
│   ├── pricing.ts            # Markup calculation logic
│   └── utils.ts
└── types/
    └── index.ts              # TypeScript types
```

## Database Schema (Supabase)

```sql
-- Users are managed by Supabase Auth

-- Pricebooks
create table pricebooks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  trade text not null check (trade in ('hvac', 'plumbing', 'electrical', 'general')),
  description text,
  default_labor_rate numeric(10,2) default 95.00,
  default_parts_markup numeric(5,2) default 50.00,
  default_materials_markup numeric(5,2) default 30.00,
  tax_rate numeric(5,2) default 0.00,
  currency text default 'USD',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Categories within a pricebook
create table categories (
  id uuid default gen_random_uuid() primary key,
  pricebook_id uuid references pricebooks(id) on delete cascade not null,
  name text not null,
  description text,
  sort_order integer default 0,
  labor_rate_override numeric(10,2),
  parts_markup_override numeric(5,2),
  created_at timestamptz default now()
);

-- Parts/items in catalog
create table parts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  pricebook_id uuid references pricebooks(id) on delete cascade not null,
  name text not null,
  description text,
  part_number text,
  cost numeric(10,2) not null default 0,
  labor_minutes integer default 60,
  flat_rate_price numeric(10,2), -- calculated or manually overridden
  is_custom_price boolean default false,
  unit text default 'each',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table pricebooks enable row level security;
alter table categories enable row level security;
alter table parts enable row level security;

-- RLS policies
create policy "Users can manage own pricebooks" on pricebooks
  for all using (auth.uid() = user_id);

create policy "Users can manage categories in own pricebooks" on categories
  for all using (pricebook_id in (select id from pricebooks where user_id = auth.uid()));

create policy "Users can manage own parts" on parts
  for all using (auth.uid() = user_id);
```

## Core Features (MVP)

### 1. Landing Page
- Hero: "Stop Guessing Prices. Start Profiting." 
- Pain point: "Your competitors use professional pricebooks. You're still using sticky notes."
- Features grid: Import parts, set markup, generate pricebook, use in field
- Pricing: $29/mo Solo, $49/mo Team (show as coming soon, start with free)
- CTA: "Start Free — No Credit Card Required"
- Trust: "Built for HVAC, Plumbing & Electrical contractors"

### 2. Parts Catalog
- Add parts manually (name, part number, cost, labor time)
- CSV import (columns: name, part_number, cost, labor_minutes, category)
- Organize by categories (e.g., "AC Repair", "Furnace Install", "Water Heaters")
- Bulk edit support

### 3. Pricebook Builder
- Select trade type (HVAC/Plumbing/Electrical)
- Set global markup rates:
  - Parts markup % (default 50%)
  - Materials markup % (default 30%)
  - Hourly labor rate (default $95/hr)
  - Tax rate
- Override per-category or per-item
- Live preview of flat rate prices
- Formula: `flat_rate = (part_cost * (1 + markup%)) + (labor_minutes/60 * labor_rate)`

### 4. Field View (Mobile/Tablet Optimized)
- Full-screen, touch-friendly view
- Search parts by name or number
- Show flat-rate price prominently (large font)
- Category browsing
- Works offline (service worker + cache)
- Can be saved as PWA

### 5. PDF Export
- Professional pricebook PDF
- Company branding (logo, name, phone)
- Organized by category
- Print-ready format

## Design Guidelines
- Clean, professional feel — these are business owners, not designers
- Color scheme: Dark navy (#1e293b) + bright orange (#f97316) accent
- Large touch targets for field use
- Fast loading — trades contractors often have poor cell signal
- shadcn/ui for all form components

## Development Notes
- Use Supabase for auth and database — Misha has GitHub OAuth configured
- Start with free tier (no Stripe integration in MVP)
- Focus on core loop: add parts → set markup → view pricebook → export PDF
- The field view is the killer feature — make it feel like a native app
- Pre-populate with starter templates (common HVAC parts, common plumbing parts)

## Commands
```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run lint   # Lint
```
