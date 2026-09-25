"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AdminNav, adminPageTitle } from "@/components/admin/admin-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { initials } from "@/components/layout/nav-links";

export function AdminTopbar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-surface/90 border-border sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur lg:px-8">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon-lg" className="lg:hidden" />}
          aria-label="Open admin menu"
        >
          <Menu />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 gap-0 p-0">
          <SheetHeader className="border-border border-b">
            <SheetTitle className="text-primary font-bold">ServiceHub Admin</SheetTitle>
          </SheetHeader>
          <AdminNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <h1 className="text-ink truncate text-lg font-semibold">{adminPageTitle(pathname)}</h1>

      <div className="ml-auto flex items-center gap-3">
        <Link href="/" className="text-muted-foreground hover:text-ink hidden text-sm sm:block">
          View site
        </Link>
        <div className="flex items-center gap-2">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials(adminName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-ink hidden max-w-40 truncate text-sm font-medium sm:block">
            {adminName}
          </span>
        </div>
      </div>
    </header>
  );
}
