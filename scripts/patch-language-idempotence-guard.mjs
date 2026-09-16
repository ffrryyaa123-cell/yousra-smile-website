import fs from 'node:fs';

const target = new URL('./patch-language-and-sitemap-safety.mjs', import.meta.url);
let source = fs.readFileSync(target, 'utf8');

const guardMarker = 'if (!videos.includes("Video Review Library")) {';
if (!source.includes(guardMarker)) {
  const start = "videos = videos\n  .replace('مكتبة فيديوهات المراجعات'";
  const end = "  .replace('شراء من أمازون', \"{language === 'en' ? 'Buy on Amazon' : 'شراء من أمازون'}\");\nfs.writeFileSync(videosFile, videos, 'utf8');";

  if (!source.includes(start)) throw new Error('[patch-language-idempotence-guard] VideosPage replacement start not found');
  if (!source.includes(end)) throw new Error('[patch-language-idempotence-guard] VideosPage replacement end not found');

  source = source.replace(start, `${guardMarker}\n  ${start}`);
  source = source.replace(end, `${end.split("\nfs.writeFileSync")[0]}\n}\nfs.writeFileSync(videosFile, videos, 'utf8');`);
  fs.writeFileSync(target, source, 'utf8');
  console.log('[patch-language-idempotence-guard] Added repeat-safe VideosPage language guard.');
} else {
  console.log('[patch-language-idempotence-guard] Guard already present.');
}
