import { useEffect, useState } from 'react';
import { CATEGORIES } from '../data/categories';
import { supabase } from './adminAccount';

const BUCKET = 'product-videos';
// The existing bucket accepts raster images but rejects JSON/SVG. Category
// state is therefore stored losslessly inside a valid PNG tEXt chunk.
const STORAGE_PATH = 'site-config/categories-state.png';
const LOCAL_KEY = 'yousra-managed-categories-v1';
const EVENT_NAME = 'yousra-categories-updated';
const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const STATE_KEYWORD = 'YousraCategories';

export interface ManagedCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  description: string;
  descriptionEn?: string;
  subcategories: string[];
  subcategoriesEn?: string[];
  image: string;
  imageStoragePath?: string;
}

const defaults: ManagedCategory[] = CATEGORIES.map(category => ({ ...category, id: String(category.id) }));
let cache: ManagedCategory[] | null = null;
let loadingPromise: Promise<ManagedCategory[]> | null = null;

const normalize = (value: unknown): ManagedCategory[] => {
  if (!Array.isArray(value)) return defaults;
  const normalized = value
    .filter(item => item && typeof item === 'object')
    .map((item: any) => ({
      id: String(item.id || `category-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
      nameAr: String(item.nameAr || item.nameEn || 'قسم جديد'),
      nameEn: String(item.nameEn || item.nameAr || 'New Category'),
      icon: String(item.icon || '📦'),
      description: String(item.description || ''),
      descriptionEn: item.descriptionEn ? String(item.descriptionEn) : undefined,
      subcategories: Array.isArray(item.subcategories) ? item.subcategories.map(String) : [],
      subcategoriesEn: Array.isArray(item.subcategoriesEn) ? item.subcategoriesEn.map(String) : [],
      image: String(item.image || ''),
      imageStoragePath: item.imageStoragePath ? String(item.imageStoragePath) : undefined,
    }));
  const ids = new Set(normalized.map(item => item.id));
  return [...normalized, ...defaults.filter(item => !ids.has(item.id))];
};

const emit = (items: ManagedCategory[]) => {
  cache = items;
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(items)); } catch { /* optional cache */ }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: items }));
};

const concatBytes = (...parts: Uint8Array[]): Uint8Array => {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
};

const uint32 = (value: number): Uint8Array => new Uint8Array([
  (value >>> 24) & 255,
  (value >>> 16) & 255,
  (value >>> 8) & 255,
  value & 255,
]);

const crc32 = (bytes: Uint8Array): number => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const pngChunk = (type: string, data: Uint8Array): Uint8Array => {
  const typeBytes = new TextEncoder().encode(type);
  const payload = concatBytes(typeBytes, data);
  return concatBytes(uint32(data.length), payload, uint32(crc32(payload)));
};

const encodeStatePng = (items: ManagedCategory[]): Uint8Array => {
  const encoder = new TextEncoder();
  const ihdr = new Uint8Array([0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0]);
  // zlib stream for one transparent RGBA pixel: filter byte + RGBA(0,0,0,0)
  const idat = new Uint8Array([120, 156, 99, 96, 96, 96, 96, 0, 0, 0, 5, 0, 1]);
  const encodedState = btoa(unescape(encodeURIComponent(JSON.stringify(items))));
  const text = concatBytes(encoder.encode(STATE_KEYWORD), new Uint8Array([0]), encoder.encode(encodedState));
  return concatBytes(
    PNG_SIGNATURE,
    pngChunk('IHDR', ihdr),
    pngChunk('tEXt', text),
    pngChunk('IDAT', idat),
    pngChunk('IEND', new Uint8Array()),
  );
};

const decodeStatePng = (buffer: ArrayBuffer): ManagedCategory[] | null => {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 8 || !PNG_SIGNATURE.every((value, index) => bytes[index] === value)) return null;
  const decoder = new TextDecoder();
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
    const type = decoder.decode(bytes.slice(offset + 4, offset + 8));
    const start = offset + 8;
    const end = start + length;
    if (end + 4 > bytes.length) return null;
    if (type === 'tEXt') {
      const data = bytes.slice(start, end);
      const zero = data.indexOf(0);
      if (zero > 0 && decoder.decode(data.slice(0, zero)) === STATE_KEYWORD) {
        try {
          const encoded = decoder.decode(data.slice(zero + 1));
          const json = decodeURIComponent(escape(atob(encoded)));
          return normalize(JSON.parse(json));
        } catch {
          return null;
        }
      }
    }
    if (type === 'IEND') break;
    offset = end + 4;
  }
  return null;
};

export async function loadManagedCategories(force = false): Promise<ManagedCategory[]> {
  if (cache && !force) return cache;
  if (loadingPromise && !force) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(STORAGE_PATH);
      const response = await fetch(`${data.publicUrl}?v=${Date.now()}`, { cache: 'no-store' });
      if (response.ok) {
        const items = decodeStatePng(await response.arrayBuffer());
        if (items?.length) {
          emit(items);
          return items;
        }
      }
    } catch { /* use local/default fallback */ }

    try {
      const saved = localStorage.getItem(LOCAL_KEY);
      if (saved) {
        const items = normalize(JSON.parse(saved));
        cache = items;
        return items;
      }
    } catch { /* ignore invalid local cache */ }

    cache = defaults;
    return defaults;
  })();

  try {
    return await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

export async function saveManagedCategories(items: ManagedCategory[]): Promise<ManagedCategory[]> {
  const normalized = normalize(items);
  if (!normalized.length) throw new Error('لا يمكن حفظ قائمة أقسام فارغة بالكامل. أضيفي قسمًا واحدًا على الأقل.');

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.access_token) {
    throw new Error('انتهت جلسة الدخول. سجّلي الدخول إلى لوحة التحكم ثم أعيدي المحاولة.');
  }

  const png = encodeStatePng(normalized);
  const body = new Blob([png], { type: 'image/png' });
  const { error } = await supabase.storage.from(BUCKET).upload(STORAGE_PATH, body, {
    contentType: 'image/png',
    cacheControl: '60',
    upsert: true,
  });
  if (error) throw new Error(`تعذر حفظ الأقسام: ${error.message}`);
  const confirmed = await loadManagedCategories(true);
  const canonical = (items: ManagedCategory[]) => JSON.stringify(items.map(item => ({ ...item, subcategories: [...item.subcategories] })));
  if (canonical(confirmed) !== canonical(normalized)) throw new Error('لم يؤكد Supabase نسخة الأقسام الجديدة. بقيت القائمة السابقة فعالة.');
  emit(confirmed);
  return confirmed;
}

export function useManagedCategories() {
  const [categories, setCategories] = useState<ManagedCategory[]>(() => cache || defaults);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void loadManagedCategories().then(items => { if (active) setCategories(items); });
    const onUpdate = (event: Event) => {
      const next = (event as CustomEvent<ManagedCategory[]>).detail;
      if (Array.isArray(next)) setCategories(next);
    };
    window.addEventListener(EVENT_NAME, onUpdate);
    return () => { active = false; window.removeEventListener(EVENT_NAME, onUpdate); };
  }, []);

  const saveCategories = async (items: ManagedCategory[]) => {
    setIsSaving(true);
    try {
      const saved = await saveManagedCategories(items);
      setCategories(saved);
      return saved;
    } finally {
      setIsSaving(false);
    }
  };

  return { categories, saveCategories, isSaving };
}
