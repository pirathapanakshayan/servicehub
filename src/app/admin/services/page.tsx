import type { Metadata } from "next";
import { AdminFilters } from "@/components/admin/admin-filters";
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

  const [categories, { data: services, meta }] = await Promise.all([
    getCategories(),
    listServices(query, { isAdmin: true }),
  ]);

  const linkParams: Record<string, string> = {};
  for (const key of ["search", "categoryId", "status"] as const) {
    if (query[key]) linkParams[key] = query[key];
  }

  return (
    <div className="space-y-5">
      <AdminFilters
        fields={[
          {
            type: "search",
            key: "search",
            label: "Search",
            placeholder: "Name or description...",
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
          {
            type: "select",
            key: "status",
            label: "Status",
            options: [
              { value: "", label: "All statuses" },
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
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
