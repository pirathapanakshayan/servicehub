export const ADMIN_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/users", label: "Users" },
] as const;

export function adminPageTitle(pathname: string): string {
  return ADMIN_LINKS.find((l) => pathname.startsWith(l.href))?.label ?? "Admin";
}
