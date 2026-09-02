"use client";

import { useState } from "react";
import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import { Radar, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type View = "signin" | "signup";
type LoginRole = "marketer" | "admin";

function clerkErrorMessage(err: unknown): string {
  const e = err as { errors?: Array<{ longMessage?: string; message?: string }> };
  return (
    e?.errors?.[0]?.longMessage ||
    e?.errors?.[0]?.message ||
    "Something went wrong. Please try again."
  );
}

export default function LoginPage() {
  const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const clerk = useClerk();

  const [view, setView] = useState<View>("signin");
  const [loginRole, setLoginRole] = useState<LoginRole>("marketer");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Authenticated via the Admin entry point, but the account is not an admin. */
  const [notAdmin, setNotAdmin] = useState(false);

  function resetFeedback() {
    setError(null);
    setNotAdmin(false);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!signInLoaded || !signIn || !setSignInActive || busy) return;
    resetFeedback();
    setBusy(true);
    try {
      const res = await signIn.create({ identifier: email, password });
      if (res.status !== "complete") {
        setError("This account needs extra verification that isn't set up here.");
        return;
      }
      await setSignInActive({ session: res.createdSessionId });

      // Identify admins by Clerk role (public metadata) — never by "the email
      // exists". A non-admin who used the Admin entry point is authenticated
      // but must not be granted access to the admin dashboard.
      const activeUser = clerk.user;
      let role = (activeUser?.publicMetadata as { role?: string } | undefined)?.role;
      if (activeUser && role === undefined) {
        // Make sure the freshly loaded user carries its metadata before deciding.
        try {
          await activeUser.reload();
          role = (activeUser.publicMetadata as { role?: string } | undefined)?.role;
        } catch {
          /* fall through with role as-is */
        }
      }

      if (loginRole === "admin" && role !== "admin") {
        setNotAdmin(true);
        setError("You don't have admin access. This account is not an authorized admin.");
        return;
      }

      // Full reload so middleware and the server pick up the new session cookie
      // and route by the real role.
      window.location.assign(loginRole === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUpStart(e: React.FormEvent) {
    e.preventDefault();
    if (!signUpLoaded || !signUp || busy) return;
    resetFeedback();
    setBusy(true);
    try {
      await signUp.create({
        emailAddress: email,
        password,
        unsafeMetadata: { fullName: name.trim() },
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!signUpLoaded || !signUp || !setSignUpActive || busy) return;
    resetFeedback();
    setBusy(true);
    try {
      const res = await signUp.attemptEmailAddressVerification({ code });
      if (res.status === "complete") {
        await setSignUpActive({ session: res.createdSessionId });
        window.location.assign("/dashboard");
      } else {
        setError("That code didn't work. Check your email and try again.");
      }
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function switchView(next: View) {
    setView(next);
    setPendingVerification(false);
    setError(null);
    setNotAdmin(false);
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
                    onClick={() => {
                      setLoginRole("marketer");
                      resetFeedback();
                    }}
                  >
                    <UserRound className="h-4 w-4" />
                    Marketer
                  </Button>
                  <Button
                    type="button"
                    variant={loginRole === "admin" ? "default" : "outline"}
                    onClick={() => {
                      setLoginRole("admin");
                      resetFeedback();
                    }}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  {loginRole === "admin"
                    ? "Admin accounts are created by your administrator. Sign in with your assigned email and password."
                    : "Sign in to submit field reports and view your activity."}
                </p>

                {notAdmin ? (
                  <div className="space-y-3">
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {error ?? "You don't have admin access."}
                    </p>
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => window.location.assign("/dashboard")}
                    >
                      Go to your dashboard
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => clerk.signOut({ redirectUrl: "/login" })}
                    >
                      Use a different account
                    </Button>
                  </div>
                ) : (
                  <>
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
                      {error ? (
                        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                          {error}
                        </p>
                      ) : null}
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={!signInLoaded || busy}
                      >
                        {busy
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
                )}
              </>
            ) : null}

            {view === "signup" && !pendingVerification ? (
              <>
                <div>
                  <p className="text-sm font-semibold">Create marketer account</p>
                  <p className="text-xs text-muted-foreground">
                    Marketers only. Admin access is provisioned separately.
                  </p>
                </div>
                <form className="space-y-4" onSubmit={handleSignUpStart}>
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
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error ? (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {error}
                    </p>
                  ) : null}
                  {/* Clerk bot-protection mounts here when enabled. */}
                  <div id="clerk-captcha" />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!signUpLoaded || busy}
                  >
                    {busy ? "Creating account…" : "Create account"}
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
            ) : null}

            {view === "signup" && pendingVerification ? (
              <>
                <div>
                  <p className="text-sm font-semibold">Verify your email</p>
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code we sent to {email}.
                  </p>
                </div>
                <form className="space-y-4" onSubmit={handleVerify}>
                  <div className="space-y-1.5">
                    <Label htmlFor="code">Verification code</Label>
                    <Input
                      id="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </div>
                  {error ? (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {error}
                    </p>
                  ) : null}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!signUpLoaded || busy}
                  >
                    {busy ? "Verifying…" : "Verify & continue"}
                  </Button>
                </form>
                <p className="text-center text-xs text-muted-foreground">
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={() => switchView("signin")}
                  >
                    Back to log in
                  </button>
                </p>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
