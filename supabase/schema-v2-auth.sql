-- Party Mate — auth migration v2
-- Run this AFTER the initial schema.sql. It extends the profiles table
-- with a birthdate and exposes a computed age_tier, and updates the
-- new-user trigger to capture birthdate + display_name from signup
-- metadata (stored in auth.users.raw_user_meta_data).

-- 1. Add birthdate column (nullable so existing rows aren't broken).
alter table public.profiles add column if not exists birthdate date;

-- 2. Age tier helper — returns 'under-18' | '18-22' | '23+' from a birthdate.
create or replace function public.age_tier(dob date)
returns text language sql immutable as $$
  select case
    when dob is null then null
    when age(dob) < interval '18 years' then 'under-18'
    when age(dob) < interval '23 years' then '18-22'
    else '23+'
  end;
$$;

-- 3. Replace the new-user trigger to pull display_name + birthdate from metadata.
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
  insert into public.profiles (id, username, display_name, birthdate)
  values (
    new.id,
    candidate,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      candidate
    ),
    nullif(new.raw_user_meta_data->>'birthdate', '')::date
  );
  return new;
end;
$$;

-- 4. Allow users to read their own profile birthdate (in addition to public read).
--    (No change needed — profiles are already publicly readable.)

-- Trigger already installed by schema.sql; re-creating the function is enough.
