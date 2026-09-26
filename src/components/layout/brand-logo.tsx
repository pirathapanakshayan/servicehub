import { Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Star mark + wordmark, shared by the site navbar, the admin top bar and the footer. */
export function BrandLogo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "text-foreground flex shrink-0 items-center gap-2 rounded-full pr-2 text-lg font-semibold tracking-tight",
        className,
      )}
    >
      <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full">
        <Star className="size-4 fill-current" aria-hidden="true" />
      </span>
      ServiceHub
    </Link>
  );
}
