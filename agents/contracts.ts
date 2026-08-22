import { z } from 'zod';
import { ReviewOnlyWorkflowSchema } from './workflow.js';

export const VerifiedFactSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
  sourceNote: z.string().min(1)
});

export const ProductReviewInputSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(2),
  retailer: z.enum(['amazon', 'aliexpress', 'other']),
  sourceUrl: z.string().url(),
  affiliateUrl: z.string().url().optional(),
  verifiedFacts: z.array(VerifiedFactSchema).min(1).max(50),
  referenceImageUrls: z.array(z.string().url()).max(10).default([]),
  beforeAfterEvidenceProvided: z.boolean().default(false),
  targetLanguage: z.enum(['ar', 'en', 'bilingual']).default('bilingual'),
  targetPlatforms: z.array(z.enum(['website', 'youtube', 'tiktok', 'instagram', 'pinterest']))
    .min(1)
    .default(['website'])
});

export type ProductReviewInput = z.infer<typeof ProductReviewInputSchema>;

export const FactsAuditSchema = z.object({
  outcome: z.enum(['CONSISTENT', 'INSUFFICIENT', 'CONFLICTING']),
  canonicalProductName: z.string(),
  supportedFacts: z.array(z.string()),
  missingEvidence: z.array(z.string()),
  conflicts: z.array(z.string()),
  notesForOwner: z.array(z.string())
});

export const ContentPackageSchema = z.object({
  titleAr: z.string(),
  titleEn: z.string(),
  shortDescriptionAr: z.string(),
  shortDescriptionEn: z.string(),
  seoTitle: z.string(),
  metaDescription: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()),
  keyFeatures: z.array(z.string()),
  needsVerification: z.array(z.string())
});

export const MediaPlanSchema = z.object({
  exactProductIdentity: z.string(),
  beforeAfterAllowed: z.boolean(),
  beforeAfterReason: z.string(),
  referenceImagesRequired: z.boolean(),
  scenes: z.array(z.object({
    order: z.number().int().positive(),
    purpose: z.enum(['hook', 'problem', 'demonstration', 'feature', 'proof', 'cta']),
    visual: z.string(),
    voiceover: z.string(),
    onScreenText: z.string(),
    evidenceRequired: z.array(z.string())
  })).min(1).max(8),
  outputVariants: z.array(z.object({
    ratio: z.enum(['16:9', '9:16', '2:3']),
    use: z.string(),
    framing: z.string()
  })).min(1)
});

export const MediaQaSchema = z.object({
  outcome: z.enum(['PASS_FOR_OWNER_REVIEW', 'NEEDS_CORRECTION', 'BLOCKED']),
  exactModelProtected: z.boolean(),
  unsupportedClaims: z.array(z.string()),
  mismatchRisks: z.array(z.string()),
  requiredCorrections: z.array(z.string())
});

export const ReviewPackageSchema = z.object({
  generatedAt: z.string(),
  status: z.enum(['waiting_owner_review', 'needs_correction']),
  publicationStatus: z.literal('NOT_PUBLISHED'),
  catalogWriteStatus: z.literal('NOT_ATTEMPTED'),
  input: ProductReviewInputSchema,
  workflow: ReviewOnlyWorkflowSchema,
  factsAudit: FactsAuditSchema,
  affiliateIntegrity: z.object({
    status: z.enum(['EXACT_OWNER_URL_PRESERVED', 'MISSING_REQUIRES_OWNER_INPUT']),
    sourceUrl: z.string().url(),
    affiliateUrl: z.string().url().optional()
  }),
  content: ContentPackageSchema,
  mediaPlan: MediaPlanSchema,
  mediaQa: MediaQaSchema,
  ownerChecklist: z.array(z.string()),
  agentTeam: z.array(z.object({ name: z.string(), responsibility: z.string() })),
  outboundConnectors: z.object({
    websiteImport: z.literal('DISABLED'),
    socialPublishing: z.literal('DISABLED'),
    mediaGeneration: z.literal('DISABLED'),
    emailSending: z.literal('DISABLED')
  })
});

export type ReviewPackage = z.infer<typeof ReviewPackageSchema>;
