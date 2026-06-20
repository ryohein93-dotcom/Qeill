# QeillPilot

「何を買いたいか」ではなく「何をしたいか」と「予算」を伝えるだけで、AIが最適な商品構成を提案するAIショッピングサービス。

仕様書（MVP Ver.1）に基づくスキャフォールドです。

## 技術構成

- フロントエンド: Next.js 14（App Router）/ TypeScript / Tailwind CSS
- バックエンド・DB: Supabase（PostgreSQL / Auth）
- AI: OpenAI互換API（既定モデル名 `gpt-5.5-mini`、`.env` の `AI_MODEL` で変更可）
- 商品情報: Amazon Product Advertising API（PA-API v5）/ 楽天市場商品検索API
- ホスティング: Vercel

外部API（Amazon / 楽天 / OpenAI）の認証情報が未設定の場合は、開発用のモックデータで動作します。
まずはモックのまま動かして画面・フローを確認し、その後に本番キーを設定する流れを想定しています。

## ディレクトリ構成

```
app/
  page.tsx                トップページ（チャット入力）
  api/chat/route.ts       AI提案生成API
  api/favorites/route.ts  お気に入りAPI
  api/history/route.ts    履歴API
  api/share/route.ts      共有リンク発行API
  share/[id]/page.tsx     共有された構成の閲覧ページ
  favorites/page.tsx      お気に入り一覧
  history/page.tsx        相談履歴一覧
components/                UIコンポーネント
lib/
  ai/openai.ts             AIによるカテゴリ判断・商品選定ロジック
  providers/amazon.ts      Amazon PA-API連携
  providers/rakuten.ts     楽天市場API連携
  products.ts              国別のEC横断検索
  proposal.ts              チャット→提案結果の組み立て
  supabase/                Supabaseクライアント（ブラウザ/サーバー）
supabase/
  schema.sql                テーブル定義
  policies.sql               Row Level Securityポリシー
```

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. Supabaseプロジェクトを作成

1. https://supabase.com でプロジェクトを作成
2. SQL Editor で `supabase/schema.sql` → `supabase/policies.sql` の順に実行
3. Project Settings > API から `Project URL` と `anon public key` を取得

### 3. 環境変数を設定

```bash
cp .env.example .env.local
```

`.env.local` に Supabase の URL / キー、OpenAI互換APIキーを設定してください。
Amazon PA-API / 楽天APIのキーは任意（未設定時はモック商品データを返します）。

### 4. ローカル起動

```bash
npm run dev
```

http://localhost:3000 を開く。

## Gitの初期化〜GitHubへのプッシュ

このディレクトリはすでに `git init` 済みで、最初のコミットが作成されています。
GitHub等のリモートリポジトリを作成後、以下を実行してください。

```bash
git remote add origin <あなたのリポジトリURL>
git branch -M main
git push -u origin main
```

## Vercelへのデプロイ

1. https://vercel.com で「Add New Project」→ 上記GitHubリポジトリを選択
2. Framework Preset は自動検出（Next.js）
3. Environment Variables に `.env.local` と同じ内容を設定
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `AI_MODEL`
   - （任意）`AMAZON_PAAPI_*`, `RAKUTEN_*`
4. Deploy

デプロイ後、Supabase側の Authentication > URL Configuration に Vercel の本番URLを
リダイレクトURLとして追加してください（メール認証等を使う場合）。

## 仕様書との対応状況（MVP Ver.1）

- [x] ホーム画面・人気プロンプト
- [x] チャット相談・最小限の追加質問
- [x] AIによる商品カテゴリ自動判断・予算配分
- [x] 商品選定（性能・価格・レビュー等を総合評価、最安値選びはしない設計のプロンプト）
- [x] 提案画面（商品画像・価格・ショップ名・レビュー・選定理由・購入ボタン・合計/差額）
- [x] 日本: Amazon / 楽天市場の比較表示
- [x] アフィリエイトリンク経由の購入ボタン（rel="sponsored"）
- [x] お気に入り保存・一覧
- [x] 構成共有（URL発行）
- [x] 相談履歴
- [ ] 国の自動判定（現状はUI上のボタンで手動切り替えのみ。IPベースの自動判定は未実装）
- [ ] ブラウザ言語設定による自動言語切り替え（現状は日本語UIのみ実装、英語UIは未着手）
- [ ] ログイン画面・サインアップ導線（Supabase Authクライアントの配線は済み、UIは未実装）

## 既知のTODO・注意点

- `AI_MODEL` の既定値は仕様書記載のモデル名をそのまま使用しています。実際に利用可能なモデルIDに置き換えてください。
- Amazon PA-API は審査・アフィリエイト契約が必要です。本番投入前に正式な利用条件を確認してください。
- 価格通貨は商品候補の先頭要素から推定しています。複数通貨が混在する構成がある場合は表示ロジックの拡張が必要です。
