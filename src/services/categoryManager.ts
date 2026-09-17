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

const normalize = (value: unknown): ManagedCategory[] => {
  if (!Array.isArray(value)) return defaults;
  return value
    .filter(item => item && typeof item === 'object')
    .map((item: any) => ({
      id: String(item.id || `category-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
      nameAr: String(item.nameAr || item.nameEn || 'قسم جديد'),
      nameEn: String(item.nameEn || item.nameAr || 'New Category'),
      icon: String(item.icon || 'Package'),
      description: String(item.description || ''),
      descriptionEn: item.descriptionEn ? String(item.descriptionEn) : undefined,
      subcategories: Array.isArray(item.subcategories) ? item.subcategories.map(String) : [],
      subcategoriesEn: Array.isArray(item.subcategoriesEn) ? item.subcategoriesEn.map(String) : undefined,
      image: String(item.image || ''),
      imageStoragePath: item.imageStoragePath ? String(item.imageStoragePath) : undefined,
    }));
};

const readLocalFallback = (): ManagedCategory[] => {
  try {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) return normalize(JSON.parse(saved));
  } catch { /* optional cache */ }
  return defaults;
};

const emit = (items: ManagedCategory[]) => {
  cache = items;
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(items)); } catch { /* optional cache */ }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: items }));
};

export async function loadManagedCategories(force = false): Promise<ManagedCategory[]> {
  if (cache && !force) return cache;
  if (loadingPromise && !force) return loadingPromise;

  loadingPromise = (async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, data, sort_order')
      .order('sort_order', { ascending: true });

    if (!error && data?.length) {
      const items = normalize(data.map(row => ({ ...(row.data as object), id: row.id })));
      emit(items);
      return items;
    }

    const fallback = readLocalFallback();
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

  const rows = normalized.map((category, index) => ({
    id: category.id,
    data: category,
    sort_order: (index + 1) * 10,
    updated_at: new Date().toISOString(),
  }));
  const { error: saveError } = await supabase.from('categories').upsert(rows, { onConflict: 'id' });
  if (saveError) throw new Error(`تعذر حفظ الأقسام: ${saveError.message}`);

  // Only the owner-facing category editor calls this with the complete list,
  // so a missing id here represents an intentional category deletion.
  const { data: currentRows, error: loadError } = await supabase.from('categories').select('id');
  if (loadError) throw new Error(`حُفظت الأقسام، لكن تعذر التحقق من الأقسام المحذوفة: ${loadError.message}`);
  const keepIds = new Set(normalized.map(category => category.id));
  const removedIds = (currentRows || []).map(row => String(row.id)).filter(id => !keepIds.has(id));
  if (removedIds.length) {
    const { error: deleteError } = await supabase.from('categories').delete().in('id', removedIds);
    if (deleteError) throw new Error(`حُفظت الأقسام، لكن تعذر حذف القسم المُزال: ${deleteError.message}`);
  }

  emit(normalized);
  return normalized;
}

export function useManagedCategories() {
  const [categories, setCategories] = useState<ManagedCategory[]>(() => cache || readLocalFallback());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = () => void loadManagedCategories(true).then(items => { if (active) setCategories(items); });
    refresh();

    const onUpdate = (event: Event) => {
      const next = (event as CustomEvent<ManagedCategory[]>).detail;
      if (Array.isArray(next)) setCategories(next);
    };
    window.addEventListener(EVENT_NAME, onUpdate);
    const channel = supabase
      .channel('managed-categories-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, refresh)
      .subscribe();

    return () => {
      active = false;
      window.removeEventListener(EVENT_NAME, onUpdate);
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
