"use client";

// Page dossier : timeline des échanges + chat Claude + composeur avec validation manuelle.
// URL : /admin/case/<lost_item_id> (protégée par le Basic Auth du middleware)

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

type Item = {
  id: string;
  public_id?: string | null;
  title?: string | null;
  description?: string | null;
  primary_category?: string | null;
  city?: string | null;
  state_id?: string | null;
  date?: string | null;
  time_slot?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  contribution?: number | null;
  paid?: boolean | null;
  object_photo?: string | null;
  created_at?: string | null;
};

type CaseMessage = {
  id: number;
  direction: "in" | "out";
  from_email?: string | null;
  to_email?: string | null;
  subject?: string | null;
  body_text?: string | null;
  created_at: string;
};

type Candidate = {
  url: string;
  title?: string | null;
  snippet?: string | null;
  verdict?: string | null;
  confidence?: number | null;
};

type ChatMsg = { role: "user" | "assistant"; content: string };

function fmt(d?: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

// Extrait "SUBJECT: ..." + bloc <<<EMAIL ... EMAIL>>> d'une réponse de l'assistant
function extractEmail(text: string): { subject: string | null; body: string | null } {
  const subject = text.match(/^SUBJECT:\s*(.+)$/m)?.[1]?.trim() || null;
  const body = text.match(/<<<EMAIL\s*([\s\S]*?)\s*EMAIL>>>/)?.[1]?.trim() || null;
  return { subject, body };
}

export default function CasePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [item, setItem] = useState<Item | null>(null);
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Chat
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Composeur
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendInfo, setSendInfo] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const r = await fetch(`/api/admin/case-data?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setItem(j.item);
      setMessages(j.messages);
      setCandidates(j.candidates);
      setTo((prev) => prev || j.item?.email || "");
      setSubject((prev) => prev || (j.item?.public_id ? `Your lost item report #${j.item.public_id} — ReportLost` : "Your lost item report — ReportLost"));
    } catch (e: any) {
      setLoadError(String(e?.message || e));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, chatBusy]);

  async function sendChat() {
    const content = chatInput.trim();
    if (!content || chatBusy || !id) return;
    const next: ChatMsg[] = [...chat, { role: "user", content }];
    setChat(next);
    setChatInput("");
    setChatBusy(true);
    try {
      const r = await fetch("/api/admin/case-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lostItemId: id, messages: next }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setChat([...next, { role: "assistant", content: j.reply }]);
    } catch (e: any) {
      setChat([...next, { role: "assistant", content: `⚠️ Erreur : ${String(e?.message || e)}` }]);
    } finally {
      setChatBusy(false);
    }
  }

  function applyDraft(text: string) {
    const { subject: s, body: b } = extractEmail(text);
    if (s) setSubject(s);
    setBody(b || text);
    setSendInfo(null);
  }

  async function sendMail() {
    if (!id || !to || !subject || !body || sending) return;
    if (!window.confirm(`Envoyer ce mail à ${to} ?`)) return;
    setSending(true);
    setSendInfo(null);
    try {
      const r = await fetch("/api/admin/case-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lostItemId: id, to, subject, body }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setSendInfo(`✅ Envoyé (réponses trackées via ${j.replyTo})`);
      setBody("");
      await load();
    } catch (e: any) {
      setSendInfo(`⚠️ ${String(e?.message || e)}`);
    } finally {
      setSending(false);
    }
  }

  if (loadError) {
    return <div className="p-8 text-red-600">Erreur : {loadError}</div>;
  }
  if (!item) {
    return <div className="p-8 text-gray-500">Chargement du dossier…</div>;
  }

  const clientName = [item.first_name, item.last_name].filter(Boolean).join(" ");

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      {/* En-tête dossier */}
      <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <h1 className="text-lg font-semibold">
            Dossier #{item.public_id || item.id} — {item.title || item.description || "objet perdu"}
          </h1>
          <span className="text-sm text-gray-500">
            {item.city}
            {item.state_id ? `, ${item.state_id}` : ""} · perdu le {item.date || "?"}
          </span>
          {item.paid ? (
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">payé {item.contribution ?? 0} $</span>
          ) : (
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">non payé</span>
          )}
        </div>
        <div className="mt-1 text-sm text-gray-600">
          {clientName} · {item.email} {item.phone ? `· ${item.phone}` : ""}
        </div>
        {candidates.length > 0 && (
          <div className="mt-2 text-sm">
            <span className="font-medium">Pistes veille :</span>{" "}
            {candidates.slice(0, 5).map((c, i) => (
              <a
                key={i}
                href={c.url}
                target="_blank"
                rel="noreferrer"
                className="mr-2 text-blue-600 underline"
                title={c.snippet || ""}
              >
                [{c.verdict} {c.confidence ?? "?"}%] {c.title || c.url.slice(0, 50)}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Colonne gauche : timeline + composeur */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">Échanges ({messages.length})</h2>
            <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
              {messages.length === 0 && (
                <p className="text-sm text-gray-500">
                  Aucun message archivé pour l’instant. Les mails envoyés d’ici et les réponses (via l’adresse
                  trackée) apparaîtront automatiquement.
                </p>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg border p-3 text-sm ${
                    m.direction === "in" ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="mb-1 flex justify-between text-xs text-gray-500">
                    <span>
                      {m.direction === "in" ? `⬅️ ${m.from_email}` : `➡️ ${m.to_email}`}
                    </span>
                    <span>{fmt(m.created_at)}</span>
                  </div>
                  <div className="font-medium">{m.subject || "(sans sujet)"}</div>
                  <div className="mt-1 whitespace-pre-wrap text-gray-700">{m.body_text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">Composer un mail</h2>
            <input
              className="mb-2 w-full rounded border px-3 py-2 text-sm"
              placeholder="Destinataire"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <input
              className="mb-2 w-full rounded border px-3 py-2 text-sm"
              placeholder="Sujet"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <textarea
              className="mb-2 h-40 w-full rounded border px-3 py-2 text-sm"
              placeholder="Corps du mail (demande un brouillon au chat, puis « Utiliser cette réponse »)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={sendMail}
                disabled={sending || !to || !subject || !body}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {sending ? "Envoi…" : "Valider & envoyer"}
              </button>
              {sendInfo && <span className="text-sm">{sendInfo}</span>}
            </div>
          </div>
        </div>

        {/* Colonne droite : chat Claude */}
        <div className="flex flex-col rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Assistant du dossier 🤖</h2>
          <div className="mb-3 flex-1 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: "62vh", minHeight: "300px" }}>
            {chat.length === 0 && (
              <p className="text-sm text-gray-500">
                L’assistant connaît tout le dossier (signalement, échanges, pistes de veille). Exemples :
                « résume le dossier », « rédige une réponse au client », « prépare un mail pour le lost &
                found de l’aéroport », « il est agacé, propose un geste commercial ».
              </p>
            )}
            {chat.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 text-sm whitespace-pre-wrap ${
                  m.role === "user" ? "ml-8 bg-blue-600 text-white" : "mr-4 bg-gray-100 text-gray-900"
                }`}
              >
                {m.content}
                {m.role === "assistant" && extractEmail(m.content).body && (
                  <div className="mt-2">
                    <button
                      onClick={() => applyDraft(m.content)}
                      className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white"
                    >
                      ✉️ Utiliser cette réponse
                    </button>
                  </div>
                )}
              </div>
            ))}
            {chatBusy && <div className="mr-4 rounded-lg bg-gray-100 p-3 text-sm text-gray-500">…</div>}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2">
            <textarea
              className="h-16 flex-1 rounded border px-3 py-2 text-sm"
              placeholder="Discute avec l'assistant… (Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne)"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendChat();
                }
              }}
            />
            <button
              onClick={sendChat}
              disabled={chatBusy || !chatInput.trim()}
              className="rounded bg-blue-600 px-4 text-sm font-medium text-white disabled:opacity-40"
            >
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
