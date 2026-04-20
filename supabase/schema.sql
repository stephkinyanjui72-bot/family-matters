-- Family Matters — initial schema
-- Run once in Supabase SQL editor to bootstrap the database.

-- ============================================================================
-- Profiles: public profile per authenticated user.
-- `auth.users` is managed by Supabase Auth; we link to it by id.
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Rooms: one row per active game room. Lives as long as players are in it.
-- ============================================================================
create table if not exists public.rooms (
  code text primary key,
  host_user_id uuid references auth.users(id) on delete cascade,
  intensity text not null default 'spicy'
    check (intensity in ('mild','spicy','extreme','chaos')),
  current_game text,
  game_state jsonb,
  bags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Room players: who's currently in which room. PK is (room_code, pid) so a
-- single player gets a stable row across reconnects.
-- ============================================================================
create table if not exists public.room_players (
  room_code text not null references public.rooms(code) on delete cascade,
  pid text not null,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  is_host boolean not null default false,
  online boolean not null default true,
  last_seen timestamptz not null default now(),
  joined_at timestamptz not null default now(),
  primary key (room_code, pid)
);

create index if not exists room_players_user_id_idx on public.room_players (user_id);
create index if not exists room_players_room_code_idx on public.room_players (room_code);

-- ============================================================================
-- Realtime: broadcast row changes so every client in a room sees updates.
-- ============================================================================
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_players;

-- ============================================================================
-- Row-level security. Reads are public (by design — anyone with a room code
-- can watch state). Writes happen only from server-side API routes using the
-- service_role key, which bypasses RLS automatically.
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;

drop policy if exists "profiles readable by anyone" on public.profiles;
create policy "profiles readable by anyone"
  on public.profiles for select using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "rooms readable by anyone" on public.rooms;
create policy "rooms readable by anyone"
  on public.rooms for select using (true);

drop policy if exists "room_players readable by anyone" on public.room_players;
create policy "room_players readable by anyone"
  on public.room_players for select using (true);

-- ============================================================================
-- Keep rooms.updated_at fresh so clients can detect staleness.
-- ============================================================================
create or replace function public.tg_rooms_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rooms_updated_at on public.rooms;
create trigger rooms_updated_at
before update on public.rooms
for each row execute function public.tg_rooms_updated_at();

-- ============================================================================
-- Auto-create a profile row whenever a new auth user signs up.
-- Username defaults to the email local-part; user can change it later.
-- ============================================================================
create or replace function public.tg_new_user_profile()
returns trigger language plpgsql security definer as $$
declare
  base text := split_part(coalesce(new.email, 'user'), '@', 1);
  candidate text := base;
  n int := 0;
begin
  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := base || n::text;
  end loop;
  insert into public.profiles (id, username, display_name)
  values (new.id, candidate, coalesce(new.raw_user_meta_data->>'full_name', candidate));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.tg_new_user_profile();
