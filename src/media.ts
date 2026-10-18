import { getZustand } from './store';

let ctx: AudioContext | null = null;
export function ton(art: 'richtig' | 'falsch' | 'klick') {
  if (!getZustand().einstellungen.ton) return;
  try {
    ctx ??= new AudioContext();
    const noten = art === 'richtig' ? [660, 880] : art === 'falsch' ? [300, 200] : [520];
    noten.forEach((hz, i) => {
      const o = ctx!.createOscillator(), g = ctx!.createGain();
      const t = ctx!.currentTime + i * 0.12;
      o.type = art === 'falsch' ? 'square' : 'sine'; o.frequency.value = hz;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.15, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(ctx!.destination); o.start(t); o.stop(t + 0.2);
    });
  } catch { /* kein Audio */ }
}

export const sprachausgabeVerfuegbar = typeof window !== 'undefined' && 'speechSynthesis' in window;
export function vorlesen(text: string) {
  if (!sprachausgabeVerfuegbar || !getZustand().einstellungen.vorlesen) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE'; u.rate = 1;
  // bevorzugt Stimmen, die auf dem Gerät arbeiten (localService) – siehe Datenschutzerklärung
  const de = speechSynthesis.getVoices().filter(v => v.lang?.toLowerCase().startsWith('de'));
  const stimme = de.find(v => v.localService) ?? de[0];
  if (stimme) u.voice = stimme;
  speechSynthesis.speak(u);
}
export function vorlesenStopp() { if (sprachausgabeVerfuegbar) speechSynthesis.cancel(); }
