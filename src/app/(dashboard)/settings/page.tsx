import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/server/auth";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Insight account and preferences.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const settings = await db.userSettings.findUnique({
    where: { userId },
    select: {
      aiTemperature: true,
      aiCitationsEnabled: true,
      notificationsEnabled: true,
      emailDigest: true,
    },
  });

  return (
    <SettingsView
      initialSettings={{
        aiTemperature: settings?.aiTemperature ?? 0.2,
        aiCitationsEnabled: settings?.aiCitationsEnabled ?? true,
        notificationsEnabled: settings?.notificationsEnabled ?? true,
        emailDigest: settings?.emailDigest ?? false,
      }}
    />
  );
}
