"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminPageTitle } from "@/components/admin/admin-links";

export const PAGE_ACTIONS_ID = "admin-page-actions";

/** Back button (not on the dashboard), the page <h1>, and a slot for <PageActions>. */
export function AdminTitleRow() {
  const pathname = usePathname();
  const onDashboard = pathname.startsWith("/admin/dashboard");

  return (
    <div className="flex flex-wrap items-center gap-4">
      {!onDashboard && (
        <Link
          href="/admin/dashboard"
          aria-label="Back to dashboard"
          className="bg-admin-panel border-admin-border text-admin-text hover:bg-admin-panel-2 flex size-12 shrink-0 items-center justify-center rounded-full border transition-colors"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
      )}
      <h1 className="text-admin-text text-[32px] leading-tight font-normal tracking-[-0.02em] sm:text-[44px]">
        {adminPageTitle(pathname)}
      </h1>
      <div id={PAGE_ACTIONS_ID} className="ml-auto flex items-center gap-2" />
    </div>
  );
}
