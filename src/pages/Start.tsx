import type { Katalog } from '../types';
import { passtZuKlassen } from '../logic';
import { heute, serieTage, status, useZustand } from '../store';
import { useReife } from '../useReife';
import { go } from '../router';
import { Icon } from '../components/Icon';

export function Start({ kat }: { kat: Katalog }) {
  const z = useZustand();
  const pool = kat.fragen.filter(f => passtZuKlassen(f, z.einstellungen.klassen));
  const sicher = pool.filter(f => status(z.fortschritt[f.id]) === 'sicher').length;
  const falsch = pool.filter(f => status(z.fortschritt[f.id]) === 'falsch').length;
  const reife = useReife(kat, z, 120, [kat, z.fortschritt, z.pruefungen, z.einstellungen.klassen, z.einstellungen.pruefKlasse, z.kalib]);
  const quote = reife ? Math.round(reife.wahrscheinlichkeit * 100) : 0;
  const letzte = z.pruefungen[0];
  const heuteN = z.tage[heute()] ?? 0, ziel = z.einstellungen.tagesziel;
  const serie = serieTage(z.tage, ziel);
  const filme = pool.filter(f => f.medien?.film).length, bilder = pool.filter(f => f.typ === 'bildauswahl').length;
  const notizen = Object.keys(z.notizen).length;
  const kacheln = [
    { t: 'Lernen', d: 'Nach Themen üben', i: 'book', p: '/lernen' },
    { t: 'Effektiv lernen', d: `Schwächen zuerst${falsch + z.markiert.length ? ` · ${falsch + z.markiert.length} offen` : ''}`, i: 'target', p: '/effektiv' },
    { t: 'Prüfung', d: 'Simulation mit Timer', i: 'clock', p: '/pruefung' },
    { t: 'Filmfragen', d: `${filme} animierte Szenen`, i: 'film', p: '/ueben/filme' },
    { t: 'Bildauswahl', d: `${bilder} Fragen mit Bildantworten`, i: 'image', p: '/ueben/bildauswahl' },
    { t: 'Zahlenfragen', d: 'Werte & Faustformeln', i: 'hash', p: '/zahlen' },
    { t: 'Lernplan', d: z.einstellungen.pruefungstermin ? 'Bis zur Prüfung' : 'Tagesziel & Termin', i: 'target', p: '/lernplan' },
    { t: 'Statistik', d: 'Dein Lernfortschritt', i: 'chart', p: '/statistik' },
    { t: 'Verkehrszeichen', d: 'Alle Zeichen nachschlagen', i: 'sign', p: '/zeichen' },
    { t: 'Suche', d: 'Fragen & Zeichen finden', i: 'search', p: '/suche' },
    ...(notizen ? [{ t: 'Meine Notizen', d: `${notizen} Fragen mit Notiz`, i: 'note', p: '/ueben/notizen' }] : []),
  ];
  return (
    <div className="seite start">
      <header className="hero">
        <div className="hero-top">
          <div className="logo"><img src={import.meta.env.BASE_URL + 'icons/icon.svg'} alt="" width={36} height={36} /><span>Theorie-Trainer</span></div>
          <button className="icon-btn hell" onClick={() => go('/einstellungen')} aria-label="Einstellungen"><Icon n="gear" /></button>
        </div>
        <p className="gruss">Hallo{z.einstellungen.name.trim() ? ' ' + z.einstellungen.name.trim() : ''}! Bereit für die nächste Runde?</p>
        <div className="hero-karte">
          <div className="ring" style={{ ['--p' as string]: quote }} role="img" aria-label={reife ? `Prüfungsreife ${quote} Prozent` : 'Prüfungsreife wird berechnet'}><span>{reife ? quote + '%' : '…'}</span></div>
          <div>
            <b>Prüfungsreife</b> <small className="dezent-hell">geschätzte Bestehenschance{reife ? ` · Klasse ${reife.klasse}` : ''}</small>
            <p>{sicher} von {pool.length} Fragen sicher{reife ? ` · im Mittel ~${Math.round(reife.erwarteteFP)} Fehlerpunkte` : ''}</p>
            {letzte && <p className={letzte.bestanden ? 'ok-text' : 'nok-text'}>Letzte Prüfung: {letzte.bestanden ? 'bestanden' : 'nicht bestanden'} ({letzte.fehlerpunkte} FP)</p>}
          </div>
        </div>
      </header>
      <button className="tagesziel" onClick={() => go('/lernplan')} aria-label={`Tagesziel: ${heuteN} von ${ziel} Fragen heute, Lernserie ${serie} Tage`}>
        <span className="tz-balken" aria-hidden="true"><i style={{ width: Math.min(100, (heuteN / ziel) * 100) + '%' }} /></span>
        <span><b>Heute {heuteN}/{ziel}</b> Fragen{heuteN >= ziel ? ' – Tagesziel erreicht!' : ''}</span>
        <span className="serie" title="Tage in Folge mit erreichtem Tagesziel"><Icon n="fire" s={18} /> {serie} {serie === 1 ? 'Tag' : 'Tage'}</span>
      </button>
      <div className="hinweis-banner" role="note"><b>Beispielfragen:</b> Diese Version enthält {kat.fragen.filter(f => !f.variante).length} selbst erstellte Übungsfragen (mit Variationen {kat.fragen.length}) – keine amtlichen Prüfungsfragen.</div>
      <nav className="kacheln">
        {kacheln.map(k => (
          <button key={k.p} className="kachel" onClick={() => go(k.p)}>
            <span className="kachel-icon"><Icon n={k.i} s={26} /></span>
            <span className="kachel-t">{k.t}</span><span className="kachel-d">{k.d}</span>
          </button>
        ))}
      </nav>
      <footer className="start-fuss"><button className="link" onClick={() => go('/quellen')}>Quellen</button> · <button className="link" onClick={() => go('/impressum')}>Impressum</button> · <button className="link" onClick={() => go('/datenschutz')}>Datenschutz</button></footer>
    </div>
  );
}
