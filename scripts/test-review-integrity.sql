-- All fixtures and events are rolled back. Never seed production metrics.
begin;
select set_config('test.review_id','review-test-' || gen_random_uuid()::text,true);
insert into public.products(id,data) values(current_setting('test.review_id'),jsonb_build_object(
  'id',current_setting('test.review_id'),'titleAr','Test only','image','keep-image','videoUrl','https://example.test/review.mp4','isHidden',false,'isActive',true));
insert into public.videos(id,product_id,data) values(current_setting('test.review_id'),current_setting('test.review_id'),jsonb_build_object(
  'title','Test only','videoUrl','https://example.test/review.mp4','thumbnailUrl','keep-shared-cover'));
set local role service_role;
do $$ declare r jsonb; begin
  r := public.record_review_open(current_setting('test.review_id'),repeat('a',64),repeat('c',64));
  if r->>'opens'<>'1' then raise exception 'First open not counted'; end if;
  r := public.record_review_open(current_setting('test.review_id'),repeat('a',64),repeat('c',64));
  if r->>'opens'<>'1' or r->>'recorded'<>'false' then raise exception 'Duplicate counted'; end if;
  r := public.record_review_open(current_setting('test.review_id'),repeat('b',64),repeat('c',64));
  if r->>'opens'<>'2' then raise exception 'Second session not counted'; end if;
  update public.products set data=data || '{"isHidden":true}'::jsonb where id=current_setting('test.review_id');
  r := public.record_review_open(current_setting('test.review_id'),repeat('d',64),repeat('c',64));
  if r->>'unavailable'<>'true' then raise exception 'Hidden review counted'; end if;
  update public.products set data=data || '{"isHidden":false}'::jsonb where id=current_setting('test.review_id');
  insert into public.review_open_events(video_id,session_hash,rate_hash)
    select current_setting('test.review_id'),md5(n::text)||md5(n::text),repeat('c',64) from generate_series(1,58) n;
  r := public.record_review_open(current_setting('test.review_id'),repeat('e',64),repeat('c',64));
  if r->>'limited'<>'true' then raise exception 'Rate gate failed'; end if;
end $$;
reset role;
do $$ begin
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','email',
    (select email from public.admin_users where active and role='owner' limit 1))::text,true);
end $$;
set local role authenticated;
do $$ declare r jsonb; begin
  insert into public.videos(id,product_id,data) values(current_setting('test.review_id')||'-shared',current_setting('test.review_id'),
    jsonb_build_object('videoUrl','https://example.test/review.mp4'));
  r := public.delete_catalog_review(current_setting('test.review_id'));
  if r->>'deleted'<>'true' then raise exception 'Delete not confirmed'; end if;
  if exists(select 1 from public.videos where id=current_setting('test.review_id')) then raise exception 'Review remains'; end if;
  if not exists(select 1 from public.review_deletion_archive where id=current_setting('test.review_id')) then raise exception 'No recovery copy'; end if;
  if (select data->>'videoUrl' from public.products where id=current_setting('test.review_id')) is distinct from 'https://example.test/review.mp4' then raise exception 'Shared video detached prematurely'; end if;
  r := public.delete_catalog_review(current_setting('test.review_id')||'-shared');
  if (select data->>'image' from public.products where id=current_setting('test.review_id'))<>'keep-image' then raise exception 'Product image lost'; end if;
  if (select data ? 'videoUrl' from public.products where id=current_setting('test.review_id')) then raise exception 'Deleted review still linked'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform public.delete_catalog_review(current_setting('test.review_id'));
    raise exception 'Anonymous deletion unexpectedly allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform public.record_review_open(current_setting('test.review_id'),repeat('a',64),repeat('c',64));
    raise exception 'Direct anonymous counter write allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: opens, deduplication, hidden-review exclusion, rate gate, archived deletion, shared-media preservation, anonymous restrictions; fixtures rolled back' as result;
rollback;
