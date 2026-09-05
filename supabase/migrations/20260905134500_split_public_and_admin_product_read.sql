-- The anon role cannot execute the catalog-admin helper. Keep the public
-- predicate independent and grant hidden-row access in an authenticated-only
-- policy so Postgres can combine the permissive policies safely.
drop policy if exists "catalog products public read" on public.products;
drop policy if exists "catalog products admin read hidden" on public.products;

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

