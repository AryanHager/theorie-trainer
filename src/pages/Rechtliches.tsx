import type { ReactNode } from 'react';
import { ANBIETER, offenePflichtfelder } from '../anbieter';
import { go } from '../router';
import { Topbar } from './Topbar';

/** Wert aus src/anbieter.ts oder deutlich markierter Platzhalter */
function W({ k, text }: { k: keyof typeof ANBIETER; text: string }) {
  const v = ANBIETER[k].trim();
  return v ? <>{v}</> : <mark className="platzhalter">[{text}]</mark>;
}
function VorlageHinweis() {
  if (!offenePflichtfelder().length) return null;
  return (
    <div className="karte hinweis vorlage" role="note" data-testid="vorlage-hinweis">
      <p><b>Vorlage – noch nicht ausgefüllt.</b> Die markierten Platzhalter müssen vor einer Veröffentlichung in <code>src/anbieter.ts</code> ergänzt und die Texte rechtlich geprüft werden. Diese Vorlage ist keine Rechtsberatung.</p>
    </div>
  );
}
function Seite({ titel, testid, children }: { titel: string; testid: string; children: ReactNode }) {
  return (
    <div className="seite">
      <Topbar titel={titel} zurueck="/quellen" />
      <main tabIndex={-1} className="inhalt rechtstext" data-testid={testid}>
        <VorlageHinweis />
        {children}
      </main>
    </div>
  );
}

export function Impressum() {
  return (
    <Seite titel="Impressum" testid="impressum">
      <section className="karte">
        <h2>Angaben gemäß § 5 DDG</h2>
        <p><W k="name" text="Vor- und Nachname" /><br /><W k="strasse" text="Straße und Hausnummer" /><br /><W k="plzOrt" text="PLZ und Ort" /></p>
        <h3>Kontakt</h3>
        <p>E-Mail: <W k="email" text="E-Mail-Adresse" />{ANBIETER.telefon.trim() && <><br />Telefon: {ANBIETER.telefon}</>}</p>
        {ANBIETER.verantwortlichMStV.trim() && <><h3>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h3><p>{ANBIETER.verantwortlichMStV}</p></>}
      </section>
      <section className="karte">
        <h2>Hinweise zum Inhalt</h2>
        <p>Der Theorie-Trainer ist ein Lernangebot mit <b>selbst formulierten Beispielfragen</b> auf Grundlage der Straßenverkehrs-Ordnung und weiterer Vorschriften. Es handelt sich <b>nicht</b> um die amtlichen Prüfungsfragen. Es besteht keine Verbindung zu TÜV, DEKRA oder anderen Prüforganisationen.</p>
        <p>Die Inhalte wurden sorgfältig erstellt; für Richtigkeit, Vollständigkeit und Aktualität wird keine Gewähr übernommen. Maßgeblich sind die geltenden Rechtsvorschriften und der amtliche Fragenkatalog.</p>
        <p>Verkehrszeichen: gemeinfreie amtliche Werke (§ 5 UrhG), Dateien von Wikimedia Commons. Einzelheiten unter <button className="link" onClick={() => go('/quellen')}>Quellen & Hinweise</button>.</p>
      </section>
      <p className="dezent klein-text">Stand: <W k="stand" text="Datum" /> · <button className="link" onClick={() => go('/datenschutz')}>Datenschutzerklärung</button></p>
    </Seite>
  );
}

export function Datenschutz() {
  return (
    <Seite titel="Datenschutzerklärung" testid="datenschutz">
      <section className="karte">
        <h2>1. Verantwortlicher</h2>
        <p>Verantwortlich im Sinne der Datenschutz-Grundverordnung (DSGVO):<br /><W k="name" text="Vor- und Nachname" />, <W k="strasse" text="Straße und Hausnummer" />, <W k="plzOrt" text="PLZ und Ort" /><br />E-Mail: <W k="email" text="E-Mail-Adresse" /></p>
      </section>
      <section className="karte">
        <h2>2. Das Wichtigste in Kürze</h2>
        <ul>
          <li>Keine Registrierung, kein Benutzerkonto.</li>
          <li><b>Keine Cookies</b>, kein Tracking, keine Analyse- oder Werbedienste.</li>
          <li>Keine Inhalte von Drittanbietern: Schriften, Skripte, Bilder und Daten werden ausschließlich vom eigenen Webserver geladen (kein CDN, keine externen Schriftarten).</li>
          <li>Ihr Lernstand bleibt <b>auf Ihrem Gerät</b>. Er wird nicht an uns oder Dritte übertragen.</li>
        </ul>
      </section>
      <section className="karte">
        <h2>3. Bereitstellung der App und Server-Logdateien</h2>
        <p>Beim Aufruf der App überträgt Ihr Browser technisch bedingt Daten an den Webserver: IP-Adresse, Datum und Uhrzeit, aufgerufene Datei, Statuscode, übertragene Datenmenge, Browser- und Betriebssystemangaben (User-Agent) sowie gegebenenfalls die zuvor besuchte Seite (Referrer). Diese Daten werden benötigt, um die App auszuliefern und den Betrieb sicher zu halten (Abwehr von Angriffen, Fehleranalyse).</p>
        <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; das berechtigte Interesse liegt in der sicheren und funktionsfähigen Bereitstellung. Die Logdateien werden nach <W k="logDauer" text="Speicherdauer, z. B. 7 Tagen" /> gelöscht. Eine Zusammenführung mit anderen Daten oder eine Auswertung zu Nutzerprofilen findet nicht statt.</p>
        <p>Hosting: <W k="hoster" text="Name und Anschrift des Hosting-Anbieters" />. Der Hoster verarbeitet die Daten in unserem Auftrag (Art. 28 DSGVO).{ANBIETER.hosterDatenschutz.trim() ? <> Informationen des Hosters: {ANBIETER.hosterDatenschutz}</> : null}</p>
      </section>
      <section className="karte">
        <h2>4. Speicherung auf Ihrem Gerät</h2>
        <p>Damit die App ihre Funktionen erfüllen kann, speichert sie Daten <b>ausschließlich lokal in Ihrem Browser</b>. Wir haben darauf keinen Zugriff; die Daten werden nicht übertragen.</p>
        <ul>
          <li><b>Lokaler Speicher (localStorage) „theorie-trainer:v1“:</b> Lernstand je Frage, markierte Fragen, eigene Notizen, Ergebnisse der Prüfungssimulationen, Tagesziel und Lernserie sowie Ihre Einstellungen (z. B. Klassen, Darstellung, optional ein Vorname für die Begrüßung).</li>
          <li><b>„theorie-trainer:offline“:</b> Zeitpunkt, zu dem Sie die Inhalte für die Offline-Nutzung geladen haben.</li>
          <li><b>Sitzungsspeicher (sessionStorage) „tt-suche“:</b> letzter Suchbegriff; wird beim Schließen des Tabs gelöscht.</li>
          <li><b>Service Worker und Cache-Speicher:</b> Programmdateien, Fragen und Verkehrszeichen, damit die App schneller lädt und offline funktioniert.</li>
        </ul>
        <p>Diese Speicherung ist unbedingt erforderlich, um den von Ihnen gewünschten Dienst bereitzustellen (§ 25 Abs. 2 Nr. 2 TDDDG); eine Einwilligung ist dafür nicht erforderlich. Sie können die Daten jederzeit löschen: in der App unter Statistik → „Lernfortschritt zurücksetzen“ oder vollständig über die Browser-Einstellungen („Websitedaten löschen“).</p>
      </section>
      <section className="karte">
        <h2>5. Vorlesefunktion</h2>
        <p>Die Vorlesefunktion nutzt die Sprachausgabe Ihres Browsers bzw. Betriebssystems und wird nur auf Ihren Wunsch gestartet. Die App bevorzugt Stimmen, die direkt auf dem Gerät arbeiten. Bietet Ihr Browser nur Online-Stimmen an, kann der vorgelesene Fragetext vom Anbieter des Browsers oder Betriebssystems verarbeitet werden; darauf haben wir keinen Einfluss. Die App übermittelt dabei keine weiteren Daten.</p>
      </section>
      <section className="karte">
        <h2>6. Externe Links</h2>
        <p>Die Quellenangaben enthalten Links, z. B. zu Wikimedia Commons. Erst wenn Sie einen solchen Link anklicken, wird die fremde Seite aufgerufen; dort gilt die Datenschutzerklärung des jeweiligen Anbieters.</p>
      </section>
      <section className="karte">
        <h2>7. Ihre Rechte</h2>
        <p>Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (Art. 21). Wenden Sie sich dazu an die oben genannte Kontaktadresse. Außerdem können Sie sich bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO).</p>
      </section>
      <p className="dezent klein-text">Stand: <W k="stand" text="Datum" /> · <button className="link" onClick={() => go('/impressum')}>Impressum</button></p>
    </Seite>
  );
}
