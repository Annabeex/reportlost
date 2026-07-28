"use client";
// Enregistrement d'un objet trouvé en 30 secondes (photo, lieu, stockage).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function OrgNewItemPage() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    title: "",
    description: "",
    found_at: today,
    found_location: "",
    storage_location: "",
    photo_url: "",
  });
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const safe = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
      const path = `org_items/${Date.now()}-${safe}`;
      const { error } = await supabaseBrowser.storage.from("images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabaseBrowser.storage.from("images").getPublicUrl(path);
      setForm((f) => ({ ...f, photo_url: data?.publicUrl || "" }));
    } catch (e: any) {
      setErr(`Photo upload failed: ${e?.message || e}`);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) { router.push("/org/login"); return; }
      const r = await fetch("/api/org/items", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      router.push("/org/dashboard");
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const cls = "w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400";

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Log a found item</h1>
      <p className="mt-1 text-sm text-gray-600">
        A reference number and the legal holding deadline are assigned automatically.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="block font-medium mb-1">What was found?</label>
          <input required value={form.title} onChange={set("title")} placeholder="e.g. Brown leather wallet" className={cls} />
        </div>
        <div>
          <label className="block font-medium mb-1">Details <span className="text-green-700">(optional)</span></label>
          <textarea value={form.description} onChange={set("description")} rows={2}
            placeholder="Color, brand, contents… keep one detail private for verification" className={cls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-medium mb-1">Date found</label>
            <input type="date" required value={form.found_at} onChange={set("found_at")} max={today} className={cls} />
          </div>
          <div>
            <label className="block font-medium mb-1">Where found <span className="text-green-700">(optional)</span></label>
            <input value={form.found_location} onChange={set("found_location")} placeholder="Lobby desk" className={cls} />
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Storage location <span className="text-green-700">(optional)</span></label>
          <input value={form.storage_location} onChange={set("storage_location")} placeholder="Shelf B3, locker A1…" className={cls} />
        </div>
        <div>
          <label className="block font-medium mb-1">Photo <span className="text-green-700">(optional)</span></label>
          {form.photo_url ? (
            <div className="flex items-center gap-3">
              <img src={form.photo_url} alt="" className="h-16 w-16 rounded-lg object-cover border" />
              <button type="button" className="text-sm text-red-600 underline"
                onClick={() => setForm((f) => ({ ...f, photo_url: "" }))}>Remove</button>
            </div>
          ) : (
            <>
              <input id="org-photo" type="file" accept="image/*" onChange={upload} className="hidden" />
              <label htmlFor="org-photo"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#2ea052] bg-white px-4 py-2.5 font-medium text-[#226638] shadow-sm hover:bg-[#f2fbf5]">
                📷 {uploading ? "Uploading…" : "Add a photo"}
              </label>
            </>
          )}
        </div>
        {err && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={busy || uploading}
            className="rounded-lg bg-gradient-to-r from-[#26723e] to-[#2ea052] px-6 py-2.5 font-semibold text-white shadow disabled:opacity-60">
            {busy ? "Saving…" : "Save item"}
          </button>
          <button type="button" className="text-sm text-gray-500 underline" onClick={() => router.push("/org/dashboard")}>
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
