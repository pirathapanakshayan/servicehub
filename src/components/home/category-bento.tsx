"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "@/components/services/category-icon";
import { cn } from "@/lib/utils";

type CategoryWithCount = { id: string; name: string; slug: string; serviceCount: number };

const LAYOUT = ["md:col-span-2 md:row-span-2 min-h-64", "md:col-span-2", "", ""];

/** Asymmetric bento (one large, three small) with a glow that follows the cursor. */
export function CategoryBento({ categories }: { categories: CategoryWithCount[] }) {
  const onMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--gx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--gy", `${e.clientY - r.top}px`);
  };

  return (
    <ul className="grid auto-rows-[minmax(11rem,auto)] gap-4 sm:grid-cols-2 md:grid-cols-4">
      {categories.slice(0, 4).map((c, i) => (
        <li key={c.id} className={cn("min-w-0", i === 0 && "sm:col-span-2", LAYOUT[i])}>
          <Link
            href={`/services?categoryId=${c.id}`}
            onPointerMove={onMove}
            className="group bg-card shadow-surface rounded-card relative flex h-full flex-col justify-between gap-8 overflow-hidden p-6"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none"
              style={{
                background:
                  "radial-gradient(320px circle at var(--gx, 50%) var(--gy, 50%), color-mix(in oklab, var(--brand-accent) 16%, transparent), transparent 70%)",
              }}
            />
            <span className="bg-surface-2 text-primary relative flex size-12 items-center justify-center rounded-full">
              <CategoryIcon slug={c.slug} className="size-6" />
            </span>
            <span className="relative flex items-end justify-between gap-4">
              <span>
                <span
                  className={cn(
                    "text-foreground block font-medium",
                    i === 0 ? "text-h2" : "text-h3",
                  )}
                >
                  {c.name}
                </span>
                <span className="text-muted-foreground text-sm">
                  {c.serviceCount} {c.serviceCount === 1 ? "service" : "services"}
                </span>
              </span>
              <span className="bg-surface-2 text-foreground group-hover:bg-primary group-hover:text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200">
                <ArrowUpRight
                  className="size-5 transition-transform duration-200 group-hover:rotate-45 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
