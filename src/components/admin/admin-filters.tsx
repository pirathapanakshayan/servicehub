"use client";

import { LoaderCircle, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClass } from "@/components/ui/native-select";

export type FilterField =
  | { type: "search"; key: string; label: string; placeholder: string }
  | { type: "select"; key: string; label: string; options: { value: string; label: string }[] }
  | { type: "date"; key: string; label: string };

/** Filter bar whose values live in the URL search params (resets to page 1 on change). */
export function AdminFilters({ fields }: { fields: FilterField[] }) {
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

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const hasFilters = fields.some((f) => searchParams.get(f.key));
  // The server ignores an inverted range, so explain why "From" isn't applied.
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const rangeInvalid = !!dateFrom && !!dateTo && dateFrom > dateTo;

  return (
    <section
      aria-label="Filters"
      className="bg-card border-border rounded-card flex flex-wrap items-end gap-3 border p-4"
    >
      {fields.map((field) => {
        const id = `filter-${field.key}`;
        if (field.type === "search") {
          return (
            <div key={field.key} className="w-full space-y-1.5 sm:w-64 lg:flex-1">
              <Label htmlFor={id}>{field.label}</Label>
              <div className="relative">
                <Search
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  aria-hidden="true"
                />
                <Input
                  id={id}
                  type="search"
                  placeholder={field.placeholder}
                  className="h-10 pl-9"
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
            </div>
          );
        }
        if (field.type === "select") {
          return (
            <div key={field.key} className="w-full space-y-1.5 sm:w-44">
              <Label htmlFor={id}>{field.label}</Label>
              <select
                id={id}
                className={nativeSelectClass}
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
          <div key={field.key} className="w-[calc(50%-0.375rem)] space-y-1.5 sm:w-40">
            <Label htmlFor={id}>{field.label}</Label>
            <Input
              id={id}
              type="date"
              aria-invalid={rangeInvalid || undefined}
              aria-describedby={rangeInvalid ? "filter-date-error" : undefined}
              value={searchParams.get(field.key) ?? ""}
              onChange={(e) => update(field.key, e.target.value)}
            />
          </div>
        );
      })}
      <div className="flex h-10 items-center gap-2">
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            className="h-10"
            onClick={() => {
              setSearch("");
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
          >
            <X aria-hidden="true" />
            Clear
          </Button>
        )}
        {isPending && (
          <LoaderCircle
            className="text-muted-foreground size-4 animate-spin"
            aria-label="Updating results"
          />
        )}
      </div>
      {rangeInvalid && (
        <p id="filter-date-error" role="alert" className="text-danger w-full text-sm">
          &ldquo;From&rdquo; is after &ldquo;To&rdquo;, so the From date is being ignored.
        </p>
      )}
    </section>
  );
}
