"use client";

import {
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogout } from "@/components/layout/use-logout";
import { cn } from "@/lib/utils";

export const ADMIN_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/services", label: "Services", icon: Sparkles },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/users", label: "Users", icon: Users },
];

export function adminPageTitle(pathname: string): string {
  return ADMIN_LINKS.find((l) => pathname.startsWith(l.href))?.label ?? "Admin";
}

/** Sidebar navigation, shared by the desktop sidebar and the mobile drawer. */
export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { logout, pending } = useLogout();

  const itemClass =
    "rounded-control flex h-10 items-center gap-3 px-3 text-sm font-medium transition-colors";

  return (
    <nav aria-label="Admin" className="flex h-full flex-col gap-1 p-3">
      {ADMIN_LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              itemClass,
              active ? "bg-primary text-primary-foreground" : "text-ink hover:bg-muted",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={logout}
        disabled={pending}
        className={cn(itemClass, "text-danger hover:bg-danger/10 mt-auto disabled:opacity-50")}
      >
        <LogOut className="size-4" aria-hidden="true" />
        {pending ? "Logging out..." : "Logout"}
      </button>
    </nav>
  );
}
