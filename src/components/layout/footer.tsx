import Link from "next/link";

const LINKS = [
  { href: "/services", label: "Services" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
  { href: "/admin/login", label: "Admin" },
];

export function Footer() {
  return (
    <footer className="border-border bg-card mt-auto border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Link href="/" className="text-primary text-lg font-bold">
            ServiceHub
          </Link>
          <p className="text-muted-foreground text-sm">
            Trusted local services, booked in minutes.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-muted-foreground hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} ServiceHub. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
