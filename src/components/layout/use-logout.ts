"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

export function useLogout() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const logout = async () => {
    setPending(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      toast.success("You have been logged out");
      router.replace("/");
      router.refresh();
    } catch {
      toast.error("Unable to log out. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return { logout, pending };
}
