import type { Config } from '@netlify/functions';
import { handleStaffReply } from '../../server/emailApi';

export default async (request: Request) => {
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  try {
    const result = await handleStaffReply(
      await request.json(),
      request.headers.get('authorization') || undefined,
    );
    return Response.json(result.body, { status: result.status });
  } catch (error) {
    console.error('Admin reply email error:', error);
    return Response.json({ error: 'تعذر إرسال الرد الآن.' }, { status: 500 });
  }
};

export const config: Config = { path: '/api/admin/reply' };
