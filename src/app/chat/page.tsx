"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatResponse = {
  id: string;
  role: "assistant";
  content: string;
  conversationId?: string;
  provider: "openclaw" | "local";
};

const starter: ChatMessage = {
  id: "starter",
  role: "assistant",
  content: "Chat is ready. Ask for workspace status, blockers, or task priorities.",
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([starter]);
  const [draft, setDraft] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollAnchor = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollAnchor.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  const history = useMemo(
    () => messages.map((message) => ({ role: message.role, content: message.content })),
    [messages],
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (isSending) return;

    const content = draft.trim();
    if (!content) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          conversationId,
          history,
        }),
      });

      const payload = (await response.json()) as ChatResponse | { error?: string };

      if (!response.ok || !("content" in payload)) {
        throw new Error(("error" in payload && payload.error) || "Chat request failed");
      }

      setConversationId(payload.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          id: payload.id || crypto.randomUUID(),
          role: "assistant",
          content: payload.content,
        },
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Chat request failed");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section>
      <PageHeader
        title="In-App Chat"
        subtitle="Message OpenClaw directly inside Mission Control for operational Q&A and decision support."
      />

      <article className="glass-panel flex min-h-[62vh] flex-col p-4">
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-border/80 pb-3 text-xs text-muted">
          <span className="uppercase tracking-[0.14em]">Chat Session</span>
          <span className="badge">{conversationId ? `Thread: ${conversationId.slice(0, 10)}` : "New Thread"}</span>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-border/70 bg-panel p-3">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-accent text-accent-contrast"
                    : "border border-border bg-surface text-foreground"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {isSending ? <p className="text-sm text-muted">Assistant is thinking...</p> : null}
          <div ref={scrollAnchor} />
        </div>

        <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
          <textarea
            rows={3}
            className="textarea"
            placeholder="Ask about priorities, blockers, and execution strategy..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted">Uses OpenClaw upstream when configured, otherwise local workspace summary mode.</p>
            <button className="btn btn-primary" type="submit" disabled={isSending || !draft.trim()}>
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </article>

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </section>
  );
}
