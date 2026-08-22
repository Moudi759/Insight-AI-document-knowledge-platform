import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  icon: LucideIcon;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  changePositive = true,
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          {change ? (
            <p
              className={cn(
                "mt-1.5 text-xs font-medium",
                changePositive ? "text-success" : "text-destructive"
              )}
            >
              {change}
            </p>
          ) : null}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
          <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-7 w-16" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}
