"use client";
// Connexion / inscription. Écran commun, vocabulaire du portail d'entrée.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { usePortal, portalFetch } from "@/lib/portal";
import { setActiveOrgId } from "@/components/OrgSwitcher";
import { portalBase, type OrgScope } from "@/lib/orgScope";

export default function PortalLogin() {
  const router = useRouter();
  const { scope, base, otherBase, words } = usePortal();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Invitation d'un collègue : le lien du mail arrive ici avec ?invite=<token>.
  // Lu dans window.location plutôt que useSearchParams, qui imposerait une
  // frontière Suspense à une page par ailleurs statique.
  const [invite, setInvite] = useState<{ token: string; email: string; org_name: string } | null>(null);

  const acceptInvite = useCallback(
    async (token: string): Promise<boolean> => {
      const r = await portalFetch(scope, "/api/org/invite", { method: "POST", body: JSON.stringify({ token }) });
      const j = await r.json().catch(() => null);
      if (!r.ok) {
        setMsg(j?.error || "This invitation could not be accepted.");
        return false;
      }
      const target: OrgScope = j?.scope === "campus" || j?.scope === "agency" ? j.scope : scope;
      setActiveOrgId(target, String(j.org_id || ""));
      router.push(`${portalBase(target)}/dashboard`);
      return true;
    },
    [router, scope]
  );

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("invite") || "";
    if (!token) return;
    let alive = true;
    (async () => {
      const r = await fetch(`/api/org/invite?token=${encodeURIComponent(token)}`);
      const j = await r.json().catch(() => null);
      if (!alive) return;
      if (!r.ok || !j?.ok) {
        setMsg(
          j?.state === "expired"
            ? "This invitation has expired. Ask your colleague to send a new one."
            : "This invitation link is no longer valid."
        );
        return;
      }
      setInvite({ token, email: j.email, org_name: j.org_name });
      setEmail(j.email);
      setMode("signup");
      // Déjà connecté (retour du mail de confirmation, par exemple) : on
      // rejoint l'établissement sans redemander le mot de passe.
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (alive && session) await acceptInvite(token);
    })();
    return () => { alive = false; };
  }, [acceptInvite]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabaseBrowser.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${base}/login${invite ? `?invite=${encodeURIComponent(invite.token)}` : ""}`,
          },
        });
        if (error) throw error;
        setMsg("Account created. Check your inbox to confirm your email, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (invite) {
          await acceptInvite(invite.token);
          return;
        }
        router.push(`${base}/dashboard`);
      }
    } catch (err: any) {
      setMsg(err?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold text-gray-900">
        {mode === "signin" ? words.signinTitle : words.signupTitle}
      </h1>
      <p className="mt-1 text-sm text-gray-600">{words.loginSubtitle}</p>
      {invite && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
          You are invited to join <b>{invite.org_name}</b>. Sign in, or create your account, with{" "}
          <b>{invite.email}</b>.
        </div>
      )}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="block font-medium mb-1">Work email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
        <div>
          <label className="block font-medium mb-1">Password</label>
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
        {msg && <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">{msg}</div>}
        <button type="submit" disabled={busy}
          className="w-full rounded-lg bg-gradient-to-r from-[#26723e] to-[#2ea052] px-4 py-2.5 font-semibold text-white shadow disabled:opacity-60">
          {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
      <button type="button" className="mt-4 block text-sm text-emerald-700 underline"
        onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(null); }}>
        {mode === "signin" ? "No account yet? Create one free" : "Already have an account? Sign in"}
      </button>

      {/* Se tromper de portail est l'erreur la plus probable ici : on ne laisse
          personne bloqué devant un formulaire qui refusera son compte. */}
      <p className="mt-6 border-t border-gray-100 pt-4 text-xs text-gray-500">
        {scope === "campus"
          ? "Police department, hotel, transit or venue? "
          : "University, college or school district? "}
        <Link href={`${otherBase}/login`} className="underline hover:text-gray-800">
          {scope === "campus" ? "Use the organization portal" : "Use the campus portal"}
        </Link>
      </p>
    </main>
  );
}
