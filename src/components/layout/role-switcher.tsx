"use client";

import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_MARKETERS } from "@/lib/mock/data";
import { useAuthActions, useCurrentUser } from "@/lib/auth/mock-session";

const ADMIN_VALUE = "role:admin";

/**
 * DEV-ONLY. Lets you jump between the admin experience and any marketer's
 * experience without a real login. Delete this component when Auth.js lands.
 */
export function RoleSwitcher() {
  const router = useRouter();
  const user = useCurrentUser();
  const { loginAsAdmin, loginAsMarketer } = useAuthActions();

  const value = user.role === "ADMIN" ? ADMIN_VALUE : `mkt:${user.marketerId}`;

  function handleChange(next: string) {
    if (next === ADMIN_VALUE) {
      loginAsAdmin();
      router.push("/admin");
      return;
    }
    const marketerId = next.replace("mkt:", "");
    loginAsMarketer(marketerId);
    router.push("/dashboard");
  }

  return (
    <div className="flex items-center gap-2">
      <FlaskConical className="h-4 w-4 text-muted-foreground" aria-hidden />
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger className="h-8 w-[190px] text-xs" aria-label="Switch mock user">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Admin</SelectLabel>
            <SelectItem value={ADMIN_VALUE}>Amaka Nwosu (Admin)</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Marketers</SelectLabel>
            {MOCK_MARKETERS.map((m) => (
              <SelectItem key={m.id} value={`mkt:${m.id}`}>
                {m.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
