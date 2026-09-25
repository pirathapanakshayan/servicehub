import { CalendarCheck, LayoutDashboard, UserRound, type LucideIcon } from "lucide-react";

export type NavUser = { name: string; role: "CUSTOMER" | "ADMIN" };

export type AccountLink = { href: string; label: string; icon: LucideIcon };

export function accountLinks(user: NavUser): AccountLink[] {
  return [
    {
      href: user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    { href: "/my-bookings", label: "My Bookings", icon: CalendarCheck },
    { href: "/profile", label: "Profile", icon: UserRound },
  ];
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
