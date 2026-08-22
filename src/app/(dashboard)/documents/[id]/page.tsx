import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/server/auth";
import { getDocument } from "@/lib/server/documents/service";
import { DocumentViewer } from "@/components/documents/document-viewer";
import { handleApiError } from "@/lib/server/api-helpers";

export const dynamic = "force-dynamic";

interface DocumentPageProps {
  params: Promise<{ id: string }>;
}

interface GenerateMetadataProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: GenerateMetadataProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Document",
    description: `Read and chat with document ${id}.`,
  };
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  let document;
  try {
    document = await getDocument(session.user.id, id);
  } catch (error) {
    void handleApiError(error);
    notFound();
  }

  return <DocumentViewer document={document} />;
}
