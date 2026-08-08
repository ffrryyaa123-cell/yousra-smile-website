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

export const submitContactMessage = (body: {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
}) => postJson<{ success: true; saved?: boolean; emailed?: boolean }>('/api/contact', body);

export const subscribeToNewsletter = (email: string, website = '') =>
  postJson<{ success: true; saved?: boolean; emailed?: boolean }>('/api/newsletter', { email, website });

export const sendContactReply = (
  body: { messageId: string; message: string },
  token: string,
) => postJson<{ success: true; statusUpdated: boolean }>('/api/admin/reply', body, token);
