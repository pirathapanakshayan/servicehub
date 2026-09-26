import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/services/pagination";
import { ServiceFilters } from "@/components/services/service-filters";
import { ServiceGrid } from "@/components/services/service-grid";
import { ServicesEmpty } from "@/components/services/services-empty";
import { PillTabs } from "@/components/ui/pill-tabs";
import { SerifAccent } from "@/components/ui/serif-accent";
import { getCategories, listServices } from "@/lib/services";
import { tabHref } from "@/lib/url";
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

  const tabs = [
    {
      label: "All",
      href: tabHref("/services", linkParams, "categoryId"),
      active: !query.categoryId,
    },
    ...categories.map((c) => ({
      label: c.name,
      href: tabHref("/services", linkParams, "categoryId", c.id),
      active: query.categoryId === c.id,
    })),
  ];

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-10">
      <PageHeader
        eyebrow="Catalogue"
        title={
          <>
            Find your <SerifAccent>service</SerifAccent>
          </>
        }
        description={
          <span aria-live="polite">
            {meta.total === 0
              ? "No results"
              : `Showing ${from}–${to} of ${meta.total} ${meta.total === 1 ? "service" : "services"}`}
          </span>
        }
      />

      <ServiceFilters categories={categories} />

      <PillTabs tabs={tabs} label="Categories" />

      {services.length === 0 ? (
        <ServicesEmpty />
      ) : (
        <>
          <h2 className="sr-only">Results</h2>
          <ServiceGrid services={services} />
          <Pagination page={meta.page} totalPages={totalPages} params={linkParams} />
        </>
      )}
    </div>
  );
}
