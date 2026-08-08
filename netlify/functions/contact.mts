import type { Config } from '@netlify/functions';
import { handleContactSubmission } from '../../server/emailApi';

export default async (request: Request) => {
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  try {
    const result = await handleContactSubmission(await request.json());
    return Response.json(result.body, { status: result.status });
  } catch (error) {
    console.error('Contact email error:', error);
    return Response.json({ error: 'تعذر إرسال الرسالة الآن. حاولي مرة أخرى لاحقًا.' }, { status: 500 });
  }
};

export const config: Config = { path: '/api/contact' };
