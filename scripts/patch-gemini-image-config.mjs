import fs from 'node:fs';
import path from 'node:path';

const serverPath = path.resolve(process.cwd(), 'server.ts');
let source = fs.readFileSync(serverPath, 'utf8');
let changed = false;

// The route-injection template previously emitted a literal newline inside a
// single-quoted string at commonContext.join('\n'). Replace that generated
// sequence with a form that cannot be broken by template escaping.
const brokenJoin = "].filter(Boolean).join('\n');";
const safeJoin = "].filter(Boolean).join(String.fromCharCode(10));";
if (source.includes(brokenJoin)) {
  source = source.replace(brokenJoin, safeJoin);
  changed = true;
}

// Current documented JavaScript config for Gemini 3.1 Flash Image uses
// responseFormat.image for aspect ratio and output size.
const legacyConfig = `              imageConfig: {
                aspectRatio: scene.aspectRatio,
                imageSize: '1K'
              }`;

const currentConfig = `              responseFormat: {
                image: {
                  aspectRatio: scene.aspectRatio,
                  imageSize: '1K'
                }
              }`;

if (source.includes(legacyConfig)) {
  source = source.replace(legacyConfig, currentConfig);
  changed = true;
}

if (changed) {
  fs.writeFileSync(serverPath, source, 'utf8');
  console.log('[Yousra Smile] Gemini image route syntax and response format normalized.');
}
