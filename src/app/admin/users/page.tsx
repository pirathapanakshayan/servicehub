import type { Metadata } from "next";
import { AdminFilters } from "@/components/admin/admin-filters";
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
  const { data: users, meta } = await listCustomers(query);

  const linkParams: Record<string, string> = {};
  if (query.search) linkParams.search = query.search;
  if (query.isActive !== undefined) linkParams.isActive = String(query.isActive);

  return (
    <div className="space-y-5">
      <AdminFilters
        fields={[
          { type: "search", key: "search", label: "Search", placeholder: "Name or email..." },
          {
            type: "select",
            key: "isActive",
            label: "Status",
            options: [
              { value: "", label: "All customers" },
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ],
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
