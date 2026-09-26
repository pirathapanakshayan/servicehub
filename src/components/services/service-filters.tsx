"use client";

import { LoaderCircle, Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import { formatPrice } from "@/lib/format";
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

const pillSelect = "bg-card shadow-surface h-11 border-0 sm:w-auto";

/** Sticky filter bar (search, category, sort, price popover) with removable active-filter chips. */
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

  const clearAll = () => {
    clearTimeout(debounce.current ?? undefined);
    debounce.current = null;
    setText({ search: "", minPrice: "", maxPrice: "" });
    startTransition(() => router.replace(pathname, { scroll: false }));
  };

  const minPrice = Number(text.minPrice);
  const maxPrice = Number(text.maxPrice);
  const rangeInvalid = text.minPrice !== "" && text.maxPrice !== "" && minPrice > maxPrice;

  const categoryId = searchParams.get("categoryId") ?? "";
  const sort = (searchParams.get("sort") ?? "newest") as ServiceSort;
  const urlMin = searchParams.get("minPrice");
  const urlMax = searchParams.get("maxPrice");

  const chips: { key: string; label: string; clear: Record<string, string> }[] = [];
  const urlSearch = searchParams.get("search");
  if (urlSearch) chips.push({ key: "search", label: `“${urlSearch}”`, clear: { search: "" } });
  const category = categories.find((c) => c.id === categoryId);
  if (category) chips.push({ key: "category", label: category.name, clear: { categoryId: "" } });
  if (urlMin || urlMax) {
    const label =
      urlMin && urlMax
        ? `${formatPrice(urlMin)} – ${formatPrice(urlMax)}`
        : urlMin
          ? `From ${formatPrice(urlMin)}`
          : `Up to ${formatPrice(urlMax!)}`;
    chips.push({ key: "price", label, clear: { minPrice: "", maxPrice: "" } });
  }
  if (sort !== "newest" && SORT_LABELS[sort]) {
    chips.push({ key: "sort", label: SORT_LABELS[sort], clear: { sort: "" } });
  }

  const removeChip = (clear: Record<string, string>) => {
    if ("search" in clear || "minPrice" in clear) {
      clearTimeout(debounce.current ?? undefined);
      debounce.current = null;
      setText((prev) => ({
        ...prev,
        ...("search" in clear ? { search: "" } : { minPrice: "", maxPrice: "" }),
      }));
    }
    update(clear);
  };

  return (
    <section
      aria-label="Filter services"
      className="bg-background/80 sticky top-[88px] z-30 -mx-4 space-y-3 px-4 py-3 backdrop-blur-lg"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:flex-nowrap">
        <div className="relative min-w-0 flex-1">
          <Label htmlFor="filter-search" className="sr-only">
            Search
          </Label>
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            id="filter-search"
            type="search"
            placeholder="Search services..."
            className="bg-card shadow-surface h-11 border-0 pl-11"
            value={text.search}
            onChange={(e) => onTextChange("search", e.target.value)}
          />
          {isPending && (
            <LoaderCircle
              className="text-muted-foreground absolute top-1/2 right-4 size-4 -translate-y-1/2 animate-spin motion-reduce:animate-none"
              aria-label="Updating results"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Label htmlFor="filter-category" className="sr-only">
            Category
          </Label>
          <Select
            id="filter-category"
            className={pillSelect}
            value={categoryId}
            onChange={(e) => update({ categoryId: e.target.value })}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Label htmlFor="filter-sort" className="sr-only">
            Sort by
          </Label>
          <Select
            id="filter-sort"
            className={pillSelect}
            value={sort}
            onChange={(e) => update({ sort: e.target.value === "newest" ? "" : e.target.value })}
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          <Popover>
            <PopoverTrigger
              render={<Button variant="ghost" className="h-11 px-5" />}
              aria-label="Price range"
            >
              <SlidersHorizontal aria-hidden="true" />
              Price
              {(urlMin || urlMax) && (
                <span className="bg-primary size-1.5 rounded-full" aria-hidden="true" />
              )}
            </PopoverTrigger>
            <PopoverContent align="end" className="space-y-3">
              <PopoverTitle className="text-sm font-medium">Price range (LKR)</PopoverTitle>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={100}
                  placeholder="Min"
                  aria-label="Minimum price"
                  aria-invalid={rangeInvalid || undefined}
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
                  value={text.maxPrice}
                  onChange={(e) => onTextChange("maxPrice", e.target.value)}
                />
              </div>
              {rangeInvalid && (
                <p role="alert" className="text-danger text-xs">
                  Min price is higher than max price.
                </p>
              )}
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            variant="ghost"
            className="h-11 px-5"
            onClick={clearAll}
            disabled={chips.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      {chips.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Active filters">
          {chips.map((chip) => (
            <li key={chip.key}>
              <button
                type="button"
                onClick={() => removeChip(chip.clear)}
                className="bg-primary text-primary-foreground hover:bg-primary-hover flex h-8 items-center gap-1.5 rounded-full pr-2.5 pl-3.5 text-sm font-medium transition-colors"
              >
                {chip.label}
                <X className="size-3.5" aria-hidden="true" />
                <span className="sr-only">(remove filter)</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
