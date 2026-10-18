// ─────────────────────────────────────────────────────────────────────────────
// Angaben für Impressum und Datenschutzerklärung – VOR EINER VERÖFFENTLICHUNG AUSFÜLLEN.
// Leere Felder erscheinen in der App als markierter Platzhalter; `npm run vorlage-check`
// meldet alle noch offenen Pflichtfelder. Bitte keine Angaben erfinden.
// ─────────────────────────────────────────────────────────────────────────────
export const ANBIETER = {
  /** Vor- und Nachname (bzw. Firma mit Rechtsform) */
  name: '',
  /** Straße und Hausnummer (ladungsfähige Anschrift, kein Postfach) */
  strasse: '',
  /** Postleitzahl und Ort */
  plzOrt: '',
  /** E-Mail-Adresse für schnelle Kontaktaufnahme */
  email: '',
  /** optional: Telefonnummer */
  telefon: '',
  /** optional, nur bei journalistisch-redaktionellen Inhalten (§ 18 Abs. 2 MStV): verantwortliche Person mit Anschrift */
  verantwortlichMStV: '',
  /** Hosting-Anbieter (Name, Anschrift) – z. B. „Beispiel GmbH, Musterstraße 1, 12345 Musterstadt“ */
  hoster: '',
  /** Link zur Datenschutzerklärung bzw. zum Auftragsverarbeitungsvertrag des Hosters */
  hosterDatenschutz: '',
  /** Speicherdauer der Server-Logdateien beim Hoster (z. B. „7 Tagen“) */
  logDauer: '',
  /** Stand der Texte */
  stand: '',
};
export const PFLICHT: (keyof typeof ANBIETER)[] = ['name', 'strasse', 'plzOrt', 'email', 'hoster', 'logDauer', 'stand'];
export const offenePflichtfelder = () => PFLICHT.filter(k => !ANBIETER[k].trim());
