import type { Katalog } from '../types';
import { passtZuKlassen } from '../logic';
import { einstellungSetzen, heute, serieTage, status, useZustand } from '../store';
import { useReife } from '../useReife';
import { go } from '../router';
import { Topbar } from './Topbar';
import { Icon } from '../components/Icon';

const TAG = 86400000;
export function Lernplan({ kat }: { kat: Katalog }) {
  const z = useZustand();
  const e = z.einstellungen;
  const pool = kat.fragen.filter(f => passtZuKlassen(f, e.klassen) && (e.variationen || !f.variante));
  const offen = pool.filter(f => status(z.fortschritt[f.id]) !== 'sicher').length;
  const neu = pool.filter(f => status(z.fortschritt[f.id]) === 'neu').length;
  const heuteN = z.tage[heute()] ?? 0;
  const serie = serieTage(z.tage, e.tagesziel);
  const reife = useReife(kat, z, 120, [kat, z.fortschritt, z.kalib, z.pruefungen]);
  const termin = e.pruefungstermin ? new Date(e.pruefungstermin + 'T00:00:00') : null;
  const tageBis = termin ? Math.max(0, Math.ceil((termin.getTime() - new Date(heute() + 'T00:00:00').getTime()) / TAG)) : null;
  // Faustregel (Annahme): jede offene Frage braucht im Schnitt etwa 2,5 Antworten, bis sie „sicher“ ist;
  // die letzten 2 Tage vor der Prüfung sind für Prüfungssimulationen reserviert.
  const lernTage = tageBis !== null ? Math.max(1, tageBis - 2) : null;
  const empfohlen = lernTage ? Math.max(10, Math.ceil((offen * 2.5) / lernTage)) : null;
  const letzte14 = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); const k = heute(d); return { k, n: z.tage[k] ?? 0, wt: d.toLocaleDateString('de-DE', { weekday: 'short' }) }; });
  const max = Math.max(e.tagesziel, ...letzte14.map(x => x.n));
  return (
    <div className="seite">
      <Topbar titel="Lernplan" zurueck="/" />
      <main tabIndex={-1} className="inhalt">
        <section className="karte">
          <h2>Tagesziel</h2>
          <div className="lp-heute"><b data-testid="lp-heute">{heuteN}</b> von {e.tagesziel} Fragen heute <span className="serie"><Icon n="fire" s={18} /> {serie} {serie === 1 ? 'Tag' : 'Tage'} in Folge</span></div>
          <div className="segment" role="radiogroup" aria-label="Tagesziel">
            {[10, 20, 30, 50, 80].map(n => <button key={n} role="radio" aria-checked={e.tagesziel === n} className={e.tagesziel === n ? 'an' : ''} onClick={() => einstellungSetzen('tagesziel', n)}>{n}</button>)}
          </div>
          <div className="lp-chart" role="img" aria-label="Beantwortete Fragen der letzten 14 Tage">
            {letzte14.map(x => <div key={x.k} className={'lp-tag' + (x.n >= e.tagesziel ? ' erreicht' : '')} title={`${x.k}: ${x.n}`}><i style={{ height: (x.n / max) * 100 + '%' }} /><small>{x.wt.slice(0, 2)}</small></div>)}
            <span className="lp-ziel" style={{ bottom: `calc(${(e.tagesziel / max) * 100}% * 0.82 + 18px)` }} aria-hidden="true" />
          </div>
        </section>
        <section className="karte">
          <h2>Prüfungstermin</h2>
          <label className="schalter-zeile"><span>Datum der Theorieprüfung</span>
            <input type="date" value={e.pruefungstermin ?? ''} min={heute()} onChange={x => einstellungSetzen('pruefungstermin', x.target.value || undefined)} data-testid="termin" /></label>
          {tageBis !== null ? <>
            <p data-testid="lp-plan">Noch <b>{tageBis} {tageBis === 1 ? 'Tag' : 'Tage'}</b>. Offen (nicht sicher): <b>{offen}</b> Fragen, davon {neu} neu.</p>
            <p>Empfehlung: etwa <b>{empfohlen} Fragen pro Tag</b>{empfohlen! > e.tagesziel ? <> – mehr als Ihr Tagesziel. <button className="link" onClick={() => einstellungSetzen('tagesziel', [10, 20, 30, 50, 80].find(n => n >= empfohlen!) ?? 80)}>Tagesziel anpassen</button></> : ' – Ihr Tagesziel reicht aus.'}</p>
            <ol className="lp-schritte">
              <li>Bis {tageBis > 2 ? `${tageBis - 2} Tage vor der Prüfung` : 'kurz vor der Prüfung'}: täglich „Effektiv lernen“ (Schwächen zuerst) und alle Kapitel einmal durcharbeiten.</li>
              <li>Ab der letzten Woche: täglich mindestens eine Prüfungssimulation.</li>
              <li>Die letzten 2 Tage: nur noch Simulationen und markierte/falsche Fragen.</li>
            </ol>
            <p className="dezent klein-text">Annahme: Eine offene Frage braucht im Schnitt etwa 2,5 Antworten, bis sie sicher sitzt.</p>
          </> : <p className="dezent">Tragen Sie Ihren Termin ein, um eine Tagesempfehlung zu erhalten.</p>}
        </section>
        {reife && <section className="karte">
          <h2>Prüfungsreife</h2>
          <p><b data-testid="reife">{Math.round(reife.wahrscheinlichkeit * 100)} %</b> geschätzte Bestehenschance (Klasse {reife.klasse}), im Mittel ~{Math.round(reife.erwarteteFP)} Fehlerpunkte.</p>
          <p className="dezent klein-text">Berechnet aus {120} simulierten Prüfungen nach den Ziehungsregeln. Trefferquoten je Lernstatus (mit Ihren Antworten kalibriert): neu {Math.round(reife.p.neu * 100)} %, falsch {Math.round(reife.p.falsch * 100)} %, 1× richtig {Math.round(reife.p.einmal * 100)} %, sicher {Math.round(reife.p.sicher * 100)} %{reife.ausPruefungen !== null ? `; mit Ihren letzten Simulationen verrechnet (${Math.round(reife.ausPruefungen * 100)} % bestanden)` : ''}.</p>
          <div className="modal-aktionen"><button className="btn primaer" onClick={() => go('/effektiv')}>Jetzt lernen</button><button className="btn ghost" onClick={() => go('/pruefung')}>Prüfung simulieren</button></div>
        </section>}
      </main>
    </div>
  );
}
