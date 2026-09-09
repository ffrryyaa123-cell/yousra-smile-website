import fs from 'node:fs';

const file = new URL('../src/pages/AdminPage.tsx', import.meta.url);
let source = fs.readFileSync(file, 'utf8');
let changed = false;

const replaceOnce = (needle, replacement, label) => {
  if (!source.includes(needle)) {
    throw new Error(`[patch-seo-text-hub] Could not find ${label}. AdminPage changed; refusing to guess.`);
  }
  source = source.replace(needle, replacement);
  changed = true;
};

if (!source.includes("import { SeoTextHub } from '../components/SeoTextHub';")) {
  replaceOnce(
    "import { AgentAutomationHub } from '../components/AgentAutomationHub';",
    "import { AgentAutomationHub } from '../components/AgentAutomationHub';\nimport { SeoTextHub } from '../components/SeoTextHub';",
    'AgentAutomationHub import'
  );
}

if (!source.includes("'seo-text'")) {
  replaceOnce(
    "'ai-assistant' | 'agent-hub' | 'workspace' | 'users'",
    "'ai-assistant' | 'seo-text' | 'agent-hub' | 'workspace' | 'users'",
    'activeTab union'
  );
}

if (!source.includes("setActiveTab('seo-text')")) {
  const workspaceButton = `        <button\n          onClick={() => setActiveTab('workspace')}`;
  const seoButton = `        <button\n          onClick={() => setActiveTab('seo-text')}\n          className={\`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer border \${\n            activeTab === 'seo-text'\n              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg border-emerald-400 font-black'\n              : 'bg-slate-900 text-emerald-300 border-emerald-500/40 hover:border-emerald-400 hover:text-white'\n          }\`}\n          title=\"CU وبيانات المنتج والنصوص فقط — بدون توليد صور أو فيديو\"\n        >\n          <FileText className=\"w-4 h-4 text-emerald-400\" />\n          <span className=\"font-black\">📝 CU والنصوص</span>\n          <span className=\"px-1.5 py-0.5 rounded bg-emerald-500/20 text-[9px] text-emerald-200 font-black\">TEXT ONLY</span>\n        </button>\n\n`;
  replaceOnce(workspaceButton, `${seoButton}${workspaceButton}`, 'workspace tab button');
}

// Important: checking only for `activeTab === 'seo-text'` is not enough,
// because the navigation button itself contains that expression. The actual
// content render must be checked independently so the button cannot exist
// without its page.
if (!source.includes('<SeoTextHub />')) {
  const agentRender = `      {activeTab === 'agent-hub' && (\n        <AgentAutomationHub />\n      )}`;
  const seoRender = `${agentRender}\n\n      {activeTab === 'seo-text' && (\n        <SeoTextHub />\n      )}`;
  replaceOnce(agentRender, seoRender, 'AgentAutomationHub render block');
}

if (changed) {
  fs.writeFileSync(file, source, 'utf8');
  console.log('[patch-seo-text-hub] CU/text-only tab wired into AdminPage.');
} else {
  console.log('[patch-seo-text-hub] Already applied.');
}
