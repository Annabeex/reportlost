// components/CaseFollowupEditor.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Block = {
  title: string;
  paragraphs: string[];
  created_at?: string;
  updated_at?: string;
};

type Props = { publicId: string | number };

function isNonEmptyString(x: any) {
  return typeof x === 'string' && x.trim().length > 0;
}
function normalizeBlocks(raw: any): Block[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((b: any) => ({
      title: isNonEmptyString(b?.title) ? String(b.title).trim() : 'Bloc',
      paragraphs: Array.isArray(b?.paragraphs)
        ? b.paragraphs.map((p: any) => String(p ?? '')).filter((p: string) => p.length > 0)
        : [],
      created_at: b?.created_at || undefined,
      updated_at: b?.updated_at || undefined,
    }))
    .filter((b: Block) => isNonEmptyString(b.title) || b.paragraphs.length > 0);
}

/* === GABARITS STANDARDS (reprennent tes blocs verts) === */
const DEFAULT_BLOCKS: Block[] = [
  {
    title: "Recherches dans des bases de données",
    paragraphs: [
      "Recherche dans la base de données de la plateforme Objets-trouves.fr",
      "Recherche dans la base de données de la plateforme Ilost.co",
      "Recherche dans la base de données de la plateforme Sherlook.fr",
      "Recherche dans la base de données de la plateforme Trouve-perdu.com",
      "Résultat : aucune correspondance n'a été trouvée lors de ces recherches."
    ],
  },
  {
    title: "Notification locale",
    paragraphs: [
      "Nous vous invitons également à vérifier auprès de la mairie du 16ᵉ arrondissement de Paris si votre trousseau de clés y a été déposé. La mairie est joignable au 01 40 72 16 16. Vous pouvez aussi déclarer la perte de votre trousseau auprès du bureau des objets trouvés de la préfecture de police de Paris en cliquant ici."
    ],
  },
  {
    title: "Création d'une adresse e-mail anonyme",
    paragraphs: [
      "Une adresse e-mail anonyme dédiée à votre signalement a été mise en place pour que votre adresse e-mail ne soit pas diffusée publiquement.",
      "Notre équipe s’assure de la véracité du contenu des messages reçus et filtre les e-mails non sollicités (publicité, spam, tentative d'arnaque, etc.)."
    ],
  },
  {
    title: "Diffusion en ligne",
    paragraphs: [
      "Votre signalement a été publié dans la base de données publique de la plateforme Objets-trouves.fr",
      "Accessible via un ordinateur",
      "Accessible via un smartphone",
      "Accessible via une tablette numérique",
      "Publication en ligne visible par tous"
    ],
  },
];

export default function CaseFollowupEditor({ publicId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const pid = String(publicId);
        const { data, error } = await supabase
          .from('lost_items')
          .select('case_followup')
          .eq('public_id', pid)
          .maybeSingle();

        if (error) throw error;

        const list = normalizeBlocks(data?.case_followup ?? []);
        if (!cancelled) {
          setBlocks(list);
          setDirty(false);
          setEditIndex(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Load failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [publicId]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const payload = blocks.map((b) => ({
        ...b,
        title: String(b.title || '').trim(),
        paragraphs: (b.paragraphs || []).map((p) => String(p ?? '')),
        updated_at: now,
        created_at: b.created_at ?? now,
      }));

      const pid = String(publicId);
      const { error } = await supabase
        .from('lost_items')
        .update({ case_followup: payload })
        .eq('public_id', pid);

      if (error) throw error;

      setDirty(false);
      setEditIndex(null);
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  // actions blocs
  const addBlock = () => { setBlocks(p => [...p, { title: 'Nouveau bloc', paragraphs: ['Nouveau paragraphe…'] }]); setEditIndex(blocks.length); setDirty(true);};
  const removeBlock = (i:number) => { setBlocks(p => p.filter((_,idx)=>idx!==i)); setEditIndex(null); setDirty(true);};
  const moveUp = (i:number) => { if(i<=0) return; setBlocks(p=>{const n=[...p]; [n[i-1],n[i]]=[n[i],n[i-1]]; return n;}); setDirty(true);};
  const moveDown = (i:number) => { if(i>=blocks.length-1) return; setBlocks(p=>{const n=[...p]; [n[i+1],n[i]]=[n[i],n[i+1]]; return n;}); setDirty(true);};
  const startEdit = (i:number)=>setEditIndex(i);
  const cancelEdit = ()=>setEditIndex(null);

  const updateTitle = (i:number, title:string)=>{ setBlocks(p=>{const n=[...p]; n[i]={...n[i], title}; return n;}); setDirty(true);};
  const addParagraph = (i:number)=>{ setBlocks(p=>{const n=[...p]; n[i]={...n[i], paragraphs:[...(n[i].paragraphs||[]), '']}; return n;}); setDirty(true);};
  const updateParagraph = (i:number, pIdx:number, val:string)=>{ setBlocks(p=>{const n=[...p]; const arr=[...(n[i].paragraphs||[])]; arr[pIdx]=val; n[i]={...n[i], paragraphs:arr}; return n;}); setDirty(true);};
  const removeParagraph = (i:number, pIdx:number)=>{ setBlocks(p=>{const n=[...p]; const arr=[...(n[i].paragraphs||[])]; arr.splice(pIdx,1); n[i]={...n[i], paragraphs:arr}; return n;}); setDirty(true);};

  const canSave = useMemo(() => dirty && !saving, [dirty, saving]);

  if (loading) return <div className="rounded-md border p-4 bg-white">Chargement…</div>;

  return (
    <div className="space-y-6">
      {error && <div className="rounded-md border border-red-300 bg-red-50 text-red-800 px-4 py-2">{error}</div>}

      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={addBlock} className="rounded-md bg-emerald-600 text-white px-3 py-1.5 text-sm font-medium hover:brightness-110">+ Ajouter un bloc</button>

        {/* ⬇️ bouton de PRÉ-REMPLISSAGE si vide */}
        {blocks.length === 0 && (
          <button
            onClick={() => { setBlocks(DEFAULT_BLOCKS); setDirty(true); setEditIndex(0); }}
            className="rounded-md bg-sky-600 text-white px-3 py-1.5 text-sm font-medium hover:brightness-110"
          >
            Pré-remplir avec les gabarits standards
          </button>
        )}

        <button onClick={save} disabled={!canSave}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold ${canSave?'bg-indigo-600 text-white hover:brightness-110':'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
          {saving ? 'Enregistrement…' : 'Enregistrer les changements'}
        </button>

        {dirty && !saving && <span className="text-xs text-amber-700">Modifications non enregistrées</span>}
      </div>

      {blocks.length === 0 ? (
        <div className="rounded-md border p-4 bg-white text-gray-700">
          Aucun bloc pour le moment. Vous pouvez <b>pré-remplir</b> avec les gabarits ou <b>ajouter un bloc</b>.
        </div>
      ) : (
        <div className="space-y-6">
          {blocks.map((b, i) => {
            const isEditing = i === editIndex;
            return (
              <div key={i} className="rounded-xl border bg-white shadow-sm">
                <div className="flex items-center justify-between bg-green-100 px-4 py-3 rounded-t-xl">
                  {isEditing ? (
                    <input value={b.title} onChange={(e)=>updateTitle(i,e.target.value)}
                      className="w-full max-w-xl rounded-md border px-3 py-2 text-sm" placeholder="Titre du bloc"/>
                  ) : (
                    <h3 className="text-lg font-semibold">{b.title || 'Bloc'}</h3>
                  )}
                  <div className="flex items-center gap-2">
                    <button onClick={()=>moveUp(i)} className="rounded-md border px-2 py-1 text-sm" title="Monter">↑</button>
                    <button onClick={()=>moveDown(i)} className="rounded-md border px-2 py-1 text-sm" title="Descendre">↓</button>
                    {!isEditing ? (
                      <button onClick={()=>startEdit(i)} className="rounded-md bg-emerald-700 text-white px-3 py-1.5 text-sm font-medium hover:brightness-110">✏️ Modifier</button>
                    ) : (
                      <button onClick={cancelEdit} className="rounded-md bg-gray-800 text-white px-3 py-1.5 text-sm font-medium hover:brightness-110">Terminer</button>
                    )}
                    <button onClick={()=>removeBlock(i)} className="rounded-md bg-red-600 text-white px-3 py-1.5 text-sm font-medium hover:brightness-110">Supprimer</button>
                  </div>
                </div>

                <div className="p-4">
                  {!isEditing ? (
                    <div className="space-y-2 text-[15px] leading-6 text-gray-800">
                      {(b.paragraphs||[]).length ? b.paragraphs.map((p,idx)=>(
                        <p key={idx} className="whitespace-pre-line">{p}</p>
                      )) : <p className="italic text-gray-500">— Aucun contenu —</p>}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(b.paragraphs||[]).map((p,pIdx)=>(
                        <div key={pIdx} className="flex items-start gap-2">
                          <textarea value={p} onChange={(e)=>updateParagraph(i,pIdx,e.target.value)}
                            className="flex-1 min-h-[100px] rounded-md border px-3 py-2 text-sm" placeholder="Paragraphe…"/>
                          <button onClick={()=>removeParagraph(i,pIdx)} className="rounded-md bg-red-50 border border-red-200 text-red-700 px-2 py-2">✖</button>
                        </div>
                      ))}
                      <button onClick={()=>addParagraph(i)} className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50">+ Ajouter un paragraphe</button>

                      <div className="mt-5 border-t pt-4">
                        <div className="text-xs font-semibold text-gray-500 mb-2">APERÇU</div>
                        <div className="bg-green-50 rounded-md p-4">
                          <div className="text-base font-semibold mb-2">{b.title || 'Bloc'}</div>
                          <div className="space-y-2 text-[15px] leading-6">
                            {(b.paragraphs||[]).map((pp,k)=>(
                              <p key={k} className="whitespace-pre-line">{pp}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button onClick={addBlock} className="rounded-md bg-emerald-600 text-white px-3 py-1.5 text-sm font-medium hover:brightness-110">+ Ajouter un bloc</button>
        <button onClick={save} disabled={!canSave}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold ${canSave?'bg-indigo-600 text-white hover:brightness-110':'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
          {saving ? 'Enregistrement…' : 'Enregistrer les changements'}
        </button>
        {dirty && !saving && <span className="text-xs text-amber-700">Modifications non enregistrées</span>}
      </div>
    </div>
  );
}
