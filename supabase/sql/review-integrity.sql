-- Review deletion is recoverable; media files may be shared and are not erased.
create table if not exists public.review_deletion_archive (
  id text not null, product_id text, data jsonb not null,
  deleted_at timestamptz not null default now(), deleted_by uuid,
  primary key (id, deleted_at)
);
alter table public.review_deletion_archive enable row level security;
revoke all on public.review_deletion_archive from anon, authenticated;
grant select, insert on public.review_deletion_archive to authenticated;
create policy "admin review archive" on public.review_deletion_archive for all to authenticated
  using ((select public.is_catalog_admin())) with check ((select public.is_catalog_admin()));

create or replace function public.delete_catalog_review(p_id text) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v public.videos%rowtype; p public.products%rowtype; cleaned jsonb; k text;
begin
  if public.is_catalog_admin() is not true then raise exception 'Admin required' using errcode='42501'; end if;
  select * into v from public.videos where id=p_id for update;
  if not found then return jsonb_build_object('deleted',true); end if;
  insert into public.review_deletion_archive(id,product_id,data,deleted_by)
    values(v.id,v.product_id,v.data,auth.uid());
  delete from public.videos where id=p_id;
  select * into p from public.products where id=v.product_id for update;
  if found and coalesce(v.data->>'videoUrl','') <> '' and not exists(
    select 1 from public.videos where product_id=v.product_id and data->>'videoUrl'=v.data->>'videoUrl'
  ) then
    cleaned := p.data;
    foreach k in array array['videoUrl','youtubeUrl','tiktokUrl','pinterestUrl'] loop
      if cleaned->>k = v.data->>'videoUrl' then
        cleaned := cleaned - k;
        if k='videoUrl' then cleaned := cleaned - 'videoThumbnailUrl' - 'videoStoragePath'; end if;
      end if;
    end loop;
    if cleaned <> p.data then
      update public.products set data=cleaned,updated_at=now() where id=p.id;
      return jsonb_build_object('deleted',true,'product',cleaned || jsonb_build_object('id',p.id));
    end if;
  end if;
  return jsonb_build_object('deleted',true);
end $$;
revoke all on function public.delete_catalog_review(text) from public, anon;
grant execute on function public.delete_catalog_review(text) to authenticated;

-- No legacy views are imported. These are review OPEN events, not video plays.
create table public.review_open_counts (
  video_id text primary key references public.videos(id) on delete cascade,
  opens bigint not null default 0 check(opens>=0),
  measured_since timestamptz not null default now()
);
create table public.review_open_events (
  video_id text not null references public.videos(id) on delete cascade,
  session_hash text not null check(length(session_hash)=64),
  rate_hash text not null check(length(rate_hash)=64),
  recorded_at timestamptz not null default now(),
  primary key(video_id,session_hash)
);
create index review_open_events_rate_time on public.review_open_events(rate_hash,recorded_at);
create index review_open_events_retention on public.review_open_events(recorded_at);
alter table public.review_open_counts enable row level security;
alter table public.review_open_events enable row level security;
revoke all on public.review_open_counts,public.review_open_events from anon,authenticated;
grant select on public.review_open_counts to anon,authenticated;
grant all on public.review_open_counts,public.review_open_events to service_role;
create policy "visible review counts" on public.review_open_counts for select to anon,authenticated
  using(exists(select 1 from public.videos where id=video_id));

create function public.record_review_open(p_video_id text,p_session_hash text,p_rate_hash text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare inserted_count integer; current_count bigint;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_rate_hash,0));
  -- Rate gate is server-side, not a browser-controlled displayed counter.
  if (select count(*) from public.review_open_events where rate_hash=p_rate_hash and recorded_at>now()-interval '1 hour')>=60 then
    return jsonb_build_object('recorded',false,'limited',true);
  end if;
  -- Refuse unpublished/hidden products even though the caller is service_role.
  if not exists(select 1 from public.videos v where v.id=p_video_id and
    (v.product_id is null or exists(select 1 from public.products p where p.id=v.product_id
      and coalesce(p.data->>'isHidden','false')<>'true' and coalesce(p.data->>'isActive','true')<>'false'))) then
    return jsonb_build_object('recorded',false,'unavailable',true);
  end if;
  insert into public.review_open_events(video_id,session_hash,rate_hash)
    values(p_video_id,p_session_hash,p_rate_hash) on conflict do nothing;
  get diagnostics inserted_count=row_count;
  if inserted_count=1 then
    insert into public.review_open_counts(video_id,opens) values(p_video_id,1)
      on conflict(video_id) do update set opens=public.review_open_counts.opens+1;
  end if;
  select opens into current_count from public.review_open_counts where video_id=p_video_id;
  delete from public.review_open_events where recorded_at<now()-interval '8 days';
  return jsonb_build_object('recorded',inserted_count=1,'opens',coalesce(current_count,0));
end $$;
revoke all on function public.record_review_open(text,text,text) from public,anon,authenticated;
grant execute on function public.record_review_open(text,text,text) to service_role;
