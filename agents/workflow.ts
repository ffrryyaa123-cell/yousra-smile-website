import { z } from 'zod';

export const WORKFLOW_STATUSES = [
  'candidate',
  'facts_audited',
  'affiliate_checked',
  'content_ready',
  'media_plan_ready',
  'media_qa_complete',
  'waiting_owner_review',
  'needs_correction'
] as const;

export const WorkflowStatusSchema = z.enum(WORKFLOW_STATUSES);
export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;

export const ReviewOnlyWorkflowSchema = z.object({
  productId: z.string().min(1),
  status: WorkflowStatusSchema,
  completedStages: z.array(WorkflowStatusSchema),
  publicationStatus: z.literal('NOT_PUBLISHED'),
  catalogWriteStatus: z.literal('NOT_ATTEMPTED'),
  humanApproval: z.literal('PENDING'),
  outboundConnectors: z.object({
    websiteImport: z.literal(false),
    socialPublishing: z.literal(false),
    emailSending: z.literal(false),
    mediaGeneration: z.literal(false)
  }),
  updatedAt: z.string()
});

export type ReviewOnlyWorkflow = z.infer<typeof ReviewOnlyWorkflowSchema>;

const ALLOWED_TRANSITIONS: Record<WorkflowStatus, readonly WorkflowStatus[]> = {
  candidate: ['facts_audited', 'needs_correction'],
  facts_audited: ['affiliate_checked', 'needs_correction'],
  affiliate_checked: ['content_ready', 'needs_correction'],
  content_ready: ['media_plan_ready', 'needs_correction'],
  media_plan_ready: ['media_qa_complete', 'needs_correction'],
  media_qa_complete: ['waiting_owner_review', 'needs_correction'],
  waiting_owner_review: [],
  needs_correction: []
};

export const AGENT_TEAM = [
  ['Review Manager', 'Runs deterministic stages and owns the review package.'],
  ['Product Facts Audit Agent', 'Checks supplied facts for contradictions and missing evidence.'],
  ['Affiliate Integrity Guard', 'Preserves an owner-supplied link exactly and never invents one.'],
  ['Content and SEO Agent', 'Creates factual copy from supplied facts only.'],
  ['Media Planning Agent', 'Plans product-faithful scenes without claiming a video exists.'],
  ['Product-Media QA Agent', 'Blocks model mismatches and unsupported before/after claims.'],
  ['CSV Draft Builder', 'Exports a review CSV without importing it.'],
  ['Credential Guard', 'Rejects inputs that appear to contain API keys or tokens.'],
  ['Owner Approval Gate', 'Stops every run at owner review with all outbound connectors off.']
] as const;

export function createWorkflow(productId: string): ReviewOnlyWorkflow {
  return ReviewOnlyWorkflowSchema.parse({
    productId,
    status: 'candidate',
    completedStages: [],
    publicationStatus: 'NOT_PUBLISHED',
    catalogWriteStatus: 'NOT_ATTEMPTED',
    humanApproval: 'PENDING',
    outboundConnectors: {
      websiteImport: false,
      socialPublishing: false,
      emailSending: false,
      mediaGeneration: false
    },
    updatedAt: new Date().toISOString()
  });
}

export function transition(
  workflow: ReviewOnlyWorkflow,
  next: WorkflowStatus
): ReviewOnlyWorkflow {
  if (!ALLOWED_TRANSITIONS[workflow.status].includes(next)) {
    throw new Error(`Invalid review workflow transition: ${workflow.status} -> ${next}`);
  }

  return ReviewOnlyWorkflowSchema.parse({
    ...workflow,
    status: next,
    completedStages: [...workflow.completedStages, next],
    updatedAt: new Date().toISOString()
  });
}

export function assertReviewOnlySafety(workflow: ReviewOnlyWorkflow): void {
  const connectors = Object.values(workflow.outboundConnectors);
  if (
    workflow.publicationStatus !== 'NOT_PUBLISHED' ||
    workflow.catalogWriteStatus !== 'NOT_ATTEMPTED' ||
    workflow.humanApproval !== 'PENDING' ||
    connectors.some(Boolean)
  ) {
    throw new Error('REVIEW_ONLY_SAFETY_GATE_FAILED');
  }

  if (!['waiting_owner_review', 'needs_correction'].includes(workflow.status)) {
    throw new Error('OWNER_REVIEW_GATE_NOT_REACHED');
  }
}
