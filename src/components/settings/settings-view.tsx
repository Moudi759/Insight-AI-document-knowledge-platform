"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Bell,
  Bot,
  Lock,
  Palette,
  UserRound,
  Loader2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider, SliderThumb as RadixSliderThumb } from "@radix-ui/react-slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function ProfileTab() {
  const router = useRouter();
  const { data: session } = useSession();
  const [name, setName] = React.useState(session?.user?.name ?? "");
  const [saving, setSaving] = React.useState(false);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error();

      toast.success("Profile updated");
      router.refresh();
    } catch {
      toast.error("Could not update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your public identity inside Insight.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              {session?.user?.image ? (
                <AvatarImage src={session.user.image} alt="" />
              ) : null}
              <AvatarFallback className="text-base">
                {(session?.user?.email ?? "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{name || "Your account"}</p>
              <p className="text-xs text-muted-foreground">
                {session?.user?.email}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings-name">Full name</Label>
            <Input
              id="settings-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
            />
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : null} Save profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

const THEME_OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  function selectTheme(value: (typeof THEME_OPTIONS)[number]["value"]) {
    setTheme(value);
    // Persist the preference so it follows the account across devices.
    void fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: value.toUpperCase() }),
    })
      .then((response) => {
        if (!response.ok) throw new Error();
      })
      .catch(() => {
        toast.error("Could not save theme preference");
      });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Choose how Insight looks on this device — saved to your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="grid grid-cols-3 gap-3"
          role="radiogroup"
          aria-label="Theme preference"
        >
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={theme === option.value}
              onClick={() => selectTheme(option.value)}
              className={`rounded-lg border p-3 text-center text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                theme === option.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "hover:bg-accent"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SecurityTab() {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) {
        const data: { error?: string } = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not change password.");
      }

      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error("Change failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>Update your account password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : null} Change password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface SettingsState {
  aiTemperature: number;
  aiCitationsEnabled: boolean;
  notificationsEnabled: boolean;
  emailDigest: boolean;
}

function PreferencesTabs({ initial }: { initial: SettingsState }) {
  const router = useRouter();
  const [state, setState] = React.useState<SettingsState>(initial);
  const [saving, setSaving] = React.useState(false);

  async function persist(next: SettingsState) {
    setState(next);
    setSaving(true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!response.ok) throw new Error();
      toast.success("Preferences saved");
      router.refresh();
    } catch {
      toast.error("Could not save preferences");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Decide what Insight tells you about.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">In-app notifications</p>
                <p className="text-xs text-muted-foreground">
                  Processing finished, document ready to chat.
                </p>
              </div>
              <Switch
                checked={state.notificationsEnabled}
                onCheckedChange={(checked) =>
                  void persist({ ...state, notificationsEnabled: checked })
                }
                aria-label="Toggle in-app notifications"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Weekly email digest</p>
                <p className="text-xs text-muted-foreground">
                  A summary of your library activity.
                </p>
              </div>
              <Switch
                checked={state.emailDigest}
                onCheckedChange={(checked) =>
                  void persist({ ...state, emailDigest: checked })
                }
                aria-label="Toggle weekly email digest"
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="ai">
        <Card>
          <CardHeader>
            <CardTitle>AI preferences</CardTitle>
            <CardDescription>
              Tune how the assistant responds to your questions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Creativity (temperature)</p>
                  <p className="text-xs text-muted-foreground">
                    Lower is factual and precise; higher is more exploratory.
                  </p>
                </div>
                <span className="rounded-md border bg-muted px-2 py-0.5 font-mono text-xs">
                  {state.aiTemperature.toFixed(1)}
                </span>
              </div>
              <Slider
                className="relative mt-4 flex h-5 w-full touch-none select-none items-center"
                value={[state.aiTemperature]}
                min={0}
                max={1}
                step={0.1}
                aria-label="AI temperature"
                onValueCommit={([value]) =>
                  void persist({
                    ...state,
                    aiTemperature: value ?? state.aiTemperature,
                  })
                }
                onValueChange={([value]) =>
                  setState((s) => ({ ...s, aiTemperature: value ?? s.aiTemperature }))
                }
              >
                <track className="relative h-1.5 w-full grow rounded-full bg-secondary" />
                <RadixSliderThumb className="block h-4 w-4 rounded-full border border-primary/50 bg-card shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </Slider>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Show source references</p>
                <p className="text-xs text-muted-foreground">
                  Attach cited passages under AI answers.
                </p>
              </div>
              <Switch
                checked={state.aiCitationsEnabled}
                onCheckedChange={(checked) =>
                  void persist({ ...state, aiCitationsEnabled: checked })
                }
                aria-label="Toggle source citations"
              />
            </div>

            {saving ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                Saving…
              </p>
            ) : null}
          </CardContent>
        </Card>
      </TabsContent>
    </>
  );
}

export function SettingsView({
  initialSettings,
}: {
  initialSettings: SettingsState;
}) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "profile" ? "profile" : "profile";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your account and workspace preferences.
      </p>

      <Tabs defaultValue={initialTab} className="mt-6">
        <TabsList className="h-auto flex-wrap justify-start sm:h-9">
          <TabsTrigger value="profile">
            <UserRound aria-hidden="true" /> Profile
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette aria-hidden="true" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock aria-hidden="true" /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell aria-hidden="true" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Bot aria-hidden="true" /> AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="appearance">
          <AppearanceTab />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>

        <PreferencesTabs initial={initialSettings} />
      </Tabs>
    </div>
  );
}
