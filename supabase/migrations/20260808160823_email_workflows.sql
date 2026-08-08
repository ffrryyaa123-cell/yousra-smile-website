create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  source text not null default 'website',
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint newsletter_subscribers_email_format_check check (
    email = lower(email)
    and char_length(email) between 3 and 320
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  )
);

create index newsletter_subscribers_status_idx
  on public.newsletter_subscribers(status, subscribed_at desc);

create trigger newsletter_subscribers_updated_at
before update on public.newsletter_subscribers
for each row execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'contact_messages_input_length_check'
      and conrelid = 'public.contact_messages'::regclass
  ) then
    alter table public.contact_messages
      add constraint contact_messages_input_length_check check (
        char_length(btrim(name)) between 1 and 120
        and char_length(btrim(email)) between 3 and 320
        and char_length(btrim(subject)) between 1 and 200
        and char_length(btrim(message)) between 1 and 5000
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'contact_messages_status_check'
      and conrelid = 'public.contact_messages'::regclass
  ) then
    alter table public.contact_messages
      add constraint contact_messages_status_check
      check (status in ('new', 'read', 'replied', 'archived')) not valid;
  end if;
end;
$$;

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "anyone submit contact message" on public.contact_messages;
create policy "anyone submit contact message"
on public.contact_messages
for insert
to anon, authenticated
with check (status = 'new' and assigned_to is null and replied_at is null);

drop policy if exists "staff read contact messages" on public.contact_messages;
create policy "staff read contact messages"
on public.contact_messages
for select
to authenticated
using ((select public.current_user_role()) in ('owner', 'admin', 'editor'));

drop policy if exists "staff update contact messages" on public.contact_messages;
create policy "staff update contact messages"
on public.contact_messages
for update
to authenticated
using ((select public.current_user_role()) in ('owner', 'admin', 'editor'))
with check ((select public.current_user_role()) in ('owner', 'admin', 'editor'));

create policy "anyone can subscribe to newsletter"
on public.newsletter_subscribers
for insert
to anon, authenticated
with check (
  status = 'active'
  and source = 'website'
  and unsubscribed_at is null
);

create policy "staff manage newsletter subscribers"
on public.newsletter_subscribers
for all
to authenticated
using ((select public.current_user_role()) in ('owner', 'admin', 'editor'))
with check ((select public.current_user_role()) in ('owner', 'admin', 'editor'));

grant usage on schema public to anon, authenticated;

revoke all on table public.contact_messages from anon, authenticated;
grant insert on table public.contact_messages to anon, authenticated;
grant select, update on table public.contact_messages to authenticated;

revoke all on table public.newsletter_subscribers from anon, authenticated;
grant insert on table public.newsletter_subscribers to anon, authenticated;
grant select, update, delete on table public.newsletter_subscribers to authenticated;
