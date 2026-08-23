import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/server/auth";
import { db } from "@/lib/db";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ThemeSync } from "@/components/theme-sync";
import { PreferencesProvider } from "@/components/preferences-provider";
import { DatabaseSetupNotice } from "@/components/shared/database-setup-notice";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  let activity: { id: string; message: string; createdAt: Date }[] = [];
  let theme: "SYSTEM" | "LIGHT" | "DARK" | undefined;
  let notificationsEnabled = true;

  try {
    const [activityEvents, settings] = await Promise.all([
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

    activity = activityEvents;
    theme = settings?.theme;
    notificationsEnabled = settings?.notificationsEnabled ?? true;
  } catch (error) {
    // Unreachable / unauthenticated database — show guidance instead of a crash.
    console.error("[dashboard] database unavailable:", error);
    return <DatabaseSetupNotice />;
  }

  return (
    <SessionProvider session={session}>
      <ThemeSync theme={theme ?? "SYSTEM"} />
      <PreferencesProvider notificationsEnabled={notificationsEnabled}>
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
