import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your Insight workspace.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
