import { useEffect, useState } from 'react';
import { CATEGORIES } from '../data/categories';
import { supabase } from './adminAccount';

const BUCKET = 'product-videos';
// This bucket is configured for image/video MIME types, so category state is
// stored inside an SVG metadata element rather than as application/json.
const STORAGE_PATH = 'site-config/categories-state.svg';
const LOCAL_KEY = 'yousra-managed-categories-v1';
const EVENT_NAME = 'yousra-categories-updated';

export interface ManagedCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  description: string;
  subcategories: string[];
  image: string;
  imageStoragePath?: string;
}

const defaults: ManagedCategory[] = CATEGORIES.map(category => ({ ...category, id: String(category.id) }));
let cache: ManagedCategory[] | null = null;
let loadingPromise: Promise<ManagedCategory[]> | null = null;

const normalize = (value: unknown): ManagedCategory[] => {
  if (!Array.isArray(value)) return defaults;
  return value
    .filter(item => item && typeof item === 'object')
    .map((item: any) => ({
      id: String(item.id || `category-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
      nameAr: String(item.nameAr || item.nameEn || 'قسم جديد'),
      nameEn: String(item.nameEn || item.nameAr || 'New Category'),
      icon: String(item.icon || '📦'),
      description: String(item.description || ''),
      subcategories: Array.isArray(item.subcategories) ? item.subcategories.map(String) : [],
      image: String(item.image || ''),
      imageStoragePath: item.imageStoragePath ? String(item.imageStoragePath) : undefined,
    }));
};

const emit = (items: ManagedCategory[]) => {
  cache = items;
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(items)); } catch { /* optional cache */ }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: items }));
};

const encodeStateSvg = (items: ManagedCategory[]): string => {
  const json = JSON.stringify(items);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1"><metadata id="yousra-categories">${encoded}</metadata><rect width="1" height="1" fill="transparent"/></svg>`;
};

const decodeStateSvg = (text: string): ManagedCategory[] | null => {
  const match = text.match(/<metadata id="yousra-categories">([^<]+)<\/metadata>/);
  if (!match?.[1]) return null;
  try {
    const json = decodeURIComponent(escape(atob(match[1])));
    return normalize(JSON.parse(json));
  } catch {
    return null;
  }
};

export async function loadManagedCategories(force = false): Promise<ManagedCategory[]> {
  if (cache && !force) return cache;
  if (loadingPromise && !force) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(STORAGE_PATH);
      const response = await fetch(`${data.publicUrl}?v=${Date.now()}`, { cache: 'no-store' });
      if (response.ok) {
        const items = decodeStateSvg(await response.text());
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

  const svg = encodeStateSvg(normalized);
  const body = new Blob([svg], { type: 'image/svg+xml' });
  const { error } = await supabase.storage.from(BUCKET).upload(STORAGE_PATH, body, {
    contentType: 'image/svg+xml',
    cacheControl: '60',
    upsert: true,
  });
  if (error) throw new Error(`تعذر حفظ الأقسام: ${error.message}`);

  emit(normalized);
  return normalized;
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
