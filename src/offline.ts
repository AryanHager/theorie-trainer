// Offline-Vorabladen aller Medien über den Service Worker
export interface OfflineStand { laeuft: boolean; fertig: number; gesamt: number; fehler: number; bytes?: number; erledigt?: boolean }
export async function medienListe(): Promise<{ dateien: string[]; bytes: number }> {
  const r = await fetch(import.meta.env.BASE_URL + 'data/medien.json'); return r.json();
}
export async function allesVorladen(melde: (s: OfflineStand) => void) {
  if (!('serviceWorker' in navigator)) throw new Error('Dieser Browser unterstützt keinen Offline-Speicher.');
  const reg = await navigator.serviceWorker.getRegistration();
  const sw = reg?.active ?? navigator.serviceWorker.controller;
  if (!sw) throw new Error('Offline-Speicher ist erst nach dem ersten Neuladen der installierten App verfügbar.');
  const { dateien, bytes } = await medienListe();
  melde({ laeuft: true, fertig: 0, gesamt: dateien.length, fehler: 0, bytes });
  await new Promise<void>(ok => {
    const h = (e: MessageEvent) => {
      const d = e.data || {};
      if (d.typ === 'fortschritt') melde({ laeuft: true, fertig: d.fertig, gesamt: d.gesamt, fehler: d.fehler, bytes });
      if (d.typ === 'fertig') { navigator.serviceWorker.removeEventListener('message', h); localStorage.setItem('theorie-trainer:offline', String(Date.now())); melde({ laeuft: false, fertig: d.fertig, gesamt: d.gesamt, fehler: d.fehler, bytes, erledigt: true }); ok(); }
    };
    navigator.serviceWorker.addEventListener('message', h);
    sw.postMessage({ typ: 'vorladen', dateien });
  });
}
