import fs from 'node:fs';

const typesFile = new URL('../src/types.ts', import.meta.url);
let types = fs.readFileSync(typesFile, 'utf8');
if (!types.includes('youtubeOAuthClientId?: string;')) {
  types = types.replace(/(\s+youtubeUrl: string;\r?\n)/, '$1  youtubeOAuthClientId?: string;\n');
}
fs.writeFileSync(typesFile, types, 'utf8');

const contextFile = new URL('../src/context/AppContext.tsx', import.meta.url);
let context = fs.readFileSync(contextFile, 'utf8');
if (!context.includes("youtubeOAuthClientId:")) {
  context = context.replace("  youtubeUrl: 'https://youtube.com/@yousrasmile',", "  youtubeUrl: 'https://youtube.com/@yousrasmile',\n  youtubeOAuthClientId: '',");
}
fs.writeFileSync(contextFile, context, 'utf8');

const adminFile = new URL('../src/pages/AdminPage.tsx', import.meta.url);
let admin = fs.readFileSync(adminFile, 'utf8');
admin = admin.replace(/(\s+youtubeUrl: siteSettings\.youtubeUrl,\r?\n)(?!\s+youtubeOAuthClientId:)/g, '$1    youtubeOAuthClientId: siteSettings.youtubeOAuthClientId || \'\',\n');

if (!admin.includes('YouTube OAuth Client ID')) {
  const youtubeLabel = '<label className="font-bold text-red-400 block mb-1">رابط YouTube:</label>';
  const labelPos = admin.indexOf(youtubeLabel);
  if (labelPos < 0) throw new Error('[patch-youtube-direct-publish] YouTube settings field missing');
  const nextDiv = admin.indexOf('            <div>', labelPos + youtubeLabel.length);
  if (nextDiv < 0) throw new Error('[patch-youtube-direct-publish] YouTube OAuth insertion point missing');
  const field = `            <div>\n              <label className="font-bold text-red-300 block mb-1">YouTube OAuth Client ID:</label>\n              <input\n                type="text"\n                value={settingsForm.youtubeOAuthClientId || ''}\n                onChange={(e) => setSettingsForm({ ...settingsForm, youtubeOAuthClientId: e.target.value })}\n                placeholder="xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"\n                className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white focus:border-red-400 focus:outline-none"\n                dir="ltr"\n              />\n              <p className="mt-1 text-[10px] text-slate-400">يُستخدم لربط قناتك ورفع الفيديو مباشرة من Yousra Smile إلى YouTube. لا تضعي Client Secret هنا.</p>\n            </div>\n\n`;
  admin = admin.slice(0, nextDiv) + field + admin.slice(nextDiv);
}
fs.writeFileSync(adminFile, admin, 'utf8');

const socialFile = new URL('../src/components/SocialVideoExportModal.tsx', import.meta.url);
let social = fs.readFileSync(socialFile, 'utf8');

if (!social.includes("from '../services/youtubePublisher'")) {
  const marker = "import { Check, Copy, ExternalLink, Share2, ShoppingBag, Sparkles, Youtube, Instagram, Video } from 'lucide-react';";
  if (!social.includes(marker)) throw new Error('[patch-youtube-direct-publish] social import marker missing');
  social = social.replace(marker, `${marker}\nimport { publishVideoToYouTube } from '../services/youtubePublisher';`);
}

social = social.replace(
  "  const { products, language, getAffiliateUrl } = useApp();",
  "  const { products, language, getAffiliateUrl, siteSettings } = useApp();"
);

if (!social.includes("const [youtubePublishState")) {
  social = social.replace(
    "  const [copied, setCopied] = useState('');",
    "  const [copied, setCopied] = useState('');\n  const [youtubePublishState, setYoutubePublishState] = useState<{ status: 'idle' | 'working' | 'success' | 'error'; message: string; url?: string }>({ status: 'idle', message: '' });"
  );
}

if (!social.includes('handleDirectYouTubePublish')) {
  const marker = "  const openUpload = async (platform: 'tiktok' | 'youtube' | 'instagram') => {";
  if (!social.includes(marker)) throw new Error('[patch-youtube-direct-publish] openUpload marker missing');
  const helper = `  const handleDirectYouTubePublish = async () => {\n    const clientId = siteSettings.youtubeOAuthClientId?.trim() || '';\n    if (!clientId) {\n      setYoutubePublishState({ status: 'error', message: 'أضيفي YouTube OAuth Client ID من لوحة التحكم ← الإعدادات العامة، ثم حاولي مرة أخرى.' });\n      return;\n    }\n    if (!videoUrl) {\n      setYoutubePublishState({ status: 'error', message: 'لا يوجد ملف فيديو مرتبط بهذه المراجعة.' });\n      return;\n    }\n    try {\n      setYoutubePublishState({ status: 'working', message: 'جاري تجهيز النشر المباشر إلى YouTube...' });\n      const result = await publishVideoToYouTube({\n        clientId,\n        videoUrl,\n        title,\n        description: [description, hashtags, affiliateUrl ? \`Shop / Affiliate link: \${affiliateUrl}\` : ''].filter(Boolean).join('\\n\\n'),\n        tags: hashtags.split(/\\s+/).filter(Boolean),\n        privacyStatus: 'public',\n        onProgress: (message) => setYoutubePublishState({ status: 'working', message }),\n      });\n      setYoutubePublishState({ status: 'success', message: 'تم رفع الفيديو إلى YouTube مباشرة.', url: result.url });\n    } catch (error: any) {\n      setYoutubePublishState({ status: 'error', message: error?.message || 'تعذر النشر المباشر إلى YouTube.' });\n    }\n  };\n\n`;
  social = social.replace(marker, helper + marker);
}

const oldButton = `          <button type="button" onClick={() => void openUpload('youtube')} className="flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-600/15 px-3 py-3 text-xs font-black hover:bg-red-600/25"><Youtube className="h-4 w-4" /> YouTube</button>`;
const newButton = `          <button type="button" onClick={() => void handleDirectYouTubePublish()} disabled={youtubePublishState.status === 'working'} className="flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-600/15 px-3 py-3 text-xs font-black hover:bg-red-600/25 disabled:cursor-wait disabled:opacity-60"><Youtube className="h-4 w-4" /> {youtubePublishState.status === 'working' ? 'جاري النشر...' : 'YouTube مباشر'}</button>`;
if (social.includes(oldButton)) social = social.replace(oldButton, newButton);
else if (!social.includes("'YouTube مباشر'")) throw new Error('[patch-youtube-direct-publish] YouTube button marker missing');

if (!social.includes('youtubePublishState.status !== \'idle\'')) {
  const marker = "        <div className=\"mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-[11px] text-emerald-100\">";
  if (!social.includes(marker)) throw new Error('[patch-youtube-direct-publish] social info marker missing');
  const statusBox = `        {youtubePublishState.status !== 'idle' && (\n          <div className={\`mb-4 rounded-2xl border p-3 text-[11px] \${youtubePublishState.status === 'success' ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-100' : youtubePublishState.status === 'error' ? 'border-red-500/40 bg-red-950/30 text-red-100' : 'border-amber-500/40 bg-amber-950/30 text-amber-100'}\`}>\n            <div className=\"font-bold\">{youtubePublishState.message}</div>\n            {youtubePublishState.url && <a href={youtubePublishState.url} target=\"_blank\" rel=\"noopener noreferrer\" className=\"mt-2 inline-flex items-center gap-1 font-black text-emerald-300 underline\">فتح الفيديو على YouTube <ExternalLink className=\"h-3 w-3\" /></a>}\n          </div>\n        )}\n\n`;
  social = social.replace(marker, statusBox + marker);
}

social = social.replace(
  "TikTok, YouTube and Instagram do not provide a public browser URL that can fill every upload field automatically. The complete publishing package is copied before the upload page opens. Pinterest receives the affiliate destination, image and description directly.",
  "YouTube now supports direct publishing from Yousra Smile after connecting your Google OAuth Client ID. TikTok and Instagram still use their upload surfaces until their direct APIs are connected. Pinterest receives the affiliate destination, image and description directly."
);
social = social.replace(
  "تيك توك ويوتيوب وإنستغرام لا توفر روابط ويب عامة تسمح بتعبئة كل حقول الرفع تلقائياً. لذلك يتم نسخ حزمة النشر كاملة تلقائياً قبل فتح صفحة الرفع. أما Pinterest فيستقبل رابط العمولة والصورة والوصف مباشرة.",
  "YouTube صار يدعم النشر المباشر من Yousra Smile بعد ربط Google OAuth Client ID. تيك توك وإنستغرام ما زالا يفتحان شاشة الرفع إلى أن نربط API المباشر لكل منصة. أما Pinterest فيستقبل رابط العمولة والصورة والوصف مباشرة."
);

fs.writeFileSync(socialFile, social, 'utf8');
console.log('[patch-youtube-direct-publish] Direct YouTube OAuth upload wired into admin reviews.');
