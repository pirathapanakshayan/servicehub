"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

type Props = { value: number; decimals?: number; prefix?: string; suffix?: string };

function format(n: number, decimals: number, prefix: string, suffix: string) {
  return (
    prefix +
    n.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + suffix
  );
}

/** Number that counts up from zero the first time it scrolls into view. */
export function CountUp({ value, decimals = 0, prefix = "", suffix = "" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView || reduce) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (n) => {
        node.textContent = format(n, decimals, prefix, suffix);
      },
    });
    return () => controls.stop();
  }, [inView, reduce, value, decimals, prefix, suffix]);

  // Server render shows the final value, so the number is correct without JS.
  return (
    <span ref={ref} className="tabular-nums">
      {format(value, decimals, prefix, suffix)}
    </span>
  );
}
