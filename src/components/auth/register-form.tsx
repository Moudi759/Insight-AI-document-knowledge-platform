"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

const passwordRules = [
  { label: "8+ characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One lowercase", test: (v: string) => /[a-z]/.test(v) },
  { label: "One number", test: (v: string) => /[0-9]/.test(v) },
];

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const passwordValue = watch("password") ?? "";

  async function onSubmit(values: RegisterInput) {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data: { error?: string } | null = await response
          .json()
          .catch(() => null);
        toast.error("Could not create account", {
          description:
            data?.error ?? "Please review your details and try again.",
        });
        return;
      }

      const result = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (result?.error) {
        toast.success("Account created — please sign in");
        router.push("/login");
        return;
      }

      toast.success("Welcome to Insight!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Registration failed", {
        description: "A network error occurred. Please try again.",
      });
    }
  }

  return (
    <Card className="border-border/70 shadow-lg shadow-black/[0.03]">
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>
          Start building your personal knowledge workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Ada Lovelace"
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
            {errors.name ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <ul className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5" aria-live="polite">
              {passwordRules.map((rule) => {
                const satisfied = rule.test(passwordValue);
                return (
                  <li
                    key={rule.label}
                    className={`text-[11px] transition-colors ${
                      satisfied ? "text-success" : "text-muted-foreground"
                    }`}
                  >
                    {satisfied ? "✓" : "○"} {rule.label}
                  </li>
                );
              })}
            </ul>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
