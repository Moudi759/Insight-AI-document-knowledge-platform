"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Bell } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ActivityItem {
  id: string;
  message: string;
  createdAt: string;
}

export function DashboardShell({
  children,
  activity,
}: {
  children: React.ReactNode;
  activity: ActivityItem[];
}) {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const pageTitle =
    NAV_LABELS.find((item) => pathname.startsWith(item.prefix))?.label ??
    "Insight";

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <Logo href="/dashboard" />
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav />
        </div>
        <div className="border-t border-sidebar-border p-4">
          <Link
            href="/documents?upload=1"
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Quick upload
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-dvh flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-md sm:gap-4 sm:px-6">
          {/* Mobile nav */}
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0">
              <SheetHeader className="border-b border-sidebar-border p-5 text-left">
                <SheetTitle asChild>
                  <div>
                    <Logo href="/dashboard" />
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="py-3">
                <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <h1 className="hidden truncate text-sm font-semibold md:block" aria-live="polite">
            {pageTitle}
          </h1>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden h-9 w-56 items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent sm:flex lg:w-64"
              aria-label="Open search (Ctrl+K)"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              Search…
              <kbd className="pointer-events-none ml-auto hidden rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground lg:inline-block">
                Ctrl K
              </kbd>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setPaletteOpen(true)}
              aria-label="Search"
            >
              <Search className="h-[18px] w-[18px]" />
            </Button>

            <Link
              href="/dashboard#activity"
              className="relative hidden rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block"
              aria-label={`Notifications: ${activity.length} recent events`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
                {activity.length > 0 ? (
                  <span
                    className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                ) : null}
              </span>
            </Link>

            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

const NAV_LABELS = [
  { prefix: "/dashboard", label: "Overview" },
  { prefix: "/documents", label: "Documents" },
  { prefix: "/chat", label: "AI Chat" },
  { prefix: "/collections", label: "Collections" },
  { prefix: "/search", label: "Search" },
  { prefix: "/analytics", label: "Analytics" },
  { prefix: "/settings", label: "Settings" },
];
