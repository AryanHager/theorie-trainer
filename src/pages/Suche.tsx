import { useMemo, useState } from 'react';
import type { Katalog } from '../types';
import { useVolleFragen } from '../katalog';
import { medienUrl, passtZuKlassen } from '../logic';
import { status, STATUS_TEXT, useZustand } from '../store';
import { go } from '../router';
import { Topbar } from './Topbar';
import { normSuche as norm, schildPasst, useSchilder } from '../schilder';

export function Suche({ kat }: { kat: Katalog }) {
  const z = useZustand();
  const { m } = useSchilder();
  const [q, setQ] = useState(() => sessionStorage.getItem('tt-suche') ?? '');
  const [alleZeichen, setAlleZeichen] = useState(false);
  const [alleIds] = useState(() => kat.fragen.map(f => f.id));
  const { fragen: alle } = useVolleFragen(kat, alleIds);
  const aktiv = q.trim().length >= 2;
  const treffer = useMemo(() => {
    if (!aktiv) return [];
    const teile = norm(q.trim()).split(/\s+/);
    const zName = (nr: string) => m?.schilder.find(s => s.nr === nr)?.name ?? '';
    return (alle ?? []).filter(f => passtZuKlassen(f, z.einstellungen.klassen)).filter(f => {
      const h = norm([f.id, f.text, f.erklaerung, ...(f.antworten?.map(a => a.text) ?? []), ...(f.zeichen ?? []).flatMap(n => ['zeichen ' + n, zName(n)])].join(' '));
      return teile.every(x => h.includes(x));
    });
  }, [q, aktiv, alle, z.einstellungen.klassen, m]);
  const zeichen = useMemo(() => aktiv && m ? m.schilder.filter(s => schildPasst(s, q)) : [], [aktiv, m, q]);
  const zeigeZeichen = alleZeichen ? zeichen : zeichen.slice(0, 12);
  return (
    <div className="seite">
      <Topbar titel="Suche" zurueck="/" />
      <main tabIndex={-1} className="inhalt">
        <input className="suchfeld" type="search" autoFocus placeholder="Suchbegriff, z. B. „Kreisverkehr“ oder „283“" value={q} onChange={e => { setQ(e.target.value); sessionStorage.setItem('tt-suche', e.target.value); }} aria-label="Fragen und Zeichen durchsuchen" />
        {aktiv && <p className="dezent">{treffer.length} Fragen · {zeichen.length} Verkehrszeichen</p>}
        {zeichen.length > 0 && (
          <section className="such-abschnitt">
            <h2>Verkehrszeichen</h2>
            <ul className="zeichen-grid kompakt">
              {zeigeZeichen.map(s => (
                <li key={s.nr}><button className="zeichen-kachel" onClick={() => go('/zeichen/' + encodeURIComponent(s.nr))} aria-label={`Zeichen ${s.nr}: ${s.name}`}>
                  <span className="zeichen-bild"><img src={medienUrl(s.datei)!} alt="" loading="lazy" /></span><b>{s.nr}</b><small>{s.name}</small>
                </button></li>
              ))}
            </ul>
            {zeichen.length > 12 && !alleZeichen && <button className="btn ghost" onClick={() => setAlleZeichen(true)}>Alle {zeichen.length} Zeichen anzeigen</button>}
          </section>
        )}
        {treffer.length > 0 && <h2>Fragen</h2>}
        <ul className="liste-einfach">
          {treffer.map(f => (
            <li key={f.id}><button className="zeile" onClick={() => go('/frage/' + f.id)}>
              {f.medien?.bild?.startsWith('signs/') && <img className="zeile-zeichen" src={medienUrl(f.medien.bild)!} alt="" loading="lazy" />}
              <div className="zeile-text"><b className="zweizeilig">{f.text}</b><small>{kat.kapitel.find(k => k.id === f.kapitel)?.titel}{f.zeichen ? ' · Zeichen ' + f.zeichen.join(' + ') : ''} · {f.punkte} Punkte · {STATUS_TEXT[status(z.fortschritt[f.id])]}</small></div><span className="pfeil">›</span>
            </button></li>
          ))}
        </ul>
      </main>
    </div>
  );
}
