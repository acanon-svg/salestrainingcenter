-- productivity_cache table
-- Used by databricks-productivity and salesforce-visits edge functions to cache external API responses

create table if not exists public.productivity_cache (
  id          uuid primary key default gen_random_uuid(),
  cache_key   text not null unique,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Allow edge functions (service role) full access
alter table public.productivity_cache enable row level security;

create policy "Service role full access"
  on public.productivity_cache
  for all
  to service_role
  using (true)
  with check (true);

-- Index for fast key lookups
create index if not exists productivity_cache_key_idx on public.productivity_cache (cache_key);
