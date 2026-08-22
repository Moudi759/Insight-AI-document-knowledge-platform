import {
  MessagesSquare,
  FolderKanban,
  Search,
  BrainCircuit,
  History,
  ShieldCheck,
} from "lucide-react";

const FEATURES = [
  {
    icon: MessagesSquare,
    title: "AI document chat",
    description:
      "Ask questions in plain language and get precise answers grounded in your own files — with citations to the exact passages.",
  },
  {
    icon: FolderKanban,
    title: "Smart organization",
    description:
      "Group documents into collections like Research, University or Projects so everything stays where you expect it.",
  },
  {
    icon: Search,
    title: "Full-text search",
    description:
      "Search across titles, conversations and the extracted content of every page you've ever uploaded. Instantly.",
  },
  {
    icon: BrainCircuit,
    title: "Knowledge extraction",
    description:
      "Every document is parsed, chunked and embedded on upload, building a retrieval engine tailored to your library.",
  },
  {
    icon: History,
    title: "Conversation history",
    description:
      "Every question and answer is saved. Reopen past conversations and pick up your research exactly where you left it.",
  },
  {
    icon: ShieldCheck,
    title: "Secure personal workspace",
    description:
      "Documents are private by default with strict per-user access control. Your knowledge is yours alone.",
  },
];

export function Features() {
  return (
    <section id="features" className="container scroll-mt-20 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold text-primary">Features</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Everything your documents wish they could do
        </h2>
        <p className="mt-3 text-muted-foreground">
          A complete toolkit for turning scattered files into a living,
          conversational knowledge base.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <article
            key={feature.title}
            className="group rounded-xl border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
              <feature.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
