import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { UseCases } from "@/components/landing/use-cases";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";
import { APP_DESCRIPTION, APP_TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${APP_TAGLINE} — Insight`,
  description: APP_DESCRIPTION,
};

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <UseCases />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
