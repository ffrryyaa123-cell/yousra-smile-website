import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const CHUNK_RELOAD_KEY = 'yousrasmile_chunk_reload_at';

const isStaleChunkError = (error: unknown) =>
  /failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module/i
    .test(error instanceof Error ? error.message : String(error));

/**
 * A deployment can replace hashed chunks while an older tab is still open.
 * Refresh once to pick up the new manifest instead of collapsing into a black
 * screen. The timestamp guard prevents reload loops for genuine code errors.
 */
export const lazyWithReload = <T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
): LazyExoticComponent<T> => lazy(async () => {
  try {
    return await loader();
  } catch (error) {
    if (isStaleChunkError(error)) {
      const now = Date.now();
      const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
      if (!Number.isFinite(lastReload) || now - lastReload > 30_000) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
        window.location.reload();
        return await new Promise<never>(() => undefined);
      }
    }
    throw error;
  }
});
