import { supabase } from './adminAccount';

export interface AiVideoJob { operationName: string; productId: string; aspectRatio: '9:16' | '16:9'; }
export interface AiVideoResult { videoUrl: string; storagePath: string; model: string; aspectRatio: '9:16' | '16:9'; }

async function invoke(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('ai-product-video', { body });
  if (error) {
    let detail = error.message;
    try { detail = (await (error as any).context?.json())?.error || detail; } catch { /* keep message */ }
    throw new Error(detail);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function startAiProductVideo(input: {
  productId: string; prompt: string; aspectRatio: '9:16' | '16:9'; referenceImageUrl?: string;
}): Promise<AiVideoJob> {
  if (/[^\x00-\x7F]/.test(input.prompt)) throw new Error('Video prompts must be English only.');
  const data = await invoke({ action: 'start', ...input });
  return { operationName: data.operationName, productId: input.productId, aspectRatio: input.aspectRatio };
}

export async function waitForAiProductVideo(
  job: AiVideoJob,
  onProgress?: (message: string) => void,
  timeoutMs = 12 * 60 * 1000
): Promise<AiVideoResult> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const data = await invoke({ action: 'status', ...job });
    if (data.done) return data as AiVideoResult;
    onProgress?.('Veo is generating the English product clip…');
    await new Promise(resolve => setTimeout(resolve, 10_000));
  }
  throw new Error('Video generation is still running. Try checking the job again shortly.');
}

