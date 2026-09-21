// lib/csv.ts — lecture et écriture de CSV, sans dépendance. Utilisé des deux
// côtés : le navigateur lit le fichier de l'ancien logiciel, le serveur écrit
// l'export.

/** Lit un CSV : séparateur , ; ou tabulation (détecté), guillemets doublés,
 *  retours à la ligne dans les cellules, BOM d'Excel. */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const firstLine = text.slice(0, text.search(/\r?\n/) === -1 ? text.length : text.search(/\r?\n/));
  const count = (ch: string) => firstLine.split(ch).length - 1;
  const delim = [",", ";", "\t"].sort((a, b) => count(b) - count(a))[0];

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else quoted = false;
      } else cell += c;
      continue;
    }
    if (c === '"' && cell === "") { quoted = true; continue; }
    if (c === delim) { row.push(cell); cell = ""; continue; }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      rows.push(row);
      row = [];
      continue;
    }
    cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }

  return rows
    .map((r) => r.map((v) => v.trim()))
    .filter((r) => r.some((v) => v !== ""));
}

/** Écrit un CSV lisible par Excel (BOM, CRLF). Une cellule qui commence par
 *  = + - @ est neutralisée : ouverte dans un tableur, elle serait exécutée
 *  comme une formule — et certaines viennent d'un formulaire public. */
export function toCsv(rows: (string | number | boolean | null | undefined)[][]): string {
  const esc = (v: string | number | boolean | null | undefined) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\r\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(esc).join(",")).join("\r\n") + "\r\n";
}

const pad = (n: number) => String(n).padStart(2, "0");

function valid(y: number, m: number, d: number): string | null {
  if (y < 100) y += 2000;
  if (y < 1990 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Date d'un export quelconque → YYYY-MM-DD. Les dates à barres sont lues à
 *  l'américaine (mois d'abord), sauf quand le premier nombre dépasse 12. */
export function parseLooseDate(raw: string, dayFirst = false): string | null {
  const s = String(raw || "").trim();
  if (!s) return null;

  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return valid(+m[1], +m[2], +m[3]);

  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})(?!\d)/);
  if (m) {
    const a = +m[1], b = +m[2], y = +m[3];
    if (a > 12) return valid(y, b, a);
    if (b > 12) return valid(y, a, b);
    return dayFirst ? valid(y, b, a) : valid(y, a, b);
  }

  // « Sep 3, 2026 », « 3 September 2026 »
  if (/[a-z]{3}/i.test(s)) {
    const t = Date.parse(s);
    if (Number.isFinite(t)) {
      const d = new Date(t);
      return valid(d.getFullYear(), d.getMonth() + 1, d.getDate());
    }
  }
  return null;
}
