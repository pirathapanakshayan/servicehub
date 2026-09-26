"use client";

import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "motion/react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "Choose a service",
    text: "Browse vetted cleaning, beauty, repair and tutoring services with clear, upfront prices.",
  },
  {
    title: "Pick a date and time",
    text: "Select a 30-minute slot that suits you and add any notes for the professional.",
  },
  {
    title: "Relax, it's booked",
    text: "We confirm your booking, and you can track or cancel it anytime from your dashboard.",
  },
];

/** Steps joined by a line that draws with scroll; each number fills lime once reached. */
export function HowItWorks() {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const [reached, setReached] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    // Step i is reached when the line passes its marker (markers sit at 0, 0.5, 1).
    setReached(STEPS.filter((_, i) => p >= i / (STEPS.length - 1) - 0.02).length);
  });

  return (
    <ol ref={ref} className="relative mx-auto max-w-2xl space-y-14">
      <span
        aria-hidden="true"
        className="bg-border absolute top-6 bottom-6 left-6 w-px -translate-x-1/2"
      />
      <motion.span
        aria-hidden="true"
        className="bg-primary absolute top-6 bottom-6 left-6 w-px origin-top -translate-x-1/2"
        style={{ scaleY: reduce ? 1 : scaleY }}
      />
      {STEPS.map((step, i) => {
        const active = reduce || i < reached;
        return (
          <li key={step.title} className="relative flex gap-6">
            <span
              className={cn(
                "relative flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold transition-colors duration-200 motion-reduce:transition-none",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground shadow-surface",
              )}
            >
              {i + 1}
            </span>
            <div className="space-y-1.5 pt-2.5">
              <h3 className="text-foreground text-h3 font-medium">{step.title}</h3>
              <p className="text-muted-foreground">{step.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
