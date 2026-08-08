import { createClient } from '@supabase/supabase-js';
import {
  ContactSubmission,
  sendContactNotification,
  sendNewsletterConfirmation,
  sendStaffReply,
} from './emailService';

export interface ApiResult {
  status: number;
  body: Record<string, unknown>;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STAFF_ROLES = new Set(['owner', 'admin', 'editor']);

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const publicKey =
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
    || process.env.SUPABASE_ANON_KEY?.trim()
    || process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
    || process.env.VITE_SUPABASE_ANON_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  return { url, publicKey, serviceKey };
};

const createServerClient = (key: string, authorization?: string) => {
  const { url } = getSupabaseConfig();
  if (!url) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    ...(authorization
      ? { global: { headers: { Authorization: authorization } } }
      : {}),
  });
};

const getSubmissionClient = () => {
  const { publicKey, serviceKey } = getSupabaseConfig();
  const key = serviceKey || publicKey;
  if (!key) return null;

  const client = createServerClient(key);
  return client ? { client, privileged: Boolean(serviceKey) } : null;
};

const cleanText = (value: unknown, maxLength: number) => String(value ?? '').trim().slice(0, maxLength);
const cleanEmail = (value: unknown) => cleanText(value, 320).toLowerCase();

const validateContact = (input: Record<string, unknown>): ContactSubmission | null => {
  const submission = {
    name: cleanText(input.name, 120),
    email: cleanEmail(input.email),
    subject: cleanText(input.subject, 200),
    message: cleanText(input.message, 5000),
  };

  if (!submission.name || !EMAIL_PATTERN.test(submission.email) || !submission.subject || !submission.message) {
    return null;
  }
  return submission;
};

const trySend = async (operation: () => Promise<boolean>, label: string) => {
  try {
    return await operation();
  } catch (error) {
    console.error(`${label} delivery failed:`, error);
    return false;
  }
};

export const handleContactSubmission = async (input: Record<string, unknown>): Promise<ApiResult> => {
  if (cleanText(input.website, 200)) return { status: 200, body: { success: true } };

  const submission = validateContact(input);
  if (!submission) {
    return { status: 400, body: { error: 'يرجى تعبئة جميع الحقول ببريد إلكتروني صحيح.' } };
  }

  const database = getSubmissionClient();
  if (!database) {
    return { status: 503, body: { error: 'اتصال قاعدة البيانات غير مفعّل على الخادم.' } };
  }

  const { error } = await database.client.from('contact_messages').insert({
    name: submission.name,
    email: submission.email,
    subject: submission.subject,
    message: submission.message,
    status: 'new',
  });
  if (error) {
    console.error('Contact message database write failed:', error);
    return {
      status: 503,
      body: { error: 'تعذر حفظ الرسالة الآن بسبب عدم توفر اتصال قاعدة البيانات.' },
    };
  }

  const emailed = await trySend(
    () => sendContactNotification(submission),
    'Contact notification',
  );

  return { status: 200, body: { success: true, saved: true, emailed } };
};

export const handleNewsletterSubscription = async (input: Record<string, unknown>): Promise<ApiResult> => {
  if (cleanText(input.website, 200)) return { status: 200, body: { success: true } };
  const email = cleanEmail(input.email);
  if (!EMAIL_PATTERN.test(email)) {
    return { status: 400, body: { error: 'يرجى إدخال بريد إلكتروني صحيح.' } };
  }

  const database = getSubmissionClient();
  if (!database) {
    return { status: 503, body: { error: 'اتصال قاعدة البيانات غير مفعّل على الخادم.' } };
  }

  const { error } = await database.client.from('newsletter_subscribers').insert({
    email,
    status: 'active',
    source: 'website',
  });

  const alreadySubscribed = error?.code === '23505';
  if (error && !alreadySubscribed) {
    console.error('Newsletter database write failed:', error);
    return {
      status: 503,
      body: { error: 'تعذر تسجيل الاشتراك الآن بسبب عدم توفر اتصال قاعدة البيانات.' },
    };
  }

  if (alreadySubscribed && database.privileged) {
    const { error: updateError } = await database.client
      .from('newsletter_subscribers')
      .update({ status: 'active', unsubscribed_at: null, updated_at: new Date().toISOString() })
      .eq('email', email);
    if (updateError) {
      console.error('Newsletter reactivation failed:', updateError);
      return {
        status: 503,
        body: { error: 'تعذر إعادة تفعيل الاشتراك الآن.' },
      };
    }
  }

  const emailed = alreadySubscribed
    ? false
    : await trySend(() => sendNewsletterConfirmation(email), 'Newsletter confirmation');

  return {
    status: 200,
    body: { success: true, saved: true, alreadySubscribed, emailed },
  };
};

const authorizeStaff = async (authorization: string | undefined) => {
  const token = authorization?.replace(/^Bearer\s+/i, '').trim();
  const { publicKey, serviceKey } = getSupabaseConfig();
  const key = publicKey || serviceKey;
  if (!token || !key) return null;

  const client = createServerClient(key, `Bearer ${token}`);
  if (!client) return null;

  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) return null;

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role, is_active')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !profile?.is_active || !STAFF_ROLES.has(profile.role)) return null;
  return { client, user: userData.user };
};

export const handleStaffReply = async (
  input: Record<string, unknown>,
  authorization?: string,
): Promise<ApiResult> => {
  const staff = await authorizeStaff(authorization);
  if (!staff) return { status: 401, body: { error: 'يجب تسجيل الدخول بحساب إدارة صالح.' } };

  const messageId = cleanText(input.messageId, 36);
  const message = cleanText(input.message, 5000);
  if (!UUID_PATTERN.test(messageId) || !message) {
    return { status: 400, body: { error: 'بيانات الرد غير مكتملة.' } };
  }

  const { data: contactMessage, error: contactError } = await staff.client
    .from('contact_messages')
    .select('email, subject')
    .eq('id', messageId)
    .single();
  if (contactError || !contactMessage) {
    return { status: 404, body: { error: 'لم يعد سجل الرسالة متاحًا.' } };
  }

  const to = cleanEmail(contactMessage.email);
  const subject = cleanText(contactMessage.subject, 200);
  if (!EMAIL_PATTERN.test(to) || !subject) {
    return { status: 422, body: { error: 'بيانات البريد المخزنة لهذه الرسالة غير صالحة.' } };
  }

  const emailed = await trySend(() => sendStaffReply(to, subject, message), 'Staff reply');
  if (!emailed) {
    return { status: 503, body: { error: 'إعدادات SMTP غير موجودة أو تعذر الاتصال بخادم البريد.' } };
  }

  const { error: updateError } = await staff.client
    .from('contact_messages')
    .update({ status: 'replied', replied_at: new Date().toISOString(), assigned_to: staff.user.id })
    .eq('id', messageId);

  if (updateError) {
    console.error('Reply sent but message status update failed:', updateError);
  }

  return { status: 200, body: { success: true, statusUpdated: !updateError } };
};
