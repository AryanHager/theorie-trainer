import { useEffect, useRef, useState } from 'react';
import { KUERZEL } from '../tasten';

/** Übersicht der Tastenkürzel, öffnet mit „?“ */
export function TastenHilfe() {
  const [offen, setOffen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const auf = () => setOffen(true);
    const k = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(el?.tagName)) return;
      if (e.key === '?') { e.preventDefault(); setOffen(o => !o); }
      else if (e.key === 'Escape') setOffen(false);
    };
    addEventListener('theorie:hilfe', auf); addEventListener('keydown', k);
    return () => { removeEventListener('theorie:hilfe', auf); removeEventListener('keydown', k); };
  }, []);
  useEffect(() => { if (offen) ref.current?.focus(); }, [offen]);
  if (!offen) return null;
  return (
    <div className="modal-bg" onClick={() => setOffen(false)}>
      <div className="modal tasten-hilfe" role="dialog" aria-modal="true" aria-labelledby="th-titel" onClick={e => e.stopPropagation()}>
        <h2 id="th-titel">Tastenkürzel</h2>
        {KUERZEL.map(g => (
          <section key={g.gruppe}>
            <h3 className="dezent-titel">{g.gruppe}</h3>
            <dl>{g.liste.map(([k, d]) => <div key={k}><dt><kbd>{k}</kbd></dt><dd>{d}</dd></div>)}</dl>
          </section>
        ))}
        <div className="modal-aktionen"><button ref={ref} className="btn primaer" onClick={() => setOffen(false)}>Schließen</button></div>
      </div>
    </div>
  );
}
