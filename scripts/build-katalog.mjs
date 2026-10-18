// Baut public/data/fragen.json: Altbestand (build-fragen.mjs) + Fragen-DSL aus content/*.txt.
// ALLE Fragen sind eigene Formulierungen ("Beispielfragen") auf Grundlage von StVO/FeV – keine amtlichen Prüfungsfragen.
import { readFileSync, readdirSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { altFragen } from './build-fragen.mjs';
import { erzeuge } from './svg-gen.mjs';
import { createHash } from 'node:crypto';

const ROOT = new URL('..', import.meta.url).pathname;
// ---- Klassen ----
export const KLASSEN = ['AM', 'A1', 'A2', 'A', 'B', 'Mofa', 'L', 'T', 'C1', 'C', 'CE', 'D1', 'D'];
const GRUPPEN = {
  MOT: ['AM', 'A1', 'A2', 'A', 'B', 'L', 'T', 'C1', 'C', 'CE', 'D1', 'D'], // Grundstoff aller Kraftfahrzeugklassen
  ALLE: KLASSEN,                                                           // inkl. Mofa
  KRAD: ['A1', 'A2', 'A'],
  ZWEIRAD: ['AM', 'A1', 'A2', 'A'],
  PKW: ['B'],
  KLEIN: ['AM', 'Mofa'],
  LT: ['L', 'T'],
  LKW: ['C1', 'C', 'CE'],
  BUS: ['D1', 'D'],
  CD: ['C1', 'C', 'CE', 'D1', 'D'],
};
const klassenAus = s => [...new Set(s.split(/[,\s]+/).filter(Boolean).flatMap(t => GRUPPEN[t] ?? [t]))];

// ---- Kapitelstruktur nach den Sachgebieten der FeV Anlage 7 Nr. 1.1 (1.x = Grundstoff, 2.x = Zusatzstoff) ----
const kapitel = [
  { id: '1.1', titel: 'Gefahrenlehre', stoff: 'grundstoff' },
  { id: '1.2', titel: 'Verhalten im Straßenverkehr', stoff: 'grundstoff' },
  { id: '1.3', titel: 'Vorfahrt, Vorrang', stoff: 'grundstoff' },
  { id: '1.4', titel: 'Verkehrszeichen', stoff: 'grundstoff' },
  { id: '1.5', titel: 'Umweltschutz', stoff: 'grundstoff' },
  { id: '2.1', titel: 'Gefahrenlehre', stoff: 'zusatzstoff' },
  { id: '2.2', titel: 'Verhalten im Straßenverkehr', stoff: 'zusatzstoff' },
  { id: '2.4', titel: 'Verkehrszeichen', stoff: 'zusatzstoff' },
  { id: '2.5', titel: 'Umweltschutz', stoff: 'zusatzstoff' },
  { id: '2.6', titel: 'Vorschriften über den Betrieb der Fahrzeuge', stoff: 'zusatzstoff' },
  { id: '2.7', titel: 'Technik', stoff: 'zusatzstoff' },
  { id: '2.8', titel: 'Eignung und Befähigung von Kraftfahrern', stoff: 'zusatzstoff' },
];
const kapIds = new Set(kapitel.map(k => k.id));

// ---- Prüfungsregeln (FeV Anlage 7 Nr. 1.2.2; Aufteilung nach Prüfungsrichtlinie Teil A Nr. 4) ----
// Grundstoff je Sachgebiet: [Fragen, Punkte]; die Punkte je Sachgebiet dürfen um ±4 (Ersterwerb) bzw. ±2 (Erweiterung)
// abweichen, sofern die Summe des Gesamtstoffs unverändert bleibt (Prüfungsrichtlinie Teil A Nr. 4.1).
const G_ERST = { '1.1': [8, 32], '1.2': [6, 21], '1.3': [3, 15], '1.4': [2, 6], '1.5': [1, 3] };
const G_ERW = { '1.1': [4, 16], '1.2': [3, 10], '1.3': [2, 10], '1.4': [1, 3] };
// Mofa (Nr. 4.7): 1.4 Verkehrszeichen zusammen mit Technik/Eignung 4 Fragen/12 Punkte – dieser Katalog hat im Grundstoff nur 1.4
const G_MOFA = { '1.1': [3, 11], '1.2': [4, 13], '1.3': [3, 15], '1.4': [4, 12], '1.5': [1, 3] };
const E = (fragen, punkte, maxFP, grund, zusatz, extra = {}) => ({ fragen, punkte, maxFehlerpunkte: maxFP, fuenferRegel: true, grundstoff: grund, zusatzstoff: zusatz, dauerMin: 45, ...extra });
const ERST = (extra = {}) => E(30, 110, 10, 20, 10, { grundKapitel: G_ERST, kapitelToleranz: 4, ...extra });
const ERW = (fragen, punkte, zusatz, extra = {}) => E(fragen, punkte, fragen === 20 ? 6 : 10, 10, zusatz, { grundKapitel: G_ERW, kapitelToleranz: 2, ...extra });
const UNS_C = { unsicher: ['dauerMin'] };
const pruefung = {
  quellen: [
    'FeV Anlage 7 Nr. 1.2.2/1.2.3 (gesetze-im-internet.de/fev_2010/anlage_7.html): Fragenzahl, Punktsumme, zulässige Fehlerpunkte, 5-Punkte-Regel',
    'Prüfungsrichtlinie für die theoretische Fahrerlaubnisprüfung, Teil A Nr. 4.1–4.8 (Stand 01.01.2021, Sonderdruck der Bundesvereinigung der Fahrlehrerverbände): Aufteilung Grund-/Zusatzstoff aller Klassen, Grundstoff je Sachgebiet, Toleranz ±4/±2 Punkte',
    'FeV § 15 Abs. 2: Klasse L nur theoretische Prüfung; Erweiterung B→BE, C1→C1E, D→DE, D1→D1E nur praktische Prüfung',
    'TÜV-Verband, Pressemitteilung 25.03.2025: Klasse B 20 Grundstoff + 10 Zusatzstoff',
    'TÜV NORD (Theorieprüfung/FAQ): Bearbeitungszeit i. d. R. 45 Minuten',
  ],
  hinweis: 'Die Bearbeitungszeit sowie die 5-Punkte-Regel bei Mofa sind nicht amtlich verifiziert (markiert mit unsicher).',
  klassen: {
    AM: { ersterwerb: ERST(), erweiterung: ERW(20, 72, 10) },
    A1: { ersterwerb: ERST(), erweiterung: ERW(20, 72, 10) },
    A2: { ersterwerb: ERST(), erweiterung: ERW(20, 72, 10) },
    A: { ersterwerb: ERST(), erweiterung: ERW(20, 72, 10) },
    B: { ersterwerb: ERST(), erweiterung: ERW(20, 72, 10) },
    L: { ersterwerb: ERST(), erweiterung: ERW(20, 72, 10) },
    T: { ersterwerb: ERST(), erweiterung: ERW(20, 72, 10) },
    Mofa: { ersterwerb: E(20, 69, 7, 15, 5, { fuenferRegel: false, grundKapitel: G_MOFA, kapitelToleranz: 4, unsicher: ['dauerMin', 'fuenferRegel'] }) },
    C: { erweiterung: ERW(37, 128, 27, UNS_C) },
    C1: { erweiterung: ERW(30, 105, 20, UNS_C) },
    CE: { erweiterung: ERW(30, 105, 20, UNS_C) },
    D: { erweiterung: ERW(40, 138, 30, UNS_C) },
    D1: { erweiterung: ERW(35, 121, 25, UNS_C) },
  },
  // Klassen ohne eigene theoretische Prüfung (FeV § 15 Abs. 2) – nur zur Information in der App
  ohneTheorie: [
    { klasse: 'BE', text: 'Zugfahrzeug der Klasse B mit Anhänger oder Sattelanhänger bis 3 500 kg zulässiger Gesamtmasse', voraussetzung: 'B' },
    { klasse: 'C1E', text: 'Zugfahrzeug der Klasse C1 mit Anhänger über 750 kg, Kombination bis 12 000 kg', voraussetzung: 'C1' },
    { klasse: 'D1E', text: 'Zugfahrzeug der Klasse D1 mit Anhänger über 750 kg', voraussetzung: 'D1' },
    { klasse: 'DE', text: 'Zugfahrzeug der Klasse D mit Anhänger über 750 kg', voraussetzung: 'D' },
  ],
  nurTheorie: ['L'],
  // Zum Vergleich: öffentlich genannte Katalogumfänge (siehe Bericht)
  katalogUmfang: { B: { fragen: 1040, quelle: 'TÜV-Verband 25.03.2025 (ab 01.04.2025)' }, alle: { fragen: 1746, quelle: 'fuehrerschein-bestehen.de (Stand 01.04.2025), unsicher' } },
};

// ---- Altbestand umhängen ----
const ALT_KAP = { gefahrenlehre: '1', verhalten: '2', vorfahrt: '3', zeichen: '4', umwelt: '5' };
const ZAHL_KAP = { 'BSP-7-042': '1.1', 'BSP-7-043': '1.2', 'BSP-7-044': '2.2', 'BSP-7-045': '2.7', 'BSP-7-046': '1.1', 'BSP-7-046-V1': '1.1', 'BSP-7-047': '1.1', 'BSP-7-048': '1.2', 'BSP-7-049': '1.1' };
const KAP_FIX = { 'BSP-5-032': ['2.5', 'zusatzstoff'], 'BSP-6-038': ['2.6', 'zusatzstoff'] };
const fragen = [];
for (const f0 of altFragen) {
  const f = structuredClone(f0);
  if (f.kapitel === 'zahlen') { f.kapitel = ZAHL_KAP[f.id]; f.zahlenfrage = true; }
  else if (f.kapitel === 'technik') f.kapitel = '2.7';
  else f.kapitel = (f.stoff === 'grundstoff' ? '1.' : '2.') + ALT_KAP[f.kapitel];
  if (KAP_FIX[f.id]) [f.kapitel, f.stoff] = KAP_FIX[f.id];
  f.stoff = f.kapitel.startsWith('1.') ? 'grundstoff' : 'zusatzstoff';
  if (f.stoff === 'grundstoff') f.klassen = GRUPPEN.MOT;
  else f.klassen = [...new Set(f.klassen.flatMap(k => k === 'A' ? GRUPPEN.KRAD : [k]))];
  f.quelle = 'batch-0';
  fragen.push(f);
}

// ---- DSL-Parser ----
// Kopfzeilen:  @kapitel 1.1   @klassen MOT   @punkte 4   @prefix G
// Frageblock:  ? Fragetext
//              + richtige Antwort / - falsche Antwort
//              = Erklärung
//              N <wert> <einheit>       (Zahlenfrage mit Eingabe)
//              # zeichen 274-30 [1020-30 ...]   # bild ball-strasse.svg   # grafik <spec>   # zusatz 205 306
//              ! punkte=5 klassen=B,KRAD zahl kapitel=1.2 mutter=BSP-7-046 (Variante einer Mutterfrage)
const GEN_DIR = ROOT + 'public/media/gen';
rmSync(GEN_DIR, { recursive: true, force: true }); mkdirSync(GEN_DIR, { recursive: true });
const signs = JSON.parse(readFileSync(ROOT + 'public/signs/signs.json', 'utf8')).schilder;
const sNr = Object.fromEntries(signs.map(x => [x.nr, x]));
const zeichenDatei = (nr, wo) => { if (!sNr[nr]) throw new Error(`Zeichen ${nr} unbekannt (${wo})`); return sNr[nr].datei; };
const filmIds = new Set((() => { try { return JSON.parse(readFileSync(ROOT + 'public/data/filme.json', 'utf8')).filme.map(f => f.id); } catch { return []; } })());
const nrAusDatei = Object.fromEntries(signs.map(x => [x.datei, x.nr]));

const zaehler = {};
for (const datei of readdirSync(ROOT + 'content').filter(f => f.endsWith('.txt')).sort()) {
  const text = readFileSync(ROOT + 'content/' + datei, 'utf8');
  let kopf = { kapitel: null, klassen: 'MOT', punkte: 3 };
  const bloecke = text.split(/\n\s*\n/);
  for (const [bi, roh] of bloecke.entries()) {
    const zeilen = roh.split('\n').map(z => z.trim()).filter(z => z && !z.startsWith('//'));
    if (!zeilen.length) continue;
    const wo = `${datei} Block ${bi + 1}`;
    const q = { antworten: [], opt: {}, zusatz: [] };
    for (const z of zeilen) {
      if (z.startsWith('@')) { const [k, ...v] = z.slice(1).split(/\s+/); kopf = { ...kopf, [k]: v.join(' ') }; continue; }
      const t = z[0], r = z.slice(1).trim();
      if (t === '?') q.text = r;
      else if (t === '+' || t === '-') {
        // Abbildungsauswahl: „+ [zeichen 205] Beschriftung“, „+ [bild datei.svg] …“, „+ [grafik spec] …“
        const mb = r.match(/^\[(zeichen|bild|grafik)\s+([^\]]+)\]\s*(.*)$/);
        if (mb) {
          const [, art, arg, beschr] = mb;
          const bild = art === 'zeichen' ? zeichenDatei(arg.trim(), wo) : art === 'bild' ? 'media/' + arg.trim() : erzeuge(arg.trim(), GEN_DIR);
          const zs = art === 'zeichen' ? sNr[arg.trim()] : null;
          const text = beschr || (zs ? (zs.eigen ? zs.name : `Zeichen ${zs.nr}: ${zs.name}`) : '');
          if (!text) throw new Error('Beschriftung (Alternativtext) fehlt bei Bildantwort in ' + wo);
          q.antworten.push({ text, richtig: t === '+', bild, ...(art === 'zeichen' ? { zeichen: arg.trim() } : {}) });
        } else q.antworten.push({ text: r, richtig: t === '+' });
      }
      else if (t === '=') q.erklaerung = (q.erklaerung ? q.erklaerung + ' ' : '') + r;
      else if (t === 'N') { const [w, ...e] = r.split(/\s+/); q.zahl = { wert: parseFloat(w.replace(',', '.')), einheit: e.join(' ') || undefined, toleranz: 0 }; }
      else if (t === '#') {
        const [art, ...rest] = r.split(/\s+/);
        if (art === 'zeichen') { q.bild = zeichenDatei(rest[0], wo); q.bildAlt = sNr[rest[0]].eigen ? `${sNr[rest[0]].name} (eigene schematische Darstellung)` : `Zeichen ${rest[0]}: ${sNr[rest[0]].name}`; q.zusatz.push(...rest.slice(1)); }
        else if (art === 'zusatz') q.zusatz.push(...rest);
        else if (art === 'bild') q.bild = 'media/' + rest[0];
        else if (art === 'grafik') { q.bild = erzeuge(rest.join(' '), GEN_DIR); q.bildAlt = q.bildAlt ?? 'Verkehrssituation (schematische Darstellung)'; q.spec = rest.join(' '); }
        else if (art === 'alt') q.bildAlt = rest.join(' ');
        else if (art === 'film') { if (!filmIds.has(rest[0])) throw new Error(`Film ${rest[0]} unbekannt (${wo})`); q.film = rest[0]; }
        else throw new Error('Unbekannte Medienangabe ' + art + ' in ' + wo);
      }
      else if (t === '!') for (const kv of r.split(/\s+/)) { const [k, v] = kv.split('='); q.opt[k] = v ?? true; }
      else throw new Error(`Unbekannte Zeile "${z}" in ${wo}`);
    }
    if (!q.text) continue; // reiner Kopfblock
    // Variation einer Mutterfrage: erbt Kapitel, Klassen und Punkte (sofern nicht angegeben), ID = <Mutter>-V<n>
    const mutterF = q.opt.mutter ? fragen.find(x => x.id === q.opt.mutter) : null;
    if (q.opt.mutter && !mutterF) throw new Error(`Mutterfrage ${q.opt.mutter} unbekannt in ${wo}`);
    if (mutterF && mutterF.mutterfrageId !== mutterF.id) throw new Error(`${q.opt.mutter} ist selbst eine Variation (${wo})`);
    const kap = q.opt.kapitel ?? mutterF?.kapitel ?? kopf.kapitel;
    if (!kapIds.has(kap)) throw new Error(`Kapitel ${kap} unbekannt in ${wo}`);
    if (!q.erklaerung) throw new Error('Erklärung fehlt in ' + wo);
    let id, varNr = 0;
    if (mutterF && datei >= '41') {
      varNr = fragen.filter(x => x.mutterfrageId === mutterF.id && x.id !== mutterF.id).length + 1;
      id = `${mutterF.id}-V${varNr}`;
    } else {
      zaehler[kap] = (zaehler[kap] ?? 0) + 1;
      id = `BSP-${kap}-${String(zaehler[kap]).padStart(3, '0')}`;
      if (mutterF) varNr = 1;
    }
    const f = {
      id, mutterfrageId: q.opt.mutter ?? id, variante: varNr, kapitel: kap,
      stoff: kap.startsWith('1.') ? 'grundstoff' : 'zusatzstoff',
      klassen: q.opt.klassen ? klassenAus(q.opt.klassen) : mutterF && datei >= '41' ? [...mutterF.klassen] : klassenAus(kopf.klassen),
      punkte: +(q.opt.punkte ?? (mutterF && datei >= '41' ? mutterF.punkte : kopf.punkte)),
      typ: q.zahl ? 'zahl' : q.antworten.some(a => a.bild) ? 'bildauswahl' : 'auswahl',
      text: q.text,
      ...(q.zahl ? { zahl: q.zahl } : { antworten: q.antworten }),
      erklaerung: q.erklaerung,
      medien: { bild: q.bild ?? null, bildAlt: q.bildAlt ?? null, zusatzbilder: q.zusatz.map(n => zeichenDatei(n, wo)), video: null, poster: null, ...(q.film ? { film: q.film } : {}) },
      beispiel: true,
      quelle: 'batch-1:' + datei,
      _wo: wo,
    };
    if (q.zahl || q.opt.zahl) f.zahlenfrage = true;
    if (q.spec) f.grafik = q.spec;
    fragen.push(f);
  }
}
// Antwortreihenfolge deterministisch je Frage mischen (Seed = id), damit die Reihenfolge
// in den Quelldateien (richtige Antworten zuerst) kein Muster verrät.
const mischeStabil = (arr, seed) => {
  const h = createHash('sha1').update(seed).digest(); const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = h[i % h.length] % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
for (const f of fragen) {
  if (f.antworten) f.antworten = mischeStabil(f.antworten, f.id);
  const nrs = [f.medien?.bild, ...(f.medien?.zusatzbilder ?? []), ...(f.antworten ?? []).map(a => a.bild)].map(d => nrAusDatei[d]).filter(Boolean);
  // in die Situationsgrafik eingezeichnete Zeichen (schild=S:205,…) ebenfalls verknüpfen
  for (const m of (f.grafik?.match(/schild=(\S+)/)?.[1] ?? '').matchAll(/:(\d+)/g)) if (sNr[m[1]] && !nrs.includes(m[1])) nrs.push(m[1]);
  if (nrs.length) f.zeichen = nrs; else delete f.zeichen;
  if (!f.medien.zusatzbilder?.length) delete f.medien.zusatzbilder;
}
const katalog = {
  $schema: './fragen.schema.json',
  meta: {
    titel: 'Beispielfragen',
    version: '0.2.0',
    stand: '2026-10-18',
    hinweis: 'BEISPIELFRAGEN – eigene Formulierungen auf Basis von StVO und FeV. Keine amtlichen Prüfungsfragen. Für den echten Fragenkatalog diese Datei durch lizenzierte Daten im selben Schema ersetzen.',
    klassen: KLASSEN,
    pruefung,
  },
  kapitel,
  fragen: fragen.map(({ _wo, ...f }) => f),
};
writeFileSync(ROOT + 'public/data/fragen.json', JSON.stringify(katalog, null, 1));
writeFileSync('/tmp/fragen-herkunft.json', JSON.stringify(Object.fromEntries(fragen.filter(f => f._wo).map(f => [f.id, f._wo]))));
console.log(fragen.length, 'Fragen geschrieben');
