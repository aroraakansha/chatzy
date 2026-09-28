import axios, { AxiosError } from "axios";

const RAG_API_BASE_URL = (process.env.NEXT_PUBLIC_RAG_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

export type RagDocument = {
  id?: string;
  document_id: string;
  filename?: string;
  name?: string;
  content_type?: string;
  chunk_count?: number;
  created_at?: string;
};

export type RagAnswer = {
  answer: string;
  sources?: Array<{
    document_id?: string;
    filename?: string;
    content?: string;
    score?: number;
  }>;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

export const ragService = {
  async enhanceText(text: string) {
    try {
      const response = await axios.post<{ enhanced_text: string }>(
        `${RAG_API_BASE_URL}/v1/text/enhance`,
        { text },
      );
      return response.data.enhanced_text;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Message enhancement is unavailable. Try again shortly."));
    }
  },

  async listDocuments() {
    try {
      const response = await axios.get<RagDocument[]>(`${RAG_API_BASE_URL}/v1/documents`);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Could not load your knowledge sources."));
    }
  },

  async uploadDocuments(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const response = await axios.post<{ documents: RagDocument[] }>(
        `${RAG_API_BASE_URL}/v1/documents`,
        formData,
      );
      return response.data.documents;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Those files could not be added to the knowledge base."));
    }
  },

  async deleteDocument(documentId: string) {
    try {
      await axios.delete(`${RAG_API_BASE_URL}/v1/documents/${encodeURIComponent(documentId)}`);
    } catch (error) {
      throw new Error(getErrorMessage(error, "Could not remove that source."));
    }
  },

  async askQuestion(question: string, topKPerPart = 4) {
    try {
      const response = await axios.post<RagAnswer>(`${RAG_API_BASE_URL}/v1/questions`, {
        question,
        top_k_per_part: topKPerPart,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "I couldn't generate a grounded answer from your sources."));
    }
  },
};
