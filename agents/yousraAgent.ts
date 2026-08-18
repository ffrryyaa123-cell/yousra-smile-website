import { Agent, run } from '@openai/agents';
import { z } from 'zod';

export const ProductPackageSchema = z.object({
  productName: z.string(),
  seoTitle: z.string(),
  shortDescription: z.string(),
  longDescription: z.string(),
  keyFeatures: z.array(z.string()),
  benefits: z.array(z.string()),
  seoKeywords: z.array(z.string()),
  metaDescription: z.string(),
  caption: z.string(),
  websiteCopy: z.string(),
  cta: z.string(),
  youtubeTitle: z.string(),
  youtubeDescription: z.string(),
  tiktokCaption: z.string(),
  instagramCaption: z.string(),
  pinterestTitle: z.string(),
  pinterestDescription: z.string(),
  hashtags: z.array(z.string()),
  voiceOver: z.string(),
  thumbnailText: z.string(),
  needsVerification: z.array(z.string()),
});

export const yousraSmileAgent = new Agent({
  name: 'Yousra Smile Content and SEO Specialist',
  model: process.env.OPENAI_MODEL || 'gpt-5-mini',
  instructions: `You prepare affiliate-product marketing packages for Yousra Smile.
Use only supplied product facts. Never invent specifications, prices, ratings, discounts, availability, or affiliate links.
Write English content for audiences in the USA, UK, Canada, and Europe.
Use direct-response problem-to-solution framing without superlatives, guarantees, miracles, or unverifiable claims.
Do not mention a price unless it appears in the supplied facts. Put uncertain fields in needsVerification.
Keep thumbnail text short and readable. Do not claim anything was published, imported, deleted, or approved.`,
  outputType: ProductPackageSchema,
});

export async function prepareProductPackage(productFacts: string) {
  const result = await run(yousraSmileAgent, `Prepare the complete Yousra Smile pilot package from these verified facts:\n\n${productFacts}`);
  return ProductPackageSchema.parse(result.finalOutput);
}


