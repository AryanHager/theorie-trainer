import { useEffect, useRef, useState } from 'react';
import type { Eingabe, Frage } from '../types';
import { medienUrl, zahlFormat } from '../logic';
import { Lightbox } from './Lightbox';
import { Icon } from './Icon';
import { FilmPlayer, useFilm } from '../film/FilmPlayer';
import { notizSetzen, useZustand } from '../store';

export const BUCHSTABEN = ['A', 'B', 'C', 'D'];

interface Props {
  frage: Frage; eingabe?: Eingabe; onChange: (e: Eingabe) => void;
  aufgedeckt?: boolean; erklaerung?: boolean; kapitelTitel?: string; gesperrt?: boolean;
  modus?: 'lernen' | 'pruefung';
  /** Filmfragen in der Prüfung */
  filmAbgespielt?: number; filmMax?: number; filmGesehen?: boolean; onFilmStart?: () => void; onFilmEnde?: () => void;
  /** Notizfeld anzeigen (Lernmodus) */
  notiz?: boolean; notizOffen?: boolean; onNotizOffen?: (o: boolean) => void;
}
export function FrageAnsicht(p: Props) {
  const { frage: f, eingabe, onChange, aufgedeckt, erklaerung, kapitelTitel, gesperrt, modus = 'lernen' } = p;
  const z = useZustand();
  const [gross, setGross] = useState<string | null>(null);
  const [gesehenLokal, setGesehenLokal] = useState(false);
  const bild = medienUrl(f.medien?.bild), video = medienUrl(f.medien?.video);
  const { film, fehler: filmFehler } = useFilm(f.medien?.film);
  const zusatz = (f.medien?.zusatzbilder ?? []).map(x => medienUrl(x)!).filter(Boolean);
  const istZeichen = !!f.medien?.bild?.startsWith('signs/');
  const auswahl = Array.isArray(eingabe) ? eingabe : [];
  const gesehen = p.filmGesehen ?? gesehenLokal;
  const filmSperre = !!f.medien?.film && z.einstellungen.filmErstAnsehen && !gesehen && !aufgedeckt;
  const sperre = gesperrt || filmSperre;
  const toggle = (i: number) => { if (aufgedeckt || sperre) return; onChange(auswahl.includes(i) ? auswahl.filter(x => x !== i) : [...auswahl, i].sort()); };
  const hatMedien = !!(bild || video || f.medien?.film);

  return (
    <article className={'frage' + (hatMedien ? ' mit-medien' : '') + (f.typ === 'bildauswahl' ? ' bildauswahl' : '')} data-typ={f.typ} data-frage={f.id}>
      <div className="frage-meta">
        {kapitelTitel && <span className="chip">{kapitelTitel}</span>}
        <span className="chip punkte" title="Fehlerpunkte bei falscher Antwort">{f.punkte} Punkte</span>
        <span className="chip">Klasse {f.klassen.join(', ')}</span>
        {f.medien?.film && <span className="chip film-chip">Filmfrage</span>}
        {f.typ === 'bildauswahl' && <span className="chip">Bildauswahl</span>}
        {(f.variante ?? 0) > 0 && <span className="chip" title="Variante einer Mutterfrage">Variation</span>}
        {f.beispiel && <span className="chip beispiel">Beispielfrage</span>}
      </div>
      {hatMedien && (
        <div className="medien">
          {f.medien?.film ? (film ? <FilmPlayer film={film} modus={modus} maxAbspielungen={modus === 'pruefung' ? p.filmMax : undefined} abgespielt={p.filmAbgespielt}
              onStart={p.onFilmStart} onEnde={() => { setGesehenLokal(true); p.onFilmEnde?.(); }} />
            : <div className="film film-lade" role="status"><div className="film-buehne film-lade-buehne">{filmFehler ? 'Szene konnte nicht geladen werden.' : 'Szene wird geladen …'}</div><div className="film-lade-platz" aria-hidden="true" /></div>)
          : video ? <video src={video} poster={medienUrl(f.medien?.poster) ?? undefined} controls playsInline />
          : <button className={'bild-btn' + (istZeichen ? ' zeichen' : '')} onClick={() => setGross(bild)} aria-label="Bild vergrößern">
              <span className="bild-stapel">
                <img src={bild!} alt={f.medien?.bildAlt ?? ''} decoding="async" fetchPriority="high" />
                {zusatz.map(x => <img key={x} src={x} alt="Zusatzzeichen" className="zusatz" decoding="async" />)}
              </span>
              <span className="zoom-hint"><Icon n="zoom" s={18} /></span>
            </button>}
        </div>
      )}
      <div className="frage-inhalt">
        <h2 className="frage-text" id={'ft-' + f.id}>{f.text}</h2>
        {filmSperre && <p className="film-sperre" role="status">Bitte sehen Sie sich zuerst die Szene vollständig an – danach können Sie antworten.</p>}
        {f.typ === 'zahl' ? (
          <div className="zahl-eingabe">
            <label>
              <span className="sr">Antwort</span>
              <input inputMode="decimal" value={typeof eingabe === 'string' ? eingabe : ''} disabled={aufgedeckt || gesperrt}
                onChange={e => onChange(e.target.value.replace(/[^0-9.,-]/g, ''))} placeholder="Zahl eingeben" aria-describedby={'ft-' + f.id}
                className={aufgedeckt ? 'aufgedeckt' : ''} />
              {f.zahl?.einheit && <span className="einheit">{f.zahl.einheit}</span>}
            </label>
            {aufgedeckt && <p className="loesung">Richtig: <b>{zahlFormat(f.zahl!.wert)} {f.zahl!.einheit}</b></p>}
          </div>
        ) : (
          <ul className={f.typ === 'bildauswahl' ? 'antworten bild-antworten' : 'antworten'} aria-labelledby={'ft-' + f.id}>
            {f.antworten!.map((a, i) => {
              const an = auswahl.includes(i);
              const cls = ['antwort', an && 'an', aufgedeckt && a.richtig && 'richtig', aufgedeckt && an && !a.richtig && 'falsch', aufgedeckt && !an && a.richtig && 'fehlt'].filter(Boolean).join(' ');
              const status = aufgedeckt ? (a.richtig ? (an ? ' – richtig angekreuzt' : ' – richtig, nicht angekreuzt') : an ? ' – falsch angekreuzt' : '') : '';
              return (
                <li key={i}>
                  {a.bild ? (
                    <button className={cls + ' bild-antwort'} onClick={() => toggle(i)} aria-pressed={an} disabled={sperre && !aufgedeckt}
                      aria-label={`Abbildung ${BUCHSTABEN[i]}${aufgedeckt ? ': ' + a.text : ''}${status}`}>
                      <span className="bild-kopf"><span className="box">{an && <Icon n="check" s={16} />}</span><b>{BUCHSTABEN[i]}</b>
                        <span className="lupe" aria-hidden="true" title="Vergrößern" onClick={e => { e.stopPropagation(); setGross(medienUrl(a.bild)); }}><Icon n="zoom" s={14} /></span></span>
                      <img src={medienUrl(a.bild)!} alt="" decoding="async" fetchPriority={i < 2 ? 'high' : 'auto'} />
                      {aufgedeckt && <span className="bild-beschr">{a.text}</span>}
                    </button>
                  ) : (
                    <button className={cls} onClick={() => toggle(i)} aria-pressed={an} disabled={sperre && !aufgedeckt} aria-label={`${BUCHSTABEN[i]}: ${a.text}${status}`}>
                      <span className="box">{an && <Icon n="check" s={18} />}</span>
                      <span>{a.text}</span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {erklaerung && <div className="erklaerung" role="note"><b>Erklärung</b><p>{f.erklaerung}</p></div>}
        {p.notiz && <Notiz id={f.id} offen={!!p.notizOffen} setOffen={o => p.onNotizOffen?.(o)} />}
      </div>
      {gross && <Lightbox src={gross} alt={gross === bild ? f.medien?.bildAlt ?? '' : 'Abbildung'} zusatz={gross === bild ? zusatz : []} onClose={() => setGross(null)} />}
    </article>
  );
}

function Notiz({ id, offen, setOffen }: { id: string; offen: boolean; setOffen: (o: boolean) => void }) {
  const z = useZustand();
  const gespeichert = z.notizen[id] ?? '';
  const [text, setText] = useState(gespeichert);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { setText(z.notizen[id] ?? ''); /* eslint-disable-next-line */ }, [id]);
  useEffect(() => { if (offen) ref.current?.focus(); }, [offen]);
  useEffect(() => { const t = setTimeout(() => { if (text !== gespeichert) notizSetzen(id, text); }, 400); return () => clearTimeout(t); }, [text, id, gespeichert]);
  if (!offen) return gespeichert
    ? <button className="notiz-vorschau" onClick={() => setOffen(true)} aria-label="Notiz bearbeiten"><Icon n="note" s={16} /> <span>{gespeichert}</span></button>
    : null;
  return (
    <div className="notiz">
      <label htmlFor={'notiz-' + id}><Icon n="note" s={16} /> Meine Notiz <small className="dezent">(nur auf diesem Gerät gespeichert)</small></label>
      <textarea id={'notiz-' + id} ref={ref} value={text} rows={3} maxLength={2000} onChange={e => setText(e.target.value)}
        onBlur={() => notizSetzen(id, text)} onKeyDown={e => { if (e.key === 'Escape') { notizSetzen(id, text); setOffen(false); } }} placeholder="Eselsbrücke, Merksatz, offene Frage …" />
      <div className="notiz-aktionen">
        {text && <button className="link" onClick={() => { setText(''); notizSetzen(id, ''); }}>Notiz löschen</button>}
        <button className="btn ghost klein" onClick={() => { notizSetzen(id, text); setOffen(false); }}>Fertig</button>
      </div>
    </div>
  );
}

export function vorleseText(f: Frage) {
  if (f.typ === 'zahl') return `${f.text} Bitte eine Zahl${f.zahl?.einheit ? ' in ' + f.zahl.einheit : ''} eingeben.`;
  if (f.typ === 'bildauswahl') return `${f.text} Es gibt ${f.antworten!.length} Abbildungen zur Auswahl: ${f.antworten!.map((_, i) => BUCHSTABEN[i]).join(', ')}.`;
  return `${f.text} ${f.antworten!.map((a, i) => `Antwort ${BUCHSTABEN[i]}: ${a.text}.`).join(' ')}`;
}
