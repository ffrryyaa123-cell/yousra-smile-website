import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { prepareProductPackage, ProductPackageSchema } from './yousraAgent.js';
import { AGENT_TEAM, ProductWorkflowStateSchema, transition } from './workflow.js';

const AFFILIATE_URL = 'https://amzn.to/4xskEMf';
const AMAZON_URL = 'https://www.amazon.com/Instant-Pot-Plus-60-Programmable/dp/B01NBKTPTS/';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required. Keep it in environment secrets; never commit it.');
}

const verifiedFacts = {
  asin: 'B01NBKTPTS',
  productName: 'Instant Pot Duo Plus 9-in-1 Multicooker, 6 Quart',
  brand: 'Instant Pot',
  finish: 'Stainless Steel/Black',
  capacity: '6 quarts',
  functions: ['pressure cooker', 'slow cooker', 'rice maker', 'steamer', 'sautأ©', 'yogurt maker', 'warmer', 'sterilizer'],
  oneTouchPrograms: 15,
  amazonUrl: AMAZON_URL,
  amazonAffiliateUrl: AFFILIATE_URL,
  aliexpressUrl: '',
  aliexpressAffiliateUrl: '',
  price: 'NEEDS_VERIFICATION',
  rating: 'NEEDS_VERIFICATION',
  reviewCount: 'NEEDS_VERIFICATION',
  availability: 'NEEDS_VERIFICATION',
  sourceCheckedAt: new Date().toISOString(),
  sourceNote: 'Name, capacity, finish, and functions verified against the supplied Amazon ASIN listing. Volatile commerce fields are intentionally not asserted.',
};

let state = ProductWorkflowStateSchema.parse({
  id: 'amazon-B01NBKTPTS',
  status: 'Candidate',
  productSource: {
    asin: verifiedFacts.asin,
    amazonUrl: verifiedFacts.amazonUrl,
    amazonAffiliateUrl: verifiedFacts.amazonAffiliateUrl,
    aliexpressUrl: '',
    aliexpressAffiliateUrl: '',
  },
  verificationStatus: 'SOURCE_MATCH_CONFIRMED',
  affiliateStatus: 'EXACT_USER_SUPPLIED_URL_PRESERVED',
  contentStatus: 'PENDING',
  mediaStatus: 'MEDIA_GENERATOR_NOT_CONFIGURED',
  humanApproval: 'PENDING',
  websiteStatus: 'NOT_IMPORTED',
  socialStatus: {
    youtube: 'DISABLED_PENDING_APPROVAL',
    tiktok: 'DISABLED_PENDING_APPROVAL',
    instagram: 'DISABLED_PENDING_APPROVAL',
    pinterest: 'DISABLED_PENDING_APPROVAL',
  },
  errors: [],
  retryCount: 0,
  lastSuccessfulStage: 'Candidate',
  updatedAt: new Date().toISOString(),
});

state = transition(state, 'Approved Candidate');
state = transition(state, 'Data Audited');
state = transition(state, 'Affiliate Verified');

const productFacts = JSON.stringify({
  ...verifiedFacts,
  forbiddenClaims: ['best in the world', 'guaranteed', 'miracle'],
  audience: ['USA', 'UK', 'Canada', 'Europe'],
  language: 'English',
});

const content = ProductPackageSchema.parse(await prepareProductPackage(productFacts));
state = { ...transition(state, 'Content Ready'), contentStatus: 'READY' };

const mediaPlan = {
  generatorStatus: 'MEDIA_GENERATOR_NOT_CONFIGURED',
  productIdentityRule: 'Every asset must preserve the exact Instant Pot Duo Plus 6 Quart shape, stainless-steel/black finish, lid, display, buttons, controls, and included parts shown in the verified source.',
  watermark: { text: 'SMART HOME', transparent: true, placement: 'safe-area corner', backgroundBox: false },
  qualityChecks: ['exact model', 'correct color and shape', 'correct controls', 'no invented accessories', 'no generated gibberish', 'no fabricated specifications', 'realistic motion'],
  variants: [
    { ratio: '16:9', use: 'YouTube landscape', framing: 'Wide kitchen counter with the cooker centered and controls legible.', camera: 'Slow 10% push-in; locked horizon.', lighting: 'Soft daylight with controlled stainless-steel highlights.' },
    { ratio: '9:16', use: 'TikTok / Instagram Reels / YouTube Shorts', framing: 'Independent vertical composition; cooker fills middle 60% with safe areas above and below.', camera: 'Gentle lateral move; no crop-derived missing controls.', lighting: 'Soft key and practical kitchen background.' },
    { ratio: '2:3', use: 'Pinterest', framing: 'Independent portrait composition with full cooker, lid, and base visible.', camera: 'Static hero frame with subtle parallax only.', lighting: 'Premium softbox look with realistic reflections.' },
  ],
  scenes: [
    { seconds: '0-10', purpose: 'Problem / hook', action: 'Busy home cook places prepared ingredients beside the stationary cooker.', onScreenText: 'One countertop. More cooking options.', voiceOver: 'When dinner needs flexibility, one multicooker can simplify the routine.' },
    { seconds: '10-24', purpose: 'Product demonstration', action: 'Adult hand selects a clearly visible program; cut to safe, realistic food-preparation close-ups without implying unverified speed.', onScreenText: '9-in-1 multicooker', voiceOver: 'The Instant Pot Duo Plus combines pressure cooking, slow cooking, rice, steam, sautأ©, yogurt, warming, and sterilizing functions in a six-quart design.' },
    { seconds: '24-36', purpose: 'CTA / end card', action: 'Finished dish beside the unchanged cooker; product remains stationary.', onScreenText: 'See details at Yousra Smile', voiceOver: 'Review the verified details and current offer through Yousra Smile.' },
  ],
  qrCode: { enabled: false, reason: 'Approved Yousra Smile product page does not exist yet.' },
};

state = { ...transition(state, 'Media Ready'), mediaStatus: 'MEDIA_PLAN_READY; MEDIA_GENERATOR_NOT_CONFIGURED' };
state = transition(state, 'Waiting for Human Review');

if (state.productSource.amazonAffiliateUrl !== AFFILIATE_URL) {
  throw new Error('Affiliate URL integrity check failed.');
}

const reviewPackage = {
  pilot: 'instant-pot-B01NBKTPTS',
  generatedAt: new Date().toISOString(),
  publicationStatus: 'NOT_PUBLISHED',
  workflow: state,
  agentTeam: AGENT_TEAM.map(([name, responsibility]) => ({ name, responsibility })),
  verifiedFacts,
  content,
  mediaPlan,
  connectors: {
    mediaGenerator: 'NOT_CONFIGURED',
    email: 'DRAFT_ONLY_NOT_CONFIGURED',
    messages: 'DISABLED_NOT_CONFIGURED',
    socialPublishing: 'DISABLED_PENDING_HUMAN_APPROVAL',
  },
};

const csvValue = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const csvHeaders = ['id', 'titleAr', 'titleEn', 'category', 'subcategory', 'brand', 'originalPrice', 'discountPrice', 'currency', 'amazonUrl', 'aliexpressUrl', 'image', 'rating', 'reviewCount'];
const csvRow = [
  state.id, '', verifiedFacts.productName, 'smart-kitchen', 'Electric Pressure Cookers', verifiedFacts.brand,
  '', '', 'USD', AFFILIATE_URL, '', '', '', '',
];
const csv = [csvHeaders.map(csvValue).join(','), csvRow.map(csvValue).join(',')].join('\n');

const contentMarkdown = `# ${content.productName}\n\n**Workflow status:** ${state.status}\n\n**Affiliate URL:** ${AFFILIATE_URL}\n\n## SEO title\n${content.seoTitle}\n\n## Short description\n${content.shortDescription}\n\n## Long description\n${content.longDescription}\n\n## Key features\n${content.keyFeatures.map((item) => `- ${item}`).join('\n')}\n\n## Benefits\n${content.benefits.map((item) => `- ${item}`).join('\n')}\n\n## Website copy\n${content.websiteCopy}\n\n## Meta description\n${content.metaDescription}\n\n## CTA\n${content.cta}\n\n## Social\n\n### YouTube\n**${content.youtubeTitle}**\n\n${content.youtubeDescription}\n\n### TikTok\n${content.tiktokCaption}\n\n### Instagram\n${content.instagramCaption}\n\n### Pinterest\n**${content.pinterestTitle}**\n\n${content.pinterestDescription}\n\n## Voice-over\n${content.voiceOver}\n\n## Thumbnail text\n${content.thumbnailText}\n`;

const mediaMarkdown = `# Media plan â€” ${verifiedFacts.productName}\n\n**Status:** MEDIA_GENERATOR_NOT_CONFIGURED\n\n**Watermark:** SMART HOME\n\n${mediaPlan.variants.map((variant) => `## ${variant.ratio} â€” ${variant.use}\n\n- Framing: ${variant.framing}\n- Camera: ${variant.camera}\n- Lighting: ${variant.lighting}`).join('\n\n')}\n\n## Scenes\n\n${mediaPlan.scenes.map((scene) => `### ${scene.seconds}\n\n- Purpose: ${scene.purpose}\n- Product action: ${scene.action}\n- On-screen text: ${scene.onScreenText}\n- Voice-over: ${scene.voiceOver}`).join('\n\n')}\n`;

const outputDirectory = resolve(process.cwd(), 'artifacts/pilot');
const files = {
  json: resolve(outputDirectory, 'instant-pot.json'),
  csv: resolve(outputDirectory, 'instant-pot.csv'),
  content: resolve(outputDirectory, 'content.md'),
  media: resolve(outputDirectory, 'media-plan.md'),
};

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(files.json, `${JSON.stringify(reviewPackage, null, 2)}\n`, 'utf8'),
  writeFile(files.csv, `${csv}\n`, 'utf8'),
  writeFile(files.content, contentMarkdown, 'utf8'),
  writeFile(files.media, mediaMarkdown, 'utf8'),
]);

console.log(JSON.stringify({
  status: state.status,
  publicationStatus: reviewPackage.publicationStatus,
  affiliateUrlIntegrity: 'VERIFIED',
  mediaStatus: state.mediaStatus,
  outputFiles: Object.values(files).map((file) => relative(process.cwd(), file)),
}, null, 2));

