// Verlustarme SVG-Optimierung der Verkehrszeichen (npm run zeichen-optimieren).
// viewBox bleibt erhalten (Skalierung), Genauigkeit 3 Nachkommastellen.
export default {
  multipass: true,
  floatPrecision: 3,
  plugins: [
    { name: 'preset-default', params: { overrides: { cleanupIds: { minify: false } } } },
  ],
};
