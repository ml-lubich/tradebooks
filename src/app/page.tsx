import Link from "next/link";
import {
  Wrench,
  Upload,
  Calculator,
  BookOpen,
  Tablet,
  Check,
  ArrowRight,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/* -------------------------------------------------------------------------- */
/*  Navbar                                                                     */
/* -------------------------------------------------------------------------- */

function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Wrench className="size-6 text-orange" />
          <span className="text-xl font-bold text-navy">TradeBooks</span>
        </Link>

        {/* Nav links — hidden on mobile */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </a>
        </nav>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" render={<Link href="/auth/login" />}>
            Log in
          </Button>
          <Button
            size="sm"
            className="bg-orange text-white hover:bg-orange-dark"
            render={<Link href="/auth/signup" />}
          >
            Start Free
          </Button>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero                                                                       */
/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      {/* Decorative grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      {/* Radial glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-orange/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="mb-6 bg-orange/15 text-orange-light border-orange/25">
            Built for HVAC, Plumbing &amp; Electrical
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Stop Guessing Prices.{" "}
            <span className="text-orange">Start Profiting.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
            Professional flat-rate pricebooks in minutes, not months. Built for
            HVAC, Plumbing &amp; Electrical contractors.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="bg-orange text-white hover:bg-orange-dark h-12 px-8 text-base"
              render={<Link href="/auth/signup" />}
            >
              Start Free — No Credit Card
              <ArrowRight className="ml-2 size-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              render={<a href="#how-it-works" />}
            >
              See How It Works
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pain Point                                                                 */
/* -------------------------------------------------------------------------- */

function PainPoint() {
  return (
    <section className="bg-zinc-50 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-2xl font-semibold leading-snug text-navy sm:text-3xl">
          Your competitors use professional pricebooks.{" "}
          <span className="text-muted-foreground">
            You&rsquo;re still using sticky notes and spreadsheets.
          </span>
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Feature Grid                                                               */
/* -------------------------------------------------------------------------- */

const features = [
  {
    icon: Upload,
    title: "Import Your Parts",
    description:
      "Upload your parts catalog from a CSV or add items one-by-one. Bring your existing data in seconds.",
  },
  {
    icon: Calculator,
    title: "Set Your Markup",
    description:
      "Define global markup percentages, labor rates, and tax — then override per-category or per-item.",
  },
  {
    icon: BookOpen,
    title: "Generate Pricebook",
    description:
      "Instantly produce a professional, print-ready pricebook you can share with your team or hand to techs.",
  },
  {
    icon: Tablet,
    title: "Use in the Field",
    description:
      "Pull up flat-rate prices on any tablet or phone — even offline. Search, browse, and quote on the spot.",
  },
];

function FeatureGrid() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            Everything you need to build a pricebook
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From CSV import to field-ready pricing — in four simple steps.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="border-0 shadow-md">
              <CardHeader>
                <div className="mb-2 flex size-12 items-center justify-center rounded-lg bg-orange/10">
                  <f.icon className="size-6 text-orange" />
                </div>
                <CardTitle className="text-navy">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  How It Works                                                               */
/* -------------------------------------------------------------------------- */

const steps = [
  {
    num: "1",
    title: "Import your parts catalog",
    description:
      "Upload a CSV with your parts, costs, and labor times — or enter them manually. We handle the rest.",
  },
  {
    num: "2",
    title: "Set markup percentages",
    description:
      "Choose your parts markup, labor rate, and tax. Fine-tune by category or individual item.",
  },
  {
    num: "3",
    title: "Use your pricebook anywhere",
    description:
      "Open the field view on a tablet, export a PDF, or share with your team. Your pricebook goes where you go.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-zinc-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three steps from spreadsheet chaos to professional pricing.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-12 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.num} className="text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-orange text-xl font-bold text-white">
                {s.num}
              </div>
              <h3 className="mt-6 text-lg font-semibold text-navy">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pricing                                                                    */
/* -------------------------------------------------------------------------- */

const plans = [
  {
    name: "Solo",
    price: "$29",
    period: "/mo",
    description: "Perfect for independent contractors",
    features: [
      "1 user",
      "Unlimited pricebooks",
      "PDF export",
      "Field view (tablet & mobile)",
      "CSV import",
    ],
    cta: "Start Free Trial",
    highlight: true,
    comingSoon: false,
  },
  {
    name: "Team",
    price: "$49",
    period: "/mo",
    description: "For growing shops with multiple techs",
    features: [
      "Everything in Solo",
      "Up to 5 users",
      "Shared pricebooks",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlight: false,
    comingSoon: true,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. No credit card required. Upgrade when you&rsquo;re
            ready.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-3xl gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.highlight
                  ? "relative border-0 shadow-xl ring-2 ring-orange"
                  : "border-0 shadow-md"
              }
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-orange text-white border-0">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl text-navy">
                    {plan.name}
                  </CardTitle>
                  {plan.comingSoon && (
                    <Badge variant="secondary">Coming Soon</Badge>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-navy">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>

                <Separator />

                <ul className="flex flex-col gap-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Check className="size-4 shrink-0 text-orange" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className={
                    plan.highlight
                      ? "bg-orange text-white hover:bg-orange-dark w-full"
                      : "w-full"
                  }
                  variant={plan.highlight ? "default" : "outline"}
                  render={<Link href="/auth/signup" />}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bottom CTA                                                                 */
/* -------------------------------------------------------------------------- */

function BottomCTA() {
  return (
    <section className="bg-navy py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <Zap className="mx-auto mb-6 size-10 text-orange" />
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to stop leaving money on the table?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
          Join hundreds of contractors who price with confidence. Start your
          free trial today.
        </p>
        <Button
          size="lg"
          className="mt-10 bg-orange text-white hover:bg-orange-dark h-12 px-8 text-base"
          render={<Link href="/auth/signup" />}
        >
          Start Free — No Credit Card
          <ChevronRight className="ml-1 size-4" />
        </Button>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Footer                                                                     */
/* -------------------------------------------------------------------------- */

function Footer() {
  return (
    <footer className="border-t bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Wrench className="size-5 text-orange" />
            <span className="text-lg font-bold text-navy">TradeBooks</span>
          </Link>

          {/* Links */}
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <a
              href="#features"
              className="transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="transition-colors hover:text-foreground"
            >
              Pricing
            </a>
            <Link
              href="/auth/login"
              className="transition-colors hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="transition-colors hover:text-foreground"
            >
              Sign up
            </Link>
          </nav>
        </div>

        <Separator className="my-8" />

        <p className="text-center text-sm text-muted-foreground">
          &copy; 2024 TradeBooks. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <PainPoint />
        <FeatureGrid />
        <HowItWorks />
        <Pricing />
        <BottomCTA />
      </main>
      <Footer />
    </>
  );
}
