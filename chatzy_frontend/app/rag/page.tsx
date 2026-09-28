"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpenText, BrainCircuit, FileText, LoaderCircle, SendHorizontal, Sparkles, Trash2, UploadCloud } from "lucide-react";
import { AppShell } from "@/features/workspace/components/app-shell";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { ragService, type RagAnswer, type RagDocument } from "@/features/rag/services/rag-service";

function documentName(document: RagDocument) {
  return document.filename ?? document.name ?? document.document_id;
}

export default function RagPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<RagAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      setDocuments(await ragService.listDocuments());
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load your knowledge sources.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Defer the request until after this render is committed.
    const requestId = window.setTimeout(() => void loadDocuments(), 0);
    return () => window.clearTimeout(requestId);
  }, [loadDocuments]);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setIsUploading(true);
    setError(null);
    try {
      const created = await ragService.uploadDocuments(Array.from(files));
      setDocuments((current) => [...created, ...current]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Those files could not be added.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function askQuestion() {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isAsking) return;
    setIsAsking(true);
    setError(null);
    try {
      setAnswer(await ragService.askQuestion(trimmedQuestion));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "I couldn't generate an answer.");
    } finally {
      setIsAsking(false);
    }
  }

  async function removeDocument(documentId: string) {
    setError(null);
    try {
      await ragService.deleteDocument(documentId);
      setDocuments((current) => current.filter((document) => document.document_id !== documentId));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not remove that source.");
    }
  }

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="relative overflow-hidden rounded-[32px] border border-indigo-100 bg-[#10172d] px-6 py-7 text-white shadow-[0_24px_70px_rgb(28_45_38/0.16)] sm:px-8">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-violet-500/30 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-500 shadow-lg shadow-indigo-950/40 ring-1 ring-white/30">
                <BookOpenText size={27} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-200">Sourcebase AI</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight">Ask what your documents know</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Add reference material, then get answers grounded in the sources you selected.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-violet-100 backdrop-blur">
              <BrainCircuit size={16} /> Grounded answers
            </div>
          </div>
        </header>

        {error ? <p className="mt-5 rounded-2xl bg-[#fee4e2] px-4 py-3 text-sm font-medium text-[#b42318]">{error}</p> : null}

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
          <section className="rounded-3xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6253c8]">Grounded chat</p>
                <h2 className="mt-1 text-xl font-semibold text-[#17211c]">Explore your knowledge base</h2>
              </div>
              <Sparkles className="text-[#7665e6]" size={21} />
            </div>
            <div className="min-h-[315px] rounded-3xl border border-[#e9e7fa] bg-[#f8f7ff] p-4 sm:p-5">
              {answer ? (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#6253c8]"><Sparkles size={15} /> Answer</div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#293048]">{answer.answer}</p>
                  {answer.sources?.length ? (
                    <div className="mt-6 border-t border-[#e4e1f7] pt-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6253c8]">Sources</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {answer.sources.map((source, index) => <span key={`${source.document_id}-${index}`} className="rounded-xl bg-white px-3 py-2 text-xs font-medium text-[#4c4771] shadow-sm">{source.filename ?? source.document_id ?? `Source ${index + 1}`}</span>)}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex h-[260px] flex-col items-center justify-center text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#7665e6] shadow-sm"><BrainCircuit size={23} /></div>
                  <p className="mt-4 font-semibold text-[#293048]">Ready when you are</p>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-[#6b7288]">Ask a specific question and Sourcebase will answer from your uploaded material.</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-end gap-2">
              <textarea value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void askQuestion(); } }} rows={2} placeholder="Ask a question about your documents…" className="min-h-12 flex-1 resize-none rounded-2xl border border-[#dfdcef] bg-white px-4 py-3 text-sm text-[#17211c] outline-none transition focus:border-[#7665e6] focus:ring-4 focus:ring-[#7665e6]/10" />
              <button type="button" onClick={() => void askQuestion()} disabled={!question.trim() || isAsking} aria-label="Ask Sourcebase" className="grid h-12 w-12 place-items-center rounded-2xl bg-[#6758d4] text-white shadow-sm transition hover:bg-[#5849c2] disabled:pointer-events-none disabled:opacity-60">
                {isAsking ? <LoaderCircle className="animate-spin" size={20} /> : <SendHorizontal size={20} />}
              </button>
            </div>
          </section>

          <aside className="rounded-3xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#008069]">Library</p><h2 className="mt-1 text-xl font-semibold text-[#17211c]">Your sources</h2></div>
              <span className="rounded-full bg-[#e7f7f1] px-2.5 py-1 text-xs font-bold text-[#008069]">{documents.length}</span>
            </div>
            <input ref={inputRef} type="file" multiple className="sr-only" onChange={(event) => void uploadFiles(event.target.files)} />
            <button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading} className="mt-5 flex w-full flex-col items-center justify-center rounded-3xl border border-dashed border-[#aa9ff2] bg-[#f8f7ff] px-4 py-6 text-center transition hover:border-[#7665e6] hover:bg-[#f2f0ff] disabled:opacity-60">
              {isUploading ? <LoaderCircle className="animate-spin text-[#6758d4]" size={24} /> : <UploadCloud className="text-[#6758d4]" size={24} />}
              <span className="mt-2 text-sm font-semibold text-[#41377e]">{isUploading ? "Adding sources…" : "Upload documents"}</span>
              <span className="mt-1 text-xs text-[#706b8a]">Choose one or more files</span>
            </button>
            <div className="mt-5 space-y-2">
              {isLoading ? [0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-[#f2f4f3]" />) : documents.length ? documents.map((document) => (
                <article key={document.document_id} className="flex items-center gap-3 rounded-2xl border border-[#edf0ed] bg-white px-3 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#edf8f4] text-[#008069]"><FileText size={17} /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#293048]">{documentName(document)}</p><p className="mt-0.5 text-xs text-[#74807b]">{document.chunk_count ? `${document.chunk_count} chunks` : "Indexed source"}</p></div>
                  <button type="button" onClick={() => void removeDocument(document.document_id)} aria-label={`Remove ${documentName(document)}`} className="grid h-8 w-8 place-items-center rounded-xl text-[#8b9691] transition hover:bg-[#fff0ef] hover:text-[#b42318]"><Trash2 size={16} /></button>
                </article>
              )) : <div className="rounded-2xl bg-[#f5f8f6] px-4 py-5 text-center text-sm leading-6 text-[#66756f]">Upload a document to begin building your grounded knowledge base.</div>}
            </div>
            <Button variant="ghost" size="sm" onClick={() => void loadDocuments()} className={cn("mt-4 w-full", isLoading && "opacity-60")}>Refresh library</Button>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
