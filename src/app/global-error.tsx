"use client";

import { useEffect } from "react";
import "./globals.css";

/** Last-resort boundary for errors in the root layout; it replaces the whole document. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground font-sans antialiased">
        <main className="flex min-h-svh items-center justify-center px-4">
          <div className="flex max-w-md flex-col items-center gap-3 text-center">
            <h1 className="text-ink text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground">
              ServiceHub hit an unexpected error. Please try again.
            </p>
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={reset}
                className="bg-primary text-primary-foreground hover:bg-primary-hover rounded-control h-10 px-4 text-sm font-medium"
              >
                Try again
              </button>
              {/* A plain anchor: the app shell may be broken, so do a full reload. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/"
                className="border-border bg-card hover:bg-muted rounded-control inline-flex h-10 items-center border px-4 text-sm font-medium"
              >
                Go to homepage
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
