import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import { listDocuments } from "@/lib/server/documents/service";
import {
  DocumentsView,
  DocumentsSkeleton,
} from "@/components/documents/documents-view";
import { UploadDropzone } from "@/components/documents/upload-dropzone";

export const metadata: Metadata = {
  title: "Documents",
  description: "Your personal knowledge library.",
};

export const dynamic = "force-dynamic";

interface DocumentsPageProps {
  searchParams: Promise<{ upload?: string }>;
}

async function DocumentsContent({ openUpload }: { openUpload: boolean }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  if (openUpload) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Upload documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Files are extracted, chunked and indexed so you can ask questions
          about them right away.
        </p>
        <div className="mt-6">
          <UploadDropzone />
        </div>
      </div>
    );
  }

  const documents = await listDocuments(session.user.id);
  return <DocumentsView initialDocuments={documents} />;
}

export default async function DocumentsPage({
  searchParams,
}: DocumentsPageProps) {
  const { upload } = await searchParams;

  return (
    <Suspense fallback={<DocumentsSkeleton />}>
      <DocumentsContent openUpload={upload === "1"} />
    </Suspense>
  );
}
