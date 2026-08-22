import { UploadCloud, Cpu, MessageCircleQuestion } from "lucide-react";

const STEPS = [
  {
    icon: UploadCloud,
    step: "01",
    title: "Upload your documents",
    description:
      "Drag in PDFs, Word files, Markdown notes or plain text. Insight accepts files up to 20 MB and validates everything on arrival.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "Insight processes and indexes them",
    description:
      "Text is extracted, split into semantic chunks and embedded into a retrieval index — automatically, in seconds.",
  },
  {
    icon: MessageCircleQuestion,
    step: "03",
    title: "Ask questions, get contextual answers",
    description:
      "Relevant passages are retrieved for every question, so answers are grounded in your documents with cited sources.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-y bg-sidebar/60 py-24 scroll-mt-20"
    >
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-primary">How it works</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            From files to answers in three steps
          </h2>
        </div>

        <ol className="relative mx-auto mt-16 grid max-w-5xl gap-10 md:grid-cols-3 md:gap-6">
          <span
            className="absolute left-[27px] top-8 hidden h-px w-[calc(100%-56px)] border-t border-dashed md:block"
            aria-hidden="true"
          />
          {STEPS.map((step) => (
            <li key={step.step} className="relative text-center md:text-left">
              <div className="flex items-center justify-center gap-3 md:justify-start">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border bg-card shadow-sm">
                  <step.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </span>
                <span
                  className="text-4xl font-bold text-muted-foreground/25"
                  aria-hidden="true"
                >
                  {step.step}
                </span>
              </div>
              <h3 className="mt-5 text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
