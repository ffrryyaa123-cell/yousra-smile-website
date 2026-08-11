import { Agent, run } from '@openai/agents';
import { z } from 'zod';

export const ProductPackageSchema = z.object({
  productName: z.string(),
  shortDescription: z.string(),
  websiteCopy: z.string(),
  youtubeTitle: z.string(),
  youtubeCaption: z.string(),
  tiktokCaption: z.string(),
  pinterestTitle: z.string(),
  pinterestDescription: z.string(),
  hashtags: z.array(z.string()),
  voiceOver: z.string(),
  thumbnailText: z.string(),
  videoPrompt16x9: z.string(),
  videoPrompt9x16: z.string(),
  videoPrompt3x2: z.string(),
  approvalStatus: z.literal('PENDING_OWNER_APPROVAL')
});

export const yousraSmileAgent = new Agent({
  name: 'Yousra Smile Product Pilot',
  model: 'gpt-5-mini',
  instructions: `You prepare affiliate-product marketing packages for Yousra Smile.
Use only supplied product facts. Never invent specifications, prices, ratings, discounts, availability, or affiliate links.
Create realistic commercial video prompts with no fantasy behavior and preserve the exact product appearance.
Prepare three video formats: 16:9, 9:16, and 3:2.
Keep thumbnail text short and readable.
Every package MUST remain PENDING_OWNER_APPROVAL. Never claim anything has been published, uploaded, deleted, or approved.`,
  outputType: ProductPackageSchema,
});

export async function prepareProductPackage(productFacts: string) {
  const result = await run(yousraSmileAgent, `Prepare the complete Yousra Smile pilot package from these verified facts:\n\n${productFacts}`);
  return ProductPackageSchema.parse(result.finalOutput);
}

