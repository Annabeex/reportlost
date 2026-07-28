"use client";
// Connexion / inscription du portail établissements.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function OrgLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabaseBrowser.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Account created. Check your inbox to confirm your email, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/org/dashboard");
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
        {mode === "signin" ? "Organization sign in" : "Create your organization account"}
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Free found property management for police departments, universities, hotels and venues.
      </p>
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
      <button type="button" className="mt-4 text-sm text-emerald-700 underline"
        onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(null); }}>
        {mode === "signin" ? "No account yet? Create one free" : "Already have an account? Sign in"}
      </button>
    </main>
  );
}
