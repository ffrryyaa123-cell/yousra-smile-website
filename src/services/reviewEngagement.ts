import { supabase } from './adminAccount';
const sent = new Set<string>();
const temporarySession = crypto.randomUUID();
function sessionId() {
  try {
    const key = 'yousra-review-measurement-session-v1';
    const stored = sessionStorage.getItem(key);
    if (stored && /^[0-9a-f-]{36}$/i.test(stored)) return stored;
    sessionStorage.setItem(key, temporarySession);
  } catch { /* A blocked storage API must not block the review. */ }
  return temporarySession;
}
export async function recordReviewOpen(videoId: string) {
  if (navigator.doNotTrack === '1') return;
  if (sent.has(videoId)) return;
  sent.add(videoId);
  try {
    const { data, error } = await supabase.functions.invoke('review-engagement', {body:{videoId,sessionId:sessionId()}});
    if (error || typeof data?.opens !== 'number') { sent.delete(videoId); return; }
    window.dispatchEvent(new CustomEvent('review-count-updated',{detail:{videoId,opens:data.opens}}));
  } catch { sent.delete(videoId); }
}
export async function loadReviewCounts(): Promise<Record<string,number>> {
  const {data,error} = await supabase.from('review_open_counts').select('video_id,opens');
  if (error) throw error;
  return Object.fromEntries((data || []).map(row => [row.video_id,Number(row.opens)]));
}
