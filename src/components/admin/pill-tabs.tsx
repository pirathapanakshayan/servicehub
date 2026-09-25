import Link from "next/link";
import { cn } from "@/lib/utils";

export type PillTab = { label: string; href: string; count?: number; active: boolean };

/** Segmented pill links (URL-driven). Active = lime with dark text. Scrolls on small screens. */
export function PillTabs({ tabs, label }: { tabs: PillTab[]; label: string }) {
  return (
    <nav aria-label={label} className="-mx-1 [scrollbar-width:none] overflow-x-auto px-1 pb-1">
      <ul className="bg-admin-panel border-admin-border inline-flex gap-1 rounded-full border p-1">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              scroll={false}
              aria-current={tab.active ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors",
                tab.active
                  ? "bg-admin-accent text-admin-accent-ink"
                  : "text-admin-text hover:bg-admin-panel-2",
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs font-semibold",
                    tab.active ? "bg-admin-accent-ink/10" : "bg-admin-bg text-admin-text",
                  )}
                >
                  {tab.count}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Link for a tab: keeps the current filters, sets (or clears) `key`, and resets paging. */
export function tabHref(
  basePath: string,
  params: Record<string, string>,
  key: string,
  value?: string,
) {
  const next = new URLSearchParams(params);
  next.delete("page");
  if (value) next.set(key, value);
  else next.delete(key);
  const qs = next.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
