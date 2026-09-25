import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="flex max-w-md flex-col items-center gap-3 text-center">
          <div className="bg-primary/10 text-primary rounded-full p-3">
            <SearchX className="size-6" aria-hidden="true" />
          </div>
          <p className="text-primary text-sm font-semibold">404</p>
          <h1 className="text-ink text-2xl font-bold">Page not found</h1>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link href="/" className={buttonVariants()}>
              Go to homepage
            </Link>
            <Link href="/services" className={buttonVariants({ variant: "outline" })}>
              Browse services
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
