"use client";

import type { ReactNode } from "react";
import { MockDataProvider } from "@/lib/mock/store";

/**
 * Client provider tree.
 *
 * Authentication is provided by <ClerkProvider> in app/layout.tsx.
 * <MockDataProvider> still holds the (mock) facilities/reports data until the
 * data backend lands.
 */
export function Providers({ children }: { children: ReactNode }) {
  return <MockDataProvider>{children}</MockDataProvider>;
}
