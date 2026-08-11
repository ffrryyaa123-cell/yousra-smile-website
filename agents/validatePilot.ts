import { ProductWorkflowStateSchema, assertApprovalGate, transition } from './workflow.js';

const affiliateUrl = 'https://amzn.to/4xskEMf';
let state = ProductWorkflowStateSchema.parse({
  id: 'amazon-B01NBKTPTS',
  status: 'Media Ready',
  productSource: {
    asin: 'B01NBKTPTS',
    amazonUrl: 'https://www.amazon.com/Instant-Pot-Plus-60-Programmable/dp/B01NBKTPTS/',
    amazonAffiliateUrl: affiliateUrl,
    aliexpressUrl: '',
    aliexpressAffiliateUrl: '',
  },
  verificationStatus: 'SOURCE_MATCH_CONFIRMED',
  affiliateStatus: 'EXACT_USER_SUPPLIED_URL_PRESERVED',
  contentStatus: 'READY',
  mediaStatus: 'MEDIA_GENERATOR_NOT_CONFIGURED',
  humanApproval: 'PENDING',
  websiteStatus: 'NOT_IMPORTED',
  socialStatus: {},
  errors: [],
  retryCount: 0,
  lastSuccessfulStage: 'Media Ready',
  updatedAt: new Date().toISOString(),
});

state = transition(state, 'Waiting for Human Review');
if (state.status !== 'Waiting for Human Review') throw new Error('Pilot did not stop at the approval gate.');
if (state.productSource.amazonAffiliateUrl !== affiliateUrl) throw new Error('Affiliate URL changed.');

let gateBlocked = false;
try {
  assertApprovalGate(state);
} catch (error) {
  gateBlocked = error instanceof Error && error.message === 'HUMAN_APPROVAL_REQUIRED';
}
if (!gateBlocked) throw new Error('Human approval gate did not block import.');

console.log(JSON.stringify({
  workflowStatus: state.status,
  affiliateUrlIntegrity: 'VERIFIED',
  humanApprovalGate: 'BLOCKING_AS_DESIGNED',
  importStatus: 'NOT_IMPORTED',
  publicationStatus: 'NOT_PUBLISHED',
}, null, 2));

