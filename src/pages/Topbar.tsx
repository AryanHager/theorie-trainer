import { go } from '../router';
import { Icon } from '../components/Icon';
export function Topbar({ titel, zurueck, children }: { titel: string; zurueck: string; children?: React.ReactNode }) {
  return (
    <header className="topbar">
      <button className="icon-btn" onClick={() => go(zurueck)} aria-label="Zurück"><Icon n="back" /></button>
      <div className="topbar-titel"><h1>{titel}</h1></div>
      {children}
    </header>
  );
}
