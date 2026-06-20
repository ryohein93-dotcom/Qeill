-- QeillPilot: 初期スキーマ
-- Supabase SQL Editor、または `supabase db push` で実行してください。

create extension if not exists "uuid-ossp";

-- ユーザーごとの設定（国・言語）。Supabase Authのauth.usersを拡張する形で保持する。
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  country text not null default 'JP' check (country in ('JP', 'US', 'GB')),
  locale text not null default 'ja' check (locale in ('ja', 'en')),
  created_at timestamptz not null default now()
);

-- 相談履歴（チャット〜提案の1サイクルを1レコードとして保存）
create table if not exists public.history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  country text not null,
  proposal jsonb not null,
  created_at timestamptz not null default now()
);

-- お気に入り（保存された商品構成）
create table if not exists public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  total_price numeric not null,
  proposal jsonb not null,
  created_at timestamptz not null default now()
);

-- 構成共有（ログイン不要で閲覧できる公開リンク）
create table if not exists public.shared_compositions (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users (id) on delete set null,
  title text not null,
  proposal jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists history_user_id_idx on public.history (user_id, created_at desc);
create index if not exists favorites_user_id_idx on public.favorites (user_id, created_at desc);
