import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to turn your first documents into knowledge.",
    features: [
      "Up to 50 documents",
      "200 AI questions / month",
      "PDF, TXT, Markdown & DOCX support",
      "Full-text search",
      "Conversation history",
    ],
    cta: "Start for free",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "per month",
    description: "For power users building a serious personal knowledge base.",
    features: [
      "Unlimited documents",
      "Unlimited AI questions",
      "Priority processing queue",
      "Advanced analytics",
      "Collections & workspaces",
      "Email support",
    ],
    cta: "Get Pro",
    href: "/register",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$29",
    period: "per seat / month",
    description: "Shared knowledge that answers before anyone has to ask around.",
    features: [
      "Everything in Pro",
      "Shared team libraries",
      "Roles & permissions",
      "Usage analytics per member",
      "SSO (coming soon)",
      "Priority support",
    ],
    cta: "Contact sales",
    href: "/register",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="border-t bg-sidebar/60 py-24 scroll-mt-20"
    >
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-primary">Pricing</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Simple plans that scale with your curiosity
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start free. Upgrade when your library grows.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-7 shadow-sm transition-all duration-200 hover:shadow-md",
                plan.highlighted &&
                  "glow-ring border-primary/40 lg:-translate-y-2"
              )}
            >
              {plan.highlighted ? (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-primary to-violet-500 px-3 py-1 text-[11px] font-semibold text-white shadow-sm dark:text-primary-foreground">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  Most popular
                </span>
              ) : null}

              <h3 className="text-base font-semibold">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tracking-tight">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <p className="mt-3 min-h-10 text-sm leading-relaxed text-muted-foreground">
                {plan.description}
              </p>

              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-success"
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant={plan.highlighted ? "default" : "outline"}
                size="lg"
                className="mt-7 w-full"
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Plans are currently illustrative — the free plan is fully functional.
        </p>
      </div>
    </section>
  );
}
