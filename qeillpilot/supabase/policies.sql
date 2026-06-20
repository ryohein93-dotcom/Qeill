-- QeillPilot: Row Level Security ポリシー
-- schema.sql の後に実行してください。

alter table public.profiles enable row level security;
alter table public.history enable row level security;
alter table public.favorites enable row level security;
alter table public.shared_compositions enable row level security;

-- profiles: 本人のみ参照・編集可能
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_upsert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- history: 本人のみ参照・作成・削除可能
create policy "history_select_own" on public.history
  for select using (auth.uid() = user_id);

create policy "history_insert_own" on public.history
  for insert with check (auth.uid() = user_id);

create policy "history_delete_own" on public.history
  for delete using (auth.uid() = user_id);

-- favorites: 本人のみ参照・作成・削除可能
create policy "favorites_select_own" on public.favorites
  for select using (auth.uid() = user_id);

create policy "favorites_insert_own" on public.favorites
  for insert with check (auth.uid() = user_id);

create policy "favorites_delete_own" on public.favorites
  for delete using (auth.uid() = user_id);

-- shared_compositions: 誰でも閲覧可（公開共有リンクのため）。作成は誰でも可（匿名共有を許可）。
create policy "shared_compositions_select_all" on public.shared_compositions
  for select using (true);

create policy "shared_compositions_insert_all" on public.shared_compositions
  for insert with check (true);

create policy "shared_compositions_delete_own" on public.shared_compositions
  for delete using (auth.uid() = owner_id);
