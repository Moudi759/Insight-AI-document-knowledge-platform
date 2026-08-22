import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-16">
      <Logo />
      <h1 className="mt-8 text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: August 2026
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground">
        <section>
          <h2>What we store</h2>
          <p className="mt-2">
            Your account details (name, email, hashed password), the documents
            you upload, extracted text and embeddings used for retrieval, your
            conversations with the assistant, and basic usage analytics.
          </p>
        </section>
        <section>
          <h2>How documents are processed</h2>
          <p className="mt-2">
            Uploaded files are stored privately and served only to your
            authenticated session. Text extraction, chunking and embedding run
            server-side; document contents are never exposed to other users.
          </p>
        </section>
        <section>
          <h2>AI providers</h2>
          <p className="mt-2">
            When an external AI provider is configured, relevant document
            passages are sent to that provider to generate answers. In demo
            mode, all processing happens locally and nothing leaves your
            deployment.
          </p>
        </section>
        <section>
          <h2>Deleting your data</h2>
          <p className="mt-2">
            Deleting a document permanently removes the file, its extracted
            text, embeddings and dependent conversations. Deleting your account
            removes everything associated with it.
          </p>
        </section>
        <section>
          <h2>Contact</h2>
          <p className="mt-2">
            Privacy questions? Reach us at{" "}
            <a href="mailto:privacy@insight.app" className="text-primary underline-offset-2 hover:underline">
              privacy@insight.app
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
