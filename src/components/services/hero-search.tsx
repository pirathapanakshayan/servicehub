"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const search = query.trim();
    router.push(search ? `/services?search=${encodeURIComponent(search)}` : "/services");
  };

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className="bg-card border-border rounded-card flex w-full max-w-xl gap-2 border p-2 shadow-sm"
    >
      <label htmlFor="hero-search" className="sr-only">
        Search services
      </label>
      <div className="relative flex-1">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          id="hero-search"
          type="search"
          placeholder='Try "cleaning" or "plumbing"'
          className="h-11 border-0 pl-9 shadow-none focus-visible:ring-0"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <Button type="submit" className="h-11 px-5">
        Search
      </Button>
    </form>
  );
}
