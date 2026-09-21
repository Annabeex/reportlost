// lib/orgPhotos.ts
//
// Les photos d'inventaire sont une PREUVE : elles servent à vérifier qu'une
// personne qui réclame un objet le connaît vraiment. Elles ne doivent donc
// être visibles que par le bureau de l'établissement.
//
// Avant : bucket public « images », envoi direct depuis le navigateur. Quiconque
// avait l'adresse voyait la photo, sans limite de durée.
// Maintenant : bucket PRIVÉ « org-private », fermé à la clé publique.
//   - l'envoi passe par le serveur (/api/org/photos), qui vérifie le compte,
//     le type réel du fichier et sa taille ;
//   - la base ne stocke qu'une référence, « private:org_items/<org>/<uuid>.jpg » ;
//   - l'affichage passe par des liens signés, valables quelques heures, que
//     seul le serveur peut fabriquer, et seulement pour les photos de
//     l'établissement du membre connecté.
//
// Serveur uniquement (clé service_role).

import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

export const ORG_BUCKET = "org-private";
const PREFIX = "private:";
const LEGACY_BUCKET = "images";

/** Durée des liens d'affichage. Un tableau de bord resté ouvert plus longtemps
 *  se recharge ; un lien qui fuit dans un historique ne vaut plus rien le soir. */
export const DISPLAY_TTL = 6 * 3600;

// Au-delà, ce n'est pas notre formulaire : il compresse à ~300 Ko avant l'envoi.
// (Vercel refuse de toute façon un corps de requête de plus de 4,5 Mo.)
export const MAX_PHOTO_BYTES = 4_000_000;

export const isPrivateRef = (v: unknown): v is string => typeof v === "string" && v.startsWith(PREFIX);
export const refPath = (ref: string) => ref.slice(PREFIX.length);

/** La référence désigne-t-elle bien une photo de CET établissement ? C'est ce
 *  qui empêche un membre d'attacher, ou de faire signer, la photo d'un autre. */
export function ownsRef(ref: unknown, orgId: string): boolean {
  if (!isPrivateRef(ref)) return false;
  const p = refPath(ref);
  return p.startsWith(`org_items/${orgId}/`) && !p.includes("..");
}

/** Type RÉEL du fichier, lu dans ses premiers octets : l'en-tête Content-Type
 *  est déclaré par l'expéditeur, il ne prouve rien. */
export function sniffImage(buf: Buffer): { ext: string; mime: string } | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: "png", mime: "image/png" };
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return { ext: "webp", mime: "image/webp" };
  return null;
}

export async function uploadOrgPhoto(
  sb: SupabaseClient,
  orgId: string,
  file: Blob,
  folder: "" | "intake" = ""
): Promise<{ ref: string } | { error: string }> {
  if (!file || file.size === 0) return { error: "Empty file." };
  if (file.size > MAX_PHOTO_BYTES) return { error: "The photo is too large." };
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = sniffImage(buf);
  if (!kind) return { error: "The photo must be a JPEG, PNG or WebP image." };

  const path = `org_items/${orgId}/${folder ? `${folder}/` : ""}${randomUUID()}.${kind.ext}`;
  const { error } = await sb.storage.from(ORG_BUCKET).upload(path, buf, { contentType: kind.mime, upsert: false });
  if (error) return { error: `storage: ${error.message}` };
  return { ref: `${PREFIX}${path}` };
}

/** Lien signé pour UNE référence (lecture par le modèle de vision, par ex.). */
export async function signOne(sb: SupabaseClient, ref: string, seconds: number): Promise<string | null> {
  if (!isPrivateRef(ref)) return null;
  const { data } = await sb.storage.from(ORG_BUCKET).createSignedUrl(refPath(ref), seconds);
  return data?.signedUrl || null;
}

/** Remplace, dans une liste de lignes, chaque référence privée par un lien
 *  signé. Les anciennes adresses publiques (avant migration) passent telles
 *  quelles. Une seule requête au stockage pour toute la liste. */
export async function signRows<T extends Record<string, any>>(
  sb: SupabaseClient,
  rows: T[],
  key: keyof T & string = "image_url" as keyof T & string,
  seconds = DISPLAY_TTL
): Promise<T[]> {
  const paths = [...new Set(rows.map((r) => r[key]).filter(isPrivateRef).map(refPath))];
  if (!paths.length) return rows;
  const signed = new Map<string, string>();
  for (let i = 0; i < paths.length; i += 500) {
    const { data } = await sb.storage.from(ORG_BUCKET).createSignedUrls(paths.slice(i, i + 500), seconds);
    for (const d of data || []) if (d.path && d.signedUrl) signed.set(d.path, d.signedUrl);
  }
  return rows.map((r) =>
    isPrivateRef(r[key]) ? { ...r, [key]: signed.get(refPath(r[key])) || null } : r
  );
}

/** Supprime le fichier, qu'il soit dans le bucket privé ou (ancienne photo)
 *  dans le bucket public. Ne lève jamais : un fichier déjà absent n'est pas
 *  une erreur. */
export async function removePhoto(sb: SupabaseClient, url: unknown): Promise<void> {
  try {
    if (isPrivateRef(url)) {
      await sb.storage.from(ORG_BUCKET).remove([refPath(url)]);
      return;
    }
    const m = String(url || "").match(/\/object\/public\/images\/(.+)$/);
    if (m) await sb.storage.from(LEGACY_BUCKET).remove([decodeURIComponent(m[1].split("?")[0])]);
  } catch {
    /* sans effet */
  }
}
