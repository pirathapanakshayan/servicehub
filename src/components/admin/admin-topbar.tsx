"use client";

import { Bell, ExternalLink, LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ADMIN_LINKS } from "@/components/admin/admin-links";
import { InitialsAvatar } from "@/components/admin/avatar";
import { BrandLogo } from "@/components/layout/brand-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/components/layout/use-logout";
import { cn } from "@/lib/utils";

const circleButton =
  "bg-admin-panel border-admin-border text-admin-text hover:bg-admin-panel-2 flex size-10 items-center justify-center rounded-full border transition-colors";

const menuClass = "w-56";

function NotificationsItem() {
  return (
    <DropdownMenuItem disabled>
      <Bell aria-hidden="true" />
      No new notifications
    </DropdownMenuItem>
  );
}

function SiteLinks() {
  return (
    <>
      <DropdownMenuItem render={<Link href="/" />}>
        <ExternalLink aria-hidden="true" />
        View public site
      </DropdownMenuItem>
      <DropdownMenuItem render={<Link href="/profile" />}>
        <UserRound aria-hidden="true" />
        My profile
      </DropdownMenuItem>
    </>
  );
}

export function AdminTopbar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const { logout, pending } = useLogout();
  const navRef = useRef<HTMLElement>(null);

  // On narrow screens the pill nav scrolls; keep the active page's pill in view.
  useEffect(() => {
    navRef.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname]);

  return (
    <header className="flex flex-wrap items-center gap-3 md:flex-nowrap">
      <BrandLogo href="/admin/dashboard" />

      {/* Below md the pill nav takes its own row and scrolls horizontally. */}
      <nav
        ref={navRef}
        aria-label="Admin"
        className="order-last w-full [scrollbar-width:none] overflow-x-auto md:order-none md:flex md:flex-1 md:justify-center"
      >
        <ul className="light-surface bg-admin-light inline-flex gap-1 rounded-full p-1">
          {ADMIN_LINKS.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-9 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors",
                    active
                      ? "bg-admin-accent text-admin-accent-ink"
                      : "text-admin-light-text hover:bg-muted",
                  )}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {/* Icon buttons collapse into the avatar menu below md. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<button type="button" className={cn(circleButton, "hidden md:flex")} />}
            aria-label="Notifications"
          >
            <Bell className="size-4" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={menuClass}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            </DropdownMenuGroup>
            <NotificationsItem />
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<button type="button" className={cn(circleButton, "hidden md:flex")} />}
            aria-label="Settings"
          >
            <Settings className="size-4" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={menuClass}>
            <SiteLinks />
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<button type="button" className="rounded-full" />}
            aria-label={`Account menu for ${adminName}`}
          >
            <InitialsAvatar name={adminName} size="md" decorative />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={menuClass}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Signed in as {adminName}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="md:hidden" />
            <div className="md:hidden">
              <NotificationsItem />
              <SiteLinks />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" disabled={pending} onClick={logout}>
              <LogOut aria-hidden="true" />
              {pending ? "Logging out..." : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
