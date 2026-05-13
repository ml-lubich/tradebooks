# TradeBooks

> Flat-rate pricebook generator for small trade contractors (HVAC,
> plumbing, electrical). Import your parts catalog, set markup
> percentages, and generate mobile-friendly pricebooks for the field
> on tablets — or print as PDFs.

**Tagline:** "Professional pricebooks in minutes, not months. $29/mo."

```mermaid
flowchart LR
    USER[("👤 trade contractor")]
    LANDING["🌐 / · landing"]
    AUTH{{"🔐 Supabase Auth<br/>Google · email"}}
    IMPORT["📥 parts catalog<br/>import"]
    MARKUP["🧮 markup %<br/>tier rules"]
    BOOK["📚 pricebook<br/>builder"]
    DB[("🗄 Supabase<br/>Postgres")]
    PDF[/"📄 PDF export<br/>@react-pdf/renderer"/]
    MOBILE[/"📱 mobile-friendly<br/>field view"/]

    USER --> LANDING --> AUTH
    AUTH --> IMPORT --> DB
    AUTH --> MARKUP --> BOOK
    DB --> BOOK
    BOOK --> PDF
    BOOK --> MOBILE

    classDef io fill:#0e1116,stroke:#2f81f7,stroke-width:1.5px,color:#e6edf3;
    classDef tool fill:#161b22,stroke:#3fb950,stroke-width:1.5px,color:#e6edf3;
    classDef brain fill:#161b22,stroke:#d29922,stroke-width:1.5px,color:#e6edf3;
    classDef out fill:#0e1116,stroke:#a371f7,stroke-width:1.5px,color:#e6edf3;
    class USER,DB io;
    class IMPORT,MARKUP,LANDING tool;
    class AUTH,BOOK brain;
    class PDF,MOBILE out;
```

## Table of contents

- [Stack](#stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)

## Stack

- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Database:** Supabase (Postgres + Auth)
- **Auth:** Supabase Google OAuth + email/password
- **Styling:** Tailwind CSS + shadcn/ui
- **PDF Generation:** @react-pdf/renderer or jspdf
- **Deployment:** Vercel
- **Payments:** Stripe (free trial first)

## Architecture

```
src/
├── app/        — App Router pages
├── components/ — UI components
└── lib/        — Supabase, utils
```

## Getting Started

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).
