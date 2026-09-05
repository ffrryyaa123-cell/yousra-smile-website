import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MODEL = Deno.env.get('VEO_MODEL') || 'veo-3.1-generate-preview';
const BUCKET = 'product-videos';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...CORS, 'Content-Type': 'application/json' }
});
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const decodeBase64 = (value: string) => Uint8Array.from(atob(value), char => char.charCodeAt(0));
async function decryptStoredKey(ciphertext: string, iv: string) {
  const seed = new TextEncoder().encode(`yousra-smile-ai:${SERVICE_ROLE_KEY}`);
  const digest = await crypto.subtle.digest('SHA-256', seed);
  const key = await crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decodeBase64(iv) }, key, decodeBase64(ciphertext));
  return new TextDecoder().decode(plain);
}

async function getGeminiKey() {
  const environmentKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY');
  if (environmentKey) return environmentKey;
  const { data } = await admin.from('ai_provider_settings')
    .select('secret_ciphertext, secret_iv')
    .eq('provider', 'gemini').maybeSingle();
  if (!data?.secret_ciphertext || !data?.secret_iv) return '';
  try { return await decryptStoredKey(data.secret_ciphertext, data.secret_iv); }
  catch { return ''; }
}

async function caller(req: Request) {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data } = await admin.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (!email) return null;
  const { data: profile } = await admin.from('admin_users')
    .select('role, active, permissions').eq('email', email).maybeSingle();
  if (!profile?.active) return null;
  const permissions = Array.isArray(profile.permissions) ? profile.permissions : [];
  const allowed = profile.role === 'owner' || profile.role === 'editor' ||
    permissions.some((p: string) => ['manage_media', 'ai_tools'].includes(p));
  return allowed ? { email } : null;
}

const safeId = (value: string) => value.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 80);
const googleError = (status: number, body: any) => {
  const detail = body?.error?.message || `Google returned HTTP ${status}`;
  if (status === 429 || /quota|billing|paid tier|credits|resource_exhausted/i.test(detail)) {
    return { status: 402, code: 'GOOGLE_BILLING_OR_QUOTA', message: detail };
  }
  if (status === 403 || /permission|not available|access/i.test(detail)) {
    return { status: 403, code: 'VEO_ACCESS_REQUIRED', message: detail };
  }
  return { status: 502, code: 'VEO_REQUEST_FAILED', message: detail };
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const actor = await caller(req);
  if (!actor) return json({ error: 'غير مصرح لك بتوليد الفيديو.' }, 403);
  const geminiApiKey = await getGeminiKey();
  if (!geminiApiKey) return json({ error: 'Google AI key is not configured.', code: 'GOOGLE_KEY_MISSING' }, 503);
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || 'start');

  if (action === 'start') {
    const productId = safeId(String(body.productId || ''));
    const prompt = String(body.prompt || '').trim();
    const aspectRatio = body.aspectRatio === '16:9' ? '16:9' : '9:16';
    if (!productId || !prompt) return json({ error: 'productId and prompt are required.' }, 400);
    if (/[^\x00-\x7F]/.test(prompt)) return json({ error: 'Video prompts, narration and on-screen text must be English only.' }, 422);
    const guardedPrompt = `${prompt}\n\nSafety and brand requirements: English voice-over and English on-screen text only. Use real animation and natural product motion, not a slideshow. If any woman or presenter appears, she must be an adult hijabi woman wearing modern modest clothing. Preserve the verified product design and do not invent claims, prices, accessories, or results.`;
    const instance: any = { prompt: guardedPrompt };
    const referenceImageUrl = String(body.referenceImageUrl || '');
    if (referenceImageUrl.startsWith('https://')) {
      const imageResponse = await fetch(referenceImageUrl, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
      const mimeType = (imageResponse.headers.get('content-type') || '').split(';')[0];
      if (imageResponse.ok && mimeType.startsWith('image/')) {
        const imageBytes = new Uint8Array(await imageResponse.arrayBuffer());
        if (imageBytes.length <= 12 * 1024 * 1024) {
          let binary = '';
          for (let i = 0; i < imageBytes.length; i += 0x8000) binary += String.fromCharCode(...imageBytes.subarray(i, i + 0x8000));
          instance.image = { bytesBase64Encoded: btoa(binary), mimeType };
        }
      }
    }
    const payload: any = {
      instances: [instance],
      parameters: { aspectRatio, numberOfVideos: 1, resolution: '720p', durationSeconds: 8 }
    };
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predictLongRunning`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiApiKey },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(120000)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.name) {
      const e = googleError(response.status, result);
      return json({ error: e.message, code: e.code, model: MODEL }, e.status);
    }
    return json({ success: true, operationName: result.name, productId, aspectRatio, model: MODEL });
  }

  if (action === 'status') {
    const operationName = String(body.operationName || '');
    const productId = safeId(String(body.productId || ''));
    const aspectRatio = body.aspectRatio === '16:9' ? '16:9' : '9:16';
    if (!/^(?:models\/[a-zA-Z0-9._-]+\/)?operations\/[a-zA-Z0-9._-]+$/.test(operationName) || !productId) return json({ error: 'Invalid video job.' }, 400);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${operationName}`, {
      headers: { 'x-goog-api-key': geminiApiKey }, signal: AbortSignal.timeout(30000)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const e = googleError(response.status, result);
      return json({ error: e.message, code: e.code }, e.status);
    }
    if (!result.done) return json({ success: true, done: false, operationName });
    if (result.error) return json({ error: result.error.message || 'Veo generation failed.', code: 'VEO_GENERATION_FAILED' }, 502);
    const video = result.response?.generateVideoResponse?.generatedSamples?.[0]?.video ||
      result.response?.generatedVideos?.[0]?.video;
    const uri = video?.uri;
    if (!uri) return json({ error: 'Veo completed without a downloadable video.', code: 'VEO_EMPTY_RESULT' }, 502);
    const download = await fetch(uri, { headers: { 'x-goog-api-key': geminiApiKey }, redirect: 'follow' });
    if (!download.ok) return json({ error: `Video download failed (${download.status}).` }, 502);
    const bytes = new Uint8Array(await download.arrayBuffer());
    const path = `${productId}/ai/${Date.now()}-${aspectRatio.replace(':', '-')}.mp4`;
    const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: 'video/mp4', cacheControl: '31536000', upsert: false
    });
    if (error) return json({ error: `Storage upload failed: ${error.message}` }, 500);
    const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
    return json({ success: true, done: true, videoUrl: data.publicUrl, storagePath: path, model: MODEL, aspectRatio });
  }

  return json({ error: 'Unknown action.' }, 400);
});

