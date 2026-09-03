"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Radar, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { useAuthActions } from "@/lib/auth/session";

type View = "signin" | "signup";
type LoginRole = "marketer" | "admin";

/**
 * Login for both actors. Marketers and admins authenticate against separate
 * API guards, so the toggle picks the endpoint, not just a label. Admin
 * accounts are provisioned by an administrator — there is no admin signup.
 */
export default function LoginPage() {
  const router = useRouter();
  const { signInAsMarketer, signUpAsMarketer, signInAsAdmin } = useAuthActions();

  const [view, setView] = useState<View>("signin");
  const [loginRole, setLoginRole] = useState<LoginRole>("marketer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function run(action: () => Promise<unknown>, destination: string) {
    setSubmitting(true);
    setError(null);
    try {
      await action();
      router.push(destination);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.displayMessage : "Something went wrong. Please try again.",
      );
      setSubmitting(false);
    }
  }

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (loginRole === "admin") {
      void run(() => signInAsAdmin(email, password), "/admin");
    } else {
      void run(() => signInAsMarketer(email, password), "/dashboard");
    }
  }

  function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    void run(
      () => signUpAsMarketer({ name, email, password, phone: phone || undefined }),
      "/dashboard",
    );
  }

  function switchView(next: View) {
    setView(next);
    setError(null);
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
            {error ? (
              <p
                role="alert"
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            ) : null}

            {view === "signin" ? (
              <>
                {/* Role toggle — picks which API guard we authenticate against */}
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

                <form className="space-y-4" onSubmit={handleSignIn}>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
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
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting
                      ? "Signing in…"
                      : `Log in as ${loginRole === "admin" ? "Admin" : "Marketer"}`}
                  </Button>
                </form>

                {loginRole === "marketer" ? (
                  <p className="text-center text-xs text-muted-foreground">
                    New marketer?{" "}
                    <button
                      type="button"
                      className="font-medium text-primary hover:underline"
                      onClick={() => switchView("signup")}
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
                    You&apos;ll be signed in straight away.
                  </p>
                </div>
                <form className="space-y-4" onSubmit={handleSignUp}>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      autoComplete="name"
                      required
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
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-phone">Phone (optional)</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      At least 8 characters.
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Creating account…" : "Create account"}
                  </Button>
                </form>
                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={() => switchView("signin")}
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
