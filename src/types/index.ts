export type FileType = "PDF" | "TXT" | "MD" | "DOCX";
export type ProcessingStatus = "QUEUED" | "PROCESSING" | "READY" | "FAILED";
export type MessageRole = "USER" | "ASSISTANT" | "SYSTEM";

export interface UserDTO {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
}

export interface SourceReference {
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  page: number | null;
  snippet: string;
}

export interface DocumentSummary {
  id: string;
  title: string;
  fileName: string;
  fileType: FileType;
  fileSize: number;
  processingStatus: ProcessingStatus;
  wordCount: number;
  pageCount: number | null;
  createdAt: string;
  updatedAt: string;
  collections: { id: string; name: string; color: string }[];
}

export interface DocumentDetail extends DocumentSummary {
  extractedText: string | null;
  errorMessage: string | null;
}

export interface ChunkPreview {
  id: string;
  chunkIndex: number;
  content: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  documentId: string | null;
  documentTitle: string | null;
  messageCount: number;
  lastMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageDTO {
  id: string;
  role: MessageRole;
  content: string;
  sources: SourceReference[] | null;
  createdAt: string;
  pending?: boolean;
}

export interface CollectionSummary {
  id: string;
  name: string;
  description: string | null;
  color: string;
  documentCount: number;
  createdAt: string;
}

export interface SearchResult {
  type: "document" | "conversation" | "text";
  id: string;
  title: string;
  snippet: string;
  documentId: string | null;
  date: string;
}

export interface DashboardStats {
  totalDocuments: number;
  documentsThisMonth: number;
  questionsAsked: number;
  storageUsedBytes: number;
  readyDocuments: number;
  processingDocuments: number;
}

export interface UploadState {
  status: "idle" | "uploading" | "processing" | "success" | "error";
  progress: number;
  fileName?: string;
  error?: string;
  documentId?: string;
}
