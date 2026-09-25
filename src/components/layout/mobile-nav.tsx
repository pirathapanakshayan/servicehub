"use client";

import { LogOut, Menu, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { accountLinks, type NavUser } from "@/components/layout/nav-links";
import { useLogout } from "@/components/layout/use-logout";

const linkClass =
  "text-ink hover:bg-muted flex h-11 items-center gap-3 rounded-control px-3 text-sm font-medium";

export function MobileNav({ user }: { user: NavUser | null }) {
  const [open, setOpen] = useState(false);
  const { logout, pending } = useLogout();
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon-lg" className="md:hidden" />}
        aria-label="Open menu"
      >
        <Menu />
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-primary font-bold">ServiceHub</SheetTitle>
          <SheetDescription>
            {user ? `Signed in as ${user.name}` : "Book trusted services"}
          </SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4" aria-label="Mobile">
          <Link href="/services" className={linkClass} onClick={close}>
            <Sparkles className="size-4" aria-hidden="true" />
            Services
          </Link>
          {user && (
            <>
              <Separator className="my-2" />
              {accountLinks(user).map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className={linkClass} onClick={close}>
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </>
          )}
        </nav>
        <div className="mt-auto flex flex-col gap-2 p-4">
          {user ? (
            <Button
              variant="outline"
              className="h-10"
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
                className={buttonVariants({ variant: "outline", className: "h-10" })}
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={close}
                className={buttonVariants({ className: "h-10" })}
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
