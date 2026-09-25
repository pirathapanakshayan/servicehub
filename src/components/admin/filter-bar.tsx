"use client";

import { ListFilter, LoaderCircle, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

export type FilterField =
  | { type: "search"; key: string; label: string; placeholder: string }
  | { type: "select"; key: string; label: string; options: { value: string; label: string }[] }
  | { type: "date"; key: string; label: string };

const pillControl =
  "border-admin-control-border bg-admin-bg text-admin-text placeholder:text-admin-muted focus-visible:border-admin-accent h-10 w-full rounded-full border pr-4 pl-10 text-sm outline-none [color-scheme:dark]";

const iconClass =
  "text-admin-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2";

/**
 * Row of dark pill filters whose values live in the URL (changing one resets to page 1).
 * `preserve` keys (e.g. a PillTabs status) are kept when clearing.
 */
export function FilterBar({
  fields,
  preserve = [],
}: {
  fields: FilterField[];
  preserve?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchField = fields.find((f) => f.type === "search");
  const [search, setSearch] = useState(() =>
    searchField ? (searchParams.get(searchField.key) ?? "") : "",
  );
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const paramsKey = searchParams.toString();
  // Sync the search box when the URL changes elsewhere, unless the user is mid-typing.
  useEffect(() => {
    if (debounce.current || !searchField) return;
    setSearch(new URLSearchParams(paramsKey).get(searchField.key) ?? "");
  }, [paramsKey, searchField]);

  useEffect(() => () => clearTimeout(debounce.current ?? undefined), []);

  const navigate = (next: URLSearchParams) => {
    next.delete("page");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    navigate(next);
  };

  const clearAll = () => {
    setSearch("");
    const next = new URLSearchParams();
    for (const key of preserve) {
      const value = searchParams.get(key);
      if (value) next.set(key, value);
    }
    navigate(next);
  };

  const activeCount = fields.filter((f) => searchParams.get(f.key)).length;
  // The server ignores an inverted range, so explain why "From" isn't applied.
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const rangeInvalid = !!dateFrom && !!dateTo && dateFrom > dateTo;

  return (
    <section
      aria-label="Filters"
      className="bg-admin-panel border-admin-border rounded-panel flex flex-wrap items-center gap-3 border p-3 sm:p-4"
    >
      <span
        className="bg-admin-bg text-admin-text flex h-10 items-center gap-2 rounded-full px-4 text-sm whitespace-nowrap"
        aria-live="polite"
      >
        <ListFilter className="text-admin-muted size-4" aria-hidden="true" />
        Active filters
        <span
          className={cn(
            "min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs font-semibold",
            activeCount > 0
              ? "bg-admin-accent text-admin-accent-ink"
              : "bg-admin-panel-2 text-admin-text",
          )}
        >
          {activeCount}
        </span>
      </span>

      {fields.map((field) => {
        const id = `filter-${field.key}`;
        if (field.type === "search") {
          return (
            <div key={field.key} className="relative w-full sm:w-64 lg:flex-1">
              <label htmlFor={id} className="sr-only">
                {field.label}
              </label>
              <Search className={iconClass} aria-hidden="true" />
              <input
                id={id}
                type="search"
                placeholder={field.placeholder}
                className={pillControl}
                value={search}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearch(value);
                  clearTimeout(debounce.current ?? undefined);
                  debounce.current = setTimeout(() => {
                    debounce.current = null;
                    update(field.key, value.trim());
                  }, 400);
                }}
              />
            </div>
          );
        }
        if (field.type === "select") {
          return (
            <div key={field.key} className="relative w-full sm:w-48">
              <label htmlFor={id} className="sr-only">
                {field.label}
              </label>
              <ListFilter className={iconClass} aria-hidden="true" />
              <select
                id={id}
                className={cn(pillControl, "appearance-auto")}
                value={searchParams.get(field.key) ?? ""}
                onChange={(e) => update(field.key, e.target.value)}
              >
                {field.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        return (
          <div key={field.key} className="relative w-[calc(50%-0.375rem)] sm:w-44">
            <label htmlFor={id} className="sr-only">
              {field.label}
            </label>
            <input
              id={id}
              type="date"
              title={field.label}
              aria-invalid={rangeInvalid || undefined}
              aria-describedby={rangeInvalid ? "filter-date-error" : undefined}
              className={cn(pillControl, "aria-invalid:border-admin-danger pl-4")}
              value={searchParams.get(field.key) ?? ""}
              onChange={(e) => update(field.key, e.target.value)}
            />
          </div>
        );
      })}

      {(activeCount > 0 || isPending) && (
        <div className="flex h-10 items-center gap-2">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-admin-text hover:bg-admin-panel-2 flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium"
            >
              <X className="size-4" aria-hidden="true" />
              Clear
            </button>
          )}
          {isPending && (
            <LoaderCircle
              className="text-admin-muted size-4 animate-spin"
              aria-label="Updating results"
            />
          )}
        </div>
      )}

      {rangeInvalid && (
        <p id="filter-date-error" role="alert" className="text-admin-danger w-full px-2 text-sm">
          &ldquo;From&rdquo; is after &ldquo;To&rdquo;, so the From date is being ignored.
        </p>
      )}
    </section>
  );
}
