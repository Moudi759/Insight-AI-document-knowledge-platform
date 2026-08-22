"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border bg-card shadow-sm">
        <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-semibold">This view failed to load</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        The database may be unreachable or the request failed. Check your
        connection and try again.
      </p>
      <div className="mt-5 flex gap-3">
        <Button size="sm" onClick={reset}>
          <RotateCcw aria-hidden="true" /> Retry
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard">Overview</Link>
        </Button>
      </div>
    </div>
  );
}
