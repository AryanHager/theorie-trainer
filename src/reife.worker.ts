// Web Worker: berechnet die Prüfungsreife (Monte-Carlo) abseits des Haupt-Threads
import { pruefungsreife } from './reife';
self.onmessage = (e: MessageEvent) => {
  const { nr, kat, z, laeufe } = e.data;
  self.postMessage({ nr, reife: pruefungsreife(kat, z, laeufe) });
};
