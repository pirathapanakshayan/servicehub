"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ButtonArrow, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Newsletter pill input. There is no newsletter backend yet, so submitting only validates the
 * address and says so; nothing is stored or sent.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address");
      return;
    }
    setError(null);
    toast.info("Newsletter sign-ups aren't live yet", {
      description: "Nothing was saved. Check back soon.",
    });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-2">
      <label htmlFor="newsletter-email" className="text-muted-foreground text-label font-medium">
        Get new services in your inbox
      </label>
      <div className="bg-background shadow-surface flex items-center gap-1 rounded-full p-1">
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "newsletter-error" : undefined}
          className="text-foreground placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent px-4 text-sm outline-none"
        />
        <button type="submit" className={cn(buttonVariants({ variant: "primary" }), "shrink-0")}>
          Subscribe
          <ButtonArrow />
        </button>
      </div>
      {error && (
        <p id="newsletter-error" role="alert" className="text-danger px-4 text-sm">
          {error}
        </p>
      )}
    </form>
  );
}
