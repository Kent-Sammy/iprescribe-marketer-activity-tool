"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Radar, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthActions } from "@/lib/auth/mock-session";

type View = "signin" | "signup";
type LoginRole = "marketer" | "admin";

/**
 * FRONTEND-PROTOTYPE login. No real authentication: any (or no) input is
 * accepted and the buttons just navigate. See src/lib/auth/mock-session.tsx.
 */
export default function LoginPage() {
  const router = useRouter();
  const { loginAsMarketer, loginAsAdmin } = useAuthActions();

  const [view, setView] = useState<View>("signin");
  const [loginRole, setLoginRole] = useState<LoginRole>("marketer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function enterMarketer() {
    loginAsMarketer();
    router.push("/dashboard");
  }

  function enterAdmin() {
    loginAsAdmin();
    router.push("/admin");
  }

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (loginRole === "admin") enterAdmin();
    else enterMarketer();
  }

  function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    enterMarketer();
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
            {view === "signin" ? (
              <>
                {/* Role toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={loginRole === "marketer" ? "default" : "outline"}
                    onClick={() => setLoginRole("marketer")}
                  >
                    <UserRound className="h-4 w-4" />
                    Marketer
                  </Button>
                  <Button
                    type="button"
                    variant={loginRole === "admin" ? "default" : "outline"}
                    onClick={() => setLoginRole("admin")}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  {loginRole === "admin"
                    ? "Prototype: enter any details (or none) and continue to the admin portal."
                    : "Prototype: enter any details (or none) and continue to your dashboard."}
                </p>

                <form className="space-y-4" onSubmit={handleSignIn}>
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
                    Log in as {loginRole === "admin" ? "Admin" : "Marketer"}
                  </Button>
                </form>

                {loginRole === "marketer" ? (
                  <p className="text-center text-xs text-muted-foreground">
                    New marketer?{" "}
                    <button
                      type="button"
                      className="font-medium text-primary hover:underline"
                      onClick={() => setView("signup")}
                    >
                      Create an account
                    </button>
                  </p>
                ) : (
                  <p className="text-center text-xs text-muted-foreground">
                    Admin access is provisioned by your system administrator.
                  </p>
                )}
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-semibold">Create marketer account</p>
                  <p className="text-xs text-muted-foreground">
                    Prototype: dummy details are fine. No verification.
                  </p>
                </div>
                <form className="space-y-4" onSubmit={handleSignUp}>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create account
                  </Button>
                </form>
                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={() => setView("signin")}
                  >
                    Log in
                  </button>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
