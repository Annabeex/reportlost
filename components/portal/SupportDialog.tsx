"use client";
// components/portal/SupportDialog.tsx — « Help & feedback » : petite fenêtre
// pour écrire au support ReportLost depuis n'importe quel écran du portail.
import { useState } from "react";
import { usePortal, portalFetch } from "@/lib/portal";

export default function SupportDialog() {
  const { scope } = usePortal();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("question");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"idle" | "sent" | "error">("idle");
  const [err, setErr] = useState("");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await portalFetch(scope, "/api/org/support", {
        method: "POST",
        body: JSON.stringify({ kind, message, page: window.location.pathname }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error || `Error ${r.status}`);
      setState("sent");
      setMessage("");
    } catch (e2) {
      setErr((e2 as Error).message);
      setState("error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => { setOpen(true); setState("idle"); }}
        className="text-[13.5px] text-gray-500 underline hover:text-gray-900">
        Help &amp; feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={() => setOpen(false)}>
          <form onSubmit={send} role="dialog" aria-modal="true" aria-label="Contact ReportLost support"
            className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[17px] font-bold text-gray-900">Write to ReportLost</h2>
                <p className="mt-0.5 text-[13.5px] text-gray-500">
                  A bug, a question, or something the tool should do. Anna reads every message and replies by email.
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close"
                className="rounded-lg px-2 py-1 text-[20px] leading-none text-gray-400 hover:text-gray-700">×</button>
            </div>

            {state === "sent" ? (
              <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-900">
                Sent. You will get a reply at the address of your account.
              </p>
            ) : (
              <>
                <div className="mt-4 flex gap-2">
                  {[["bug", "Bug"], ["feature", "Feature request"], ["question", "Question"]].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setKind(v)}
                      className={`rounded-full border px-3 py-1.5 text-[13px] ${kind === v ? "border-emerald-300 bg-emerald-50 font-semibold text-emerald-800" : "border-gray-300 text-gray-600"}`}>
                      {l}
                    </button>
                  ))}
                </div>
                <textarea required minLength={10} maxLength={4000} rows={5} value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder={kind === "bug" ? "What you did, what you expected, what happened instead." : "Describe it in a few sentences."}
                  className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3 text-[15px] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
                {err && <p className="mt-2 text-[13.5px] text-red-700">{err}</p>}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[12.5px] text-gray-400">Your institution and the page you are on are attached automatically.</span>
                  <button type="submit" disabled={busy}
                    className="rounded-xl bg-[#16a34a] px-5 py-2.5 text-[14.5px] font-bold text-white disabled:opacity-60">
                    {busy ? "Sending…" : "Send"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}
    </>
  );
}
