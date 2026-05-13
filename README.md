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
- [Pricebook build (algorithm)](#pricebook-build-algorithm)
- [Field-view sequence](#field-view-sequence)
- [Getting Started](#getting-started)
- [🗺️ Repository map](#️-repository-map)
- [📊 Code composition](#-code-composition)

## Pricebook build (algorithm)

```mermaid
flowchart LR
    A([import parts catalog<br/>CSV])
    B["normalize SKUs<br/>units · categories"]
    C["set markup rules<br/>tier % per category"]
    D["compute flat rates<br/>cost → retail"]
    E["organize sections<br/>HVAC / plumbing / electrical"]
    F["persist pricebook"]
    G{"export?"}
    H["@react-pdf PDF"]
    I["mobile field URL"]
    Z([share with techs])
    A --> B --> C --> D --> E --> F --> G
    G -- pdf --> H --> Z
    G -- mobile --> I --> Z
```

## Field-view sequence

```mermaid
sequenceDiagram
    participant T as tech (tablet)
    participant APP as mobile pricebook
    participant DB as Supabase
    participant C as customer

    T->>APP: open pricebook URL
    APP->>DB: fetch latest pricebook
    DB-->>APP: items + flat rates
    T->>APP: select items for job
    APP-->>T: total quote
    T->>C: present quote on tablet
    C-->>T: approve
```

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


## 🗺️ Repository map

Top-level layout of `tradebooks` rendered as a Mermaid mindmap (auto-generated from the on-disk tree).

```mermaid
mindmap
  root((tradebooks))
    public/
      file.svg
      globe.svg
      next.svg
      vercel.svg
      window.svg
    src/
      app
      components
      lib
      types
    supabase/
      migrations
    files
      README.md
      next.config.ts
      package.json
      tsconfig.json
```


## 📊 Code composition

File-type breakdown of source under this repo (skips `.git`, `node_modules`, build caches, lockfiles).

```mermaid
pie showData title File-type composition of tradebooks (52 files)
    "TypeScript" : 35
    "SVG image" : 5
    "Markdown" : 4
    "JSON" : 3
    "JavaScript" : 2
    "SQL" : 1
    "Image" : 1
    "CSS" : 1
```
