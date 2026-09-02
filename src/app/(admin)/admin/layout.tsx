import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

/**
 * Server-side gate for everything under /admin.
 *
 * This is defense in depth on top of `src/middleware.ts`: the admin area is
 * never rendered for a request whose Clerk session does not carry
 * `publicMetadata.role === "admin"`, regardless of the middleware matcher.
 */
export default async function AdminAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, sessionClaims } = await auth();

  if (!userId) redirect("/login");

  const role = (sessionClaims as { metadata?: { role?: string } } | null)?.metadata
    ?.role;

  if (role !== "admin") redirect("/dashboard");

  return <>{children}</>;
}
