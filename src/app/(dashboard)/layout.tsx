import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/server/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const activity = await db.activityEvent.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, message: true, createdAt: true },
  });

  return (
    <SessionProvider session={session}>
      <DashboardShell
        activity={activity.map((event) => ({
          id: event.id,
          message: event.message,
          createdAt: event.createdAt.toISOString(),
        }))}
      >
        {children}
      </DashboardShell>
    </SessionProvider>
  );
}
