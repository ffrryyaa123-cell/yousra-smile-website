import { requireSupabase } from './supabase';

const postJson = async <T>(url: string, body: Record<string, unknown>, token?: string): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'تعذر الاتصال بخدمة البريد.');
  }
  return payload as T;
};

export const submitContactMessage = async (body: {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
}) => {
  const database = requireSupabase();
  const { error } = await database.from('contact_messages').insert({
    name: body.name.trim(),
    email: body.email.trim().toLowerCase(),
    subject: body.subject.trim(),
    message: body.message.trim(),
    status: 'new',
  });

  if (error) throw new Error(error.message || 'تعذر حفظ الرسالة.');
  return { success: true as const, saved: true, emailed: false };
};

export const subscribeToNewsletter = async (email: string, website = '') => {
  if (website.trim()) return { success: true as const, saved: false, emailed: false };

  const database = requireSupabase();
  const { error } = await database.from('newsletter_subscribers').insert({
    email: email.trim().toLowerCase(),
    status: 'active',
    source: 'website',
  });

  if (error && error.code !== '23505') throw new Error(error.message || 'تعذر تسجيل الاشتراك.');
  return { success: true as const, saved: !error, emailed: false };
};

export const sendContactReply = (
  body: { messageId: string; message: string },
  token: string,
) => postJson<{ success: true; statusUpdated: boolean }>('/api/admin/reply', body, token);
