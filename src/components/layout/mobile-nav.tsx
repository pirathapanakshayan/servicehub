"use client";

import { LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { accountLinks, SITE_LINKS, type NavUser } from "@/components/layout/nav-links";
import { useLogout } from "@/components/layout/use-logout";

const bigLink =
  "text-foreground hover:bg-card flex min-h-14 items-center rounded-card px-4 text-h3 font-medium transition-colors";

/** Circular menu button (below md) opening a full-height dark sheet with large links. */
export function MobileNav({ user }: { user: NavUser | null }) {
  const [open, setOpen] = useState(false);
  const { logout, pending } = useLogout();
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="icon" size="icon" className="md:hidden" />}
        aria-label="Open menu"
      >
        <Menu />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="bg-background gap-0 border-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="text-h2! font-medium">Menu</SheetTitle>
          <SheetDescription>
            {user ? `Signed in as ${user.name}` : "Book trusted local services"}
          </SheetDescription>
        </SheetHeader>

        <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Mobile">
          {SITE_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={bigLink} onClick={close}>
              {link.label}
            </Link>
          ))}
          {user && (
            <>
              <p className="text-muted-foreground text-label mt-4 px-4 pb-1 font-medium">Account</p>
              {accountLinks(user).map(({ href, label }) => (
                <Link key={href} href={href} className={bigLink} onClick={close}>
                  {label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="mt-auto flex flex-col gap-2 p-6">
          {user ? (
            <Button
              variant="ghost"
              size="lg"
              disabled={pending}
              onClick={async () => {
                await logout();
                close();
              }}
            >
              <LogOut aria-hidden="true" />
              {pending ? "Logging out..." : "Logout"}
            </Button>
          ) : (
            <>
              <Link
                href="/login"
                onClick={close}
                className={buttonVariants({ variant: "ghost", size: "lg" })}
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={close}
                className={buttonVariants({ variant: "primary", size: "lg" })}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
