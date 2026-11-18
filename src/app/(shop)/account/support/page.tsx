"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/contexts/NotificationContext";
import { formatDateTime } from "@/utils/format";

interface TicketMessage {
  id: string;
  author: "customer" | "staff";
  body: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

function isTicket(value: unknown): value is SupportTicket {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" &&
    typeof record.subject === "string" &&
    typeof record.status === "string" &&
    typeof record.createdAt === "string" &&
    Number.isFinite(Date.parse(record.createdAt)) &&
    typeof record.updatedAt === "string" &&
    Number.isFinite(Date.parse(record.updatedAt)) &&
    Array.isArray(record.messages) &&
    record.messages.every((message) =>
      typeof message === "object" &&
      message !== null &&
      typeof (message as Record<string, unknown>).id === "string" &&
      ["customer", "staff"].includes(String((message as Record<string, unknown>).author)) &&
      typeof (message as Record<string, unknown>).body === "string" &&
      typeof (message as Record<string, unknown>).createdAt === "string" &&
      Number.isFinite(Date.parse((message as Record<string, unknown>).createdAt as string))
    );
}

function SupportContent() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchTickets = useCallback(async (): Promise<SupportTicket[]> => {
    const response = await fetch("/api/customer/support", { cache: "no-store" });
    const payload: unknown = await response.json();
    if (
      !response.ok ||
      typeof payload !== "object" ||
      payload === null ||
      !("tickets" in payload) ||
      !Array.isArray(payload.tickets)
    ) throw new Error("Support requests could not be loaded.");
    return payload.tickets.filter(isTicket);
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    setError("");
    try {
      setTickets(await fetchTickets());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Support requests could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void fetchTickets()
      .then((result) => {
        if (!cancelled) setTickets(result);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Support requests could not be loaded.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [fetchTickets]);

  const retryLoadTickets = () => {
    void loadTickets();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/customer/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ subject, message }),
      });
      const payload: unknown = await response.json();
      const ticketValue = typeof payload === "object" && payload !== null && "ticket" in payload
        ? payload.ticket
        : null;
      if (!response.ok || !isTicket(ticketValue)) {
        const detail = typeof payload === "object" && payload !== null &&
          "message" in payload && typeof payload.message === "string"
          ? payload.message
          : "Support request could not be submitted.";
        throw new Error(detail);
      }
      setTickets((previous) => [ticketValue, ...previous]);
      setSubject("");
      setMessage("");
      toast({ title: "Support request submitted." });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Support request could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (ticketId: string, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const draft = (replyDrafts[ticketId] ?? "").trim();
    if (replyingId || draft.length < 2) return;
    setReplyingId(ticketId);
    setError("");
    try {
      const response = await fetch("/api/customer/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ ticketId, message: draft }),
      });
      const payload: unknown = await response.json();
      const updated = typeof payload === "object" && payload !== null && "ticket" in payload
        ? payload.ticket
        : null;
      if (!response.ok || !isTicket(updated)) {
        const detail = typeof payload === "object" && payload !== null &&
          "message" in payload && typeof payload.message === "string"
          ? payload.message
          : "Reply could not be sent.";
        throw new Error(detail);
      }
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      setReplyDrafts((prev) => ({ ...prev, [ticketId]: "" }));
      toast({ title: "Reply added to ticket." });
    } catch (replyError) {
      setError(replyError instanceof Error ? replyError.message : "Reply could not be sent.");
    } finally {
      setReplyingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-charcoal">Customer support</h1>
      <p className="mt-1 text-sm text-graymute">Your requests are saved to your PrestaShop customer account.</p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-forest-100 bg-white p-5 shadow-soft">
        <div>
          <label htmlFor="support-subject" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-graymute">Subject</label>
          <input
            id="support-subject"
            required
            minLength={4}
            maxLength={120}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="h-11 w-full rounded-xl border border-forest-100 px-3.5 text-sm outline-none focus:border-forest-300"
          />
        </div>
        <div>
          <label htmlFor="support-message" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-graymute">How can we help?</label>
          <textarea
            id="support-message"
            required
            minLength={10}
            maxLength={4000}
            rows={5}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="w-full rounded-xl border border-forest-100 p-3.5 text-sm outline-none focus:border-forest-300"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-forest-900 px-5 text-sm font-bold text-white disabled:opacity-60"
        >
          <Send className="size-4" aria-hidden />
          {submitting ? "Sending…" : "Submit request"}
        </button>
      </form>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
      {error && !loading && (
        <button type="button" onClick={retryLoadTickets} className="mt-2 text-sm font-bold text-forest-800 underline">
          Try loading requests again
        </button>
      )}
      <h2 className="mt-8 text-lg font-bold text-charcoal">Your requests</h2>
      {loading ? (
        <p className="mt-4 text-sm text-graymute" role="status">Loading support requests…</p>
      ) : tickets.length === 0 ? (
        <EmptyState icon={MessageCircle} title="No support requests yet" description="Submit a request above and it will appear here." className="mt-4" />
      ) : (
        <ul className="mt-4 space-y-3">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="rounded-2xl border border-forest-100 bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-charcoal">{ticket.subject}</h3>
                <span className="rounded-full bg-forest-50 px-2.5 py-1 text-xs font-semibold capitalize text-forest-800">{ticket.status}</span>
              </div>
              <p className="mt-1 text-xs text-graymute">Opened {formatDateTime(ticket.createdAt)}</p>
              <ul className="mt-4 space-y-3 border-t border-forest-50 pt-3">
                {ticket.messages.map((entry) => (
                  <li key={entry.id} className="text-sm">
                    <p className="font-semibold capitalize text-charcoal">{entry.author}</p>
                    <p className="mt-1 whitespace-pre-wrap text-graymute">{entry.body}</p>
                    <p className="mt-1 text-[11px] text-graymute/70">{formatDateTime(entry.createdAt)}</p>
                  </li>
                ))}
              </ul>
              {!ticket.messages.some((entry) => entry.author === "staff") && (
                <p className="mt-3 text-xs text-graymute">No staff reply has been recorded yet.</p>
              )}
              {ticket.status !== "closed" && (
                <form onSubmit={(e) => submitReply(ticket.id, e)} className="mt-4 flex gap-2 border-t border-forest-50 pt-3">
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={4000}
                    placeholder="Write a reply…"
                    aria-label={`Reply to ${ticket.subject}`}
                    value={replyDrafts[ticket.id] ?? ""}
                    onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                    className="h-10 flex-1 rounded-xl border border-forest-100 px-3 text-sm outline-none focus:border-forest-300"
                  />
                  <button
                    type="submit"
                    disabled={replyingId === ticket.id}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-forest-900 px-4 text-xs font-bold text-white disabled:opacity-60"
                  >
                    <Send className="size-3.5" aria-hidden />
                    {replyingId === ticket.id ? "Sending…" : "Reply"}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AccountSupportPage() {
  return <ProtectedRoute><SupportContent /></ProtectedRoute>;
}
