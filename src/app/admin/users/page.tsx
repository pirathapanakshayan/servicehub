import type { Metadata } from "next";
import { FilterBar } from "@/components/admin/filter-bar";
import { PillTabs } from "@/components/ui/pill-tabs";
import { tabHref } from "@/lib/url";
import { UsersTable } from "@/components/admin/users-table";
import { Pagination } from "@/components/services/pagination";
import { listCustomers } from "@/lib/admin";
import { requirePageAdmin } from "@/lib/auth";
import { parseSearchParams, userQuerySchema } from "@/lib/validators";

export const metadata: Metadata = { title: "Users" };

type AdminUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  await requirePageAdmin();
  const query = parseSearchParams(userQuerySchema, await searchParams);
  // Tab counts ignore the active filter so each tab shows its own total.
  const countQuery = { ...query, isActive: undefined, page: 1, limit: 1 };
  const [{ data: users, meta }, all, active, inactive] = await Promise.all([
    listCustomers(query),
    listCustomers(countQuery),
    listCustomers({ ...countQuery, isActive: true }),
    listCustomers({ ...countQuery, isActive: false }),
  ]);

  const linkParams: Record<string, string> = {};
  if (query.search) linkParams.search = query.search;
  if (query.isActive !== undefined) linkParams.isActive = String(query.isActive);
  const tab = (label: string, count: number, value?: "true" | "false") => ({
    label,
    count,
    href: tabHref("/admin/users", linkParams, "isActive", value),
    active: (query.isActive === undefined ? undefined : String(query.isActive)) === value,
  });

  return (
    <div className="space-y-5">
      <PillTabs
        label="Customer status"
        tabs={[
          tab("All", all.meta.total),
          tab("Active", active.meta.total, "true"),
          tab("Inactive", inactive.meta.total, "false"),
        ]}
      />
      <FilterBar
        preserve={["isActive"]}
        fields={[
          {
            type: "search",
            key: "search",
            label: "Search customers",
            placeholder: "Search name or email...",
          },
        ]}
      />
      <UsersTable
        users={users}
        hasFilters={Object.keys(linkParams).length > 0}
        total={meta.total}
      />
      <Pagination
        page={meta.page}
        totalPages={Math.max(1, Math.ceil(meta.total / meta.limit))}
        params={linkParams}
        basePath="/admin/users"
      />
    </div>
  );
}
