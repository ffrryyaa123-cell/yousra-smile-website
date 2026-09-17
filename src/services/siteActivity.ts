import { adminAccount, supabase } from './adminAccount';
import { getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

type EventKind = 'page_view' | 'product_view' | 'affiliate_click';
const fallbackVisitor = crypto.randomUUID();
const fallbackSession = crypto.randomUUID();
const validId = (id: unknown): id is string => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id);
let adminCheck: Promise<boolean> | null = null;
let adminCheckedAt = 0;
adminAccount.onSessionChange(() => { adminCheck = null; });

function identity() {
  let visitorId: string = fallbackVisitor, sessionId: string = fallbackSession;
  try {
    const raw = JSON.parse(localStorage.getItem('yousra-visitor-v1') || 'null');
    if (raw && validId(raw.id) && raw.expires > Date.now()) visitorId = raw.id;
    else localStorage.setItem('yousra-visitor-v1', JSON.stringify({id:visitorId, expires:Date.now()+30*86400000}));
    const session = sessionStorage.getItem('yousra-session-v1');
    if (validId(session)) sessionId = session;
    else sessionStorage.setItem('yousra-session-v1',sessionId);
  } catch { /* Blocked storage is allowed; counts become less stable. */ }
  return {visitorId, sessionId};
}

export async function recordSiteActivity(kind: EventKind, page: string, productId?: string, platform?: 'amazon' | 'aliexpress') {
  if (page === 'admin' || navigator.doNotTrack === '1' || document.visibilityState === 'hidden') return;
  try {
    // Exclusion only, never an authorization decision. Dashboard access still
    // depends on the existing auth/RLS rules.
    const firebaseEmail = getApps().length ? getAuth().currentUser?.email?.toLowerCase() : '';
    if (firebaseEmail && ['ffrryyaa123@gmail.com','sarsar336699@gmail.com'].includes(firebaseEmail)) return;
    if (!adminCheck || Date.now()-adminCheckedAt > 30000) {
      adminCheckedAt = Date.now();
      adminCheck = adminAccount.loadProfile().then(profile => Boolean(profile));
    }
    if (await adminCheck) return;
    const body = {eventId:crypto.randomUUID(), ...identity(), kind, page, productId, platform};
    await supabase.functions.invoke('site-engagement',{body});
  } catch { /* Measurement failure never blocks browsing or an affiliate link. */ }
}

export interface ActivityReport {
  days:number;
  totals:{visitors:number;sessions:number;page_views:number;product_views:number;clicks:number};
  products:Array<{product_id:string;views:number;amazon_clicks:number;aliexpress_clicks:number}>;
  first_event:string|null;
  catalog:{products:number;public_products:number;reviews:number};
  sales:null; commissions:null;
}
export async function loadActivityReport(days:number): Promise<ActivityReport> {
  const {data,error}=await supabase.rpc('site_activity_report',{p_days:days});
  if(error || !data?.totals) throw error || new Error('الإحصائيات غير متاحة');
  return data;
}
