import { z } from 'zod';

export const WORKFLOW_STATUSES = [
  'Candidate',
  'Approved Candidate',
  'Data Audited',
  'Affiliate Verified',
  'Content Ready',
  'Media Ready',
  'Waiting for Human Review',
  'Human Approved',
  'Imported to Yousra Smile',
  'Website Verified',
  'Published to YouTube',
  'Published to TikTok',
  'Published to Instagram',
  'Published to Pinterest',
  'Completed',
  'Error / Needs Correction',
] as const;

export const WorkflowStatusSchema = z.enum(WORKFLOW_STATUSES);
export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;

export const ProductWorkflowStateSchema = z.object({
  id: z.string(),
  status: WorkflowStatusSchema,
  productSource: z.object({
    asin: z.string(),
    amazonUrl: z.url(),
    amazonAffiliateUrl: z.url(),
    aliexpressUrl: z.string(),
    aliexpressAffiliateUrl: z.string(),
  }),
  verificationStatus: z.string(),
  affiliateStatus: z.string(),
  contentStatus: z.string(),
  mediaStatus: z.string(),
  humanApproval: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  websiteStatus: z.string(),
  socialStatus: z.record(z.string(), z.string()),
  errors: z.array(z.string()),
  retryCount: z.number().int().nonnegative(),
  lastSuccessfulStage: z.string(),
  updatedAt: z.string(),
});

export type ProductWorkflowState = z.infer<typeof ProductWorkflowStateSchema>;

export const AGENT_TEAM = [
  ['Main Manager / Orchestrator', 'Coordinates status transitions and specialists.'],
  ['Product Data Intake Agent', 'Normalizes user-supplied product facts.'],
  ['Product Audit & Verification Agent', 'Rejects unsupported facts and mismatched models.'],
  ['Affiliate Link Verification Agent', 'Preserves and validates approved affiliate URLs.'],
  ['Content & SEO Agent', 'Creates factual English marketing copy.'],
  ['Image / Media Planning Agent', 'Creates still-image jobs without claiming assets exist.'],
  ['Video Planning Agent', 'Creates independently reframed 16:9, 9:16, and 2:3 plans.'],
  ['Media Quality Review Agent', 'Checks exact model, controls, text, and realistic motion.'],
  ['Final CSV Builder Agent', 'Builds only fields supported by the site importer.'],
  ['Human Approval Gate', 'Blocks import and distribution until explicit approval.'],
  ['Yousra Smile Import Agent', 'Disabled until human approval.'],
  ['Website Verification Agent', 'Disabled until an approved import exists.'],
  ['Social Media Distribution Agent', 'Disabled until site verification and approval.'],
  ['Product Discovery Agent', 'Future candidate-only workflow.'],
  ['Affiliate Sourcing Agent', 'Future authenticated-source workflow.'],
  ['Email Agent', 'Draft replies only; sending is disabled.'],
  ['Messages / Customer Communication Agent', 'Connectors not configured.'],
  ['Social Monitoring Agent', 'Connectors not configured.'],
  ['Product Status / Workflow Memory', 'Persists auditable per-product state.'],
  ['Error Handling / Retry Agent', 'Records failures and bounded retry counts.'],
] as const;

const ALLOWED_TRANSITIONS: Record<WorkflowStatus, readonly WorkflowStatus[]> = {
  'Candidate': ['Approved Candidate', 'Error / Needs Correction'],
  'Approved Candidate': ['Data Audited', 'Error / Needs Correction'],
  'Data Audited': ['Affiliate Verified', 'Error / Needs Correction'],
  'Affiliate Verified': ['Content Ready', 'Error / Needs Correction'],
  'Content Ready': ['Media Ready', 'Error / Needs Correction'],
  'Media Ready': ['Waiting for Human Review', 'Error / Needs Correction'],
  'Waiting for Human Review': ['Human Approved', 'Error / Needs Correction'],
  'Human Approved': ['Imported to Yousra Smile', 'Error / Needs Correction'],
  'Imported to Yousra Smile': ['Website Verified', 'Error / Needs Correction'],
  'Website Verified': ['Published to YouTube', 'Published to TikTok', 'Published to Instagram', 'Published to Pinterest', 'Completed', 'Error / Needs Correction'],
  'Published to YouTube': ['Completed', 'Error / Needs Correction'],
  'Published to TikTok': ['Completed', 'Error / Needs Correction'],
  'Published to Instagram': ['Completed', 'Error / Needs Correction'],
  'Published to Pinterest': ['Completed', 'Error / Needs Correction'],
  'Completed': [],
  'Error / Needs Correction': ['Candidate', 'Approved Candidate', 'Data Audited', 'Affiliate Verified', 'Content Ready', 'Media Ready'],
};

export function transition(state: ProductWorkflowState, next: WorkflowStatus): ProductWorkflowState {
  if (!ALLOWED_TRANSITIONS[state.status].includes(next)) {
    throw new Error(`Invalid workflow transition: ${state.status} -> ${next}`);
  }
  if (next === 'Human Approved' && state.humanApproval !== 'APPROVED') {
    throw new Error('Explicit human approval is required before import or publication.');
  }
  return ProductWorkflowStateSchema.parse({
    ...state,
    status: next,
    lastSuccessfulStage: next === 'Error / Needs Correction' ? state.lastSuccessfulStage : next,
    updatedAt: new Date().toISOString(),
  });
}

export function assertApprovalGate(state: ProductWorkflowState) {
  if (state.humanApproval !== 'APPROVED' || state.status !== 'Human Approved') {
    throw new Error('HUMAN_APPROVAL_REQUIRED');
  }
}

