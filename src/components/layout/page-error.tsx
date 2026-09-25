"use client";

import { CircleAlert } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

type PageErrorProps = { error: Error & { digest?: string }; reset: () => void };

/** Shared UI for route error boundaries (error.tsx files). */
export function PageError({ error, reset }: PageErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center"
    >
      <div className="bg-danger/10 text-danger rounded-full p-3">
        <CircleAlert className="size-6" aria-hidden="true" />
      </div>
      <h1 className="text-ink text-xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground text-sm">
        We couldn&apos;t load this page. Please check your connection and try again.
      </p>
      <Button className="mt-2" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
