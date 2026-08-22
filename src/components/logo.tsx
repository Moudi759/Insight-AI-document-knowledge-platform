import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

export function Logo({
  className,
  href = "/",
  showText = true,
}: {
  className?: string;
  href?: string;
  showText?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      aria-label={`${APP_NAME} home`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-indigo-500 to-violet-500 shadow-md shadow-primary/25 transition-transform duration-200 group-hover:scale-105">
        <Sparkles className="h-4 w-4 text-white dark:text-primary-foreground" />
      </span>
      {showText ? (
        <span className="text-[17px] font-semibold tracking-tight">
          {APP_NAME}
        </span>
      ) : null}
    </Link>
  );
}
