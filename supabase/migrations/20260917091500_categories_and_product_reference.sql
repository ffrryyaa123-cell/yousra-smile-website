-- Permanent category system for Yousra Smile.
-- Supabase is the durable source of truth; GitHub keeps the reproducible schema.

create table if not exists public.categories (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;

-- Public storefront may read categories.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'categories' and policyname = 'categories_public_read'
  ) then
    create policy categories_public_read on public.categories
      for select using (true);
  end if;
end $$;

-- Only active admin users may modify categories.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'categories' and policyname = 'categories_admin_insert'
  ) then
    create policy categories_admin_insert on public.categories
      for insert with check (
        exists (
          select 1 from public.admin_users au
          where au.user_id = auth.uid() and au.active = true
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'categories' and policyname = 'categories_admin_update'
  ) then
    create policy categories_admin_update on public.categories
      for update using (
        exists (
          select 1 from public.admin_users au
          where au.user_id = auth.uid() and au.active = true
        )
      ) with check (
        exists (
          select 1 from public.admin_users au
          where au.user_id = auth.uid() and au.active = true
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'categories' and policyname = 'categories_admin_delete'
  ) then
    create policy categories_admin_delete on public.categories
      for delete using (
        exists (
          select 1 from public.admin_users au
          where au.user_id = auth.uid() and au.active = true
        )
      );
  end if;
end $$;

-- Seed the known baseline categories without overwriting edits made in Admin.
insert into public.categories (id, data, sort_order)
values
  ('smart-home', jsonb_build_object('id','smart-home','nameAr','المنزل الذكي','nameEn','Smart Home'), 10),
  ('smart-kitchen', jsonb_build_object('id','smart-kitchen','nameAr','المطبخ الذكي','nameEn','Smart Kitchen'), 20),
  ('furniture-decor', jsonb_build_object('id','furniture-decor','nameAr','أثاث المنزل والديكور','nameEn','Furniture & Decor'), 30),
  ('smart-gadgets', jsonb_build_object('id','smart-gadgets','nameAr','الأجهزة الذكية والإلكترونيات','nameEn','Smart Electronics'), 40),
  ('women-corner', jsonb_build_object('id','women-corner','nameAr','العناية الشخصية والأناقة','nameEn','Personal Care & Style'), 50),
  ('health-fitness', jsonb_build_object('id','health-fitness','nameAr','الصحة واللياقة','nameEn','Health & Fitness'), 60),
  ('garden-outdoor', jsonb_build_object('id','garden-outdoor','nameAr','الحديقة والهواء الطلق','nameEn','Garden & Outdoor'), 70)
on conflict (id) do nothing;

-- New products, or explicit category changes on existing products, must point
-- to a real category row. Legacy products with an unchanged historical value
-- remain editable so this guard does not break existing production data.
create or replace function public.validate_product_category_reference()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_category text;
  old_category text;
begin
  new_category := nullif(btrim(new.data->>'category'), '');
  if tg_op = 'UPDATE' then
    old_category := nullif(btrim(old.data->>'category'), '');
  end if;

  if tg_op = 'INSERT' or new_category is distinct from old_category then
    if new_category is null then
      raise exception 'Product category is required.' using errcode = '23514';
    end if;

    if not exists (select 1 from public.categories c where c.id = new_category) then
      raise exception 'Product category % does not exist in public.categories.', new_category using errcode = '23503';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists products_category_reference_guard on public.products;
create trigger products_category_reference_guard
before insert or update of data on public.products
for each row execute function public.validate_product_category_reference();
