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
  address?: string | null;
  object_photo?: string | null;
  slug?: string | null;
  created_at?: string | null;
};

type Establishment = {
  id: number;
  name: string;
  email?: string | null;
  url?: string | null;
  contacted_email: boolean;
  contacted_form: boolean;
  notes?: string | null;
};

type CaseMessage = {
  id: number;
  direction: "in" | "out" | "note";
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

// Nettoie les restes de markdown d'un brouillon avant de le mettre dans le composeur
function stripMarkdown(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^#+\s?/gm, "")
    .trim();
}

// Rend un texte avec les URLs cliquables (nouvel onglet)
function renderWithLinks(text: string) {
  const parts = String(text || "").split(/(https?:\/\/[^\s)>\]]+)/g);
  return parts.map((p, i) =>
    /^https?:\/\//.test(p) ? (
      <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="underline break-all">
        {p}
      </a>
    ) : (
      p
    )
  );
}

export default function CasePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [item, setItem] = useState<Item | null>(null);
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Ajout d'établissement
  const [estName, setEstName] = useState("");
  const [estEmail, setEstEmail] = useState("");
  const [estUrl, setEstUrl] = useState("");
  const [estBusy, setEstBusy] = useState(false);

  // Chat
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Note interne
  const [noteText, setNoteText] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);

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
      setEstablishments(j.establishments || []);
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

  async function sendChat(preset?: string) {
    const content = (preset ?? chatInput).trim();
    if (!content || chatBusy || !id) return;
    const next: ChatMsg[] = [...chat, { role: "user", content }];
    setChat(next);
    if (!preset) setChatInput("");
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

  async function findPlaces() {
    if (chatBusy || !id) return;
    const next: ChatMsg[] = [
      ...chat,
      { role: "user", content: "🏢 Recherche les établissements à contacter (avec leurs vraies coordonnées)." },
    ];
    setChat(next);
    setChatBusy(true);
    try {
      const r = await fetch("/api/admin/case-places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lostItemId: id }),
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

  async function deleteMessage(msgId: number) {
    if (!window.confirm("Supprimer ce message de l'historique ?")) return;
    try {
      const r = await fetch("/api/admin/case-message-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: msgId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (e: any) {
      alert(`Erreur : ${String(e?.message || e)}`);
    }
  }

  async function addEstablishment() {
    const name = estName.trim();
    if (!name || estBusy || !id) return;
    setEstBusy(true);
    try {
      const r = await fetch("/api/admin/case-establishment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lostItemId: id, name, email: estEmail.trim(), url: estUrl.trim() }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setEstablishments((prev) => [...prev, j.establishment]);
      setEstName("");
      setEstEmail("");
      setEstUrl("");
    } catch (e: any) {
      alert(`Erreur : ${String(e?.message || e)}`);
    } finally {
      setEstBusy(false);
    }
  }

  async function toggleEstablishment(est: Establishment, field: "contacted_email" | "contacted_form") {
    const value = !est[field];
    setEstablishments((prev) => prev.map((e) => (e.id === est.id ? { ...e, [field]: value } : e)));
    try {
      const r = await fetch("/api/admin/case-establishment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: est.id, [field]: value }),
      });
      if (!r.ok) throw new Error((await r.json())?.error || r.statusText);
    } catch (e: any) {
      // rollback
      setEstablishments((prev) => prev.map((x) => (x.id === est.id ? { ...x, [field]: !value } : x)));
      alert(`Erreur : ${String(e?.message || e)}`);
    }
  }

  async function deleteEstablishment(estId: number) {
    if (!window.confirm("Retirer cet établissement de la liste ?")) return;
    try {
      const r = await fetch(`/api/admin/case-establishment?id=${estId}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json())?.error || r.statusText);
      setEstablishments((prev) => prev.filter((e) => e.id !== estId));
    } catch (e: any) {
      alert(`Erreur : ${String(e?.message || e)}`);
    }
  }

  async function addNote() {
    const text = noteText.trim();
    if (!text || noteBusy || !id) return;
    setNoteBusy(true);
    try {
      const r = await fetch("/api/admin/case-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lostItemId: id, text }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setNoteText("");
      await load();
    } catch (e: any) {
      alert(`Erreur note : ${String(e?.message || e)}`);
    } finally {
      setNoteBusy(false);
    }
  }

  function applyDraft(text: string) {
    const { subject: s, body: b } = extractEmail(text);
    if (s) setSubject(stripMarkdown(s));
    setBody(stripMarkdown(b || text));
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
    return (
      <div className="p-8">
        <a href="/admin" className="text-sm text-blue-600 underline">← Retour à l’admin</a>
        <div className="mt-3 text-red-600">Erreur : {loadError}</div>
      </div>
    );
  }
  if (!item) {
    return <div className="p-8 text-gray-500">Chargement du dossier…</div>;
  }

  const clientName = [item.first_name, item.last_name].filter(Boolean).join(" ");

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <a
        href="/admin"
        className="mb-3 inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100"
      >
        ← Retour à l’admin
      </a>

      {/* En-tête dossier : infos complètes du signalement */}
      <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex gap-4">
          {item.object_photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.object_photo}
              alt="objet perdu"
              className="h-28 w-28 flex-shrink-0 rounded-lg border object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <h1 className="text-lg font-semibold">
                Dossier #{item.public_id || item.id} — {item.title || item.description || "objet perdu"}
              </h1>
              {item.paid ? (
                <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">payé {item.contribution ?? 0} $</span>
              ) : (
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">non payé</span>
              )}
              {item.slug && (
                <a
                  href={`/lost/${item.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded bg-[#226638] px-2 py-0.5 text-xs font-medium text-white hover:brightness-110"
                >
                  View post ↗
                </a>
              )}
              {item.public_id && (
                <a
                  href={`/case/${item.public_id}?edit=1`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded bg-blue-700 px-2 py-0.5 text-xs font-medium text-white hover:brightness-110"
                  title="Éditer et envoyer le compte rendu (établissements synchronisés automatiquement)"
                >
                  📋 Compte rendu ↗
                </a>
              )}
              {item.public_id && (item as any).case_token && (
                <a
                  href={`/case/${item.public_id}?t=${encodeURIComponent((item as any).case_token)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded bg-gray-600 px-2 py-0.5 text-xs font-medium text-white hover:brightness-110"
                  title="Le lien exact que voit le client (celui envoyé par email)"
                >
                  👁 Vue client ↗
                </a>
              )}
              {item.paid && item.public_id && (
                <a
                  href={`/api/sticker-sheet?public_id=${encodeURIComponent(String(item.public_id))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded bg-orange-600 px-2 py-0.5 text-xs font-medium text-white hover:brightness-110"
                  title="Planche de stickers QR du dossier (PDF)"
                >
                  🏷️ Stickers PDF ↗
                </a>
              )}
              {(item as any).search_status !== undefined && (
                (item as any).search_status === "excluded" ? (
                  <button
                    type="button"
                    onClick={async () => {
                      const r = await fetch("/api/admin/match-toggle", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: item.id, action: "include" }),
                      });
                      const j = await r.json().catch(() => null);
                      if (j?.ok) location.reload();
                      else alert(`Action échouée: ${j?.error || r.status}`);
                    }}
                    className="rounded bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white hover:brightness-110"
                    title="Réintégrer ce dossier à la veille automatique"
                  >
                    ▶️ Réactiver la veille
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const r = await fetch("/api/admin/match-toggle", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: item.id, action: "exclude" }),
                      });
                      const j = await r.json().catch(() => null);
                      if (j?.ok) location.reload();
                      else alert(`Action échouée: ${j?.error || r.status}`);
                    }}
                    className="rounded bg-gray-500 px-2 py-0.5 text-xs font-medium text-white hover:brightness-110"
                    title="Exclure ce dossier de la veille automatique"
                  >
                    ⏸ Exclure de la veille
                  </button>
                )
              )}
            </div>
            <div className="mt-1 text-sm text-gray-600">
              {item.primary_category ? `${item.primary_category} · ` : ""}
              {item.city}
              {item.state_id ? `, ${item.state_id}` : ""} · perdu le {item.date || "?"}
              {item.time_slot ? ` (${item.time_slot})` : ""}
              {item.address ? ` · ${item.address}` : ""}
            </div>
            {item.description && (
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{item.description}</p>
            )}
            {(item as any).circumstances && (
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                <span className="font-medium text-gray-800">Circonstances :</span>{" "}
                {(item as any).circumstances}
              </p>
            )}
            <div className="mt-1 text-sm text-gray-600">
              👤 {clientName} · {item.email} {item.phone ? `· ${item.phone}` : ""}
              {(item as any).birth_date ? ` · 🎂 ${(item as any).birth_date}` : ""}
            </div>
            {(item as any).private_detail && (
              <div className="mt-1 inline-block rounded bg-rose-50 px-2 py-0.5 text-xs text-rose-700">
                🔒 Détail privé (jamais publié) : {(item as any).private_detail}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pistes de veille + établissements contactés */}
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-semibold">🔎 Pistes de veille ({candidates.length})</h2>
          {candidates.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun candidat yes/maybe pour l’instant.</p>
          ) : (
            <ul className="max-h-52 space-y-2 overflow-y-auto pr-1 text-sm">
              {candidates.map((c, i) => (
                <li key={i} className="border-l-2 border-blue-200 pl-2">
                  <span
                    className={
                      c.verdict === "yes" ? "font-semibold text-green-700" : "font-semibold text-amber-700"
                    }
                  >
                    {String(c.verdict).toUpperCase()} {c.confidence ?? "?"}%
                  </span>{" "}
                  <a href={c.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                    {c.title || c.url.slice(0, 60)}
                  </a>
                  {c.snippet && <div className="text-gray-600">{c.snippet}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-semibold">🏢 Établissements contactés ({establishments.length})</h2>
          <ul className="max-h-40 space-y-1 overflow-y-auto pr-1 text-sm">
            {establishments.map((est) => (
              <li key={est.id} className="flex items-center gap-3 rounded border border-gray-100 px-2 py-1">
                <span className="min-w-0 flex-1 truncate">
                  {est.url ? (
                    <a href={est.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                      {est.name}
                    </a>
                  ) : (
                    est.name
                  )}
                  {est.email && <span className="text-gray-500"> · {est.email}</span>}
                </span>
                <label className="flex items-center gap-1 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={est.contacted_email}
                    onChange={() => toggleEstablishment(est, "contacted_email")}
                  />
                  ✉️ mail
                </label>
                <label className="flex items-center gap-1 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={est.contacted_form}
                    onChange={() => toggleEstablishment(est, "contacted_form")}
                  />
                  📋 formulaire
                </label>
                <button
                  onClick={() => deleteEstablishment(est.id)}
                  className="text-gray-400 hover:text-red-600"
                  title="Retirer"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              className="w-40 flex-1 rounded border px-2 py-1 text-sm"
              placeholder="Nom (ex: JFK Lost & Found)"
              value={estName}
              onChange={(e) => setEstName(e.target.value)}
            />
            <input
              className="w-36 rounded border px-2 py-1 text-sm"
              placeholder="Email (optionnel)"
              value={estEmail}
              onChange={(e) => setEstEmail(e.target.value)}
            />
            <input
              className="w-36 rounded border px-2 py-1 text-sm"
              placeholder="URL / formulaire (opt.)"
              value={estUrl}
              onChange={(e) => setEstUrl(e.target.value)}
            />
            <button
              onClick={addEstablishment}
              disabled={estBusy || !estName.trim()}
              className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white disabled:opacity-40"
            >
              + Ajouter
            </button>
          </div>
        </div>
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
                    m.direction === "in"
                      ? "border-blue-200 bg-blue-50"
                      : m.direction === "note"
                      ? "border-yellow-300 bg-yellow-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {m.direction === "in"
                        ? `⬅️ ${m.from_email}`
                        : m.direction === "note"
                        ? "📝 Note interne"
                        : `➡️ ${m.to_email}`}
                    </span>
                    <span className="flex items-center gap-2">
                      {fmt(m.created_at)}
                      <button
                        onClick={() => deleteMessage(m.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="Supprimer ce message de l'historique"
                      >
                        🗑
                      </button>
                    </span>
                  </div>
                  {m.direction !== "note" && <div className="font-medium">{m.subject || "(sans sujet)"}</div>}
                  <div className="mt-1 whitespace-pre-wrap text-gray-700">{renderWithLinks(m.body_text || "")}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2 border-t pt-3">
              <input
                className="flex-1 rounded border px-3 py-2 text-sm"
                placeholder="📝 Ajouter une note interne (visible par l'assistant IA)…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addNote();
                  }
                }}
              />
              <button
                onClick={addNote}
                disabled={noteBusy || !noteText.trim()}
                className="rounded bg-yellow-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {noteBusy ? "…" : "Noter"}
              </button>
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
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              onClick={() => sendChat("Prépare le mail initial d’enquête pour ce dossier.")}
              disabled={chatBusy}
              className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-40"
            >
              ✉️ Mail initial d’enquête
            </button>
            <button
              onClick={findPlaces}
              disabled={chatBusy}
              className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-40"
              title="Recherche Google réelle (Serper) puis synthèse — emails et formulaires vérifiables, avec sources"
            >
              🏢 Qui contacter ? (recherche web)
            </button>
            <button
              onClick={() => sendChat("Résume ce dossier : où on en est, ce qui a été fait, prochaines actions.")}
              disabled={chatBusy}
              className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-40"
            >
              📋 Résumé du dossier
            </button>
          </div>
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
                {renderWithLinks(m.content)}
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
              onClick={() => sendChat()}
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
