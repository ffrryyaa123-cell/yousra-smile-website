const allowedOrigins = new Set(['https://yousrasmile.com', 'https://www.yousrasmile.com']);
// SHA-256 of the site's existing PUBLIC browser key, not a server credential.
const browserKeyHash = '1587d77956d356f52afa6cfd106df9cefd37b5650f4b548d17b3cc787cb33af6';
const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2,'0')).join('');

Deno.serve(async req => {
  const origin = req.headers.get('origin') || '';
  const headers = {
    'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'https://yousrasmile.com',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin'
  };
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), {status,headers});
  if (!allowedOrigins.has(origin)) return reply(403,{error:'Origin not allowed'});
  if (req.method === 'OPTIONS') return new Response(null,{status:204,headers});
  if (req.method !== 'POST') return reply(405,{error:'POST required'});
  // Custom publishable-key authentication permits anonymous site visitors,
  // but never authorizes catalog edits or arbitrary counter values.
  const suppliedKey = req.headers.get('apikey') || '';
  if (hex(await crypto.subtle.digest('SHA-256',encoder.encode(suppliedKey))) !== browserKeyHash)
    return reply(401,{error:'Invalid browser key'});
  try {
    if (Number(req.headers.get('content-length') || 0)>1024) return reply(413,{error:'Body too large'});
    const text = await req.text();
    if (text.length>1024) return reply(413,{error:'Body too large'});
    const {videoId,sessionId} = JSON.parse(text);
    if (typeof videoId !== 'string' || !/^[\w.-]{1,240}$/.test(videoId) ||
        typeof sessionId !== 'string' || !/^[0-9a-f-]{36}$/i.test(sessionId)) return reply(400,{error:'Invalid event'});
    const url = Deno.env.get('SUPABASE_URL');
    const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !secret) return reply(503,{error:'Measurement unavailable'});
    const signingKey = await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    const hash = async (value: string) => hex(await crypto.subtle.sign('HMAC',signingKey,encoder.encode(`review-opens-v1:${value}`)));
    const network = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    const sessionHash = await hash(`session:${sessionId}`);
    const rateHash = await hash(`network:${network}:${new Date().toISOString().slice(0,10)}`);
    const response = await fetch(`${url}/rest/v1/rpc/record_review_open`,{
      method:'POST',headers:{apikey:secret,Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},
      body:JSON.stringify({p_video_id:videoId,p_session_hash:sessionHash,p_rate_hash:rateHash}),signal:AbortSignal.timeout(8000)
    });
    if (!response.ok) return reply(503,{error:'Measurement unavailable'});
    const result = await response.json();
    return reply(result.limited ? 429 : result.unavailable ? 404 : 200,result);
  } catch { return reply(400,{error:'Could not record event'}); }
});
