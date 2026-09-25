import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  /** Current search params, used to preserve filters in page links. */
  params: Record<string, string>;
  /** Path the page links point to. */
  basePath?: string;
};

function pageHref(basePath: string, params: Record<string, string>, page: number) {
  const search = new URLSearchParams(params);
  if (page <= 1) search.delete("page");
  else search.set("page", String(page));
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Page numbers to show, with null for gaps: 1 … 4 5 6 … 10 */
function pageList(page: number, totalPages: number): (number | null)[] {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) result.push(null);
    result.push(p);
  });
  return result;
}

const itemClass =
  "rounded-control inline-flex h-10 min-w-10 items-center justify-center gap-1 border px-3 text-sm font-medium transition-colors";

export function Pagination({ page, totalPages, params, basePath = "/services" }: PaginationProps) {
  if (totalPages <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2">
      {prevDisabled ? (
        <span className={cn(itemClass, "text-muted-foreground border-border opacity-50")}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          Prev
        </span>
      ) : (
        <Link
          href={pageHref(basePath, params, page - 1)}
          className={cn(itemClass, "border-border bg-card hover:bg-muted")}
          rel="prev"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Prev
        </Link>
      )}

      {pageList(page, totalPages).map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} className="text-muted-foreground px-1">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={pageHref(basePath, params, p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              itemClass,
              p === page
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border bg-card hover:bg-muted hidden sm:inline-flex",
            )}
          >
            {p}
          </Link>
        ),
      )}

      {nextDisabled ? (
        <span className={cn(itemClass, "text-muted-foreground border-border opacity-50")}>
          Next
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
      ) : (
        <Link
          href={pageHref(basePath, params, page + 1)}
          className={cn(itemClass, "border-border bg-card hover:bg-muted")}
          rel="next"
        >
          Next
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}
