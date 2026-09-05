-- Hidden URL-to-media drafts remain readable to catalog admins, while anon
-- visitors and ordinary authenticated users can only read published products.
drop policy if exists "catalog products public read" on public.products;
create policy "catalog products public read"
on public.products
for select
to anon, authenticated
using (
  coalesce((data ->> 'isHidden')::boolean, false) = false
);

create policy "catalog products admin read hidden"
on public.products
for select
to authenticated
using (
  (select public.is_catalog_admin())
);

-- Do not expose generated videos belonging to a hidden product. Videos that
-- are not attached to a product retain the existing public gallery behavior.
drop policy if exists "catalog videos public read" on public.videos;
create policy "catalog videos public read"
on public.videos
for select
to anon, authenticated
using (
  product_id is null
  or exists (
    select 1 from public.products
    where products.id = videos.product_id
  )
);

