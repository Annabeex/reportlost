"use client";
// components/portal/PortalTeam.tsx — l'équipe d'un établissement : qui a accès
// à l'inventaire, avec quel rôle, et l'invitation d'un collègue par e-mail.
import { useCallback, useEffect, useState } from "react";
import PortalNav from "@/components/portal/PortalNav";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { usePortalSession } from "@/lib/portalSession";

type Member = { user_id: string; role: string; email: string; joined_at: string; me: boolean };
type Invite = { id: string; email: string; role: string; created_at: string; expires_at: string; expired: boolean };

const ROLE_HELP: Record<string, string> = {
  staff: "Logs items, confirms drop-offs, records returns.",
  admin: "Everything staff does, plus settings, team and import.",
};

export default function PortalTeam() {
  const { api, org, orgs, cross, pending, switchOrg } = usePortalSession("team");
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [myRole, setMyRole] = useState<string>("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [copyLink, setCopyLink] = useState("");
  // Changement de l'adresse de connexion du compte courant. Supabase envoie un
  // lien de confirmation à la nouvelle adresse (et, selon le réglage du projet,
  // à l'ancienne) : rien ne change tant qu'il n'est pas cliqué.
  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState("");

  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg("");
    const { error } = await supabaseBrowser.auth.updateUser({ email: newEmail.trim() });
    setEmailMsg(error ? error.message : `A confirmation link was sent to ${newEmail.trim()}. Your sign-in address changes once you click it.`);
    if (!error) setNewEmail("");
  };

  const orgId = String(org?.id || "");

  const load = useCallback(async () => {
    const r = await api("/api/org/members");
    const j = await r.json().catch(() => null);
    if (!r.ok) return;
    setMembers(Array.isArray(j.members) ? j.members : []);
    setInvites(Array.isArray(j.invites) ? j.invites : []);
    setMyRole(String(j.role || ""));
  }, [api]);

  useEffect(() => { if (orgId) load(); }, [orgId, load]);

  const call = async (method: string, body: Record<string, any>) => {
    setErr("");
    setMsg("");
    const r = await api("/api/org/members", { method, body: JSON.stringify(body) });
    const j = await r.json().catch(() => null);
    if (!r.ok) { setErr(j?.error || `Error ${r.status}`); return null; }
    await load();
    return j;
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setCopyLink("");
    const j = await call("POST", { email, role });
    if (j) {
      // Si le mail n'est pas parti, l'administrateur peut transmettre le lien
      // lui-même : l'invitation existe quand même.
      setMsg(j.sent ? `Invitation sent to ${email}.` : "The email could not be sent. Copy the link below and send it yourself.");
      if (!j.sent && j.link) setCopyLink(String(j.link));
      setEmail("");
    }
    setBusy(false);
  };

  if (!org) return <div className="p-10 text-gray-500">Loading…</div>;
  const isAdmin = myRole === "admin";

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <PortalNav current="team" pending={pending} orgs={orgs} activeId={orgId} crossPortal={cross} onChangeOrg={switchOrg} />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="mt-1 text-sm text-gray-500">People who can open the inventory of {org.name}.</p>

        {isAdmin ? (
          <form onSubmit={invite} className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-[16px] font-bold text-gray-900">Invite a colleague</h2>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@institution.edu"
                aria-label="Colleague's work email"
                className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 text-[16px] focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                aria-label="Role"
                className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-[15px]"
              >
                <option value="staff">Staff</option>
                <option value="admin">Administrator</option>
              </select>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-[#16a34a] px-5 py-3 text-[15px] font-bold text-white disabled:opacity-60"
              >
                {busy ? "Sending…" : "Send invitation"}
              </button>
            </div>
            <p className="mt-2 text-[13px] text-gray-500">
              {ROLE_HELP[role]} The link is valid for 14 days and only works for the invited address.
            </p>
          </form>
        ) : (
          <div className="mt-5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
            Only an administrator of this account can invite or remove people.
          </div>
        )}

        {msg && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-900">{msg}</div>}
        {copyLink && (
          <input
            readOnly
            value={copyLink}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Invitation link"
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 font-mono text-[12.5px]"
          />
        )}
        {err && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">{err}</div>}

        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {members.map((m) => (
            <div key={m.user_id} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-gray-100 px-5 py-3.5 last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold text-gray-900">
                  {m.email || "—"}{m.me && <span className="font-normal text-gray-400"> (you)</span>}
                </div>
                <div className="text-[12.5px] text-gray-400">
                  since {new Date(m.joined_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>
              </div>
              {isAdmin ? (
                <select
                  value={m.role}
                  onChange={(e) => call("PATCH", { user_id: m.user_id, role: e.target.value })}
                  aria-label={`Role of ${m.email}`}
                  className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-[13.5px]"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Administrator</option>
                </select>
              ) : (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[12.5px] text-gray-600">
                  {m.role === "admin" ? "Administrator" : "Staff"}
                </span>
              )}
              {isAdmin && !m.me && (
                <button
                  type="button"
                  onClick={() => { if (confirm(`Remove ${m.email} from ${org.name}?`)) call("DELETE", { user_id: m.user_id }); }}
                  className="text-[13.5px] text-gray-400 underline hover:text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={changeEmail} className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-[15px] font-bold text-gray-900">Your sign-in email</h2>
          <p className="mt-1 text-[13px] text-gray-500">
            The address you use to sign in. Not the office address shown to claimants, which is edited from the inventory page.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new.address@institution.edu"
              className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            <button type="submit" className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-[14px] font-semibold text-gray-700 hover:bg-gray-50">
              Change
            </button>
          </div>
          {emailMsg && <p className="mt-2 text-[13.5px] text-gray-700">{emailMsg}</p>}
        </form>

        {invites.length > 0 && (
          <>
            <h2 className="mt-7 text-[15px] font-bold text-gray-900">Pending invitations</h2>
            <div className="mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {invites.map((i) => (
                <div key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-gray-100 px-5 py-3 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] text-gray-900">{i.email}</div>
                    <div className={`text-[12.5px] ${i.expired ? "text-amber-700" : "text-gray-400"}`}>
                      {i.role === "admin" ? "Administrator" : "Staff"} ·{" "}
                      {i.expired
                        ? "expired"
                        : `valid until ${new Date(i.expires_at).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`}
                    </div>
                  </div>
                  {isAdmin && (
                    <>
                      <button type="button" onClick={async () => {
                        const j = await call("POST", { email: i.email, role: i.role });
                        if (j) setMsg(j.sent ? `Invitation sent again to ${i.email}.` : "The email could not be sent.");
                      }} className="text-[13.5px] text-emerald-700 underline">
                        Send again
                      </button>
                      <button type="button" onClick={() => call("DELETE", { invite_id: i.id })} className="text-[13.5px] text-gray-400 underline hover:text-red-600">
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
