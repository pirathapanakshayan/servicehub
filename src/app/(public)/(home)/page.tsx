import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { CategoryGrid } from "@/components/services/category-grid";
import { HeroSearch } from "@/components/services/hero-search";
import { HowItWorks } from "@/components/services/how-it-works";
import { ServiceGrid } from "@/components/services/service-grid";
import { getSession } from "@/lib/auth";
import { getCategoriesWithCounts, getFeaturedServices } from "@/lib/services";

export default async function HomePage() {
  // Read the session first: it marks the page dynamic before any DB query runs at build time.
  const session = await getSession();
  const [categories, featured] = await Promise.all([
    getCategoriesWithCounts(),
    getFeaturedServices(6),
  ]);

  return (
    <>
      <section className="from-primary/10 to-background bg-gradient-to-b">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center md:py-24">
          <span className="bg-card text-primary border-border rounded-full border px-3 py-1 text-xs font-semibold">
            Cleaning · Beauty · Repairs · Tutoring
          </span>
          <h1 className="text-ink max-w-3xl text-4xl font-bold tracking-tight text-balance md:text-5xl">
            Book trusted local services in minutes
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg text-pretty">
            Compare vetted professionals, see clear prices upfront and pick a date and time that
            works for you. No calls, no waiting.
          </p>
          <HeroSearch />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/services" className={buttonVariants({ className: "h-11 px-6" })}>
              Browse services
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link
              href={session ? "/my-bookings" : "/register"}
              className={buttonVariants({ variant: "outline", className: "h-11 px-6" })}
            >
              {session ? "My bookings" : "Create free account"}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="categories-heading">
        <div className="mb-8 space-y-1">
          <h2 id="categories-heading" className="text-ink text-2xl font-bold">
            Browse by category
          </h2>
          <p className="text-muted-foreground">Find the right professional for the job.</p>
        </div>
        {categories.length > 0 ? (
          <CategoryGrid categories={categories} />
        ) : (
          <p className="text-muted-foreground">No categories available yet.</p>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="featured-heading">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 id="featured-heading" className="text-ink text-2xl font-bold">
              Featured services
            </h2>
            <p className="text-muted-foreground">Popular picks from our newest listings.</p>
          </div>
          <Link
            href="/services"
            className="text-primary flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            View all services
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        {featured.length > 0 ? (
          <ServiceGrid services={featured} />
        ) : (
          <p className="text-muted-foreground">
            No services are available right now. Please check back soon.
          </p>
        )}
      </section>

      <section
        id="how-it-works"
        className="bg-card border-border scroll-mt-28 border-y"
        aria-labelledby="how-heading"
      >
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-8 space-y-1 text-center">
            <h2 id="how-heading" className="text-ink text-2xl font-bold">
              How it works
            </h2>
            <p className="text-muted-foreground">Three simple steps to get it done.</p>
          </div>
          <HowItWorks />
        </div>
      </section>
    </>
  );
}
