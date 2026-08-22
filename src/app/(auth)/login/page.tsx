import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Insight workspace.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] w-full max-w-sm" />}>
      <LoginForm />
    </Suspense>
  );
}
