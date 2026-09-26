"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type PillTab = { label: string; href: string; count?: number; active: boolean };

/**
 * Segmented pill links (URL-driven) with a lime indicator that slides to the active tab.
 * Shared by the site and the admin (tokens resolve to the admin palette inside .admin-theme).
 */
export function PillTabs({ tabs, label }: { tabs: PillTab[]; label: string }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);
  const activeHref = tabs.find((t) => t.active)?.href;

  // Measure the active tab; re-measure on resize (labels and counts can change width).
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const active = list.querySelector<HTMLElement>('[aria-current="page"]');
      setIndicator(active ? { left: active.offsetLeft, width: active.offsetWidth } : null);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [activeHref, tabs]);

  return (
    <nav aria-label={label} className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
      <ul ref={listRef} className="bg-card shadow-surface relative inline-flex gap-1 rounded-full p-1">
        {indicator && (
          <li
            aria-hidden="true"
            className="bg-primary absolute top-1 bottom-1 rounded-full transition-[left,width] duration-200 ease-out motion-reduce:transition-none"
            style={{ left: indicator.left, width: indicator.width }}
          />
        )}
        {tabs.map((tab) => (
          <li key={tab.href} className="relative">
            <Link
              href={tab.href}
              scroll={false}
              aria-current={tab.active ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors",
                tab.active ? "text-primary-foreground" : "text-foreground hover:bg-secondary",
                // Before the first measurement, paint the active tab directly.
                tab.active && !indicator && "bg-primary",
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs font-semibold",
                    tab.active ? "bg-primary-foreground/10" : "bg-background text-foreground",
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
