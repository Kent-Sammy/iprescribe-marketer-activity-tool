"use client";

import type { ReactNode } from "react";
import { MockSessionProvider } from "@/lib/auth/mock-session";
import { MockDataProvider } from "@/lib/mock/store";

/**
 * Client provider tree.
 *
 * FRONTEND-PROTOTYPE PHASE: authentication is mocked (see mock-session.tsx) and
 * there are no route guards. When real auth returns, re-add <ClerkProvider> here
 * (and re-add src/middleware.ts).
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MockSessionProvider>
      <MockDataProvider>{children}</MockDataProvider>
    </MockSessionProvider>
  );
}
