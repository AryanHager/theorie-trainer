// Kleiner statischer Server für dist/ (lokale Vorschau wie im Betrieb): vorkomprimierte Dateien (Brotli/Gzip),
// Cache-Header und Sicherheits-Header wie in deploy/nginx.conf. Keine Abhängigkeiten.
// Aufruf: node scripts/serve.mjs [--port 4173]
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
const DIST = new URL('../dist/', import.meta.url).pathname;
const PORT = Number(process.argv[process.argv.indexOf('--port') + 1]) || Number(process.env.PORT) || 4173;
const TYP = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.mp4': 'video/mp4', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
export const SICHERHEIT = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()', 'X-Frame-Options': 'DENY',
};
const cache = p => /\/assets\/|\/data\/teile\//.test(p) ? 'public, max-age=31536000, immutable' : /\.(html|json|webmanifest)$|\/sw\.js$/.test(p) || p.endsWith('/') ? 'no-cache' : 'public, max-age=604800';
createServer((req, res) => {
  let pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pfad.endsWith('/')) pfad += 'index.html';
  const datei = normalize(join(DIST, pfad));
  if (!datei.startsWith(DIST) || !existsSync(datei) || statSync(datei).isDirectory()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', ...SICHERHEIT }); return res.end('Nicht gefunden'); }
  const ae = String(req.headers['accept-encoding'] || '');
  let quelle = datei, enc = null;
  if (/\bbr\b/.test(ae) && existsSync(datei + '.br')) { quelle = datei + '.br'; enc = 'br'; } else if (/\bgzip\b/.test(ae) && existsSync(datei + '.gz')) { quelle = datei + '.gz'; enc = 'gzip'; }
  const st = statSync(quelle), etag = `"${st.size}-${st.mtimeMs | 0}${enc ? '-' + enc : ''}"`;
  const kopf = { 'Content-Type': TYP[extname(datei)] || 'application/octet-stream', 'Cache-Control': cache(pfad), ETag: etag, Vary: 'Accept-Encoding', ...SICHERHEIT };
  if (enc) kopf['Content-Encoding'] = enc;
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, kopf); return res.end(); }
  kopf['Content-Length'] = st.size; res.writeHead(200, kopf);
  if (req.method === 'HEAD') return res.end();
  createReadStream(quelle).pipe(res);
}).listen(PORT, () => console.log(`Theorie-Trainer: http://localhost:${PORT}/`));
