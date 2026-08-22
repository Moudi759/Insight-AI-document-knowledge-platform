import type { Metadata } from "next";
import { SearchView } from "@/components/search/search-view";

export const metadata: Metadata = {
  title: "Search",
  description: "Search across documents, conversations and extracted text.",
};

export default function SearchPage() {
  return <SearchView />;
}
