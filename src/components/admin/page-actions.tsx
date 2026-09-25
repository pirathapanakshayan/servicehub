"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PAGE_ACTIONS_ID } from "@/components/admin/admin-title-row";

/** Renders its children into the title row's right-hand slot (see AdminTitleRow). */
export function PageActions({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById(PAGE_ACTIONS_ID));
  }, []);

  return target ? createPortal(children, target) : null;
}
