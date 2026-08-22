import {
  GraduationCap,
  Code2,
  FlaskConical,
  Briefcase,
  Users,
} from "lucide-react";

const USE_CASES = [
  {
    icon: GraduationCap,
    title: "Students",
    quote:
      "\u201cTurn lecture slides and textbooks into a tutor. Ask what an exam will cover.\u201d",
  },
  {
    icon: Code2,
    title: "Developers",
    quote:
      "\u201cDrop in specs and RFCs. Ask why a decision was made months later.\u201d",
  },
  {
    icon: FlaskConical,
    title: "Researchers",
    quote:
      "\u201cQuery dozens of papers at once and jump straight to the cited passage.\u201d",
  },
  {
    icon: Briefcase,
    title: "Professionals",
    quote:
      "\u201cContracts, reports, policies — find the clause you need in seconds.\u201d",
  },
  {
    icon: Users,
    title: "Teams",
    quote:
      "\u201cA shared library that answers questions before anyone has to ask around.\u201d",
  },
];

export function UseCases() {
  return (
    <section id="use-cases" className="container scroll-mt-20 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold text-primary">Use cases</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Built for people who work with knowledge
        </h2>
      </div>

      <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {USE_CASES.map((useCase) => (
          <li
            key={useCase.title}
            className="rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <useCase.icon className="h-5 w-5 text-primary" aria-hidden="true" />
            <h3 className="mt-3 text-sm font-semibold">{useCase.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {useCase.quote}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
