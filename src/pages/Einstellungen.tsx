import { useState } from 'react';
import type { Katalog } from '../types';
import { allesVorladen, type OfflineStand } from '../offline';
import { hilfeOeffnen } from '../tasten';
import { KLASSEN_INFO } from '../logic';
import { einstellungSetzen, useZustand } from '../store';
import { sprachausgabeVerfuegbar, vorlesen } from '../media';
import { Topbar } from './Topbar';

export function Einstellungen({ kat }: { kat: Katalog }) {
  const { einstellungen: e } = useZustand();
  const [off, setOff] = useState<OfflineStand | null>(null);
  const [offFehler, setOffFehler] = useState<string | null>(null);
  const zuletzt = localStorage.getItem('theorie-trainer:offline');
  const vorladen = () => { setOffFehler(null); allesVorladen(setOff).catch(x => { setOff(null); setOffFehler(x.message); }); };
  const varianten = kat.fragen.filter(f => f.variante).length;
  const klasseToggle = (id: string) => {
    const neu = e.klassen.includes(id) ? e.klassen.filter(k => k !== id) : [...e.klassen, id];
    if (neu.length) einstellungSetzen('klassen', neu);
  };
  return (
    <div className="seite">
      <Topbar titel="Einstellungen" zurueck="/" />
      <main tabIndex={-1} className="inhalt">
        <section className="karte">
          <h2>Führerscheinklassen</h2>
          <p className="dezent">Mehrfachauswahl möglich – geübt werden alle Fragen der gewählten Klassen. Die Prüfungssimulation fragt jeweils eine Klasse ab.</p>
          <div className="klassen-wahl">
            {KLASSEN_INFO.filter(k => !kat.meta.klassen || kat.meta.klassen.includes(k.id)).map(k => {
              const n = kat.fragen.filter(f => f.klassen.includes(k.id)).length;
              return (
                <button key={k.id} data-klasse={k.id} className={'klasse' + (e.klassen.includes(k.id) ? ' an' : '')} aria-pressed={e.klassen.includes(k.id)} onClick={() => klasseToggle(k.id)}>
                  <b>{k.id}</b><span>{k.d}</span><small>{n} Fragen</small>
                </button>
              );
            })}
          </div>
          {(kat.meta.pruefung?.ohneTheorie?.length ?? 0) > 0 && (
            <details className="info-klappe" data-testid="ohne-theorie">
              <summary>BE, C1E, D1E, DE und L – was gilt für die Theorie?</summary>
              <p className="dezent klein-text">Für die Erweiterung auf diese Anhängerklassen ist <b>nur eine praktische Prüfung</b> vorgeschrieben – eine eigene Theorieprüfung gibt es nicht (FeV § 15 Abs. 2). Deshalb bietet die App dafür keine Prüfungssimulation an:</p>
              <ul className="klein-text">
                {kat.meta.pruefung!.ohneTheorie!.map(k => <li key={k.klasse}><b>{k.klasse}</b>: {k.text} (Voraussetzung: Klasse {k.voraussetzung}, FeV § 9 Abs. 2)</li>)}
              </ul>
              {kat.meta.pruefung?.nurTheorie?.includes('L') && <p className="dezent klein-text">Umgekehrt genügt für die <b>Klasse L</b> eine theoretische Prüfung, eine praktische Prüfung ist nicht vorgesehen (FeV § 15 Abs. 2). Die Klasse CE hat dagegen eine eigene Theorieprüfung (Erweiterung, 30 Fragen).</p>}
            </details>
          )}
        </section>
        <section className="karte">
          <h2>Lernen</h2>
          <label className="schalter-zeile"><span>Variationen einbeziehen <small className="dezent">({varianten} abgewandelte Fassungen von Mutterfragen)</small></span><input type="checkbox" role="switch" data-testid="variationen" checked={e.variationen} onChange={x => einstellungSetzen('variationen', x.target.checked)} /></label>
          <label className="schalter-zeile"><span>Tagesziel (Fragen pro Tag)</span>
            <select value={e.tagesziel} onChange={x => einstellungSetzen('tagesziel', +x.target.value)}>{[10, 20, 30, 50, 80].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
        </section>
        <section className="karte">
          <h2>Filmfragen</h2>
          <label className="schalter-zeile"><span>Abspielungen je Szene in der Prüfung</span>
            <select value={e.filmMax} data-testid="filmmax" onChange={x => einstellungSetzen('filmMax', +x.target.value)}>{[1, 2, 3, 4, 5, 6, 8, 10].map(n => <option key={n} value={n}>{n}×</option>)}</select></label>
          <label className="schalter-zeile"><span>Antworten erst nach vollständigem Ansehen freigeben</span><input type="checkbox" role="switch" checked={e.filmErstAnsehen} onChange={x => einstellungSetzen('filmErstAnsehen', x.target.checked)} /></label>
          <p className="dezent klein-text">Annahme: In der echten Prüfung ist die Zahl der Abspielungen begrenzt (hier Standard 5×). Prüfen Sie die aktuellen Regeln bei Ihrer Prüfstelle.</p>
        </section>
        <section className="karte">
          <h2>Darstellung</h2>
          <div className="segment" role="radiogroup" aria-label="Farbschema">
            {([['auto', 'Automatisch'], ['hell', 'Hell'], ['dunkel', 'Dunkel']] as const).map(([v, t]) => (
              <button key={v} role="radio" aria-checked={e.theme === v} className={e.theme === v ? 'an' : ''} onClick={() => einstellungSetzen('theme', v)}>{t}</button>
            ))}
          </div>
          <label className="schalter-zeile"><span>Hoher Kontrast</span><input type="checkbox" role="switch" data-testid="kontrast" checked={e.kontrast} onChange={x => einstellungSetzen('kontrast', x.target.checked)} /></label>
          <label className="schalter-zeile"><span>Größere Schrift</span><input type="checkbox" role="switch" checked={e.grosseSchrift} onChange={x => einstellungSetzen('grosseSchrift', x.target.checked)} /></label>
          <button className="btn ghost" onClick={hilfeOeffnen}>Tastenkürzel anzeigen <kbd>?</kbd></button>
        </section>
        <section className="karte">
          <h2>Offline nutzen</h2>
          <p className="dezent">Lädt alle Verkehrszeichen, Grafiken und Szenen auf dieses Gerät, damit die App ohne Internet vollständig funktioniert.</p>
          {off?.laeuft && <div role="progressbar" aria-label="Offline-Download" aria-valuemin={0} aria-valuemax={off.gesamt} aria-valuenow={off.fertig} className="balken"><i className="sicher" style={{ width: (off.fertig / Math.max(1, off.gesamt)) * 100 + '%' }} /></div>}
          {off && <p aria-live="polite" data-testid="offline-stand">{off.laeuft ? `${off.fertig} von ${off.gesamt} Dateien …` : `Fertig: ${off.fertig - off.fehler} von ${off.gesamt} Dateien gespeichert${off.fehler ? `, ${off.fehler} Fehler` : ''}.`}</p>}
          {offFehler && <p className="nok-text">{offFehler}</p>}
          {!off && zuletzt && <p className="dezent klein-text">Zuletzt vollständig gespeichert: {new Date(+zuletzt).toLocaleString('de-DE')}</p>}
          <button className="btn primaer" onClick={vorladen} disabled={!!off?.laeuft} data-testid="offline-btn"><span>Alle Medien offline speichern</span></button>
        </section>
        <section className="karte">
          <h2>Persönlich</h2>
          <label className="feld-zeile"><span>Vorname für die Begrüßung (optional)</span>
            <input type="text" className="eingabe" value={e.name} maxLength={30} autoComplete="given-name" placeholder="z. B. Alex" onChange={x => einstellungSetzen('name', x.target.value)} data-testid="name-eingabe" /></label>
          <p className="dezent klein-text">Wird nur auf diesem Gerät gespeichert.</p>
        </section>
        <section className="karte">
          <h2>Ton & Sprache</h2>
          <label className="schalter-zeile"><span>Töne bei richtig/falsch</span><input type="checkbox" role="switch" checked={e.ton} onChange={x => einstellungSetzen('ton', x.target.checked)} /></label>
          <label className="schalter-zeile"><span>Vorlesefunktion{!sprachausgabeVerfuegbar && ' (vom Browser nicht unterstützt)'}</span><input type="checkbox" role="switch" checked={e.vorlesen} disabled={!sprachausgabeVerfuegbar} onChange={x => einstellungSetzen('vorlesen', x.target.checked)} /></label>
          <label className="schalter-zeile"><span>Fragen automatisch vorlesen</span><input type="checkbox" role="switch" checked={e.autoVorlesen} disabled={!e.vorlesen || !sprachausgabeVerfuegbar} onChange={x => einstellungSetzen('autoVorlesen', x.target.checked)} /></label>
          {sprachausgabeVerfuegbar && e.vorlesen && <button className="btn ghost" onClick={() => vorlesen(`Hallo${e.name.trim() ? ' ' + e.name.trim() : ''}, so klingt die Vorlesefunktion.`)}>Probe anhören</button>}
        </section>
        <section className="karte dezent-karte">
          <h2>Über diese App</h2>
          <p>Theorie-Trainer (Arbeitstitel) · Fragenkatalog: <b>{kat.meta.titel}</b>, Version {kat.meta.version}</p>
          <p className="dezent">{kat.meta.hinweis}</p>
          <p className="dezent">Alle Lerndaten bleiben lokal auf diesem Gerät (localStorage) – keine Cookies, kein Tracking.</p>
          <p className="dezent">Verkehrszeichen: Wikimedia Commons, gemeinfrei (§ 5 UrhG). <a href="#/quellen">Quellen</a> · <a href="#/impressum">Impressum</a> · <a href="#/datenschutz">Datenschutz</a></p>
        </section>
      </main>
    </div>
  );
}
