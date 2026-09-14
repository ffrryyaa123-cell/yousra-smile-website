import fs from 'node:fs';

const socialFile = new URL('../src/components/SocialVideoExportModal.tsx', import.meta.url);
let social = fs.readFileSync(socialFile, 'utf8');

if (!social.includes("openExtraChannel")) {
  const marker = "  return (\n";
  const helper = `  const openExtraChannel = async (platform: 'twitter' | 'snapchat' | 'threads') => {\n    if (navigator.clipboard) await navigator.clipboard.writeText(caption);\n    setCopied('package');\n    window.setTimeout(() => setCopied(''), 1500);\n    const url = platform === 'twitter'\n      ? \`https://twitter.com/intent/tweet?text=\${encodeURIComponent(caption)}\`\n      : platform === 'threads'\n        ? 'https://www.threads.com/'\n        : 'https://web.snapchat.com/';\n    window.open(url, '_blank', 'noopener,noreferrer');\n  };\n\n`;
  if (!social.includes(marker)) throw new Error('[patch-social-extra-channels] Social return marker missing');
  social = social.replace(marker, helper + marker);
} else {
  social = social.replace("platform: 'twitter' | 'snapchat'", "platform: 'twitter' | 'snapchat' | 'threads'");
  social = social.replace("    const url = platform === 'twitter'\n      ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`\n      : 'https://web.snapchat.com/';", "    const url = platform === 'twitter'\n      ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`\n      : platform === 'threads'\n        ? 'https://www.threads.com/'\n        : 'https://web.snapchat.com/';");
}

if (!social.includes('> X / Twitter</button>')) {
  const instagramButton = `          <button type="button" onClick={() => void openUpload('instagram')} className="flex items-center justify-center gap-2 rounded-xl border border-pink-500/40 bg-pink-500/10 px-3 py-3 text-xs font-black hover:bg-pink-500/20"><Instagram className="h-4 w-4" /> Instagram</button>\n`;
  const extras = `${instagramButton}          <button type="button" onClick={() => void openExtraChannel('twitter')} className="flex items-center justify-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-3 text-xs font-black hover:bg-sky-500/20"><span className="text-sm font-black">X</span> X / Twitter</button>\n          <button type="button" onClick={() => void openExtraChannel('snapchat')} className="flex items-center justify-center gap-2 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-3 py-3 text-xs font-black hover:bg-yellow-400/20"><span className="text-sm">👻</span> Snapchat</button>\n`;
  if (!social.includes(instagramButton)) throw new Error('[patch-social-extra-channels] Instagram button marker missing');
  social = social.replace(instagramButton, extras);
  social = social.replace('grid grid-cols-2 gap-2 sm:grid-cols-4', 'grid grid-cols-2 gap-2 sm:grid-cols-3');
}
if (!social.includes('> Threads</button>')) {
  const snapButton = `          <button type="button" onClick={() => void openExtraChannel('snapchat')} className="flex items-center justify-center gap-2 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-3 py-3 text-xs font-black hover:bg-yellow-400/20"><span className="text-sm">👻</span> Snapchat</button>\n`;
  const threadsButton = `${snapButton}          <button type="button" onClick={() => void openExtraChannel('threads')} className="flex items-center justify-center gap-2 rounded-xl border border-slate-400/40 bg-slate-500/10 px-3 py-3 text-xs font-black hover:bg-slate-500/20"><span className="text-sm font-black">@</span> Threads</button>\n`;
  if (!social.includes(snapButton)) throw new Error('[patch-social-extra-channels] Snapchat review button marker missing');
  social = social.replace(snapButton, threadsButton);
}
fs.writeFileSync(socialFile, social, 'utf8');

const detailFile = new URL('../src/components/ProductDetailModal.tsx', import.meta.url);
let detail = fs.readFileSync(detailFile, 'utf8');
if (!detail.includes("const shareToSnapchat = async")) {
  const twitterFn = `  const shareToTwitter = () => {\n    const url = \`https://twitter.com/intent/tweet?url=\${encodeURIComponent(productUrl)}&text=\${encodeURIComponent(shareText)}\`;\n    window.open(url, '_blank', 'noopener,noreferrer');\n  };\n`;
  const snapchatFn = `${twitterFn}\n  const shareToSnapchat = async () => {\n    if (navigator.clipboard) await navigator.clipboard.writeText(socialShareBundle);\n    window.open('https://web.snapchat.com/', '_blank', 'noopener,noreferrer');\n  };\n`;
  if (!detail.includes(twitterFn)) throw new Error('[patch-social-extra-channels] Twitter function marker missing');
  detail = detail.replace(twitterFn, snapchatFn);
}
if (!detail.includes('سناب شات (Snapchat)')) {
  const twitterButton = `                  <button\n                    onClick={() => { shareToTwitter(); setShowShareMenu(false); }}\n                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-sky-950/40 text-sky-400 font-bold text-xs transition-colors"\n                  >\n                    <TwitterIcon className="w-4 h-4 text-sky-400" />\n                    <span>تويتر / X (Twitter)</span>\n                  </button>\n`;
  const snapchatButton = `${twitterButton}\n                  <button\n                    onClick={() => { void shareToSnapchat(); setShowShareMenu(false); }}\n                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-yellow-950/40 text-yellow-300 font-bold text-xs transition-colors"\n                    title="Snapchat — نسخ بيانات المنتج وفتح سناب شات"\n                  >\n                    <span className="w-4 text-center">👻</span>\n                    <span>سناب شات (Snapchat)</span>\n                  </button>\n`;
  if (!detail.includes(twitterButton)) throw new Error('[patch-social-extra-channels] Twitter menu button marker missing');
  detail = detail.replace(twitterButton, snapchatButton);
}
fs.writeFileSync(detailFile, detail, 'utf8');

// Threads profile field in Admin > General Settings, using the user's real profile URL.
const adminFile = new URL('../src/pages/AdminPage.tsx', import.meta.url);
let admin = fs.readFileSync(adminFile, 'utf8');
admin = admin.replace(/(\s+twitterUrl: siteSettings\.twitterUrl,\r?\n)(\s+amazonTag:)/g, '$1    threadsUrl: siteSettings.threadsUrl,\n$2');
if (!admin.includes('رابط Threads')) {
  const twitterLabel = '<label className="font-bold text-sky-300 block mb-1">رابط X / Twitter:</label>';
  const twitterPos = admin.indexOf(twitterLabel);
  if (twitterPos < 0) throw new Error('[patch-social-extra-channels] Twitter settings field missing before Threads insertion');
  const nextDiv = admin.indexOf('            <div>', twitterPos + twitterLabel.length);
  if (nextDiv < 0) throw new Error('[patch-social-extra-channels] Threads settings insertion point missing');
  const threadsField = `            <div>\n              <label className="font-bold text-slate-200 block mb-1">رابط Threads:</label>\n              <input\n                type="url"\n                value={settingsForm.threadsUrl || ''}\n                onChange={(e) => setSettingsForm({ ...settingsForm, threadsUrl: e.target.value })}\n                placeholder="https://www.threads.com/@yousrasmile1"\n                className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white focus:border-slate-300 focus:outline-none"\n              />\n            </div>\n\n`;
  admin = admin.slice(0, nextDiv) + threadsField + admin.slice(nextDiv);
}
fs.writeFileSync(adminFile, admin, 'utf8');

const typesFile = new URL('../src/types.ts', import.meta.url);
let types = fs.readFileSync(typesFile, 'utf8');
if (!types.includes('threadsUrl?: string;')) {
  types = types.replace(/(\s+twitterUrl\?: string;\r?\n)/, '$1  threadsUrl?: string;\n');
}
fs.writeFileSync(typesFile, types, 'utf8');

const contextFile = new URL('../src/context/AppContext.tsx', import.meta.url);
let context = fs.readFileSync(contextFile, 'utf8');
if (!context.includes("threadsUrl: 'https://www.threads.com/@yousrasmile1'")) {
  context = context.replace("  twitterUrl: 'https://x.com/yousrasmile',", "  twitterUrl: 'https://x.com/yousrasmile',\n  threadsUrl: 'https://www.threads.com/@yousrasmile1',");
}
fs.writeFileSync(contextFile, context, 'utf8');

const seoFile = new URL('../src/components/SEOHead.tsx', import.meta.url);
let seo = fs.readFileSync(seoFile, 'utf8');
if (!seo.includes('siteSettings.threadsUrl')) {
  seo = seo.replace('              siteSettings.twitterUrl || "https://x.com"', '              siteSettings.twitterUrl || "https://x.com",\n              siteSettings.threadsUrl || "https://www.threads.com/@yousrasmile1"');
}
fs.writeFileSync(seoFile, seo, 'utf8');

console.log('[patch-social-extra-channels] X/Twitter, Snapchat and Threads enabled; Threads added to reviews and admin settings.');
