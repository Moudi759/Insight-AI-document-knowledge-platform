import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-16">
      <Logo />
      <h1 className="mt-8 text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: August 2026
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground">
        <section>
          <h2>1. Acceptance</h2>
          <p className="mt-2">
            By creating an Insight account you agree to these terms. If you do
            not agree, please do not use the service.
          </p>
        </section>
        <section>
          <h2>2. Your content</h2>
          <p className="mt-2">
            You retain full ownership of every document you upload. Insight
            processes your files solely to provide extraction, indexing and
            retrieval features within your personal workspace.
          </p>
        </section>
        <section>
          <h2>3. Acceptable use</h2>
          <p className="mt-2">
            Do not upload content you have no right to share with a processing
            service, and do not attempt to access other users&apos; data or
            disrupt the platform.
          </p>
        </section>
        <section>
          <h2>4. Availability</h2>
          <p className="mt-2">
            The service is provided &ldquo;as is&rdquo; without warranties.
            Features may change as the product evolves.
          </p>
        </section>
        <section>
          <h2>5. Contact</h2>
          <p className="mt-2">
            Questions about these terms? Reach us at{" "}
            <a href="mailto:support@insight.app" className="text-primary underline-offset-2 hover:underline">
              support@insight.app
            </a>
            .
          </p>
        </section>
      </div>

      <Link
        href="/"
        className="mt-10 inline-block rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
      >
        Back home
      </Link>
    </div>
  );
}
