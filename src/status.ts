// Lernstatus einer Frage – ohne Abhängigkeiten, damit er auch im Web Worker (Prüfungsreife) nutzbar ist
import type { Fortschritt } from './store';
export type Status = 'neu' | 'falsch' | 'einmal' | 'sicher';
export function status(f?: Fortschritt): Status {
  if (!f) return 'neu';
  if (f.zuletzt === 'f') return 'falsch';
  return f.serie >= 2 ? 'sicher' : 'einmal';
}
