import { CalendarCheck, ShieldCheck, Wallet } from "lucide-react";
import { Aurora } from "@/components/layout/aurora";
import { BrandLogo } from "@/components/layout/brand-logo";
import { SerifAccent } from "@/components/ui/serif-accent";

type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Small pill next to the title, e.g. "Admin". */
  badge?: string;
};

const BENEFITS = [
  { icon: ShieldCheck, label: "Vetted professionals" },
  { icon: Wallet, label: "Upfront prices" },
  { icon: CalendarCheck, label: "Book in minutes" },
];

/**
 * Split auth layout: an aurora brand panel on the left (a short band on mobile) and the form
 * in a surface card on the right.
 */
export function AuthCard({ title, description, children, footer, badge }: AuthCardProps) {
  return (
    <div className="grid min-h-svh grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1">
      <aside className="lg:rounded-section relative isolate flex h-28 flex-col overflow-hidden px-6 py-6 lg:m-3 lg:h-auto lg:px-12 lg:py-10">
        <Aurora />
        <BrandLogo className="relative" />
        <div className="relative mt-auto hidden max-w-lg space-y-8 lg:block">
          <figure className="space-y-4">
            <blockquote className="text-h2 text-foreground font-medium text-balance">
              “Booked a deep clean on my lunch break. It was <SerifAccent>effortless</SerifAccent>.”
            </blockquote>
            <figcaption className="text-muted-foreground">Nimali P., Colombo</figcaption>
          </figure>
          <ul className="flex flex-wrap gap-2" aria-label="Why ServiceHub">
            {BENEFITS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="bg-card/60 shadow-surface text-foreground flex items-center gap-2 rounded-full px-4 py-2 text-sm backdrop-blur-md"
              >
                <Icon className="text-primary size-4" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex items-start justify-center px-4 pt-2 pb-10 lg:items-center lg:py-10">
        <div className="bg-card shadow-surface rounded-card w-full max-w-md space-y-6 p-6 sm:p-8">
          <header className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-foreground text-[28px] leading-tight font-medium tracking-tight">
                {title}
              </h1>
              {badge && (
                <span className="bg-primary text-primary-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-muted-foreground">{description}</p>
          </header>
          {children}
          {footer && <div className="text-muted-foreground text-center text-sm">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
