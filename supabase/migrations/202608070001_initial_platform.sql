-- Yousra Smile affiliate marketing platform
-- Initial scalable schema for products, media, marketers, publishing and imports.

create extension if not exists pgcrypto;

create type public.user_role as enum ('owner', 'admin', 'editor', 'marketer', 'customer');
create type public.review_status as enum ('draft', 'pending_review', 'approved', 'rejected', 'published', 'archived');
create type public.platform_name as enum ('youtube', 'tiktok', 'pinterest', 'instagram', 'x');
create type public.publish_status as enum ('draft', 'queued', 'processing', 'published', 'failed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  display_name text,
  role public.user_role not null default 'customer',
  avatar_url text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.marketer_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  slug text unique not null,
  bio text,
  approval_status public.review_status not null default 'pending_review',
  default_affiliate_disclosure text,
  commission_notes text,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  slug text unique not null,
  name_ar text not null,
  name_en text,
  description_ar text,
  description_en text,
  image_url text,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  show_on_home boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  category_id uuid references public.categories(id) on delete set null,
  sku text,
  slug text unique not null,
  title_ar text not null,
  title_en text,
  short_description text,
  long_description text,
  brand text,
  original_price numeric(14,2),
  discount_price numeric(14,2),
  currency text not null default 'USD',
  amazon_url text,
  aliexpress_url text,
  affiliate_url text,
  affiliate_disclosure text,
  rating numeric(3,2),
  review_count integer not null default 0,
  keywords text[] not null default '{}',
  features text[] not null default '{}',
  specs jsonb not null default '{}'::jsonb,
  status public.review_status not null default 'draft',
  is_featured boolean not null default false,
  is_top_selling boolean not null default false,
  is_hidden boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, sku)
);

create index products_owner_idx on public.products(owner_id);
create index products_category_idx on public.products(category_id);
create index products_status_idx on public.products(status);
create index products_created_idx on public.products(created_at desc);
create index products_search_idx on public.products using gin (
  to_tsvector('simple', coalesce(title_ar,'') || ' ' || coalesce(title_en,'') || ' ' || coalesce(brand,''))
);

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  media_type text not null check (media_type in ('image','video','thumbnail')),
  storage_path text,
  external_url text,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  width integer,
  height integer,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

create index product_media_product_idx on public.product_media(product_id, sort_order);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  product_id uuid references public.products(id) on delete set null,
  source_platform public.platform_name,
  source_post_id text,
  source_url text,
  storage_path text,
  thumbnail_url text,
  title text not null,
  caption text,
  hashtags text[] not null default '{}',
  duration_seconds integer,
  status public.review_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index videos_owner_idx on public.videos(owner_id);
create index videos_product_idx on public.videos(product_id);
create index videos_status_idx on public.videos(status);

create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  platform public.platform_name not null,
  account_name text,
  account_external_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, platform, account_external_id)
);

create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  product_id uuid references public.products(id) on delete set null,
  video_id uuid references public.videos(id) on delete set null,
  social_account_id uuid not null references public.social_accounts(id) on delete cascade,
  platform public.platform_name not null,
  title text,
  caption text,
  hashtags text[] not null default '{}',
  destination_url text,
  board_or_playlist_id text,
  privacy_status text,
  publish_status public.publish_status not null default 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  external_post_id text,
  external_post_url text,
  last_error text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index social_posts_owner_idx on public.social_posts(owner_id);
create index social_posts_status_idx on public.social_posts(publish_status, scheduled_at);

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  import_type text not null check (import_type in ('products_csv','videos_csv','youtube','tiktok','pinterest','manual')),
  source_filename text,
  source_url text,
  status text not null default 'pending',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  invalid_rows integer not null default 0,
  processed_rows integer not null default 0,
  report_path text,
  error_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.profiles(id),
  export_type text not null check (export_type in ('products_csv','catalog_zip','media_archive','database_backup')),
  filters jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  row_count integer not null default 0,
  file_path text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.site_settings (
  id boolean primary key default true check (id),
  site_name text not null default 'Yousra Smile',
  contact_email text not null default 'info@yousrasmile.com',
  whatsapp_url text,
  youtube_url text,
  tiktok_url text,
  pinterest_url text,
  instagram_url text,
  x_url text,
  default_language text not null default 'ar',
  default_currency text not null default 'USD',
  settings jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (true) on conflict do nothing;

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  ai_category text,
  ai_draft_reply text,
  status text not null default 'new',
  assigned_to uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  replied_at timestamptz
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger marketer_profiles_updated_at before update on public.marketer_profiles for each row execute function public.set_updated_at();
create trigger categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger videos_updated_at before update on public.videos for each row execute function public.set_updated_at();
create trigger social_accounts_updated_at before update on public.social_accounts for each row execute function public.set_updated_at();
create trigger social_posts_updated_at before update on public.social_posts for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.marketer_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_media enable row level security;
alter table public.videos enable row level security;
alter table public.social_accounts enable row level security;
alter table public.social_posts enable row level security;
alter table public.import_jobs enable row level security;
alter table public.export_jobs enable row level security;
alter table public.site_settings enable row level security;
alter table public.contact_messages enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create policy "public read published products" on public.products
for select using (status = 'published' and is_hidden = false);

create policy "owners manage own products" on public.products
for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "admins manage all products" on public.products
for all using (public.current_user_role() in ('owner','admin','editor'))
with check (public.current_user_role() in ('owner','admin','editor'));

create policy "public read active categories" on public.categories
for select using (is_active = true);

create policy "admins manage categories" on public.categories
for all using (public.current_user_role() in ('owner','admin','editor'))
with check (public.current_user_role() in ('owner','admin','editor'));

create policy "public read published videos" on public.videos
for select using (status = 'published');

create policy "owners manage own videos" on public.videos
for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "admins manage all videos" on public.videos
for all using (public.current_user_role() in ('owner','admin','editor'))
with check (public.current_user_role() in ('owner','admin','editor'));

create policy "users manage own social accounts" on public.social_accounts
for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "users manage own social posts" on public.social_posts
for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "admins read site settings" on public.site_settings
for select using (true);

create policy "owners and admins update site settings" on public.site_settings
for update using (public.current_user_role() in ('owner','admin'))
with check (public.current_user_role() in ('owner','admin'));

create policy "anyone submit contact message" on public.contact_messages
for insert with check (true);

create policy "staff read contact messages" on public.contact_messages
for select using (public.current_user_role() in ('owner','admin','editor'));

create policy "staff update contact messages" on public.contact_messages
for update using (public.current_user_role() in ('owner','admin','editor'));
