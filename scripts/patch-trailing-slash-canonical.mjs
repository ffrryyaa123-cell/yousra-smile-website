import fs from 'node:fs';

const file = new URL('../server.ts', import.meta.url);
let source = fs.readFileSync(file, 'utf8');

const marker = '    const distPath = path.join(process.cwd(), "dist");\n    app.use(express.static(distPath));';
const guard = `    // CANONICAL_URL_GUARD: keep one crawlable URL per page.\n    // The sitemap and canonical tags use the no-trailing-slash form, so redirect\n    // duplicate /path/ requests to /path while preserving the query string.\n    app.use((req, res, next) => {\n      if (req.path.length > 1 && req.path.endsWith('/')) {\n        const canonicalPath = req.path.replace(/\\/+$/, '');\n        const queryIndex = req.originalUrl.indexOf('?');\n        const query = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : '';\n        return res.redirect(301, canonicalPath + query);\n      }\n      next();\n    });\n\n    const distPath = path.join(process.cwd(), "dist");\n    app.use(express.static(distPath));`;

if (source.includes('CANONICAL_URL_GUARD')) {
  console.log('[patch-trailing-slash-canonical] Canonical trailing-slash redirect already installed.');
} else if (source.includes(marker)) {
  source = source.replace(marker, guard);
  fs.writeFileSync(file, source, 'utf8');
  console.log('[patch-trailing-slash-canonical] 301 redirect from trailing-slash duplicates installed.');
} else {
  throw new Error('[patch-trailing-slash-canonical] Production static-server marker not found.');
}
