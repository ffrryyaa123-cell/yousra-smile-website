-- Expose catalog categories through the Data API while RLS remains authoritative.
grant usage on schema public to anon, authenticated;
grant select on table public.categories to anon, authenticated;
grant insert, update, delete on table public.categories to authenticated;

-- Seed the current top-level catalog once. Existing owner-managed rows are preserved.
insert into public.categories (
  slug,
  name_ar,
  name_en,
  image_url,
  icon,
  sort_order,
  is_active,
  show_on_home
)
values
  (
    'smart-home',
    'المنزل الذكي',
    'Smart Home',
    'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80',
    'Home',
    10,
    true,
    true
  ),
  (
    'smart-kitchen',
    'المطبخ الذكي',
    'Smart Kitchen',
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    'Utensils',
    20,
    true,
    true
  ),
  (
    'furniture-decor',
    'أثاث المنزل والديكور',
    'Furniture & Decor',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    'Armchair',
    30,
    true,
    true
  ),
  (
    'smart-gadgets',
    'الأجهزة الذكية والإلكترونيات',
    'Smart Electronics',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
    'Cpu',
    40,
    true,
    true
  ),
  (
    'women-corner',
    'العناية الشخصية والأناقة',
    'Personal Care & Style',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    'Sparkles',
    50,
    true,
    true
  ),
  (
    'health-fitness',
    'الصحة واللياقة',
    'Health & Fitness',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    'Activity',
    60,
    true,
    true
  )
on conflict (slug) do nothing;
