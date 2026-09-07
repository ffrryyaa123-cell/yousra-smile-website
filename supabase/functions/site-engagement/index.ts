const origins = new Set(['https://yousrasmile.com','https://www.yousrasmile.com']);
const publicKeyHash = '1587d77956d356f52afa6cfd106df9cefd37b5650f4b548d17b3cc787cb33af6';
const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
const uuid = (s: unknown) => typeof s==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const pages = new Set(['home','products','videos','deals','favorites','cart','compare','about','contact','privacy','terms','cookies','disclosure']);
Deno.serve(async req => {
 const origin=req.headers.get('origin')||'';
 const headers={'Access-Control-Allow-Origin':origins.has(origin)?origin:'https://yousrasmile.com','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
 const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers});
 if(!origins.has(origin)) return reply(403,{error:'Origin not allowed'});
 if(req.method==='OPTIONS') return new Response(null,{status:204,headers});
 if(req.method!=='POST') return reply(405,{error:'POST required'});
 // Public browser credential, NOT admin authority. Counts are computed server-side.
 if(hex(await crypto.subtle.digest('SHA-256',encoder.encode(req.headers.get('apikey')||'')))!==publicKeyHash) return reply(401,{error:'Invalid browser key'});
 try {
  if(Number(req.headers.get('content-length')||0)>2048) return reply(413,{error:'Body too large'});
  const raw=await req.text(); if(raw.length>2048) return reply(413,{error:'Body too large'});
  const e=JSON.parse(raw);
  if(!uuid(e.eventId)||!uuid(e.visitorId)||!uuid(e.sessionId)||!['page_view','product_view','affiliate_click'].includes(e.kind)||!pages.has(e.page)) return reply(400,{error:'Invalid event'});
  if(e.kind!=='page_view' && (typeof e.productId!=='string'||!/^[-\w.]{1,240}$/.test(e.productId))) return reply(400,{error:'Invalid product'});
  if(e.kind==='affiliate_click' && !['amazon','aliexpress'].includes(e.platform)) return reply(400,{error:'Invalid platform'});
  const url=Deno.env.get('SUPABASE_URL'),secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!secret) return reply(503,{error:'Measurement unavailable'});
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const hash=async(value:string)=>hex(await crypto.subtle.sign('HMAC',key,encoder.encode('site-activity-v1:'+value)));
  const network=(req.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim();
  const result=await fetch(url+'/rest/v1/rpc/record_site_activity',{method:'POST',headers:{apikey:secret,Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:JSON.stringify({
   p_event_id:e.eventId,p_visitor_hash:await hash('visitor:'+e.visitorId),p_session_hash:await hash('session:'+e.sessionId),
   p_rate_hash:await hash('network:'+network+':'+new Date().toISOString().slice(0,10)),p_kind:e.kind,p_page:e.page,
   p_product_id:e.kind==='page_view'?null:e.productId,p_platform:e.kind==='affiliate_click'?e.platform:null
  }),signal:AbortSignal.timeout(8000)});
  if(!result.ok) return reply(503,{error:'Measurement unavailable'});
  const data=await result.json(); return reply(data.limited?429:data.unavailable?404:data.invalid?400:200,data);
 } catch {return reply(400,{error:'Could not record event'});}
});
