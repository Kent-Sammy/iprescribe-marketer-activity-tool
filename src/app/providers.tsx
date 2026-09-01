"use client";

import type { ReactNode } from "react";
import { MockSessionProvider } from "@/lib/auth/mock-session";
import { MockDataProvider } from "@/lib/mock/store";

/**
 * Client provider tree. When real auth/data land, this is where next-auth's
 * <SessionProvider> and any query-client provider would go.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MockSessionProvider>
      <MockDataProvider>{children}</MockDataProvider>
    </MockSessionProvider>
  );
}
