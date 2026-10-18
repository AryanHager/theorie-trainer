import { useEffect, useState } from 'react';
export function useRoute() {
  const get = () => decodeURIComponent(location.hash.replace(/^#/, '')) || '/';
  const [r, setR] = useState(get);
  useEffect(() => {
    const f = () => {
      const neu = get(); setR(neu);
      if (!neu.startsWith('/zeichen/')) window.scrollTo(0, 0);
      // Fokus für Screenreader/Tastatur an den Seitenanfang setzen
      requestAnimationFrame(() => (document.querySelector('main, h1') as HTMLElement | null)?.focus?.({ preventScroll: true }));
    };
    addEventListener('hashchange', f); return () => removeEventListener('hashchange', f);
  }, []);
  return r;
}
export const go = (p: string, ersetzen = false) => { if (ersetzen) location.replace('#' + p); else location.hash = p; };
