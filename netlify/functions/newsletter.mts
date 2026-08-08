import type { Config } from '@netlify/functions';
import { handleNewsletterSubscription } from '../../server/emailApi';

export default async (request: Request) => {
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  try {
    const result = await handleNewsletterSubscription(await request.json());
    return Response.json(result.body, { status: result.status });
  } catch (error) {
    console.error('Newsletter email error:', error);
    return Response.json({ error: 'تعذر تسجيل الاشتراك الآن. حاولي مرة أخرى لاحقًا.' }, { status: 500 });
  }
};

export const config: Config = { path: '/api/newsletter' };
