import type { Metadata } from "next";
import { FilterBar } from "@/components/admin/filter-bar";
import { PillTabs, tabHref } from "@/components/admin/pill-tabs";
import { ServicesTable } from "@/components/admin/services-table";
import { Pagination } from "@/components/services/pagination";
import { requirePageAdmin } from "@/lib/auth";
import { getCategories, listServices } from "@/lib/services";
import { parseServiceQuery } from "@/lib/validators";

export const metadata: Metadata = { title: "Services" };

const PAGE_SIZE = 10;

type AdminServicesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminServicesPage({ searchParams }: AdminServicesPageProps) {
  await requirePageAdmin();
  const query = {
    ...parseServiceQuery(await searchParams),
    includeInactive: true,
    limit: PAGE_SIZE,
  };

  // Tab counts ignore the status filter so each tab shows its own total.
  const countQuery = { ...query, status: undefined, page: 1, limit: 1 };
  const [categories, { data: services, meta }, all, active, inactive] = await Promise.all([
    getCategories(),
    listServices(query, { isAdmin: true }),
    listServices(countQuery, { isAdmin: true }),
    listServices({ ...countQuery, status: "ACTIVE" }, { isAdmin: true }),
    listServices({ ...countQuery, status: "INACTIVE" }, { isAdmin: true }),
  ]);

  const linkParams: Record<string, string> = {};
  for (const key of ["search", "categoryId", "status"] as const) {
    if (query[key]) linkParams[key] = query[key];
  }
  const tab = (label: string, count: number, status?: "ACTIVE" | "INACTIVE") => ({
    label,
    count,
    href: tabHref("/admin/services", linkParams, "status", status),
    active: query.status === status,
  });

  return (
    <div className="space-y-5">
      <PillTabs
        label="Service status"
        tabs={[
          tab("All", all.meta.total),
          tab("Active", active.meta.total, "ACTIVE"),
          tab("Inactive", inactive.meta.total, "INACTIVE"),
        ]}
      />
      <FilterBar
        preserve={["status"]}
        fields={[
          {
            type: "search",
            key: "search",
            label: "Search services",
            placeholder: "Search name or description...",
          },
          {
            type: "select",
            key: "categoryId",
            label: "Category",
            options: [
              { value: "", label: "All categories" },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ],
          },
        ]}
      />
      <ServicesTable
        services={services}
        categories={categories}
        hasFilters={Object.keys(linkParams).length > 0}
        total={meta.total}
      />
      <Pagination
        page={meta.page}
        totalPages={Math.max(1, Math.ceil(meta.total / meta.limit))}
        params={linkParams}
        basePath="/admin/services"
      />
    </div>
  );
}
