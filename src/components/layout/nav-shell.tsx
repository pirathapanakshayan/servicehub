"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SCROLL_THRESHOLD = 24;

/** Floating pill bar that shrinks slightly and gains a shadow after 24px of scroll. */
export function NavShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // The wrapper sticks at 0 and pads 16px, so the bar floats 16px from the top.
    <div className="sticky top-0 z-40 px-4 pt-4">
      <div
        data-scrolled={scrolled || undefined}
        className={cn(
          // --card at 70% is the spec's rgba(22,24,28,0.7).
          "bg-card/70 shadow-surface mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 rounded-full pr-2 pl-5 backdrop-blur-md",
          "transition-[height,box-shadow] duration-200 motion-reduce:transition-none",
          "data-scrolled:h-14 data-scrolled:shadow-[inset_0_1px_0_rgb(255_255_255/0.04),0_12px_32px_rgb(0_0_0/0.45)]",
        )}
      >
        {children}
      </div>
    </div>
  );
}
