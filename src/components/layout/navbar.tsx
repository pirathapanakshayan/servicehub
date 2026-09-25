import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import type { NavUser } from "@/components/layout/nav-links";
import { getSession } from "@/lib/auth";

export async function Navbar() {
  const session = await getSession();
  const user: NavUser | null = session ? { name: session.name, role: session.role } : null;

  return (
    <header className="bg-surface/90 border-border sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-primary text-xl font-bold tracking-tight">
            ServiceHub
          </Link>
          <nav className="hidden md:block" aria-label="Main">
            <Link
              href="/services"
              className="text-muted-foreground hover:text-ink text-sm font-medium transition-colors"
            >
              Services
            </Link>
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost", className: "h-9" })}
              >
                Login
              </Link>
              <Link href="/register" className={buttonVariants({ className: "h-9" })}>
                Register
              </Link>
            </>
          )}
        </div>

        <MobileNav user={user} />
      </div>
    </header>
  );
}
