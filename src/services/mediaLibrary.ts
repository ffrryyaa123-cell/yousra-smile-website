import { useEffect, useState } from 'react';
import { supabase } from './adminAccount';
import { SITE_BRAND_ASSETS } from '../config/siteBrand';

const BUCKET = 'product-videos';
const FOLDER = 'media-library';
const STATE_PATH = 'site-config/media-library-state.png';
const LOCAL_KEY = 'yousra-media-library-v3';
const EVENT_NAME = 'yousra-media-library-updated';
const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const STATE_KEYWORD = 'YousraMediaLibrary';

export type MediaPlacement = 'none' | 'siteLogo' | 'heroBanner' | 'smartHomeBanner' | 'creatorAvatar';

export interface MediaLibraryItem {
  id: string;
  name: string;
  url: string;
  type: 'logo' | 'banner' | 'product' | 'other';
  storagePath?: string;
  placement?: MediaPlacement;
}

export interface MediaLibraryState { items: MediaLibraryItem[]; updatedAt: string; }

const defaults: MediaLibraryState = {
  items: [
    { id: 'brand-smart-home', name: 'شعار Smart Home', url: SITE_BRAND_ASSETS.siteLogo, type: 'logo', placement: 'siteLogo' },
    { id: 'brand-yousra-avatar', name: 'أفاتار يسرى YS LUXE', url: SITE_BRAND_ASSETS.creatorAvatar, type: 'logo', placement: 'creatorAvatar' },
    { id: 'brand-main-hero', name: 'بانر المنزل الذكي الرئيسي', url: SITE_BRAND_ASSETS.heroBanner, type: 'banner', placement: 'heroBanner' },
  ],
  updatedAt: new Date(0).toISOString(),
};

let cache: MediaLibraryState | null = null;
let loadingPromise: Promise<MediaLibraryState> | null = null;

const normalizeState = (value: unknown): MediaLibraryState => {
  const raw = value && typeof value === 'object' ? value as Partial<MediaLibraryState> : {};
  const items = Array.isArray(raw.items) ? raw.items.filter(item => item && typeof item === 'object' && /^https:\/\//i.test(String(item.url || ''))).map(item => ({
    id: String(item.id || crypto.randomUUID()), name: String(item.name || 'صورة'), url: String(item.url),
    type: ['logo', 'banner', 'product', 'other'].includes(item.type) ? item.type : 'other',
    storagePath: item.storagePath ? String(item.storagePath) : undefined,
    placement: ['none', 'siteLogo', 'heroBanner', 'smartHomeBanner', 'creatorAvatar'].includes(String(item.placement)) ? item.placement : 'none',
  } as MediaLibraryItem)) : defaults.items;
  return { items: items.length ? items : defaults.items, updatedAt: String(raw.updatedAt || new Date().toISOString()) };
};

const concatBytes = (...parts: Uint8Array[]) => { const size = parts.reduce((sum, part) => sum + part.length, 0); const output = new Uint8Array(size); let offset = 0; for (const part of parts) { output.set(part, offset); offset += part.length; } return output; };
const uint32 = (value: number) => new Uint8Array([(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255]);
const crc32 = (bytes: Uint8Array) => { let crc = 0xffffffff; for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); } return (crc ^ 0xffffffff) >>> 0; };
const pngChunk = (type: string, data: Uint8Array) => { const typeBytes = new TextEncoder().encode(type); const payload = concatBytes(typeBytes, data); return concatBytes(uint32(data.length), payload, uint32(crc32(payload))); };
const encodeStatePng = (state: MediaLibraryState) => {
  const encoder = new TextEncoder();
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
  const text = concatBytes(encoder.encode(STATE_KEYWORD), new Uint8Array([0]), encoder.encode(encoded));
  return concatBytes(PNG_SIGNATURE, pngChunk('IHDR', new Uint8Array([0,0,0,1,0,0,0,1,8,6,0,0,0])), pngChunk('tEXt', text), pngChunk('IDAT', new Uint8Array([120,156,99,96,96,96,96,0,0,0,5,0,1])), pngChunk('IEND', new Uint8Array()));
};
const decodeStatePng = (buffer: ArrayBuffer): MediaLibraryState | null => {
  const bytes = new Uint8Array(buffer); if (bytes.length < 8 || !PNG_SIGNATURE.every((value, index) => bytes[index] === value)) return null;
  const decoder = new TextDecoder(); let offset = 8;
  while (offset + 12 <= bytes.length) { const length = ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0; const type = decoder.decode(bytes.slice(offset + 4, offset + 8)); const start = offset + 8; const end = start + length; if (end + 4 > bytes.length) return null; if (type === 'tEXt') { const data = bytes.slice(start, end); const zero = data.indexOf(0); if (zero > 0 && decoder.decode(data.slice(0, zero)) === STATE_KEYWORD) { try { return normalizeState(JSON.parse(decodeURIComponent(escape(atob(decoder.decode(data.slice(zero + 1))))))); } catch { return null; } } } if (type === 'IEND') break; offset = end + 4; }
  return null;
};

const emit = (state: MediaLibraryState) => { cache = state; try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); } catch { /* cache only */ } window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: state })); };

export async function loadMediaLibraryState(force = false): Promise<MediaLibraryState> {
  if (cache && !force) return cache;
  if (loadingPromise && !force) return loadingPromise;
  loadingPromise = (async () => {
    try { const { data } = supabase.storage.from(BUCKET).getPublicUrl(STATE_PATH); const response = await fetch(`${data.publicUrl}?v=${Date.now()}`, { cache: 'no-store' }); if (response.ok) { const decoded = decodeStatePng(await response.arrayBuffer()); if (decoded) { emit(decoded); return decoded; } } } catch { /* fallback below */ }
    try { const saved = localStorage.getItem(LOCAL_KEY); if (saved) return normalizeState(JSON.parse(saved)); } catch { /* invalid cache */ }
    cache = defaults; return defaults;
  })();
  try { return await loadingPromise; } finally { loadingPromise = null; }
}

export async function saveMediaLibraryState(items: MediaLibraryItem[]): Promise<MediaLibraryState> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.access_token) throw new Error('انتهت جلسة الدخول. سجّلي الدخول ثم أعيدي المحاولة.');
  const state = normalizeState({ items, updatedAt: new Date().toISOString() });
  const body = new Blob([encodeStatePng(state)], { type: 'image/png' });
  const { error } = await supabase.storage.from(BUCKET).upload(STATE_PATH, body, { contentType: 'image/png', cacheControl: '60', upsert: true });
  if (error) throw new Error(`تعذر حفظ ربط الصور: ${error.message}`);
  const confirmed = await loadMediaLibraryState(true);
  if (confirmed.updatedAt !== state.updatedAt) throw new Error('لم يؤكد Supabase نسخة إعداد الصور الجديدة.');
  emit(confirmed); return confirmed;
}

export function mediaPlacementSettings(state: MediaLibraryState) {
  const byPlacement = (placement: MediaPlacement) => state.items.find(item => item.placement === placement)?.url;
  return { siteLogo: byPlacement('siteLogo') || SITE_BRAND_ASSETS.siteLogo, creatorAvatarUrl: byPlacement('creatorAvatar') || SITE_BRAND_ASSETS.creatorAvatar, heroBannerUrl: byPlacement('heroBanner') || SITE_BRAND_ASSETS.heroBanner, smartHomeBannerUrl: byPlacement('smartHomeBanner') };
}

export function useMediaLibrary() {
  const [state, setState] = useState<MediaLibraryState>(() => cache || defaults);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => { let active = true; void loadMediaLibraryState().then(next => { if (active) setState(next); }); const listener = (event: Event) => setState((event as CustomEvent<MediaLibraryState>).detail); window.addEventListener(EVENT_NAME, listener); return () => { active = false; window.removeEventListener(EVENT_NAME, listener); }; }, []);
  const save = async (items: MediaLibraryItem[]) => { setIsSaving(true); try { const next = await saveMediaLibraryState(items); setState(next); return next; } finally { setIsSaving(false); } };
  return { state, items: state.items, save, isSaving };
}

const safeFileName = (name: string) => {
  const ext = (name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const base = name.replace(/\.[^.]+$/, '').normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'image';
  return `${base}.${ext}`;
};

export async function uploadMediaLibraryImage(file: File): Promise<{ url: string; storagePath: string }> {
  if (!file || file.size === 0) throw new Error('ملف الصورة فارغ.');
  if (!file.type.startsWith('image/')) throw new Error('اختاري ملف صورة فقط.');
  if (file.size > 15 * 1024 * 1024) throw new Error('حجم الصورة أكبر من 15MB. اختاري صورة أصغر.');
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.access_token) throw new Error('انتهت جلسة الدخول. سجّلي الدخول إلى لوحة التحكم ثم أعيدي المحاولة.');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const storagePath = `${FOLDER}/${stamp}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, { contentType: file.type || 'image/jpeg', cacheControl: '31536000', upsert: false });
  if (error) throw new Error(`تعذر رفع الصورة: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return { url: data.publicUrl, storagePath };
}

export async function deleteMediaLibraryImage(storagePath?: string): Promise<void> {
  if (!storagePath) return;
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) throw new Error(`تعذر حذف ملف الصورة: ${error.message}`);
}
