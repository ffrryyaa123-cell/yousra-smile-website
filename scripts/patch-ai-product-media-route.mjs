import fs from 'node:fs';
import path from 'node:path';

const serverPath = path.resolve(process.cwd(), 'server.ts');
const source = fs.readFileSync(serverPath, 'utf8');
const routeMarker = 'YS_AI_PRODUCT_MEDIA_ROUTE_V1';

if (source.includes(routeMarker)) {
  process.exit(0);
}

const insertionMarker = `  // =========================================================================\n  // 3.6 DEDICATED API: Extract Product & Prepare Video Generation Data Structure\n  // =========================================================================`;

if (!source.includes(insertionMarker)) {
  throw new Error('Could not find the expected server.ts insertion point for the AI product media route.');
}

const routeCode = `
  // =========================================================================
  // ${routeMarker}: Original AI product images generated from verified references
  // =========================================================================
  app.post("/api/agent/generate-product-images", verifyAgentAuth, async (req, res) => {
    try {
      const {
        productTitle,
        brand = '',
        category = '',
        kind = 'general',
        features = [],
        referenceImages = [],
        sourceUrl = ''
      } = req.body || {};

      if (typeof productTitle !== 'string' || !productTitle.trim()) {
        return res.status(400).json({ error: 'A verified product title is required.' });
      }

      const aiClient = getGeminiAI(req.headers['x-gemini-key'] as string);
      if (!aiClient) {
        return res.status(503).json({
          error: 'Gemini image generation is not configured. Add a Gemini API key in the admin AI settings.'
        });
      }

      const validReferenceUrls = Array.isArray(referenceImages)
        ? referenceImages
            .filter((url: unknown) => typeof url === 'string' && /^https:\/\//i.test(url))
            .slice(0, 3)
        : [];

      // Reference images are fetched only for this generation request. They are
      // never written to local storage, Supabase, or the product gallery here.
      const referenceParts: any[] = [];
      for (const url of validReferenceUrls) {
        try {
          const refResponse = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 YousraSmileProductMedia/1.0',
              'Accept': 'image/avif,image/webp,image/jpeg,image/png,*/*'
            }
          });
          if (!refResponse.ok) continue;
          const contentType = (refResponse.headers.get('content-type') || 'image/jpeg').split(';')[0];
          if (!contentType.startsWith('image/')) continue;
          const bytes = Buffer.from(await refResponse.arrayBuffer());
          if (bytes.length === 0 || bytes.length > 12 * 1024 * 1024) continue;
          referenceParts.push({
            inlineData: {
              mimeType: contentType,
              data: bytes.toString('base64')
            }
          });
        } catch {
          // A blocked reference is simply skipped; generation may still use the
          // verified title/features and any other references that loaded.
        }
      }

      const verifiedFeatures = Array.isArray(features)
        ? features.filter((feature: unknown) => typeof feature === 'string' && feature.trim()).slice(0, 6)
        : [];

      const fidelityRule = [
        'Create a NEW original commercial image, not a copy of any reference composition.',
        'Use supplied reference images only to preserve the exact physical product model.',
        'Keep product color, proportions, lid, handle, controls, materials, logo placement and visible design details faithful.',
        'Do not invent accessories, functions, labels, certifications, discounts or product claims.',
        'Do not reproduce an Amazon page, seller graphic, watermark, layout or source-photo background.',
        'All visible marketing text, if any, must be English only.',
        'Any person shown must be an adult.'
      ].join(' ');

      const commonContext = [
        \`Product: \${productTitle.trim()}\`,
        brand ? \`Brand: \${String(brand).trim()}\` : '',
        category ? \`Category: \${String(category).trim()}\` : '',
        verifiedFeatures.length ? \`Verified features: \${verifiedFeatures.join(' | ')}\` : '',
        sourceUrl ? 'The product was verified from the supplied commerce URL.' : ''
      ].filter(Boolean).join('\n');

      const scenePrompts = kind === 'cleaning'
        ? [
            {
              type: 'hero',
              aspectRatio: '1:1',
              prompt: 'Premium clean e-commerce hero shot on a softly lit neutral studio background. Product centered and fully visible.'
            },
            {
              type: 'lifestyle_home',
              aspectRatio: '2:3',
              prompt: 'Realistic modern home lifestyle scene with an adult modest hijabi woman using the product correctly. Natural daylight, premium but believable.'
            },
            {
              type: 'before_after',
              aspectRatio: '2:3',
              prompt: 'Believable cleaning demonstration for the exact surface this product is designed for. Show a restrained before/after result with consistent camera angle and lighting; no exaggerated transformation.'
            },
            {
              type: 'feature',
              aspectRatio: '2:3',
              prompt: 'Detailed commercial close-up showing verified controls, construction and functional product details. No invented attachments.'
            },
            {
              type: 'thumbnail',
              aspectRatio: '16:9',
              prompt: 'High-impact YouTube-style product thumbnail composition using the real product design. Clean premium background, strong subject separation, no Arabic text.'
            }
          ]
        : [
            {
              type: 'hero',
              aspectRatio: '1:1',
              prompt: 'Premium clean e-commerce hero shot on a softly lit neutral studio background. Product centered and fully visible.'
            },
            {
              type: 'lifestyle_home',
              aspectRatio: '2:3',
              prompt: 'Lifestyle image with an adult modest hijabi woman using or holding the product naturally in a bright modern home, kitchen, garden or office as appropriate for the product.'
            },
            {
              type: 'lifestyle_outdoor',
              aspectRatio: '2:3',
              prompt: 'Second distinct lifestyle image with an adult modest hijabi woman using the product in a realistic alternate setting such as garden, car, gym, seaside walk or outdoor leisure when appropriate.'
            },
            {
              type: 'feature',
              aspectRatio: '2:3',
              prompt: 'Detailed commercial close-up highlighting only verified product materials, controls, lid, handle, texture or functional design details.'
            },
            {
              type: 'thumbnail',
              aspectRatio: '16:9',
              prompt: 'High-impact YouTube-style product thumbnail composition using the real product design. Clean premium background, strong subject separation, no Arabic text.'
            }
          ];

      const generatedImages: any[] = [];
      const generationErrors: string[] = [];

      for (const scene of scenePrompts) {
        const prompt = \`\${commonContext}\n\n\${scene.prompt}\n\n\${fidelityRule}\`;
        try {
          const parts = [
            ...referenceParts,
            { text: prompt }
          ];
          const result: any = await aiClient.models.generateContent({
            model: 'gemini-3.1-flash-image',
            contents: [{ role: 'user', parts }],
            config: {
              responseModalities: ['TEXT', 'IMAGE'],
              imageConfig: {
                aspectRatio: scene.aspectRatio,
                imageSize: '1K'
              }
            }
          } as any);

          const outputParts = result?.candidates?.[0]?.content?.parts || [];
          const imagePart = outputParts.find((part: any) => part?.inlineData?.data && part?.inlineData?.mimeType?.startsWith('image/'));
          if (!imagePart) {
            generationErrors.push(\`\${scene.type}: no image returned\`);
            continue;
          }

          generatedImages.push({
            type: scene.type,
            aspectRatio: scene.aspectRatio,
            mimeType: imagePart.inlineData.mimeType,
            data: imagePart.inlineData.data,
            prompt
          });
        } catch (error: any) {
          generationErrors.push(\`\${scene.type}: \${error?.message || 'generation failed'}\`);
        }
      }

      if (generatedImages.length === 0) {
        return res.status(502).json({
          error: 'No original product images were generated.',
          details: generationErrors.slice(0, 5)
        });
      }

      return res.json({
        success: true,
        data: {
          productTitle: productTitle.trim(),
          generatedImages,
          referenceCountUsed: referenceParts.length,
          finalAssetsAreGenerated: true,
          sourceImagesPersisted: false,
          errors: generationErrors
        }
      });
    } catch (error: any) {
      console.error('[AI Product Images] Generation failed:', error);
      return res.status(500).json({ error: error?.message || 'AI product image generation failed.' });
    }
  });

`;

const patched = source.replace(insertionMarker, `${routeCode}${insertionMarker}`);
fs.writeFileSync(serverPath, patched, 'utf8');
console.log('[Yousra Smile] AI product media route enabled.');
