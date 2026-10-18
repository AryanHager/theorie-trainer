import { useEffect, useRef } from 'react';
import { Icon } from './Icon';
export function Lightbox({ src, alt, onClose, zusatz = [], children }: { src: string; alt: string; onClose: () => void; zusatz?: string[]; children?: React.ReactNode }) {
  const zu = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const vorher = document.activeElement as HTMLElement | null;
    zu.current?.focus();
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', k);
    return () => { removeEventListener('keydown', k); vorher?.focus?.(); };
  }, [onClose]);
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Bild vergrößert" onClick={onClose}>
      <button ref={zu} className="icon-btn lightbox-close" aria-label="Schließen"><Icon n="x" /></button>
      <div className="lightbox-inhalt">
        <div className="lightbox-bilder">
          <img src={src} alt={alt} />
          {zusatz.map(z => <img key={z} src={z} alt="Zusatzzeichen" className="zusatz" />)}
        </div>
        {children && <div className="lightbox-text" onClick={e => e.stopPropagation()}>{children}</div>}
      </div>
    </div>
  );
}
