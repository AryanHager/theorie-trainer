import react from '@vitejs/plugin-react'
import { readFileSync, rmSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'

/** Bindet das (kleine) Haupt-CSS direkt in index.html ein – spart eine render-blockierende Anfrage */
function cssInline(): Plugin {
  return {
    name: 'css-inline',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const html = bundle['index.html'];
      if (!html || html.type !== 'asset') return;
      let src = String(html.source);
      for (const [name, a] of Object.entries(bundle)) {
        if (a.type !== 'asset' || !name.endsWith('.css')) continue;
        const re = new RegExp(`<link rel="stylesheet"[^>]*href="\\./${name.replace(/[.]/g, '\\.')}"[^>]*>`);
        if (re.test(src)) { src = src.replace(re, () => `<style>${String(a.source)}</style>`); delete bundle[name]; }
      }
      html.source = src;
    },
  }
}

/** Der vollständige Katalog (data/fragen.json) dient nur Skripten und Tests; die App lädt index.json + data/teile/ */
function ohneGesamtkatalog(): Plugin {
  let out = 'dist'
  return { name: 'ohne-gesamtkatalog', apply: 'build', configResolved(c) { out = c.build.outDir }, closeBundle() { rmSync(out + '/data/fragen.json', { force: true }) } }
}

/** Offene Pflichtfelder in src/anbieter.ts (gleiche Logik wie scripts/vorlage-check.mjs) */
function offeneVorlagefelder(): string[] {
  const src = readFileSync(new URL('./src/anbieter.ts', import.meta.url), 'utf8')
  const pflicht: string[] = JSON.parse(src.match(/PFLICHT[^=]*=\s*(\[[^\]]*\])/)![1].replace(/'/g, '"'))
  return pflicht.filter(k => { const m = src.match(new RegExp(`\\b${k}:\\s*'([^']*)'`)); return !m || !m[1].trim() })
}

/**
 * Für Hosts ohne eigene HTTP-Header (z. B. GitHub Pages): CSP als <meta> (frame-ancestors ist dort
 * nicht möglich), und solange Impressum/Datenschutz Vorlagen sind: noindex + robots.txt „Disallow“.
 */
function statischesHosting(): Plugin {
  const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'"
  return {
    name: 'statisches-hosting',
    apply: 'build',
    transformIndexHtml(html) {
      const esc = (s: string) => s.replace(/"/g, '&quot;')
      let meta = `<meta http-equiv="Content-Security-Policy" content="${esc(csp)}" />\n    <meta name="referrer" content="no-referrer" />`
      if (offeneVorlagefelder().length) meta += '\n    <meta name="robots" content="noindex, nofollow" />'
      // direkt nach <meta charset>, damit die CSP für alle folgenden Elemente gilt
      return html.replace(/(<meta charset="UTF-8" \/>)/, `$1\n    ${meta}`)
    },
    generateBundle() {
      const offen = offeneVorlagefelder().length > 0
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: offen
        ? '# Impressum/Datenschutz sind noch Vorlagen – bitte noch nicht indexieren (siehe DEPLOY.md)\nUser-agent: *\nDisallow: /\n'
        : 'User-agent: *\nAllow: /\n' })
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), cssInline(), ohneGesamtkatalog(), statischesHosting()],
  server: { host: true },
  preview: { host: true },
})
