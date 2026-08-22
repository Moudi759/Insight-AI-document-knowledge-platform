"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  MessagesSquare,
  FolderKanban,
  Search,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "AI Chat", href: "/chat", icon: MessagesSquare },
  { label: "Collections", href: "/collections", icon: FolderKanban },
  { label: "Search", href: "/search", icon: Search },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="space-y-1 px-3">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon
              className={cn(
                "h-[18px] w-[18px] shrink-0",
                active ? "text-primary" : "text-muted-foreground"
              )}
              aria-hidden="true"
            />
            {item.label}
            {active ? (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
