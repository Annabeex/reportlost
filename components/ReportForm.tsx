// components/ReportForm.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
// import { supabase } from "@/lib/supabaseClient"; // <= intentionally not used from client
import { formatCityWithState, normalizeCityInput } from "@/lib/locationUtils";
import { useRouter } from "next/navigation";

import ReportFormStep1 from "./ReportFormStep1";
import ReportFormStep2 from "./ReportFormStep2";
import WhatHappensNext from "./WhatHappensNext";
import ReportContribution from "./ReportContribution";
import SearchGauge, { type GaugeLevel } from "./SearchGauge";
import CheckoutForm from "./CheckoutForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type ReportFormProps = {
  defaultCity?: string;
  enforceValidation?: boolean;
  onBeforeSubmit?: (formData: any) => any;
  onStepChange?: (step: number) => void;
  /** ⬅️ NEW: permet de pré-remplir la catégorie (ex: "wallet") */
  initialCategory?: string;
  forceFreeMode?: boolean; // ✅ NEW: Active le mode "Student" (skip paiement)
  universityName?: string; // ✅ NEW: Pour afficher le nom de l'université
  /** ✅ NEW: version "intégrée" (page ville) — enlève min-h-screen et allège les marges.
   *  Par défaut false → aucun impact sur /report, universités, home. */
  embedded?: boolean;
  /** Lost-pet mode: free listing or $25 team-assisted search. */
  petMode?: boolean;
};

type EventLike =
  | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  | { target: { name: string; value: any; type?: string; checked?: boolean } };

function normalizeDbResult(resData: any) {
  if (resData == null) return null;
  if (Array.isArray(resData)) return resData[0] ?? null;
  return resData;
}

/** SHA-1 util (browser SubtleCrypto) -> hex */
async function sha1Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-1", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Compute a stable fingerprint on client from canonicalized important fields.
 * Uses SubtleCrypto (browser). Returns hex SHA-1 (40 chars) to match server.
 */
async function computeFingerprint(payload: Record<string, any>): Promise<string> {
  const parts = [
    (payload.title ?? "").toString(),
    (payload.description ?? "").toString(),
    (payload.city ?? "").toString(),
    (payload.state_id ?? "").toString().toUpperCase(),
    (payload.date ?? "").toString(),
    (payload.email ?? "").toString().toLowerCase(),
  ];
  return sha1Hex(parts.join("|"));
}

export default function ReportForm({
  defaultCity = "",
  enforceValidation = false,
  onBeforeSubmit,
  onStepChange,
  initialCategory,
  forceFreeMode = false, // ✅ NEW
  universityName, // ✅ NEW
  embedded = false, // ✅ NEW
  petMode = false, // ✅ NEW
}: ReportFormProps) {
  const [step, setStep] = useState(1);
  const [progressStep, setProgressStep] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ anti double-submit (état)
  const submitLockRef = useRef(false); // ✅ anti double-submit (verrou mémoire)
  const formRef = useRef<HTMLDivElement>(null);
  // Passe à true dès que le dossier est finalisé : empêche toute réécriture
  // ultérieure du rid mémorisé (voir saveReportToDatabase).
  const finalizedRef = useRef(false);

  const router = useRouter();

  const [formData, setFormData] = useState<any>(() => {
    const normalizedCity = normalizeCityInput(defaultCity);

    return {
      report_id: "",
      public_id: "",
      report_public_id: "",
      // ✅ NEW: champ catégorie (pré-rempli si fourni)
      category: (initialCategory || "").toString().trim().toLowerCase(),
      // ✅ NEW: code partenaire issu du QR (ex: "chicago-north")
      source_station: "",
      source_page: "",

      title: "",
      description: "",
      city: normalizedCity.label,
      state_id: normalizedCity.stateId,
      date: "",
      time_slot: "",
      loss_neighborhood: "",
      loss_street: "",
      transport: false,
      transport_answer: "",
      departure_place: "",
      arrival_place: "",
      departure_time: "",
      arrival_time: "",
      travel_number: "",
      transport_type: "",
      transport_type_other: "",

      airline_name: "",
      metro_line_known: null, // boolean | null
      metro_line: "",
      train_company: "",
      rideshare_platform: "",
      taxi_company: "",
      circumstances: "",

      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
      preferred_contact_channel: "",
      research_report_opt_in: null,

      contribution: 0,
      isCellphone: false,
      phoneColor: "",
      phoneMaterial: "",
      phoneBrand: "",
      phoneModel: "",
      phoneSerial: "",
      phoneProof: "",
      phoneMark: "",
      phoneOther: "",
      object_photo: "",
      consent: false,
      consent_contact: false,
      consent_terms: false,
      consent_authorized: false,
    };
  });

  // --- Mount-only logic (client) ---
  useEffect(() => {
    setIsClient(true);

    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("go") === "contribute") setStep(4);
      // This link preselects automatic search on the plan selection screen.
      if (params.get("offer") === "auto") setShowAutoPlan(true);

      // ✅ rid : l'URL (?rid=, lien du mail) prime toujours. Le rid mémorisé en
      // localStorage n'est réutilisé que s'il a moins de 24h — au-delà, c'est un
      // NOUVEAU signalement, pas la reprise d'un brouillon (sinon on écrasait
      // l'ancien dossier et aucun mail ne repartait).
      const urlRid = params.get("rid") || "";
      let storedRid = "";
      if (!urlRid) {
        const ts = Number(localStorage.getItem("reportlost_rid_ts") || 0);
        if (ts && Date.now() - ts < 24 * 60 * 60 * 1000) {
          storedRid = localStorage.getItem("reportlost_rid") || "";
        } else {
          localStorage.removeItem("reportlost_rid");
          localStorage.removeItem("reportlost_rid_ts");
        }
      }
      const rid = urlRid || storedRid;
      if (rid) setFormData((p: any) => ({ ...p, report_id: rid }));

      // ✅ Bonus safe: si ?category=... dans l'URL et que le champ est vide, on le pose
      const catParam = (params.get("category") || "").trim().toLowerCase();
      if (catParam && !formData.category) {
        setFormData((p: any) => ({ ...p, category: catParam }));
      }

      // ✅ Amorce des pages villes : ?item=… pré-remplit le premier champ, pour
      // que la personne arrive sur une étape 1 déjà entamée plutôt que vierge.
      const itemParam = (params.get("item") || "").trim();
      if (itemParam) {
        setFormData((p: any) => (p.title ? p : { ...p, title: itemParam.slice(0, 120) }));
        setItemFromUrl(true);
      }

      // ✅ NEW: récupérer ?station=xxxx depuis l'URL du QR
      const st = (params.get("station") || "").trim().toLowerCase();
      if (st) {
        setFormData((p: any) => ({ ...p, source_station: st }));
      }

      // ✅ Provenance du dépôt. On la lit dans le referrer plutôt que dans un
      // paramètre ajouté à chaque lien : tous les chemins existants sont
      // couverts d'un coup, y compris ceux qu'on oublierait. ?from=… reste
      // prioritaire pour les cas où le referrer est perdu (redirection, QR).
      // On ne garde QUE le chemin : jamais la chaîne de requête, qui peut
      // transporter ce que la personne a tapé.
      const fromParam = (params.get("from") || "").trim().slice(0, 120);
      let source = fromParam;
      // Formulaire integre directement dans une page (pas sur /report) :
      // l'origine est la page elle-meme.
      if (!source) {
        const here = window.location.pathname || "";
        if (here && !here.startsWith("/report")) source = here.slice(0, 160);
      }
      // Navigation interne vers /report : document.referrer n'est pas mis a
      // jour par Next.js. VisitTracker garde la derniere page vue en session.
      if (!source) {
        try {
          source = (sessionStorage.getItem("rl_last_page") || "").slice(0, 160);
        } catch {
          source = "";
        }
      }
      if (!source) {
        const ref = String(document.referrer || "");
        if (!ref) {
          source = "direct";
        } else {
          try {
            const u = new URL(ref);
            source =
              u.host === window.location.host
                ? u.pathname.slice(0, 160)
                : `ext:${u.hostname.replace(/^www\./, "")}`.slice(0, 120);
          } catch {
            source = "direct";
          }
        }
      }
      // Un aller-retour à l'intérieur du formulaire ne doit pas écraser
      // l'origine réelle par « /report ».
      if (source && !source.startsWith("/report")) {
        setFormData((p: any) => (p.source_page ? p : { ...p, source_page: source }));
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ notify parent on step change
  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  const handleChange = (e: EventLike) => {
    if (!e?.target?.name) return;
    const { name, value, type, checked } = (e as any).target;
    setFormData((prev: any) => {
      const nextValue = type === "checkbox" ? !!checked : value;

      if (name === "city") {
        const normalized = normalizeCityInput(String(nextValue ?? ""));
        return {
          ...prev,
          city: normalized.label,
          state_id: normalized.stateId,
        };
      }

      if (name === "state_id") {
        const normalizedState =
          typeof nextValue === "string" ? nextValue.trim().toUpperCase() : "";
        return {
          ...prev,
          state_id: normalizedState || null,
        };
      }

      // ✅ ça couvrira aussi "category" et "source_station"
      return { ...prev, [name]: nextValue };
    });
  };

  // ✅ Erreur de validation affichée en bannière (plus de popup alert())
  const [topError, setTopError] = useState<string | null>(null);

  // ✅ Scroll fiable en haut du formulaire APRÈS le rendu de la nouvelle étape.
  // (Avant : scroll lancé avant le changement d'étape → on atterrissait en bas
  // de la page suivante sur mobile.)
  // ⚠️ JAMAIS au premier rendu : sur une page ville, ça scrollerait le visiteur
  // jusqu'au formulaire dès l'arrivée, en sautant tout le contenu.
  const stepScrollArmed = useRef(false);
  useEffect(() => {
    setTopError(null);
    if (!stepScrollArmed.current) {
      stepScrollArmed.current = true;
      return;
    }
    const scrollTop = () => formRef.current?.scrollIntoView({ block: "start" });
    const id = requestAnimationFrame(scrollTop);
    // 2e passage à 300 ms : sur mobile, le clavier qui se referme après la
    // saisie décale la page APRÈS le premier scroll.
    const t = setTimeout(scrollTop, 300);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step === 3 || step === 4) setProgressStep(5);
    if (step === 5) setProgressStep(6);
  }, [step]);

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  // 📊 Entonnoir : compteur anonyme par étape (une fois par session et par étape).
  // Permet de voir OÙ les visiteurs s'arrêtent (vue → étape 1 → étape 2 → offre → fin).
  const funnelSent = useRef<Set<string>>(new Set());
  const funnelTrack = useCallback((event: string) => {
    try {
      if (funnelSent.current.has(event)) return;
      funnelSent.current.add(event);
      const k = `rl_f_${event}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* jamais bloquant */
    }
  }, []);
  const trackPaymentFailure = useCallback(() => {
    funnelTrack("form_payment_failed");
  }, [funnelTrack]);
  useEffect(() => {
    funnelTrack("form_view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (step === 4) funnelTrack("form_plan_choice_view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  const buildPhoneDescription = () => {
    if (!formData.isCellphone) return null;
    const parts = [
      formData.phoneColor && `Color: ${formData.phoneColor}`,
      formData.phoneMaterial && `Material: ${formData.phoneMaterial}`,
      formData.phoneBrand && `Brand: ${formData.phoneBrand}`,
      formData.phoneModel && `Model: ${formData.phoneModel}`,
      formData.phoneSerial && `Serial: ${formData.phoneSerial}`,
      formData.phoneProof && `Proof: ${formData.phoneProof}`,
      formData.phoneMark && `Mark: ${formData.phoneMark}`,
      formData.phoneOther && `Other: ${formData.phoneOther}`,
    ].filter(Boolean);
    return parts.join(" • ");
  };

  /**
   * Save report using server endpoint /api/save-report
   * The server implements dedupe/fingerprint/update/insert and controls email sending.
   */
  const saveReportToDatabase = async () => {
    try {
      // ✅ anti double-submit (verrou local mémoire + état UI)
      if (submitLockRef.current) return false;
      submitLockRef.current = true;
      setIsSubmitting(true);

      const phoneDescription = buildPhoneDescription();
      const object_photo = formData.object_photo || null;

      const consentOK = !!(
        formData.consent ||
        (formData.consent_contact &&
          formData.consent_terms &&
          formData.consent_authorized)
      );

      const normalizedCity = normalizeCityInput(formData.city);
      if (!normalizedCity.city) {
        alert("Please select the city where the item was lost.");
        return false;
      }

      const explicitState =
        typeof formData.state_id === "string"
          ? formData.state_id.trim().toUpperCase()
          : "";
      const fallbackState =
        typeof normalizedCity.stateId === "string"
          ? normalizedCity.stateId.trim().toUpperCase()
          : "";
      const finalStateId = explicitState || fallbackState;

      if (!finalStateId) {
        alert(
          'Please specify the state for the city (e.g., select a suggestion like "Chicago (IL)").',
        );
        return false;
      }

      const cityDisplay = formatCityWithState(
        normalizedCity.label,
        finalStateId,
      );

      // utilitaire léger pour convertir "" -> null
      const toNull = (v: any) =>
        v === "" || v === undefined ? null : v;

      const payload = {
        // ✅ on envoie aussi la catégorie
        category: toNull(
          (formData.category || "").toString().trim().toLowerCase(),
        ),
        // ✅ NEW: code partenaire issu du QR (ex: "chicago-north")
        source_page: toNull((formData.source_page || "").toString().trim()),
        source_station: toNull(
          (formData.source_station || "").toString().trim().toLowerCase(),
        ),

        title: toNull(formData.title),
        description: toNull(formData.description),
        city: cityDisplay || null,
        state_id: finalStateId,
        date: toNull(formData.date),
        time_slot: toNull(formData.time_slot),
        loss_neighborhood: toNull(formData.loss_neighborhood),
        loss_street: toNull(formData.loss_street),

        // === Nouveaux champs: contexte / transport / lieu ===
        transport_answer: toNull(formData.transport_answer),
        transport_type: toNull(formData.transport_type),
        transport_type_other: toNull(formData.transport_type_other),
        place_type: toNull(formData.place_type),
        place_type_other: toNull(formData.place_type_other),
        airline_name: toNull(formData.airline_name),
        metro_line_known: formData.metro_line_known ?? null,
        metro_line: toNull(formData.metro_line),
        train_company: toNull(formData.train_company),
        rideshare_platform: toNull(formData.rideshare_platform),
        taxi_company: toNull(formData.taxi_company),
        circumstances: toNull(formData.circumstances),

        // === Trajet ===
        departure_place: toNull(formData.departure_place),
        arrival_place: toNull(formData.arrival_place),
        departure_time: toNull(formData.departure_time),
        arrival_time: toNull(formData.arrival_time),
        travel_number: toNull(formData.travel_number),

        // === Contact ===
        email: String(formData.email || ""),
        first_name: String(formData.first_name || ""),
        last_name: String(formData.last_name || ""),
        phone: toNull(formData.phone),
        address: toNull(formData.address),

        // === Préférences ===
        preferred_contact_channel: toNull(
          formData.preferred_contact_channel,
        ),
        research_report_opt_in: formData.research_report_opt_in ?? null,

        contribution: formData.contribution ?? 0,
        consent: consentOK,
        phone_description: toNull(phoneDescription),
        object_photo,
      };

      const cleaned = onBeforeSubmit ? onBeforeSubmit(payload) : payload;

      // compute fingerprint client-side so server and client fingerprint match
      const fingerprint = await computeFingerprint(cleaned);

      // ✅ On conserve le fingerprint, mais on NE BLOQUE PLUS le POST
      try {
        localStorage.setItem("rl_pending_fp", fingerprint);
      } catch {
        /* ignore */
      }

      // build body to POST to server endpoint
      const bodyToSend: Record<string, any> = {
        ...cleaned,
        fingerprint,
      };

      // include report_id if we already have one (update flow)
      // ONLY send report_id if it *looks like a UUID*
      if (formData.report_id) {
        const candidate = String(formData.report_id).trim();
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(candidate)) {
          bodyToSend.report_id = candidate;
        } else if (formData.public_id) {
          bodyToSend.report_public_id = String(formData.public_id);
        } else {
          console.warn(
            "Not sending report_id because it is not a UUID:",
            candidate,
          );
        }
      }

      // — avant l'appel fetch —
      const controller = new AbortController();
      const timeoutMs = 20000; // ⬆️ passe de 8000 à 20000
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      let res: Response;
      try {
        res = await fetch("/api/save-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyToSend),
          signal: controller.signal,
        });
      } catch (e: any) {
        // 🔁 petit retry si c’est un AbortError
        if (e?.name === "AbortError") {
          const controller2 = new AbortController();
          const retryTimeout = setTimeout(
            () => controller2.abort(),
            20000,
          );
          try {
            res = await fetch("/api/save-report", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(bodyToSend),
              signal: controller2.signal,
            });
          } finally {
            clearTimeout(retryTimeout);
          }
        } else {
          throw e;
        }
      } finally {
        clearTimeout(timeout);
      }

      // Diagnostic: if non-ok, lire et afficher le body (json ou texte)
      if (!res!.ok) {
        const contentType = res!.headers.get("content-type") || "";
        let bodyText = "";
        try {
          if (contentType.includes("application/json")) {
            const j = await res!.json().catch(() => null);
            bodyText = JSON.stringify(j, null, 2);
          } else {
            bodyText = await res!.text().catch(() => "");
          }
        } catch (e) {
          bodyText = String(e);
        }
        console.error("❌ /api/save-report non-ok:", res!.status, bodyText);
        alert(
          `Server error (${res!.status}): ${
            bodyText || res!.statusText
          }`,
        );
        return false;
      }

      // Parse successful response; guard against invalid JSON
      let jsonRes: any = null;
      try {
        jsonRes = await res!.json();
      } catch (e) {
        const txt = await res!.text().catch(() => "");
        console.error(
          "❌ /api/save-report returned invalid JSON:",
          txt,
          e,
        );
        alert(
          "Server returned invalid response. Voir console pour détails.",
        );
        return false;
      }

      if (!jsonRes || !jsonRes.ok) {
        console.error("❌ /api/save-report error payload:", jsonRes);
        alert(
          `Unexpected database error: ${
            jsonRes?.error || "unknown"
          }`,
        );
        return false;
      }

      const returnedId = jsonRes.id?.toString?.() || "";
      const returnedPublicId = jsonRes.public_id || "";

      // persist to client state + localStorage
      setFormData((p: any) => ({
        ...p,
        report_id: returnedId || p.report_id,
        public_id: returnedPublicId || p.public_id,
        report_public_id: returnedPublicId || p.report_public_id,
        city: cityDisplay,
        state_id: finalStateId,
      }));

      try {
        // ⚠️ Deux corrections ici.
        // 1) Les accolades manquaient : `reportlost_rid_ts` était écrit même
        //    quand aucun id n'était revenu, donc la fenêtre de 24 h glissait
        //    indéfiniment tant que la personne utilisait le formulaire.
        // 2) Une fois le dossier finalisé (publié en gratuit ou payé), on ne
        //    réécrit plus le rid : sinon la sauvegarde des coordonnées
        //    facultatives d'après-paiement le remettait en place et le dossier
        //    payé redevenait écrasable par un dépôt ultérieur.
        if (returnedId && !finalizedRef.current) {
          localStorage.setItem("reportlost_rid", returnedId);
          localStorage.setItem("reportlost_rid_ts", String(Date.now()));
        }
        if (returnedPublicId)
          localStorage.setItem(
            "reportlost_public_id",
            returnedPublicId,
          );
      } catch {
        /* ignore */
      }

      // === NOTE: pas de génération/redirect de slug ici.
      return true;
    } catch (err: any) {
      if (err?.name === "AbortError") {
        console.error("❌ /api/save-report timed out");
        alert("Request timed out. Please try again.");
        return false;
      }
      console.error(
        "💥 Unexpected error while saving report (client):",
        err,
      );
      alert(
        `Unexpected error. Voir la console pour plus d'infos: ${String(
          err?.message || err,
        )}`,
      );
      return false;
    } finally {
      // ✅ relâche le verrou après un court délai pour éviter les rafales
      setTimeout(() => {
        submitLockRef.current = false;
        setIsSubmitting(false);
        try {
          localStorage.removeItem("rl_pending_fp");
        } catch {}
      }, 3000);
    }
  };

  // --- navigation / step logic ---
  const handleNext = async () => {
    // Step 1 validation
    if (enforceValidation && step === 1) {
      if (
        !formData.title?.trim() ||
        !formData.description?.trim() ||
        !formData.city?.trim() ||
        !formData.date?.trim()
      ) {
        setTopError("Please fill in all required fields.");
        return;
      }
    }

    // Step 2: personal info + submit to DB
    if (enforceValidation && step === 2) {
      if (isSubmitting) return; // ✅ déjà en cours

      if (!formData.first_name?.trim()) {
        setTopError("Please enter your first name.");
        return;
      }
      if (!formData.last_name?.trim()) {
        setTopError("Please enter your last name.");
        return;
      }
      if (!formData.email?.trim()) {
        setTopError("Please enter your email.");
        return;
      }

      const consentOK = !!(
        formData.consent ||
        (formData.consent_contact &&
          formData.consent_terms &&
          formData.consent_authorized)
      );

      if (!consentOK) {
        setTopError("Please confirm all required checkboxes.");
        return;
      }

      const success = await saveReportToDatabase();
      if (!success) return;
      funnelTrack("form_step2_done");
    }

    if (step === 1) funnelTrack("form_step1_done");

    // ✅ MODIFICATION ICI : Gestion du mode "Université"
    // Si on est à l'étape 3 (WhatHappensNext) et qu'on est en forceFreeMode,
    // on saute l'étape 4 (Paiement) pour aller direct à 5.
    if (step === 3 && forceFreeMode) {
      setFormData((prev: any) => ({ ...prev, contribution: 0, paymentRequired: false }));
      setStep(5);
      return;
    }

    setStep((s) => s + 1);
  };

  // ✅ Après paiement : écran de confirmation (plus de popup alert) qui propose
  // les coordonnées d'action (téléphone / adresse / date de naissance), demandées
  // UNIQUEMENT aux clients payants. Le webhook Stripe gère la base côté serveur.
  // Objet déjà renseigné par l'amorce d'une page ville : l'étape 1 ne repose
  // alors plus la question, elle enchaîne directement sur la description.
  const [itemFromUrl, setItemFromUrl] = useState(false);
  const [showAutoPlan, setShowAutoPlan] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  useEffect(() => {
    if (step === 5 && Number(formData.contribution) > 0 && !paymentDone) {
      funnelTrack("form_checkout_view");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, formData.contribution, paymentDone]);
  // Ecran final gratuit : cran de la jauge, et paiement ouvert depuis la jauge.
  const [gaugeLevel, setGaugeLevel] = useState<GaugeLevel>(0);
  const [upsellFromFree, setUpsellFromFree] = useState(false);
  // La jauge ouvre le paiement sur place : on reste a l'etape 5, qui affiche le
  // formulaire de paiement des que la contribution devient positive.
  const startUpsell = (price: number) => {
    setUpsellFromFree(true);
    setFormData((prev: any) => ({ ...prev, contribution: price, paymentRequired: true }));
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {}
  };
  // « Back » depuis ce paiement revient sur la jauge, pas a l'ecran des formules.
  const backFromCheckout = () => {
    if (upsellFromFree) {
      setUpsellFromFree(false);
      setFormData((prev: any) => ({ ...prev, contribution: 0, paymentRequired: false }));
      return;
    }
    handleBack();
  };
  const [detailsSaved, setDetailsSaved] = useState(false);
  /**
   * Le rid mémorisé sert à retomber sur la MÊME ligne quand la personne
   * revient en arrière dans le formulaire : c'est ce qui évite les doublons.
   * Mais il n'était jamais effacé, seulement purgé au bout de 24 h. Un dépôt
   * ultérieur fait depuis le même navigateur écrasait donc le dossier
   * précédent au lieu d'en créer un nouveau — et, la ligne existant déjà, ni
   * la notification support ni l'e-mail de publication ne repartaient.
   *
   * On l'efface donc à la FINALISATION seulement (publié en gratuit, ou payé).
   * Le retour arrière se produit avant ce point : la protection anti-doublon
   * est intacte, et le lien d'upsell reste valable puisqu'il porte le rid dans
   * son URL, pas dans le localStorage.
   */
  const clearStoredRid = () => {
    finalizedRef.current = true;
    try {
      localStorage.removeItem("reportlost_rid");
      localStorage.removeItem("reportlost_rid_ts");
    } catch {
      /* navigation privée, stockage bloqué : sans effet */
    }
  };

  const handleSuccessfulPayment = async () => {
    funnelTrack("form_payment_succeeded");
    setPaymentDone(true);
    // Dossier finalisé et payé : idem, on ne doit plus réécrire cette ligne.
    clearStoredRid();
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ block: "start" }));
  };
  const saveActionDetails = async () => {
    const ok = await saveReportToDatabase();
    if (ok) setDetailsSaved(true);
  };

  // ✅ envoi email “free submission” une seule fois (NOUVEAU CONTENU)
  const [freeEmailSent, setFreeEmailSent] = useState(false);
  useEffect(() => {
    const shouldSend =
      isClient &&
      step === 5 &&
      Number(formData.contribution) <= 0 &&
      !freeEmailSent &&
      formData?.email;

    if (!shouldSend) return;
    funnelTrack("form_completed_free");

    (async () => {
      try {
       const controller = new AbortController();
const t = setTimeout(() => controller.abort(), 15000);

await fetch("/api/public/send-publication-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    reportId: String(formData.report_id || ""),
    // optionnel si tu veux un contrôle supplémentaire
    email: formData.email || "",
  }),
  signal: controller.signal,
}).catch(() => {
  /* soft-fail */
});

clearTimeout(t);
setFreeEmailSent(true);
// Dossier finalisé en annonce gratuite : le brouillon n'est plus reprenable.
clearStoredRid();
      } catch {
        // soft-fail
      }
    })();
  }, [
    isClient,
    step,
    formData.contribution,
    formData.email,
    formData.report_id,
    freeEmailSent,
  ]);

  const contributionUsd = Number(formData.contribution || 0);
  const paidServiceLabel = petMode
    ? "Team-assisted pet search"
    : contributionUsd >= 25
    ? "Team-assisted search"
    : "Automatic search";


  return (
    <main
      ref={formRef}
      className={
        embedded
          ? "w-full px-1 sm:px-2 py-1 space-y-4"
          : "w-full min-h-screen px-4 py-6 space-y-4"
      }
    >
      {/* Barre de progression fine (visuelle, sans numérotation) */}
      {step <= 5 && (
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200"
          role="progressbar"
          aria-label="Report completion progress"
          aria-valuemin={1}
          aria-valuemax={6}
          aria-valuenow={progressStep}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#26723e] to-[#2ea052] transition-all duration-500"
            style={{ width: `${Math.min(100, (progressStep / 6) * 100)}%` }}
          />
        </div>
      )}

      {/* Erreur de validation (remplace les popups alert) */}
      {topError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
          aria-live="polite"
        >
          {topError}
        </div>
      )}

      {step === 1 && (
        <ReportFormStep1
          formData={formData}
          onChange={handleChange}
          onNext={handleNext}
          onProgressStepChange={setProgressStep}
          universityName={universityName} // ✅ NEW: Prop passée pour affichage conditionnel
          petMode={petMode} // ✅ NEW: libellés animaux
          itemFromUrl={itemFromUrl}
        />
      )}

      {step === 2 && (
        <ReportFormStep2
          formData={formData}
          setFormData={setFormData}
          onChange={handleChange}
          onNext={handleNext}
          onBack={handleBack}
          onProgressStepChange={setProgressStep}
          isSubmitting={isSubmitting} // ✅ passe l’état à Step2
        />
      )}

      {step === 3 && (
        <WhatHappensNext
          formData={formData}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {/* ✅ MODIFICATION: On cache l'étape 4 si on est en mode gratuit (forceFreeMode) */}
      {step === 4 && !forceFreeMode && (
        <ReportContribution
          amount={Number(formData.contribution ?? 0)}
          setFormData={setFormData}
          onBack={handleBack}
          onNext={handleNext}
          petMode={petMode}
          showAutoPlan={showAutoPlan}
          onPlanSelected={funnelTrack}
        />
      )}

      {step === 5 &&
        (Number(formData.contribution) <= 0 ||
        formData?.paymentRequired === false ? (
          // ✅ Pas de paiement (gratuit ou universite) : ECRAN FINAL UNIQUE.
          // Fusion de l'ancien ecran « jauge » et de cette confirmation. Le mail
          // de publication part a l'affichage (effet plus haut, step === 5) :
          // plus aucun clic n'est necessaire pour terminer. La jauge sert de
          // relance, et ses boutons ouvrent le paiement sans recharger la page.
          <section className="w-full min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-gray-200">
              <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
                <p className="flex items-start gap-2.5 text-[14.5px] leading-snug text-gray-600">
                  <span
                    aria-hidden
                    className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full border border-green-200 bg-green-100 text-[11px] font-bold text-green-800"
                  >
                    ✓
                  </span>
                  <span>
                    {forceFreeMode
                      ? "Published in the public database (student access)"
                      : "Published in the public database"}
                  </span>
                </p>
                <p className="mt-2.5 flex items-start gap-2.5 text-[14.5px] leading-snug">
                  <span
                    aria-hidden
                    className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full border border-gray-300 bg-white text-[11px] text-gray-600"
                  >
                    ○
                  </span>
                  <span className="font-medium text-gray-800">
                    No paid search service selected
                    <span className="mt-0.5 block text-[13px] font-normal text-gray-600">
                      The free option publishes a public listing without team outreach or active web monitoring.
                    </span>
                  </span>
                </p>
                {formData?.email ? (
                  <p className="mt-2.5 flex items-start gap-2.5 text-[14.5px] leading-snug text-gray-600">
                    <span
                      aria-hidden
                      className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full border border-gray-200 bg-white text-[11px] text-gray-500"
                    >
                      ✉
                    </span>
                    <span>
                      Confirmation sent to{" "}
                      <b className="font-semibold text-gray-800">{String(formData.email)}</b>
                      <span className="mt-0.5 block text-[13px] text-gray-500">
                        with your reference and the link to your listing.
                      </span>
                    </span>
                  </p>
                ) : null}
              </div>

              <div className="px-5 py-6">
                <h2 className="text-[21px] font-bold text-gray-900">Optional search services</h2>
                <p className="mb-5 mt-1.5 text-[14.5px] text-gray-600">
                  Compare the scope and duration of each option.
                </p>

                <SearchGauge level={gaugeLevel} onChange={setGaugeLevel} />

                <button
                  type="button"
                  onClick={() => startUpsell(gaugeLevel === 1 ? 12 : 25)}
                  className="mt-5 block w-full rounded-xl bg-[#1f6b3a] px-5 py-3.5 text-center text-[16px] font-bold text-white hover:brightness-110"
                >
                  {gaugeLevel === 1 ? "Choose automatic search — $12" : "Choose team-assisted search — $25"}
                </button>
                {gaugeLevel === 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setGaugeLevel(1);
                      startUpsell(12);
                    }}
                    className="mt-2.5 block w-full text-center text-[13.5px] text-[#1f6b3a] underline underline-offset-2"
                  >
                    Choose automatic search — $12
                  </button>
                ) : null}

                <p className="mt-4 text-[12px] leading-snug text-gray-500">
                  🔒 One-time payment, never a subscription. Processed securely by Stripe.com, PCI DSS
                  v4.0 certified.
                </p>

                <div className="mt-5 flex items-center justify-between text-[13px]">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-gray-500 underline underline-offset-2 hover:text-gray-700"
                  >
                    ← Back to options
                  </button>
                  <span className="text-gray-400">
                    {/^\d{5}$/.test(String(formData.public_id || ""))
                      ? `Reference ${formData.public_id} · `
                      : ""}
                    your free listing stays online either way.
                  </span>
                </div>
              </div>
            </div>
          </section>
        ) : paymentDone ? (
          // ✅ Confirmation après paiement + coordonnées d'action (clients payants uniquement)
          <section className="w-full bg-white px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="rounded-2xl border border-green-200 bg-[#f2fbf5] px-5 py-5">
              <h2 className="text-xl font-bold text-[#1f6b3a]">
                Payment confirmed — {paidServiceLabel} is active
              </h2>
              <p className="mt-1.5 text-[#0f2b1c]">
                Your report is published and the selected service is active. A confirmation email
                is on its way
                {formData.email ? (
                  <> to <span className="font-semibold">{formData.email}</span></>
                ) : null}
                .
              </p>

              <dl className="mt-4 space-y-2.5 border-t border-green-200/70 pt-4 text-sm">
                <div className="flex gap-3">
                  <dt className="w-24 flex-none font-semibold text-[#1f6b3a]">Monitoring</dt>
                  <dd className="text-[#123524]">
                    Public-web checks run daily during the first week, then weekly and monthly for {contributionUsd >= 25 ? "12" : "6"} months. Potential matches are reviewed before notification.
                  </dd>
                </div>
                {contributionUsd >= 25 && (
                  <div className="flex gap-3">
                    <dt className="w-24 flex-none font-semibold text-[#1f6b3a]">Outreach</dt>
                    <dd className="text-[#123524]">
                      The team contacts relevant services and venues and can publish a local notice. Reports are sent to public services where third-party filing is accepted; otherwise, contact details and instructions are provided.
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {contributionUsd >= 25 && (
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
              <h3 className="font-semibold text-gray-900">
                Additional contact details{" "}
                <span className="font-normal text-green-700">(optional)</span>
              </h3>
              {/* Chaque explication ne s'affiche que tant que le champ concerné est
                  vide : une fois rempli, il n'y a plus rien à débloquer et la phrase
                  ne ferait qu'allonger l'écran. */}
              {(!formData.phone || !formData.birth_date || !formData.address) && (
                <ul className="mt-2 mb-4 space-y-1.5 text-sm text-gray-600">
                  {!formData.phone && (
                    <li>
                      <span className="font-medium text-gray-900">Phone number</span> — so an
                      establishment that has your item can reach you directly instead of going
                      through us.
                    </li>
                  )}
                  {(!formData.birth_date || !formData.address) && (
                    <li>
                      <span className="font-medium text-gray-900">
                        Date of birth and postal address
                      </span>{" "}
                      — several police departments will not accept a report filed on your behalf
                      without them.
                    </li>
                  )}
                </ul>
              )}
              <p className="mb-4 text-sm text-gray-500">
                Never published on the site, and never passed on beyond the step that requires it.
                You can leave a field empty and add it later.
              </p>
              {detailsSaved ? (
                <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                  Details saved.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium mb-1">
                        Phone number <span className="font-normal text-gray-500">(optional)</span>
                      </label>
                      <input
                        name="phone"
                        type="tel"
                        value={formData.phone || ""}
                        onChange={handleChange}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">
                        Date of birth <span className="font-normal text-gray-500">(optional)</span>
                      </label>
                      <input
                        type="date"
                        name="birth_date"
                        value={formData.birth_date || ""}
                        onChange={handleChange}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-medium mb-1">
                        Postal address <span className="font-normal text-gray-500">(optional)</span>
                      </label>
                      <input
                        name="address"
                        value={formData.address || ""}
                        onChange={handleChange}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={saveActionDetails}
                    disabled={isSubmitting}
                    className={`mt-4 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#26723e] to-[#2ea052] px-6 py-2.5 font-semibold text-white shadow ${
                      isSubmitting ? "opacity-60 pointer-events-none" : ""
                    }`}
                  >
                    {isSubmitting ? "Saving…" : "Save my details"}
                  </button>
                </>
              )}
            </div>
            )}
          </section>
        ) : (
          // ✅ Paiement si contribution > 0 (Flow classique)
          <section className="w-full min-h-screen bg-white px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-2xl font-bold mb-4">
              Complete payment — {paidServiceLabel} (${contributionUsd.toFixed(2)})
            </h2>
            <Elements stripe={stripePromise}>
              <CheckoutForm
                amount={Number(formData.contribution || 0)}
                reportId={String(formData.report_id || "")}
                onSuccess={handleSuccessfulPayment}
                onBack={backFromCheckout}
                onPaymentFailure={trackPaymentFailure}
                tierLabel={paidServiceLabel}
                key={`co-${formData.report_id}-${formData.contribution}`}
              />
            </Elements>
          </section>
        ))}
    </main>
  );
}
