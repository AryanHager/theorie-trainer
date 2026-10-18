import { useEffect, useRef } from 'react';

/** Tastenkürzel: ignoriert Eingaben in Textfeldern und Tastenkombinationen mit Strg/Alt/Cmd. */
export function useTasten(map: Record<string, (e: KeyboardEvent) => void>, aktiv = true) {
  const ref = useRef(map); ref.current = map;
  useEffect(() => {
    if (!aktiv) return;
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const el = e.target as HTMLElement;
      if (el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)) return;
      if (document.querySelector('.modal-bg, .lightbox') && e.key !== 'Escape' && e.key !== '?') return;
      let k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === ' ') k = 'Space';
      // Leertaste auf Schaltflächen nicht abfangen (Standardverhalten „klicken“)
      if (k === 'Space' && el?.tagName === 'BUTTON') return;
      const fn = ref.current[k];
      if (fn) { e.preventDefault(); fn(e); }
    };
    addEventListener('keydown', h); return () => removeEventListener('keydown', h);
  }, [aktiv]);
}
export const filmUmschalten = () => dispatchEvent(new Event('theorie:film'));
export const hilfeOeffnen = () => dispatchEvent(new Event('theorie:hilfe'));

export const KUERZEL: { gruppe: string; liste: [string, string][] }[] = [
  { gruppe: 'Lernen', liste: [['1 – 4 oder A – D', 'Antwort an-/abwählen'], ['Enter', 'Antwort prüfen / nächste Frage'], ['← / →', 'vorherige / nächste Frage'], ['E', 'Erklärung ein/aus'], ['M', 'als schwierig markieren'], ['N', 'Notiz schreiben'], ['R', 'Frage vorlesen'], ['F oder Leertaste', 'Filmszene abspielen / pausieren']] },
  { gruppe: 'Prüfung', liste: [['1 – 4 oder A – D', 'Antwort an-/abwählen'], ['← / → oder Enter', 'vorherige / nächste Frage'], ['M', 'Frage markieren'], ['F', 'Filmszene abspielen'], ['G', 'Fragenübersicht ein/aus']] },
  { gruppe: 'Überall', liste: [['?', 'diese Hilfe'], ['Esc', 'Dialog oder Vergrößerung schließen'], ['Tab', 'zum nächsten Bedienelement']] },
];
