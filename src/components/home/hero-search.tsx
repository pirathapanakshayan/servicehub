"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Category = { id: string; name: string };

export function HeroSearch({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const search = query.trim();
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    const qs = params.toString();
    router.push(qs ? `/services?${qs}` : "/services");
  };

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className="bg-card/80 shadow-surface sm:rounded-control flex w-full max-w-2xl flex-col gap-2 rounded-[28px] p-2 backdrop-blur-md sm:flex-row sm:items-center"
    >
      <label htmlFor="hero-search" className="sr-only">
        Search services
      </label>
      <div className="relative flex-1">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          id="hero-search"
          type="search"
          placeholder="Try “cleaning” or “tutoring”"
          className="text-foreground placeholder:text-muted-foreground rounded-control h-12 w-full bg-transparent pr-4 pl-12 text-base outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <label htmlFor="hero-category" className="sr-only">
        Category
      </label>
      <select
        id="hero-category"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="bg-surface-2 text-foreground rounded-control h-12 px-4 text-sm outline-none sm:w-44"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Button type="submit" size="lg" className="h-12 px-7 text-base" arrow>
        Search
      </Button>
    </form>
  );
}
