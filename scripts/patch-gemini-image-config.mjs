import fs from 'node:fs';
import path from 'node:path';

const serverPath = path.resolve(process.cwd(), 'server.ts');
let source = fs.readFileSync(serverPath, 'utf8');

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
  fs.writeFileSync(serverPath, source, 'utf8');
  console.log('[Yousra Smile] Current Gemini 3.1 image response format enabled.');
}
