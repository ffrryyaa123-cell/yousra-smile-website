import { CATEGORIES as FALLBACK_CATEGORIES } from '../data/categories';
import { Category } from '../types';
import { isSupabaseConfigured, supabase } from './supabase';

interface CategoryRow {
  id: string;
  parent_id: string | null;
  slug: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  image_url: string | null;
  icon: string | null;
  sort_order: number;
  show_on_home: boolean;
}

export const mapCategoryRows = (rows: CategoryRow[]): Category[] => {
  const childrenByParent = new Map<string, CategoryRow[]>();

  rows.forEach(row => {
    if (!row.parent_id) return;
    const siblings = childrenByParent.get(row.parent_id) ?? [];
    siblings.push(row);
    childrenByParent.set(row.parent_id, siblings);
  });

  return rows
    .filter(row => !row.parent_id)
    .map(row => {
      const fallback = FALLBACK_CATEGORIES.find(category => category.id === row.slug);
      const children = (childrenByParent.get(row.id) ?? [])
        .sort((a, b) => a.sort_order - b.sort_order || a.name_ar.localeCompare(b.name_ar, 'ar'));

      return {
        id: row.slug,
        nameAr: row.name_ar,
        nameEn: row.name_en || row.name_ar,
        icon: row.icon || fallback?.icon || 'Tag',
        description: row.description_ar || row.description_en || fallback?.description || '',
        descriptionAr: row.description_ar || fallback?.description || '',
        descriptionEn: row.description_en || '',
        image: row.image_url || fallback?.image || '',
        subcategories: children.length > 0
          ? children.map(child => child.name_ar)
          : fallback?.subcategories ?? [],
        showOnHome: row.show_on_home,
      };
    });
};

export const fetchCatalogCategories = async (): Promise<Category[]> => {
  if (!isSupabaseConfigured || !supabase) return FALLBACK_CATEGORIES;

  const { data, error } = await supabase
    .from('categories')
    .select(`
      id,
      parent_id,
      slug,
      name_ar,
      name_en,
      description_ar,
      description_en,
      image_url,
      icon,
      sort_order,
      show_on_home
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  const categories = mapCategoryRows((data ?? []) as CategoryRow[]);
  return categories.length > 0 ? categories : FALLBACK_CATEGORIES;
};
