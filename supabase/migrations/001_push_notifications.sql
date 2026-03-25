-- Push 구독 정보 저장
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

-- 위스키별 알림 구독
create table if not exists whisky_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  whisky_id uuid not null references whiskeys(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, whisky_id)
);

-- 인덱스
create index if not exists idx_push_subs_user on push_subscriptions(user_id);
create index if not exists idx_whisky_alerts_whisky on whisky_alerts(whisky_id);
create index if not exists idx_whisky_alerts_user on whisky_alerts(user_id);

-- RLS
alter table push_subscriptions enable row level security;
alter table whisky_alerts enable row level security;

-- push_subscriptions: 본인 것만 읽기/쓰기 (서버는 service_role로 우회)
create policy "push_subs_select" on push_subscriptions for select using (auth.uid() = user_id);
create policy "push_subs_insert" on push_subscriptions for insert with check (auth.uid() = user_id);
create policy "push_subs_delete" on push_subscriptions for delete using (auth.uid() = user_id);

-- whisky_alerts: 본인 것만
create policy "alerts_select" on whisky_alerts for select using (auth.uid() = user_id);
create policy "alerts_insert" on whisky_alerts for insert with check (auth.uid() = user_id);
create policy "alerts_delete" on whisky_alerts for delete using (auth.uid() = user_id);
