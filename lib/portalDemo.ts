// lib/portalDemo.ts
//
// Mode démonstration du portail : /org/demo ouvre le VRAI tableau de bord,
// sans compte, sans mot de passe partagé, et sans qu'un visiteur puisse
// abîmer quoi que ce soit.
//
// Le portail ne parle au serveur que par une seule fonction (portalFetch).
// En démo, on la remplace par celle-ci :
//
//   • les lectures  → /api/org/demo?part=…, route publique en lecture seule ;
//   • les écritures → JAMAIS envoyées. On renvoie une réponse « ok » fabriquée
//     ici, dans le navigateur. L'écran se met donc à jour comme en vrai — un
//     commissariat peut cliquer « Mark returned » et voir l'objet changer de
//     colonne — mais rien ne quitte sa page : au rechargement, la démo est
//     intacte. Un faux succès est volontaire : afficher une erreur à chaque
//     clic donnerait l'impression d'un outil cassé, ce qui est pire que de ne
//     rien montrer.

/** Correspondance entre les routes authentifiées et la route publique de démo. */
function partOf(url: string): string | null {
  const [path, qs = ""] = url.split("?");
  const p = new URLSearchParams(qs);

  if (path === "/api/org/me") return "part=me";
  if (path === "/api/org/items") return "part=items";
  if (path === "/api/org/intakes") return "part=intakes";
  if (path === "/api/org/lost-reports") return "part=lost-reports";
  if (path === "/api/org/matches") return "part=matches";
  if (path === "/api/org/items/export") {
    const s = p.get("status") || "";
    return s ? `part=export&status=${encodeURIComponent(s)}` : "part=export";
  }
  const m = path.match(/^\/api\/org\/items\/([^/]+)$/);
  if (m) return `part=item&id=${encodeURIComponent(decodeURIComponent(m[1]))}`;
  return null;
}

const fakeOk = (body: unknown = { ok: true }) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

export async function demoFetch(url: string, init?: RequestInit): Promise<Response> {
  const method = String(init?.method || "GET").toUpperCase();

  // Rien n'est envoyé. L'appelant reçoit un succès et met à jour son état local.
  if (method !== "GET") return fakeOk();

  const part = partOf(url);
  // Une lecture non prévue ne doit pas casser l'écran : l'appelant lit un objet
  // vide exactement comme il lirait une liste vide.
  if (!part) return fakeOk({ ok: true });

  return fetch(`/api/org/demo?${part}`, { cache: "no-store" });
}
