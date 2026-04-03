"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/app-types";
import { clearStoredSession, getStoredSession } from "@/lib/client-storage";

function subscribeNoop() {
  return () => undefined;
}

export function useRoleGuard(requiredRole: UserRole) {
  const router = useRouter();
  const session = useSyncExternalStore(subscribeNoop, getStoredSession, () => null);
  const ready = Boolean(session && session.user.role === requiredRole);

  useEffect(() => {
    if (!session || session.user.role !== requiredRole) {
      clearStoredSession();
      router.replace("/");
    }
  }, [requiredRole, router, session]);

  return {
    ready,
    session,
  };
}
