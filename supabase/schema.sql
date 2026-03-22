-- BottleScan DB Schema

-- 위스키 마스터 테이블
create table if not exists whiskeys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  category text not null default '기타',
  abv numeric(4,1),
  volume_ml integer default 700,
  image_url text,
  created_at timestamptz default now()
);

-- 매장 테이블
create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  region text not null,
  sub_region text,
  lat numeric(10,7),
  lng numeric(10,7),
  created_at timestamptz default now()
);

-- 유저 프로필
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  avatar_url text,
  report_count integer default 0,
  created_at timestamptz default now()
);

-- 가격 제보
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  whiskey_id uuid not null references whiskeys(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  price integer not null,
  photo_url text,
  note text,
  created_at timestamptz default now()
);

-- 인덱스
create index if not exists idx_reports_whiskey on reports(whiskey_id);
create index if not exists idx_reports_store on reports(store_id);
create index if not exists idx_reports_created on reports(created_at desc);
create index if not exists idx_whiskeys_name on whiskeys(name);

-- RLS 활성화
alter table whiskeys enable row level security;
alter table stores enable row level security;
alter table profiles enable row level security;
alter table reports enable row level security;

-- 읽기: 모든 사용자
create policy "whiskeys_read" on whiskeys for select using (true);
create policy "stores_read" on stores for select using (true);
create policy "profiles_read" on profiles for select using (true);
create policy "reports_read" on reports for select using (true);

-- 쓰기: 인증된 사용자만
create policy "reports_insert" on reports for insert with check (auth.uid() = user_id);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- 위스키/매장: 인증된 사용자가 추가 가능
create policy "whiskeys_insert" on whiskeys for insert with check (auth.uid() is not null);
create policy "stores_insert" on stores for insert with check (auth.uid() is not null);

-- 프로필 자동 생성 트리거
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'User'));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
