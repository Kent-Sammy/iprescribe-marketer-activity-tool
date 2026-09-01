"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Radar, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_MARKETERS } from "@/lib/mock/data";
import { useAuthActions } from "@/lib/auth/mock-session";

export default function LoginPage() {
  const router = useRouter();
  const { loginAsMarketer, loginAsAdmin } = useAuthActions();
  const [email, setEmail] = useState("jane.doe@example.com");
  const [password, setPassword] = useState("demo");
  const [marketerId, setMarketerId] = useState(MOCK_MARKETERS[0].id);

  function enterAsMarketer() {
    loginAsMarketer(marketerId);
    router.push("/dashboard");
  }

  function enterAsAdmin() {
    loginAsAdmin();
    router.push("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="rounded-xl bg-primary p-2 text-primary-foreground">
            <Radar className="h-6 w-6" />
          </span>
          <h1 className="text-lg font-semibold">Marketer Activity Tool</h1>
          <p className="text-sm text-muted-foreground">
            Field activity &amp; reporting for marketers
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4 p-6">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                enterAsMarketer();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Log in
              </Button>
            </form>

            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Authentication is mocked for this build. Any credentials work — “Log
              in” drops you straight into the marketer workspace.
            </p>
          </CardContent>
        </Card>

        {/* -------- Dev quick access -------- */}
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Quick access (dev)
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="marketer">Sign in as marketer</Label>
              <Select value={marketerId} onValueChange={setMarketerId}>
                <SelectTrigger id="marketer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_MARKETERS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                      {m.status === "INACTIVE" ? " (inactive)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={enterAsMarketer}>
                <UserRound className="h-4 w-4" />
                Marketer
              </Button>
              <Button variant="outline" onClick={enterAsAdmin}>
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              You can also switch roles any time from the top bar once inside.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
