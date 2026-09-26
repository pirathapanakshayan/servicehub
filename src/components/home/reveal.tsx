"use client";

import { motion, useReducedMotion } from "motion/react";

type Props = { children: React.ReactNode; className?: string };

/** List whose <RevealItem> children fade up with a stagger when scrolled into view. */
export function RevealGroup({ children, className }: Props) {
  const reduce = useReducedMotion();
  return (
    <motion.ul
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
    >
      {children}
    </motion.ul>
  );
}

export function RevealItem({ children, className }: Props) {
  return (
    <motion.li
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] } },
      }}
    >
      {children}
    </motion.li>
  );
}
