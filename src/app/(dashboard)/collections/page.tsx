import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/server/auth";
import { listDocuments, getUserCollections } from "@/lib/server/documents/service";
import { CollectionsView } from "@/components/collections/collections-view";

export const metadata: Metadata = {
  title: "Collections",
  description: "Organize documents into collections.",
};

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [collections, documents] = await Promise.all([
    getUserCollections(session.user.id),
    listDocuments(session.user.id),
  ]);

  return <CollectionsView collections={collections} documents={documents} />;
}
