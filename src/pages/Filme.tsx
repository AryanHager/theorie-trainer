import { useEffect, useState } from 'react';
import type { FilmKatalog, Katalog } from '../types';
import { filmeLaden, FilmPlayer } from '../film/FilmPlayer';
import { go } from '../router';
import { Topbar } from './Topbar';

/** Übersicht aller eigenen Filmszenen mit Sprung zu den zugehörigen Fragen */
export function Filme({ kat }: { kat: Katalog }) {
  const [k, setK] = useState<FilmKatalog | null>(null);
  const [akt, setAkt] = useState<string | null>(null);
  useEffect(() => { filmeLaden().then(setK).catch(() => setK({ hinweis: '', filme: [] })); }, []);
  if (!k) return <div className="seite"><Topbar titel="Filmszenen" zurueck="/" /><div className="leer"><div className="lade" aria-label="Lädt" /></div></div>;
  return (
    <div className="seite">
      <Topbar titel="Filmszenen" zurueck="/" />
      <main tabIndex={-1} className="inhalt">
        <p className="dezent">{k.filme.length} eigene animierte Szenen (schematische Draufsicht). {k.hinweis}</p>
        <button className="btn primaer" onClick={() => go('/ueben/filme')}>Alle Filmfragen üben</button>
        <ul className="film-liste">
          {k.filme.map(f => {
            const fr = kat.fragen.filter(q => q.medien?.film === f.id);
            return (
              <li key={f.id} className="karte">
                <h3>{f.titel}</h3>
                {akt === f.id ? <FilmPlayer film={f} /> : <button className="btn ghost" onClick={() => setAkt(f.id)}>Szene laden</button>}
                <p className="dezent klein-text">{fr.length} {fr.length === 1 ? 'Frage' : 'Fragen'}: {fr.map(q => <button key={q.id} className="link" onClick={() => go('/frage/' + q.id)}>{q.id}</button>)}</p>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
