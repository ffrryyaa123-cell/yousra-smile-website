import { supabase } from './adminAccount';

export interface AiVideoJob { operationName: string; productId: string; aspectRatio: '9:16' | '16:9'; cacheKey?: string; }
export interface AiVideoResult { videoUrl: string; storagePath: string; model: string; aspectRatio: '9:16' | '16:9'; }

async function invoke(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('ai-product-video', { body });
  if (error) {
    let detail = error.message;
    let code = '';
    try { const body = await (error as any).context?.json(); detail = body?.error || detail; code = body?.code || ''; } catch { /* keep message */ }
    throw Object.assign(new Error(detail), { code });
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function startAiProductVideo(input: {
  productId: string; prompt: string; aspectRatio: '9:16' | '16:9'; referenceImageUrl?: string;
}): Promise<AiVideoJob> {
  if (/[^\x00-\x7F]/.test(input.prompt)) throw new Error('Video prompts must be English only.');
  const cacheKey = `ys-veo-job:${input.productId}:${input.aspectRatio}:${input.prompt}`;
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached?.job && Date.now() - cached.createdAt < 24 * 60 * 60 * 1000) return cached.job;
  } catch { /* Storage unavailable: generation still works. */ }
  const data = await invoke({ action: 'start', ...input });
  const job = { operationName: data.operationName, productId: input.productId, aspectRatio: input.aspectRatio, cacheKey };
  try { localStorage.setItem(cacheKey, JSON.stringify({ job, createdAt: Date.now() })); } catch { /* Optional resume cache. */ }
  return job;
}

export async function waitForAiProductVideo(
  job: AiVideoJob,
  onProgress?: (message: string) => void,
  timeoutMs = 12 * 60 * 1000
): Promise<AiVideoResult> {
  const started = Date.now();
  const resultKey = `ys-veo-result:${job.operationName}`;
  try {
    const cached = JSON.parse(localStorage.getItem(resultKey) || 'null');
    if (cached?.videoUrl && cached?.storagePath) return cached;
  } catch { /* Optional cache. */ }
  while (Date.now() - started < timeoutMs) {
    let data;
    try {
      data = await invoke({ action: 'status', operationName: job.operationName, productId: job.productId, aspectRatio: job.aspectRatio });
    } catch (error: any) {
      if (['VEO_FILTERED_RESULT', 'VEO_EMPTY_RESULT', 'VEO_GENERATION_FAILED'].includes(error?.code) && job.cacheKey) {
        try { localStorage.removeItem(job.cacheKey); } catch { /* Optional cache. */ }
      }
      throw error;
    }
    if (data.done) {
      try { localStorage.setItem(resultKey, JSON.stringify(data)); } catch { /* Optional cache. */ }
      return data as AiVideoResult;
    }
    onProgress?.('Veo is generating the English product clip…');
    await new Promise(resolve => setTimeout(resolve, 10_000));
  }
  throw new Error('Video generation is still running. Try checking the job again shortly.');
}

