// Legt für alle Textdateien in dist/ vorkomprimierte Fassungen an (.br und .gz).
// Webserver wie nginx (gzip_static/brotli_static) oder scripts/serve.mjs liefern sie direkt aus.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';
const DIST = new URL('../dist/', import.meta.url).pathname;
const TEXT = /\.(html|js|mjs|css|json|svg|webmanifest|txt|xml)$/;
let n = 0, vorher = 0, nachher = 0;
const lauf = d => { for (const f of readdirSync(d)) { const p = d + f; if (statSync(p).isDirectory()) lauf(p + '/'); else if (TEXT.test(f) && statSync(p).size > 512) {
  const roh = readFileSync(p); const br = brotliCompressSync(roh, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }); const gz = gzipSync(roh, { level: 9 });
  writeFileSync(p + '.br', br); writeFileSync(p + '.gz', gz); n++; vorher += roh.length; nachher += br.length;
} } };
lauf(DIST);
console.log(`komprimiert: ${n} Dateien, ${(vorher / 1e6).toFixed(1)} MB → ${(nachher / 1e6).toFixed(1)} MB (Brotli)`);
