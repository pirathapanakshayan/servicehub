import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SITE_LINKS, type NavUser } from "@/components/layout/nav-links";
import { NavShell } from "@/components/layout/nav-shell";
import { UserMenu } from "@/components/layout/user-menu";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth";

export async function Navbar() {
  const session = await getSession();
  const user: NavUser | null = session ? { name: session.name, role: session.role } : null;

  return (
    <NavShell>
      <BrandLogo />

      <nav className="hidden md:block" aria-label="Main">
        <ul className="flex items-center gap-1">
          {SITE_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary flex h-9 items-center rounded-full px-4 text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="hidden items-center gap-2 md:flex">
        {user ? (
          <UserMenu user={user} />
        ) : (
          <>
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
              Login
            </Link>
            <Link href="/register" className={buttonVariants({ variant: "primary" })}>
              Register
            </Link>
          </>
        )}
      </div>

      <MobileNav user={user} />
    </NavShell>
  );
}
