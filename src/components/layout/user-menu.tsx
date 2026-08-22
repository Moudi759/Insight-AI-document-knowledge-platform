"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { LogOut, Settings, UserRound, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(
  name: string | null | undefined,
  email: string | null | undefined
): string {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return (email ?? "?").slice(0, 2).toUpperCase();
}

export function UserMenu() {
  const router = useRouter();
  const { data: session } = useSession();

  const user = session?.user;

  async function handleSignOut() {
    await signOut({ redirectTo: "/" });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 w-9 rounded-full p-0"
          aria-label="Open user menu"
        >
          <Avatar className="h-8 w-8">
            {user?.image ? <AvatarImage src={user.image} alt="" /> : null}
            <AvatarFallback>
              {user ? initials(user.name, user.email) : "?"}
            </AvatarFallback>          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold">{user?.name ?? "Account"}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/settings?tab=profile")}>
          <UserRound aria-hidden="true" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/settings")}>
          <Settings aria-hidden="true" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/documents")}>
          <Sparkles aria-hidden="true" />
          My documents
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          <LogOut aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
