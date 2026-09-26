import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { NewsletterForm } from "@/components/layout/newsletter-form";

// Only real routes: every link here resolves to an existing page or a working search.
const COLUMNS = [
  {
    title: "Explore",
    links: [
      { href: "/services", label: "All services" },
      { href: "/#how-it-works", label: "How it works" },
    ],
  },
  {
    title: "Popular",
    links: [
      { href: "/services?search=cleaning", label: "Cleaning" },
      { href: "/services?search=plumbing", label: "Plumbing" },
      { href: "/services?search=massage", label: "Massage" },
      { href: "/services?search=tutoring", label: "Tutoring" },
    ],
  },
  {
    title: "Customers",
    links: [
      { href: "/register", label: "Create account" },
      { href: "/login", label: "Log in" },
      { href: "/my-bookings", label: "My bookings" },
      { href: "/profile", label: "Profile" },
    ],
  },
  {
    title: "Admins",
    links: [
      { href: "/admin/login", label: "Admin login" },
      { href: "/admin/dashboard", label: "Dashboard" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="bg-card shadow-surface rounded-t-section relative mt-24 overflow-hidden">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-6 pt-16 pb-8 lg:grid-cols-[1.2fr_2fr]">
        <div className="max-w-sm space-y-6">
          <BrandLogo />
          <p className="text-muted-foreground">
            Trusted local services, booked in minutes. Clear prices, real time slots.
          </p>
          <NewsletterForm />
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMNS.map((column) => (
            <div key={column.title} className="space-y-4">
              <h2 className="text-label text-muted-foreground font-medium">{column.title}</h2>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-border mx-auto flex max-w-[1200px] flex-wrap justify-between gap-2 border-t px-6 py-6 text-sm">
        <p className="text-muted-foreground">
          © {new Date().getFullYear()} ServiceHub. All rights reserved.
        </p>
        <p className="text-muted-foreground">Colombo, Sri Lanka · Prices in LKR</p>
      </div>

      {/* Huge faded wordmark, clipped by the footer's bottom edge. */}
      <p
        aria-hidden="true"
        className="text-surface-2 pointer-events-none -mb-[3.2vw] text-center text-[12vw] leading-[0.8] font-semibold tracking-[-0.04em] whitespace-nowrap select-none"
      >
        ServiceHub
      </p>
    </footer>
  );
}
