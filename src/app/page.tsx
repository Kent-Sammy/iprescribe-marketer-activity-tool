import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function RootPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) redirect("/login");

  const role = (sessionClaims as { metadata?: { role?: string } } | null)?.metadata
    ?.role;
  redirect(role === "admin" ? "/admin" : "/dashboard");
}
