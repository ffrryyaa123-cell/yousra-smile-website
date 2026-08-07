import type { Config } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: jsonHeaders });

export default async (request: Request) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json({ error: 'GEMINI_API_KEY is not configured on the server.' }, 503);
  }

  try {
    const body = await request.json();
    const productName = String(body?.productName ?? '').trim();
    const productCategory = String(body?.productCategory ?? 'عام').trim();
    const extraDetails = String(body?.extraDetails ?? '').trim();
    const contentType = body?.contentType === 'blog' ? 'blog' : 'product';

    if (!productName) {
      return json({
        error: contentType === 'blog'
          ? 'عنوان أو موضوع المقال مطلوب.'
          : 'اسم المنتج مطلوب.'
      }, 400);
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

    const productPrompt = `
أنت كاتب محتوى تسويقي وSEO لمنصة Yousra Smile للتسويق بالعمولة.
أنشئ محتوى عربيًا فصيحًا واضحًا للمنتج التالي:
اسم المنتج: ${productName}
القسم: ${productCategory}
تفاصيل إضافية: ${extraDetails || 'لا توجد'}

أعد JSON صالحًا فقط بهذه الحقول:
seoTitle, seoDescription, productDescription, longDescription,
tags (array), hashtags (array), keywords (array), imageNote,
suggestedFeatures (array).
لا تضف أي نص خارج JSON.
`;

    const blogPrompt = `
أنت كاتب مقالات وSEO لمنصة Yousra Smile للتسويق بالعمولة.
أنشئ مقالًا عربيًا فصيحًا ومفيدًا حول:
الموضوع: ${productName}
القسم: ${productCategory}
تفاصيل إضافية: ${extraDetails || 'لا توجد'}

أعد JSON صالحًا فقط بهذه الحقول:
seoTitle, seoDescription, summaryAr, category, readTime, contentAr,
tags (array), hashtags (array), keywords (array), imageNote.
لا تضف أي نص خارج JSON.
`;

    const response = await ai.models.generateContent({
      model,
      contents: contentType === 'blog' ? blogPrompt : productPrompt,
      config: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error('The AI service returned an empty response.');
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('The AI response was not valid JSON.');
    }

    return json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected AI generation error.';
    console.error('AI generation error:', error);
    return json({ error: message }, 500);
  }
};

export const config: Config = {
  path: '/api/ai/generate',
};
