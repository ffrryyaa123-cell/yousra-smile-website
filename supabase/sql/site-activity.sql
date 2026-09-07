-- Measured site activity only; never inferred affiliate sales.
create table public.site_activity_events (
 event_id uuid primary key,
 recorded_at timestamptz not null default now(),
 visitor_hash text not null check(length(visitor_hash)=64),
 session_hash text not null check(length(session_hash)=64),
 rate_hash text not null check(length(rate_hash)=64),
 kind text not null check(kind in ('page_view','product_view','affiliate_click')),
 page text not null check(length(page)<=40),
 product_id text references public.products(id) on delete set null,
 platform text check(platform in ('amazon','aliexpress'))
);
create index site_activity_time_idx on public.site_activity_events(recorded_at);
create index site_activity_product_idx on public.site_activity_events(product_id);
create index site_activity_rate_idx on public.site_activity_events(rate_hash,recorded_at);
alter table public.site_activity_events enable row level security;
revoke all on public.site_activity_events from anon,authenticated;
grant select on public.site_activity_events to authenticated;
grant all on public.site_activity_events to service_role;
create policy site_activity_admin_read on public.site_activity_events for select to authenticated
using ((select public.is_catalog_admin()));

create function public.record_site_activity(p_event_id uuid,p_visitor_hash text,p_session_hash text,p_rate_hash text,p_kind text,p_page text,p_product_id text default null,p_platform text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 if p_kind not in ('page_view','product_view','affiliate_click') or p_page='admin' then return jsonb_build_object('invalid',true); end if;
 if p_kind in ('product_view','affiliate_click') and not exists (
  select 1 from public.products p where p.id=p_product_id and coalesce(p.data->>'isHidden','false')<>'true' and coalesce(p.data->>'isActive','true')<>'false'
 ) then return jsonb_build_object('unavailable',true); end if;
 if p_kind='affiliate_click' and (p_platform is null or p_platform not in ('amazon','aliexpress')) then return jsonb_build_object('invalid',true); end if;
 perform pg_advisory_xact_lock(hashtextextended(p_rate_hash,1));
 if (select count(*) from public.site_activity_events where rate_hash=p_rate_hash and recorded_at>now()-interval '1 hour')>=600 then
  return jsonb_build_object('limited',true);
 end if;
 insert into public.site_activity_events(event_id,visitor_hash,session_hash,rate_hash,kind,page,product_id,platform)
 values(p_event_id,p_visitor_hash,p_session_hash,p_rate_hash,p_kind,p_page,p_product_id,p_platform)
 on conflict(event_id) do nothing;
 delete from public.site_activity_events where recorded_at<now()-interval '90 days';
 return jsonb_build_object('recorded',true);
end $$;
revoke all on function public.record_site_activity(uuid,text,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.record_site_activity(uuid,text,text,text,text,text,text,text) to service_role;

create function public.site_activity_report(p_days integer default 7)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if public.is_catalog_admin() is not true then raise exception 'Admin required' using errcode='42501'; end if;
 if p_days not in (1,7,30) then raise exception 'Invalid period'; end if;
 with events as (
  select * from public.site_activity_events where recorded_at>=now()-make_interval(days=>p_days)
 ), totals as (
  select count(distinct visitor_hash) visitors,count(distinct session_hash) sessions,
  count(*) filter(where kind='page_view') page_views,
  count(*) filter(where kind='product_view') product_views,
  count(*) filter(where kind='affiliate_click') clicks from events
 ), top_products as (
  select product_id,count(*) filter(where kind='product_view') views,
   count(*) filter(where kind='affiliate_click' and platform='amazon') amazon_clicks,
   count(*) filter(where kind='affiliate_click' and platform='aliexpress') aliexpress_clicks
  from events where product_id is not null group by product_id
  order by count(*) filter(where kind='product_view') desc,product_id limit 20
 )
 select jsonb_build_object('days',p_days,'totals',(select row_to_json(totals) from totals),
 'products',coalesce((select jsonb_agg(top_products) from top_products),'[]'::jsonb),
 'first_event',(select min(recorded_at) from public.site_activity_events),
 'catalog',jsonb_build_object('products',(select count(*) from public.products),
 'public_products',(select count(*) from public.products where coalesce(data->>'isHidden','false')<>'true' and coalesce(data->>'isActive','true')<>'false'),
 'reviews',(select count(*) from public.videos)),
 'sales',null,'commissions',null) into result;
 return result;
end $$;
revoke all on function public.site_activity_report(integer) from public,anon;
grant execute on function public.site_activity_report(integer) to authenticated;

