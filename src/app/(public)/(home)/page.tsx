import { CalendarCheck, Layers, Star } from "lucide-react";
import Link from "next/link";
import { Aurora } from "@/components/layout/aurora";
import { CategoryBento } from "@/components/home/category-bento";
import { CategoryMarquee } from "@/components/home/category-marquee";
import { CountUp } from "@/components/ui/count-up";
import { ServiceCard } from "@/components/services/service-card";
import { HeroSearch } from "@/components/home/hero-search";
import { HowItWorks } from "@/components/home/how-it-works";
import { RevealGroup, RevealItem } from "@/components/home/reveal";
import { ButtonArrow, buttonVariants } from "@/components/ui/button";
import { LightPanel } from "@/components/ui/light-panel";
import { SectionHeader } from "@/components/ui/section-header";
import { SerifAccent } from "@/components/ui/serif-accent";
import { getSession } from "@/lib/auth";
import { getCategoriesWithCounts, getFeaturedServices, getLandingStats } from "@/lib/services";

const RATING = 4.9;

const TESTIMONIALS = [
  {
    name: "Nimali Perera",
    role: "Colombo 05",
    quote:
      "Booked a deep clean on my lunch break. The price was exactly what the site said and they arrived right on time.",
  },
  {
    name: "Kasun Fernando",
    role: "Kandy",
    quote:
      "Our kitchen tap was fixed the same afternoon. Being able to see open slots instead of phoning around is a game changer.",
  },
  {
    name: "Tharushi Silva",
    role: "Negombo",
    quote:
      "I found a maths tutor for my son in minutes. Rescheduling and tracking sessions from the dashboard is effortless.",
  },
];

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

export default async function HomePage() {
  // Read the session first: it marks the page dynamic before any DB query runs at build time.
  const session = await getSession();
  const [categories, featured, stats] = await Promise.all([
    getCategoriesWithCounts(),
    getFeaturedServices(6),
    getLandingStats(),
  ]);

  const headline = [
    <>Book trusted</>,
    <>services in</>,
    <SerifAccent key="accent">minutes</SerifAccent>,
  ];

  const chips = [
    { icon: Layers, value: `${stats.services}+`, label: "services" },
    { icon: CalendarCheck, value: stats.bookings.toLocaleString("en-US"), label: "bookings" },
    { icon: Star, value: `${RATING}/5`, label: "rating" },
  ];

  return (
    <>
      {/* 1. Hero */}
      <section className="relative isolate -mt-24 flex min-h-[92svh] items-center overflow-hidden pt-24">
        <Aurora />
        <div className="relative mx-auto flex w-full max-w-[1200px] flex-col items-center gap-7 px-4 py-16 text-center">
          <p className="animate-fade-up bg-card/60 shadow-surface text-foreground flex items-center gap-2.5 rounded-full px-4 py-2 text-sm backdrop-blur-md">
            <span className="relative flex size-2" aria-hidden="true">
              <span className="animate-pulse-ring bg-primary absolute inset-0 rounded-full" />
              <span className="bg-primary relative size-2 rounded-full" />
            </span>
            Trusted by 2,000+ customers in Sri Lanka
          </p>
          <h1 className="text-display text-foreground max-w-4xl">
            {headline.map((line, i) => (
              <span key={i} className="block overflow-hidden pb-[0.08em]">
                <span
                  className="animate-line-up block"
                  style={{ animationDelay: `${120 + i * 80}ms` }}
                >
                  {line}
                </span>
              </span>
            ))}
          </h1>
          <p
            className="animate-fade-up text-muted-foreground max-w-xl text-lg text-pretty"
            style={{ animationDelay: "400ms" }}
          >
            Compare vetted professionals, see clear prices upfront and pick a time that works for
            you. No calls, no waiting.
          </p>
          <div
            className="animate-fade-up flex w-full justify-center"
            style={{ animationDelay: "480ms" }}
          >
            <HeroSearch categories={categories} />
          </div>
          <ul className="mt-4 flex flex-wrap justify-center gap-3" aria-label="At a glance">
            {chips.map(({ icon: Icon, value, label }, i) => (
              <li key={label} className="animate-bob" style={{ animationDelay: `${i * -1.6}s` }}>
                <span className="bg-card/50 shadow-surface flex items-center gap-2.5 rounded-full px-4 py-2.5 backdrop-blur-md">
                  <Icon className="text-primary size-4" aria-hidden="true" />
                  <span className="text-foreground font-semibold">{value}</span>
                  <span className="text-muted-foreground text-sm">{label}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 2. Category marquee */}
      {categories.length > 0 && (
        <section aria-label="Browse categories" className="mx-auto max-w-[1200px] px-4 pb-8">
          <CategoryMarquee categories={categories} />
        </section>
      )}

      {/* 3. Categories bento */}
      <section className="mx-auto max-w-[1200px] px-4 py-16" aria-labelledby="categories-heading">
        <SectionHeader
          id="categories-heading"
          eyebrow="Categories"
          title="Everything your home needs"
          description="Find the right professional for the job."
          className="mb-10"
        />
        {categories.length > 0 ? (
          <CategoryBento categories={categories} />
        ) : (
          <p className="text-muted-foreground">No categories available yet.</p>
        )}
      </section>

      {/* 4. Featured services */}
      <section className="mx-auto max-w-[1200px] px-4 py-16" aria-labelledby="featured-heading">
        <SectionHeader
          id="featured-heading"
          eyebrow="Featured"
          title="Popular right now"
          description="Fresh picks from our newest listings."
          action={
            <Link href="/services" className={buttonVariants({ variant: "ghost" })}>
              View all services
              <ButtonArrow />
            </Link>
          }
          className="mb-10"
        />
        {featured.length > 0 ? (
          <RevealGroup className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((service) => (
              <RevealItem key={service.id} className="min-w-0">
                <ServiceCard service={service} />
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <p className="text-muted-foreground">
            No services are available right now.{" "}
            <Link href="/services" className="text-foreground underline underline-offset-4">
              Browse the catalogue
            </Link>
          </p>
        )}
      </section>

      {/* 5. How it works */}
      <section
        id="how-it-works"
        className="mx-auto max-w-[1200px] scroll-mt-28 px-4 py-16"
        aria-labelledby="how-heading"
      >
        <SectionHeader
          id="how-heading"
          eyebrow="How it works"
          title="Three steps, zero phone calls"
          className="mb-12 justify-center text-center [&_p]:justify-center [&>div]:mx-auto"
        />
        <HowItWorks />
      </section>

      {/* 6. Stats band */}
      <section aria-label="ServiceHub in numbers" className="mx-auto max-w-[1200px] px-4 py-16">
        <dl className="bg-card shadow-surface rounded-section grid grid-cols-2 gap-y-10 p-8 md:grid-cols-4 md:p-12">
          {[
            { value: 2000, suffix: "+", label: "Happy customers" },
            { value: stats.bookings, label: "Bookings made" },
            { value: stats.services, label: "Active services" },
            { value: RATING, decimals: 1, suffix: "/5", label: "Average rating" },
          ].map(({ label, ...num }) => (
            <div key={label} className="flex flex-col-reverse items-center gap-1 text-center">
              <dt className="text-muted-foreground text-sm">{label}</dt>
              <dd className="text-foreground text-[clamp(2rem,5vw,3rem)] font-medium tracking-tight">
                <CountUp {...num} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 7. Testimonials */}
      <section className="mx-auto max-w-[1200px] px-4 py-16" aria-labelledby="testimonials-heading">
        <LightPanel className="rounded-section p-6 sm:p-10">
          <SectionHeader
            id="testimonials-heading"
            eyebrow="Testimonials"
            title="Loved across the island"
            className="mb-10"
          />
          <ul className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <li key={t.name}>
                <figure className="border-border rounded-card flex h-full flex-col gap-6 border p-6">
                  <blockquote className="text-light-text flex-1 text-pretty">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="bg-light-text text-light flex size-10 items-center justify-center rounded-full text-sm font-semibold"
                    >
                      {initials(t.name)}
                    </span>
                    <span>
                      <span className="text-light-text block text-sm font-semibold">{t.name}</span>
                      <span className="text-light-muted block text-sm">{t.role}</span>
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </LightPanel>
      </section>

      {/* 8. CTA */}
      <section className="mx-auto max-w-[1200px] px-4 pt-16 pb-24" aria-labelledby="cta-heading">
        <div className="relative isolate">
          <div
            aria-hidden="true"
            className="rounded-section pointer-events-none absolute inset-0 -z-10 overflow-hidden blur-2xl"
          >
            <div
              className="animate-spin-slow absolute top-1/2 left-1/2 aspect-square w-[150%] -translate-x-1/2 -translate-y-1/2 opacity-60"
              style={{
                background:
                  "conic-gradient(from 0deg, var(--brand-accent), var(--brand-aurora-teal), var(--brand-aurora-violet), var(--brand-accent))",
              }}
            />
          </div>
          <div className="bg-primary text-primary-foreground rounded-section m-1.5 flex flex-col items-center gap-6 px-6 py-16 text-center md:py-20">
            <h2
              id="cta-heading"
              className="text-h1 max-w-2xl font-medium text-balance md:text-[56px]"
            >
              Your next booking is a few taps away
            </h2>
            <p className="max-w-lg text-lg">
              Join thousands of Sri Lankans who book trusted help without the back-and-forth.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/services" className={buttonVariants({ variant: "ghost", size: "lg" })}>
                Browse services
                <ButtonArrow />
              </Link>
              <Link
                href={session ? "/my-bookings" : "/register"}
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                {session ? "My bookings" : "Create free account"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
