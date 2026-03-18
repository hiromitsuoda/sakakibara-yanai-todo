# 行政書士法人榊原・箭内事務所 TODO管理システム

取引先から依頼のTODOリスト管理Webアプリ

---

## 🚀 ローカル起動手順

```bash
# 1. プロジェクトフォルダに移動
cd todo-app

# 2. 依存パッケージをインストール
npm install

# 3. 環境変数を設定
cp .env.local.example .env.local
# .env.local をエディタで開いてSupabaseの値を入力

# 4. 開発サーバー起動
npm run dev
# → http://localhost:3000 で確認
```

---

## ☁️ Vercel デプロイ手順

### 1. GitHubにリポジトリを作成
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/your-account/sakakibara-yanai-todo.git
git push -u origin main
```

### 2. Vercelにデプロイ
1. https://vercel.com にアクセス → ログイン
2. 「New Project」→ GitHubリポジトリを選択
3. 「Environment Variables」に以下を設定:
   - `NEXT_PUBLIC_SUPABASE_URL` = https://xxxxxx.supabase.co
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = eyJ...
4. 「Deploy」をクリック

---

## 🗄️ Supabase セットアップ手順

1. https://app.supabase.com にアクセス → 新規プロジェクト作成
2. 「SQL Editor」で `supabase/schema.sql` の内容を実行
3. 「Project Settings → API」からURLとAnon Keyをコピー
4. `.env.local` に貼り付け

---

## 🛠️ 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js 14 (App Router) |
| UI | Tailwind CSS |
| データベース | Supabase (PostgreSQL) |
| ホスティング | Vercel |
| 言語 | TypeScript |

---

## 📋 機能一覧

- [x] カンバンボード（期限超過/未着手/進行中/完了）
- [x] リストビュー
- [x] 担当者別フィルター（全員/榊原/箭内/山本/鈴木）
- [x] タグフィルター（許可申請/変更届/相談対応/法人/更新）
- [x] テキスト検索
- [x] TODOカード展開・コメント入力・保存
- [x] ステータス変更（進行中へ・完了にする）
- [x] CSV取込モーダル（デモ付き）
- [x] PDF添付モーダル
- [x] 新規TODO作成
- [x] TODO削除
- [x] モバイル対応（スマホ下部ナビ）
- [ ] Supabase実DB連携（.env.local設定後に有効化）
- [ ] CSV Shift-JIS対応パース（本番実装予定）
- [ ] PDF viewer
- [ ] カレンダービュー

---

## 📁 ディレクトリ構成

```
todo-app/
├── app/
│   ├── layout.tsx      # ルートレイアウト
│   ├── page.tsx        # メインページ（状態管理）
│   └── globals.css     # グローバルCSS
├── components/
│   ├── Header.tsx      # ヘッダー・担当者切替
│   ├── KanbanBoard.tsx # カンバンボード
│   ├── TodoCard.tsx    # TODOカード（展開・操作）
│   ├── ImportModal.tsx # CSV/PDF取込モーダル
│   ├── AddTodoModal.tsx# 新規TODO作成モーダル
│   └── Toast.tsx       # 通知トースト
├── data/
│   └── mockData.ts     # モックデータ（行政書士業務）
├── lib/
│   ├── types.ts        # TypeScript型定義
│   └── supabase.ts     # Supabaseクライアント
└── supabase/
    └── schema.sql      # DBスキーマ
```
