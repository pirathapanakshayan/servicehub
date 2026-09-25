import type { Metadata } from "next";
import { AdminTitleRow } from "@/components/admin/admin-title-row";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { requirePageAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | ServiceHub Admin" },
  robots: { index: false },
};

/** Dark admin shell. `.admin-theme` scopes the admin tokens (globals.css, CLAUDE.md). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requirePageAdmin();

  return (
    <div className="admin-theme min-h-svh p-2 sm:p-3">
      <div className="bg-admin-bg rounded-canvas mx-auto flex min-h-[calc(100svh-1rem)] max-w-[1440px] flex-col gap-6 px-4 py-4 sm:min-h-[calc(100svh-1.5rem)] sm:px-6 sm:py-5 lg:px-8">
        <AdminTopbar adminName={admin.name} />
        <AdminTitleRow />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
