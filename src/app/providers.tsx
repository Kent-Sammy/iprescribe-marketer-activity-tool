"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "@/lib/auth/session";
import { DataProvider } from "@/lib/data/store";

/**
 * Client provider tree.
 *
 * <SessionProvider> restores the API session from the stored token pair;
 * <DataProvider> loads the collections that session is allowed to see, so it
 * has to sit inside it.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <DataProvider>{children}</DataProvider>
    </SessionProvider>
  );
}
