import type { Katalog } from '../types';
import { useSchilder } from '../schilder';
import { Topbar } from './Topbar';
import { go } from '../router';

export function Quellen({ kat }: { kat: Katalog }) {
  const { m } = useSchilder();
  return (
    <div className="seite">
      <Topbar titel="Quellen & Hinweise" zurueck="/" />
      <main tabIndex={-1} className="inhalt">
        <section className="karte">
          <h2>Verkehrszeichen</h2>
          <p>Die Abbildungen der Verkehrszeichen stammen von <a href="https://commons.wikimedia.org/wiki/Category:SVG_road_signs_in_Germany" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>.</p>
          <p>Amtliche Verkehrszeichen nach der Straßenverkehrs-Ordnung (StVO) und dem Verkehrszeichenkatalog (VzKat) sind als amtliche Werke <b>gemeinfrei</b> (§ 5 Abs. 1 UrhG). Verwendet werden nur Dateien mit den Commons-Lizenzvorlagen <i>PD-VzKat</i> bzw. <i>PD-Vz historisch</i> (Letzteres nur für Zeichen, die im aktuellen Katalog weiterhin gültig sind).</p>
          {m && <p className="dezent">{m.schilder.length} Zeichen · Stand des Abrufs: {new Date(m.abgerufen).toLocaleDateString('de-DE')}. Zu jedem Zeichen ist die Commons-Quelldatei in der Zeichen-Übersicht verlinkt.</p>}
        </section>
        <section className="karte">
          <h2>Fragen & Grafiken</h2>
          <p>Alle Fragen sind <b>Beispielfragen</b> – eigene Formulierungen auf Grundlage der StVO. Es handelt sich nicht um amtliche Prüfungsfragen. Situationsgrafiken (Kreuzungen u. a.) sind selbst gezeichnet.</p>
          <p>Ebenfalls <b>eigene Darstellungen</b> dieses Projekts (keine amtlichen Abbildungen): die schematischen Zeichnungen der Fahrbahnmarkierungen (Zeichen 293–299), des Grünpfeils, der Wechsel- und Dauerlichtzeichen sowie der Zeichen von Polizeibeamten – in der Zeichen-Übersicht mit „Eigene Zeichnung“ markiert – und alle animierten Szenen der Filmfragen (eigene SVG-Animationen).</p>
          <p>Die Variationen sind eigene Abwandlungen der eigenen Beispielfragen. Rechtsstand und Faktenprüfung: StVO, StVZO und FeV in der aktuellen Fassung (gesetze-im-internet.de).</p>
          <p className="dezent">Fragenkatalog: {kat.meta.titel}, Version {kat.meta.version}. Ohne Gewähr – maßgeblich sind StVO und amtlicher Fragenkatalog.</p>
        </section>
        <section className="karte">
          <h2>Impressum & Datenschutz</h2>
          <p><button className="link" onClick={() => go('/impressum')}>Impressum</button> · <button className="link" onClick={() => go('/datenschutz')}>Datenschutzerklärung</button></p>
          <p className="dezent">Lernstand und Einstellungen werden nur lokal im Browser gespeichert. Keine Cookies, kein Tracking, keine Inhalte von Drittanbietern.</p>
        </section>
      </main>
    </div>
  );
}
