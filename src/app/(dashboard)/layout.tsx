import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/server/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ThemeSync } from "@/components/theme-sync";
import { PreferencesProvider } from "@/components/preferences-provider";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [activity, settings] = await Promise.all([
    db.activityEvent.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, message: true, createdAt: true },
    }),
    db.userSettings.findUnique({
      where: { userId: session.user.id },
      select: { theme: true, notificationsEnabled: true },
    }),
  ]);

  return (
    <SessionProvider session={session}>
      <ThemeSync theme={settings?.theme ?? "SYSTEM"} />
      <PreferencesProvider
        notificationsEnabled={settings?.notificationsEnabled ?? true}
      >
        <DashboardShell
          activity={activity.map((event) => ({
            id: event.id,
            message: event.message,
            createdAt: event.createdAt.toISOString(),
          }))}
        >
          {children}
        </DashboardShell>
      </PreferencesProvider>
    </SessionProvider>
  );
}
