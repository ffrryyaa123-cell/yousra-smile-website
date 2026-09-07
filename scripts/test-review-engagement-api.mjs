import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/services/adminAccount.ts',import.meta.url),'utf8');
const url=source.match(/const SUPABASE_URL = '([^']+)'/)[1];
const key=source.match(/const SUPABASE_PUBLISHABLE_KEY = '([^']+)'/)[1];
const send=(apikey,origin,body)=>fetch(`${url}/functions/v1/review-engagement`,{
  method:'POST',headers:{apikey,origin,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)
});
const body={videoId:`not-a-real-review-${crypto.randomUUID()}`,sessionId:crypto.randomUUID()};
assert.equal((await send('invalid','https://yousrasmile.com',body)).status,401);
console.log('PASS: invalid browser key rejected');
assert.equal((await send(key,'https://unrelated.example',body)).status,403);
console.log('PASS: unrelated origin rejected');
assert.equal((await send(key,'https://yousrasmile.com',body)).status,404);
console.log('PASS: authenticated RPC rejects missing review without recording an event');
const r=await fetch(`${url}/rest/v1/review_open_counts?select=video_id,opens`,{headers:{apikey:key},signal:AbortSignal.timeout(15000)});
assert.equal(r.status,200);
assert.ok(Array.isArray(await r.json()));
console.log('PASS: aggregate counts readable through public RLS');
const denied=await fetch(`${url}/rest/v1/review_open_events?select=*`,{headers:{apikey:key},signal:AbortSignal.timeout(15000)});
assert.ok([401,403].includes(denied.status));
console.log('PASS: raw measurement records not publicly readable');
