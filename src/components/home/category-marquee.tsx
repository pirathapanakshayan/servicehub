import Link from "next/link";
import { CategoryIcon } from "@/components/services/category-icon";

type Category = { id: string; name: string; slug: string };

/** Infinite loop of category pills (CSS only). The track is doubled so the loop is seamless. */
export function CategoryMarquee({ categories }: { categories: Category[] }) {
  // Repeat short lists so one copy is always wider than the viewport.
  const copies = Math.max(1, Math.ceil(8 / categories.length));
  const base = Array.from({ length: copies }, () => categories).flat();

  const pill = (c: Category, key: string, hidden: boolean) => (
    <li key={key} aria-hidden={hidden || undefined}>
      <Link
        href={`/services?categoryId=${c.id}`}
        tabIndex={hidden ? -1 : undefined}
        className="bg-card shadow-surface text-foreground hover:bg-surface-2 flex items-center gap-2.5 rounded-full px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors"
      >
        <CategoryIcon slug={c.slug} className="text-primary size-4" />
        {c.name}
      </Link>
    </li>
  );

  return (
    <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] py-2">
      <ul
        aria-label="Categories"
        className="animate-marquee flex w-max gap-3 group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused]"
      >
        {base.map((c, i) => pill(c, `a-${i}`, i >= categories.length))}
        {base.map((c, i) => pill(c, `b-${i}`, true))}
      </ul>
    </div>
  );
}
