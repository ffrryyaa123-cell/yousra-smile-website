-- Yousra Smile catalog compatibility and complete RLS policies.

alter table public.products
  add column if not exists source_legacy_id text,
  add column if not exists subcategory_slug text,
  add column if not exists primary_image_url text,
  add column if not exists image_urls text[] not null default '{}',
  add column if not exists youtube_url text,
  add column if not exists tiktok_url text,
  add column if not exists pinterest_url text,
  add column if not exists instagram_url text,
  add column if not exists discount_percent integer not null default 0,
  add column if not exists views_count bigint not null default 0,
  add column if not exists is_latest boolean not null default false,
  add column if not exists is_active boolean not null default true;

create unique index if not exists products_owner_legacy_id_uidx
  on public.products(owner_id, source_legacy_id)
  where source_legacy_id is not null;

alter table public.videos
  add column if not exists embed_id text,
  add column if not exists views_label text,
  add column if not exists date_label text,
  add column if not exists product_title_snapshot text,
  add column if not exists product_image_snapshot text;

alter table public.site_settings
  add column if not exists site_logo text,
  add column if not exists amazon_tag text,
  add column if not exists aliexpress_tag text;

update public.site_settings
set contact_email = 'info@yousrasmile.com'
where id = true;

-- Create a profile automatically for every new Supabase Auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Profiles
create policy "users read own profile" on public.profiles
for select using (id = auth.uid());

create policy "staff read all profiles" on public.profiles
for select using (public.current_user_role() in ('owner','admin','editor'));

create policy "users update own profile" on public.profiles
for update using (id = auth.uid())
with check (id = auth.uid());

create policy "owners and admins manage profiles" on public.profiles
for all using (public.current_user_role() in ('owner','admin'))
with check (public.current_user_role() in ('owner','admin'));

-- Marketer profiles
create policy "public read approved marketers" on public.marketer_profiles
for select using (approval_status in ('approved','published'));

create policy "marketers manage own profile" on public.marketer_profiles
for all using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "staff manage marketer profiles" on public.marketer_profiles
for all using (public.current_user_role() in ('owner','admin','editor'))
with check (public.current_user_role() in ('owner','admin','editor'));

-- Product media
create policy "public read published product media" on public.product_media
for select using (
  exists (
    select 1 from public.products p
    where p.id = product_media.product_id
      and p.status = 'published'
      and p.is_hidden = false
      and p.is_active = true
  )
);

create policy "owners manage own product media" on public.product_media
for all using (
  exists (
    select 1 from public.products p
    where p.id = product_media.product_id and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.products p
    where p.id = product_media.product_id and p.owner_id = auth.uid()
  )
);

create policy "staff manage all product media" on public.product_media
for all using (public.current_user_role() in ('owner','admin','editor'))
with check (public.current_user_role() in ('owner','admin','editor'));

-- Social publishing staff oversight
create policy "staff manage all social accounts" on public.social_accounts
for all using (public.current_user_role() in ('owner','admin'))
with check (public.current_user_role() in ('owner','admin'));

create policy "staff manage all social posts" on public.social_posts
for all using (public.current_user_role() in ('owner','admin','editor'))
with check (public.current_user_role() in ('owner','admin','editor'));

-- Import/export jobs
create policy "users manage own import jobs" on public.import_jobs
for all using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "staff manage all import jobs" on public.import_jobs
for all using (public.current_user_role() in ('owner','admin','editor'))
with check (public.current_user_role() in ('owner','admin','editor'));

create policy "users manage own export jobs" on public.export_jobs
for all using (requested_by = auth.uid())
with check (requested_by = auth.uid());

create policy "staff manage all export jobs" on public.export_jobs
for all using (public.current_user_role() in ('owner','admin','editor'))
with check (public.current_user_role() in ('owner','admin','editor'));

-- Audit logs
create policy "staff read audit logs" on public.audit_logs
for select using (public.current_user_role() in ('owner','admin','editor'));

create policy "authenticated users write own audit logs" on public.audit_logs
for insert with check (actor_id = auth.uid());

-- Extra indexes for large catalogs and administration.
create index if not exists products_active_published_idx
  on public.products(status, is_active, is_hidden, created_at desc);
create index if not exists products_brand_idx on public.products(brand);
create index if not exists products_subcategory_idx on public.products(subcategory_slug);
create index if not exists videos_platform_idx on public.videos(source_platform, created_at desc);
create index if not exists contact_messages_status_idx on public.contact_messages(status, created_at desc);
create index if not exists import_jobs_status_idx on public.import_jobs(status, created_at desc);
create index if not exists export_jobs_status_idx on public.export_jobs(status, created_at desc);
