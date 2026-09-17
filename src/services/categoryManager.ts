import { useEffect, useState } from 'react';
import { CATEGORIES } from '../data/categories';
import { supabase } from './adminAccount';

const LOCAL_KEY = 'yousra-managed-categories-v2';
const EVENT_NAME = 'yousra-categories-updated';

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

const normalizeOne = (item: any): ManagedCategory => ({
  id: String(item?.id || `category-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
  nameAr: String(item?.nameAr || item?.nameEn || 'قسم جديد'),
  nameEn: String(item?.nameEn || item?.nameAr || 'New Category'),
  icon: String(item?.icon || '📦'),
  description: String(item?.description || ''),
  descriptionEn: item?.descriptionEn ? String(item.descriptionEn) : undefined,
  subcategories: Array.isArray(item?.subcategories) ? item.subcategories.map(String) : [],
  subcategoriesEn: Array.isArray(item?.subcategoriesEn) ? item.subcategoriesEn.map(String) : undefined,
  image: String(item?.image || ''),
  imageStoragePath: item?.imageStoragePath ? String(item.imageStoragePath) : undefined,
});

const normalize = (value: unknown): ManagedCategory[] => {
  if (!Array.isArray(value)) return defaults;
  return value.filter(item => item && typeof item === 'object').map(normalizeOne);
};

const emit = (items: ManagedCategory[]) => {
  cache = items;
  try { window.localStorage.setItem(LOCAL_KEY, JSON.stringify(items)); } catch { /* cache is optional */ }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: items }));
};

const loadLocalFallback = (): ManagedCategory[] => {
  try {
    const saved = window.localStorage.getItem(LOCAL_KEY);
    if (saved) {
      const items = normalize(JSON.parse(saved));
      if (items.length) return items;
    }
  } catch { /* ignore stale/invalid local cache */ }
  return defaults;
};

export async function loadManagedCategories(force = false): Promise<ManagedCategory[]> {
  if (cache && !force) return cache;
  if (loadingPromise && !force) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, data, sort_order')
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });

      if (error) throw error;
      const items = (data || [])
        .map(row => normalizeOne({ ...(row.data as object), id: row.id }))
        .filter(item => item.id);

      if (items.length) {
        emit(items);
        return items;
      }
    } catch (error) {
      console.warn('Supabase categories unavailable; using cached/default categories.', error);
    }

    const fallback = loadLocalFallback();
    cache = fallback;
    return fallback;
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

  // Permanent safety rule: category saves are ADD/UPDATE only.
  // A stale/partial admin screen or an automated agent must never delete an
  // existing category merely because it was absent from the submitted list.
  const rows = normalized.map((category, index) => ({
    id: category.id,
    data: category,
    sort_order: (index + 1) * 10,
    updated_at: new Date().toISOString(),
  }));

  const { error: saveError } = await supabase
    .from('categories')
    .upsert(rows, { onConflict: 'id' });
  if (saveError) throw new Error(`تعذر حفظ الأقسام في قاعدة البيانات: ${saveError.message}`);

  // Reload from Supabase so local state always reflects the durable database,
  // including pre-existing categories that were not part of this save call.
  const saved = await loadManagedCategories(true);
  emit(saved);
  return saved;
}

export function useManagedCategories() {
  const [categories, setCategories] = useState<ManagedCategory[]>(() => cache || loadLocalFallback());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;

    void loadManagedCategories().then(items => {
      if (active) setCategories(items);
    });

    const onLocalUpdate = (event: Event) => {
      const next = (event as CustomEvent<ManagedCategory[]>).detail;
      if (active && Array.isArray(next)) setCategories(next);
    };
    window.addEventListener(EVENT_NAME, onLocalUpdate);

    const channel = supabase
      .channel('managed-categories-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        void loadManagedCategories(true).then(items => {
          if (active) setCategories(items);
        });
      })
      .subscribe();

    return () => {
      active = false;
      window.removeEventListener(EVENT_NAME, onLocalUpdate);
      void supabase.removeChannel(channel);
    };
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