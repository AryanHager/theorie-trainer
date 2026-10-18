const P: Record<string, string> = {
  back: 'M15 18l-6-6 6-6', next: 'M9 6l6 6-6 6', home: 'M3 11l9-8 9 8M5 10v10h14V10',
  book: 'M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 5v16', target: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 4a5 5 0 100 10 5 5 0 000-10zm0 4a1 1 0 100 2 1 1 0 000-2z',
  clock: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 3', chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5', gear: 'M12 9a3 3 0 100 6 3 3 0 000-6zM19 12l2-1-1-3-2 .2-1.3-1.3.2-2-3-1-1 2h-1.8l-1-2-3 1 .2 2L6 6.2 4 6 3 9l2 1v2l-2 1 1 3 2-.2 1.3 1.3-.2 2 3 1 1-2h1.8l1 2 3-1-.2-2 1.3-1.3 2 .2 1-3-2-1z',
  speaker: 'M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11', hash: 'M5 9h14M5 15h14M10 4L8 20M16 4l-2 16',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z', flag: 'M5 21V4M5 4h11l-2 4 2 4H5', x: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12l5 5L20 7', moon: 'M20 14A8 8 0 1110 4a6 6 0 0010 10z', sun: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5',
  sign: 'M12 2l10 10-10 10L2 12zM12 8v5M12 16v.01',
  note: 'M5 3h10l4 4v14H5zM15 3v4h4M8 12h8M8 16h6', film: 'M4 5h16v14H4zM4 9h16M4 15h16M8 5v4M12 5v4M16 5v4M8 15v4M12 15v4M16 15v4',
  key: 'M3 7h18v10H3zM6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M7 14h10', fire: 'M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-3 2-4 2-6 1 1 2 2 2 3 1-2 1-5 1-7z',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14', image: 'M4 5h16v14H4zM8 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM20 16l-5-5-8 8',
  zoom: 'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5M11 8v6M8 11h6',
};
export function Icon({ n, s = 22 }: { n: keyof typeof P | string; s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[n]} /></svg>;
}
