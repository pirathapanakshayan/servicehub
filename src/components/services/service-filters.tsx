"use client";

import { LoaderCircle, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClass } from "@/components/ui/native-select";
import type { ServiceSort } from "@/lib/validators";

type Category = { id: string; name: string };

const SORT_LABELS: Record<ServiceSort, string> = {
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
};

type TextKey = "search" | "minPrice" | "maxPrice";

function readText(params: URLSearchParams): Record<TextKey, string> {
  return {
    search: params.get("search") ?? "",
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
  };
}

export function ServiceFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState(() => readText(searchParams));
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep inputs in sync when the URL changes elsewhere (e.g. "Clear filters", back button).
  const paramsKey = searchParams.toString();
  // Skipped while a debounced update is pending so in-progress typing isn't overwritten.
  useEffect(() => {
    if (debounce.current) return;
    setText(readText(new URLSearchParams(paramsKey)));
  }, [paramsKey]);

  useEffect(() => () => clearTimeout(debounce.current ?? undefined), []);

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const onTextChange = (key: TextKey, value: string) => {
    setText((prev) => ({ ...prev, [key]: value }));
    clearTimeout(debounce.current ?? undefined);
    debounce.current = setTimeout(() => {
      debounce.current = null;
      update({ [key]: value.trim() });
    }, 400);
  };

  const minPrice = Number(text.minPrice);
  const maxPrice = Number(text.maxPrice);
  const rangeInvalid = text.minPrice !== "" && text.maxPrice !== "" && minPrice > maxPrice;

  return (
    <section
      aria-label="Filter services"
      className="bg-card border-border rounded-card grid gap-4 border p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1.4fr_1fr]"
    >
      <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
        <Label htmlFor="filter-search">Search</Label>
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            id="filter-search"
            type="search"
            placeholder="Search services..."
            className="h-10 pl-9"
            value={text.search}
            onChange={(e) => onTextChange("search", e.target.value)}
          />
          {isPending && (
            <LoaderCircle
              className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin"
              aria-label="Updating results"
            />
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-category">Category</Label>
        <select
          id="filter-category"
          className={nativeSelectClass}
          value={searchParams.get("categoryId") ?? ""}
          onChange={(e) => update({ categoryId: e.target.value })}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-1.5">
        <legend className="text-sm leading-none font-medium">Price (LKR)</legend>
        <div className="flex items-center gap-2 pt-1.5">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            placeholder="Min"
            aria-label="Minimum price"
            aria-invalid={rangeInvalid || undefined}
            className="h-10"
            value={text.minPrice}
            onChange={(e) => onTextChange("minPrice", e.target.value)}
          />
          <span className="text-muted-foreground" aria-hidden="true">
            –
          </span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            placeholder="Max"
            aria-label="Maximum price"
            aria-invalid={rangeInvalid || undefined}
            className="h-10"
            value={text.maxPrice}
            onChange={(e) => onTextChange("maxPrice", e.target.value)}
          />
        </div>
        {rangeInvalid && (
          <p role="alert" className="text-danger text-xs">
            Min price is higher than max price.
          </p>
        )}
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="filter-sort">Sort by</Label>
        <select
          id="filter-sort"
          className={nativeSelectClass}
          value={searchParams.get("sort") ?? "newest"}
          onChange={(e) => update({ sort: e.target.value === "newest" ? "" : e.target.value })}
        >
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
