export type Klasse = string; // z. B. "A", "B"
export interface Antwort { text: string; richtig: boolean; /** Abbildungsauswahl: Bild der Antwortoption */ bild?: string; zeichen?: string }
export interface Medien { bild?: string | null; bildAlt?: string | null; zusatzbilder?: string[]; video?: string | null; poster?: string | null; /** ID einer eigenen animierten Szene (public/data/filme.json) */ film?: string }
/** Metadaten einer Frage – immer geladen (data/index.json), reichen für Statistik, Filter und Prüfungsziehung */
export interface FrageMeta {
  id: string;
  mutterfrageId: string;
  variante?: number;
  kapitel: string;
  stoff: 'grundstoff' | 'zusatzstoff';
  klassen: Klasse[];
  punkte: number;
  typ: 'auswahl' | 'zahl' | 'bildauswahl';
  medien?: { film?: string };
  beispiel?: boolean;
  /** Frage gehört (auch) zum Bereich „Zahlenfragen“ */
  zahlenfrage?: boolean;
  /** Index des Katalogteils (data/teile/…), in dem die vollständige Frage steht */
  teil?: number;
}
/** Vollständige Frage – wird teilweise bei Bedarf nachgeladen */
export interface Frage extends FrageMeta {
  text: string;
  antworten?: Antwort[];
  zahl?: { wert: number; einheit?: string; toleranz?: number };
  erklaerung: string;
  medien?: Medien;
  /** VzKat-Nummern der gezeigten Zeichen (Verweis auf signs.json) */
  zeichen?: string[];
  /** Herkunft innerhalb dieses Projekts (Batch/Datei), keine externe Quelle */
  quelle?: string;
  /** Spezifikation der selbst erzeugten Situationsgrafik (scripts/svg-gen.mjs) */
  grafik?: string;
}
export interface Kapitel { id: string; titel: string; stoff?: 'grundstoff' | 'zusatzstoff'; beschreibung?: string }
export type PruefungsArt = 'ersterwerb' | 'erweiterung';
export interface PruefungsRegel {
  fragen: number; punkte: number; maxFehlerpunkte: number; fuenferRegel: boolean;
  grundstoff: number; zusatzstoff: number; dauerMin: number;
  /** Felder, deren Wert nicht amtlich belegt ist */
  unsicher?: string[];
  /** Grundstoff je Sachgebiet: [Fragen, Punkte] (Prüfungsrichtlinie Teil A Nr. 4) */
  grundKapitel?: Record<string, [number, number]>;
  /** zulässige Abweichung der Punkte je Sachgebiet (±) */
  kapitelToleranz?: number;
}
export interface PruefungsMeta {
  quellen?: string[]; hinweis?: string;
  klassen: Record<string, Partial<Record<PruefungsArt, PruefungsRegel>>>;
  /** Klassen ohne eigene theoretische Prüfung (FeV § 15 Abs. 2) */
  ohneTheorie?: { klasse: string; text: string; voraussetzung: string }[];
  /** Klassen mit nur theoretischer Prüfung (FeV § 15 Abs. 2) */
  nurTheorie?: string[];
  katalogUmfang?: Record<string, unknown>;
}
export interface Katalog {
  meta: {
    titel: string; version: string; stand?: string; hinweis?: string;
    klassen?: string[];
    pruefung?: PruefungsMeta;
  };
  kapitel: Kapitel[];
  fragen: FrageMeta[];
  /** Dateinamen der Katalogteile unter data/teile/ */
  teile: string[];
}
/** Auswahl: Indizes der angekreuzten Antworten; Zahl: eingegebener Text */
export type Eingabe = number[] | string;

export interface Schild { nr: string; name: string; kategorie: string; datei: string; quelle: string; commonsDatei: string | null; lizenz: string; stvo?: number | null; gruppe?: string; grundname?: string; variante?: string | null; eigen?: boolean; nameCommons?: string }
export interface SchilderManifest { titel: string; hinweis: string; quelle: string; abgerufen: string; kategorien: string[]; schilder: Schild[] }

/* ---------- Eigene animierte Szenen („Filmfragen“) ---------- */
/** Keyframe: [Zeit s, x m, y m, Fahrtrichtung Grad (0 = nach oben)] */
export type Keyframe = [number, number, number, number];
export type Zeitraum = [number, number];
export interface FilmObjekt {
  id: string;
  art: 'pkw' | 'lkw' | 'bus' | 'transporter' | 'krad' | 'rad' | 'fussg' | 'kind' | 'ball' | 'reh' | 'traktor' | 'polizei' | 'rtw' | 'tram' | 'roller' | 'hund' | 'kinderwagen' | 'rollstuhl' | 'bake' | 'kegel';
  farbe?: string; ich?: boolean;
  bahn: Keyframe[];
  blinker?: [number, number, 'l' | 'r' | 'w'][];
  brems?: Zeitraum[]; tuer?: Zeitraum[]; blaulicht?: Zeitraum[]; rueckfahr?: Zeitraum[];
  sichtbar?: Zeitraum; licht?: boolean; warnblink?: boolean;
}
export interface FilmAmpel { x: number; y: number; w?: number; phasen: [number, 'rot' | 'gelb' | 'gruen' | 'rotgelb' | 'aus' | 'gelbblink'][]; gruenpfeil?: boolean }
export interface FilmSchild { x: number; y: number; nr: string; datei: string }
export interface FilmWelt {
  typ: 'stadt' | 'kreuzung' | 'einmuendung' | 'landstrasse' | 'autobahn' | 'kreisverkehr' | 'bahnuebergang' | 'wohngebiet' | 'zebra' | 'baustelle' | 'kurve' | 'parkplatz';
  nacht?: boolean; regen?: boolean; nebel?: number; schnee?: boolean; laub?: boolean;
  /** zusätzliche Elemente */
  /** zusätzliche Linien (Haltlinie, Wartelinie, durchgezogene Linie) */
  linien?: { x1: number; y1: number; x2: number; y2: number; art: 'halt' | 'warte' | 'durch' | 'leit' }[];
  /** Kurvenverlauf (kurve): x = k·(y − y0)² für y < y0 */
  kurve?: { y0: number; k: number };
  extras?: ('radweg' | 'haltestelle' | 'parkstreifen' | 'auffahrt' | 'schutzstreifen' | 'mittelinsel' | 'baken' | 'schule' | 'wald' | 'laternen' | 'stau' | 'pfuetze' | 'tunnel' | 'feldweg')[];
}
export interface Film {
  id: string; titel: string; dauer: number; poster: number;
  /** Textbeschreibung für Screenreader und als Alternative */
  beschreibung: string;
  welt: FilmWelt;
  /** feste Kamera (x, y) oder Verfolgung des eigenen Fahrzeugs; b = Bildbreite in m, vor = Vorausblick-Anteil */
  kamera?: { x?: number; y?: number; b?: number; vor?: number };
  objekte: FilmObjekt[]; ampeln?: FilmAmpel[]; schilder?: FilmSchild[];
  hinweise?: [number, number, string][];
}
export interface FilmKatalog { hinweis: string; filme: Film[] }
