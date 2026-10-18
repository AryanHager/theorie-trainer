import type { Katalog } from '../types';
import { passtZuKlassen } from '../logic';
import { einstellungSetzen, status, useZustand } from '../store';
import { go } from '../router';
import { Topbar } from './Topbar';

export function KapitelListe({ kat }: { kat: Katalog }) {
  const z = useZustand();
  const pool = kat.fragen.filter(f => passtZuKlassen(f, z.einstellungen.klassen) && (z.einstellungen.variationen || !f.variante));
  const nVar = kat.fragen.filter(f => passtZuKlassen(f, z.einstellungen.klassen) && f.variante).length;
  return (
    <div className="seite">
      <Topbar titel="Lernen nach Themen" zurueck="/" />
      <main tabIndex={-1} className="inhalt liste">
        <label className="schalter-zeile karte variationen-schalter"><span><b>Variationen</b> <small className="dezent">{z.einstellungen.variationen ? `${nVar} Variationen werden mitgeübt` : 'nur Mutterfragen'}</small></span>
          <input type="checkbox" role="switch" data-testid="variationen-lernen" checked={z.einstellungen.variationen} onChange={x => einstellungSetzen('variationen', x.target.checked)} /></label>
        <button className="zeile" onClick={() => go('/lernen/alle')}>
          <div><b>Alle Fragen</b><small>{pool.length} Fragen</small></div><span className="pfeil">›</span>
        </button>
        {(['grundstoff', 'zusatzstoff'] as const).map(stoff => {
          const anz = pool.filter(f => f.stoff === stoff).length; if (!anz) return null;
          return (<section key={stoff} className="kap-gruppe" aria-label={stoff === 'grundstoff' ? 'Grundstoff' : 'Zusatzstoff'}>
          <h2 className="gruppen-titel">{stoff === 'grundstoff' ? 'Grundstoff' : `Zusatzstoff (Klasse ${z.einstellungen.klassen.join(', ')})`} <small>{anz} Fragen</small></h2>
            {kat.kapitel.filter(k => (k.stoff ?? 'grundstoff') === stoff).map(k => {
            const fr = pool.filter(f => f.kapitel === k.id); if (!fr.length) return null;
            const s = fr.filter(f => status(z.fortschritt[f.id]) === 'sicher').length;
            const e = fr.filter(f => status(z.fortschritt[f.id]) === 'einmal').length;
            const fa = fr.filter(f => status(z.fortschritt[f.id]) === 'falsch').length;
            return (
              <button key={k.id} data-kapitel={k.id} className="zeile" onClick={() => go('/lernen/' + k.id)}>
                <div className="zeile-text">
                  <b><span className="kap-nr">{k.id}</span> {k.titel}</b><small>{fr.length} Fragen{k.beschreibung ? ' · ' + k.beschreibung : ''}</small>
                  <div className="balken mehrfach" aria-label={`${s} sicher, ${e} einmal richtig, ${fa} falsch`}>
                    <i className="sicher" style={{ width: (s / fr.length) * 100 + '%' }} />
                    <i className="einmal" style={{ width: (e / fr.length) * 100 + '%' }} />
                    <i className="falsch" style={{ width: (fa / fr.length) * 100 + '%' }} />
                  </div>
                </div>
                <span className="pfeil">›</span>
              </button>
            );
          })}
          </section>);
        })}
      </main>
    </div>
  );
}
