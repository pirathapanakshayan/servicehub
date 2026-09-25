import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/services/pagination";
import { ServiceFilters } from "@/components/services/service-filters";
import { ServiceGrid } from "@/components/services/service-grid";
import { ServicesEmpty } from "@/components/services/services-empty";
import { getCategories, listServices } from "@/lib/services";
import { parseServiceQuery } from "@/lib/validators";

export const metadata: Metadata = {
  title: "Services",
  description: "Browse cleaning, beauty, home repair and tutoring services.",
};

type ServicesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const rawParams = await searchParams;
  // The public catalogue never shows inactive services, even to admins.
  const query = { ...parseServiceQuery(rawParams), includeInactive: false };

  const [categories, { data: services, meta }] = await Promise.all([
    getCategories(),
    listServices(query, { isAdmin: false }),
  ]);

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
  const linkParams: Record<string, string> = {};
  for (const key of ["search", "categoryId", "minPrice", "maxPrice", "sort"] as const) {
    const value = query[key];
    if (value !== undefined && !(key === "sort" && value === "newest")) {
      linkParams[key] = String(value);
    }
  }
  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <PageHeader
        title="Services"
        description="Find and book trusted professionals for your home and lifestyle."
      />

      <ServiceFilters categories={categories} />

      {services.length === 0 ? (
        <ServicesEmpty />
      ) : (
        <>
          <p className="text-muted-foreground text-sm" aria-live="polite">
            Showing {from}–{to} of {meta.total} {meta.total === 1 ? "service" : "services"}
          </p>
          <h2 className="sr-only">Results</h2>
          <ServiceGrid services={services} />
          <Pagination page={meta.page} totalPages={totalPages} params={linkParams} />
        </>
      )}
    </div>
  );
}
