import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "@/components/services/category-icon";

type CategoryWithCount = { id: string; name: string; slug: string; serviceCount: number };

export function CategoryGrid({ categories }: { categories: CategoryWithCount[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {categories.map((category) => (
        <li key={category.id}>
          <Link
            href={`/services?categoryId=${category.id}`}
            className="group bg-card border-border rounded-card hover:border-primary flex h-full flex-col gap-4 border p-5 transition-colors"
          >
            <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
              <CategoryIcon slug={category.slug} className="size-6" />
            </span>
            <span className="space-y-1">
              <span className="text-ink block font-semibold">{category.name}</span>
              <span className="text-muted-foreground flex items-center gap-1 text-sm">
                {category.serviceCount} {category.serviceCount === 1 ? "service" : "services"}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
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
