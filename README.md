# Gallery Management System

小さなギャラリーのスペース管理システム。10箇所の展示場所を持つギャラリーで、絵画の管理と展示スケジュールを効率的に管理できます。

## 技術スタック

- **Frontend**: Vue.js 3 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite
- **API**: REST API

## 機能

### 🎨 絵画マスター管理
- 絵画の新規登録（ID自動生成、タイトル、作者名、詳細URL）
- 登録済み絵画の一覧表示（テーブルソート機能付き）
- 絵画情報の編集・削除
- 各カラムでのソート機能（昇順・降順切り替え）

### 📍 掲載場所管理
- 10箇所の掲載場所管理（場所ID: 1-10）
- 各場所の設置可能サイズ設定（幅、高さ）
- 場所一覧表示（テーブルソート機能付き）
- 場所情報の編集
- スケジュール確認機能

### 📅 展示管理機能
- 絵画を特定の場所に特定期間展示する管理
- 展示登録（絵画選択、場所選択、開始日、終了日）
- 展示一覧表示（ソート機能付き）
- 現在展示中の作品一覧
- **展示期間の重複チェック**
- 展示ステータス管理（予定・展示中・完了）
- リアルタイム空き状況確認

### 💾 データベース閲覧機能
- SQLiteの生データを確認できる画面
- 全テーブル（artworks, locations, exhibitions）のデータ表示
- データベース統計とヘルスチェック
- 開発・デバッグ用途

### ⚡ 同時アクセス対応
- SQLiteのWALモード（Write-Ahead Logging）を活用
- 楽観的ロック制御（updated_atフィールド使用）
- トランザクション管理による競合制御
- 5名程度の同時利用を想定

## インストールと起動

### 1. 依存関係のインストール

```bash
# ルートディレクトリで全ての依存関係をインストール
npm run install:all
```

### 2. 開発サーバーの起動

```bash
# クライアントとサーバーを同時起動
npm run dev
```

または個別に起動:

```bash
# サーバーのみ起動 (http://localhost:3000)
npm run dev:server

# クライアントのみ起動 (http://localhost:5173)  
npm run dev:client
```

### 3. アプリケーションへのアクセス

ブラウザで `http://localhost:5173` にアクセスしてください。

### 4. サーバーの停止

開発サーバーを停止するには以下の方法があります：

#### 方法1: キーボードショートカット（推奨）
```bash
# サーバーが動いているターミナルで
Ctrl + C
```

#### 方法2: プロセス名で停止
```bash
# TypeScript開発サーバーを停止
pkill -f "ts-node-dev"

# Vite開発サーバーを停止  
pkill -f "vite"

# 全てのnpmプロセスを停止
pkill -f "npm run dev"
```

#### 方法3: ポート番号で停止
```bash
# ポート3000を使用しているプロセスを停止（サーバー）
lsof -ti:3000 | xargs kill -9

# ポート5173を使用しているプロセスを停止（クライアント）
lsof -ti:5173 | xargs kill -9
```

#### 方法4: 一括停止コマンド
```bash
# 全ての関連プロセスを一度に停止
pkill -f "ts-node-dev" && pkill -f "vite" && pkill -f "npm"
```

## プロジェクト構造

```
gallery-app/
├── package.json                 # ルートpackage.json（全体管理）
├── README.md                    # このファイル
├── CLAUDE.md                    # 開発者向けドキュメント
├── server/                      # バックエンド
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── app.ts              # Expressアプリメイン
│   │   ├── database.ts         # SQLite設定・初期化
│   │   └── routes/             # APIルート
│   │       ├── artworks.ts     # 絵画管理API
│   │       ├── locations.ts    # 場所管理API
│   │       ├── exhibitions.ts  # 展示管理API
│   │       └── database.ts     # データベース管理API
│   └── database.db             # SQLiteデータベースファイル
└── client/                     # フロントエンド
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.ts             # Vueアプリエントリーポイント
        ├── App.vue             # ルートコンポーネント
        ├── types/
        │   └── index.ts        # TypeScript型定義
        ├── components/         # 再利用可能コンポーネント
        │   ├── Navigation.vue  # ナビゲーション
        │   └── SortableTable.vue # ソート可能テーブル
        └── views/              # ページコンポーネント
            ├── Home.vue        # ホーム（ダッシュボード）
            ├── Artworks.vue    # 絵画管理
            ├── Locations.vue   # 場所管理
            ├── Exhibitions.vue # 展示管理
            └── Database.vue    # データベース閲覧
```

## API仕様

### 絵画API
- `GET /api/artworks` - 絵画一覧取得
- `POST /api/artworks` - 新規絵画登録
- `PUT /api/artworks/:id` - 絵画情報更新
- `DELETE /api/artworks/:id` - 絵画削除

### 場所API
- `GET /api/locations` - 場所一覧取得
- `PUT /api/locations/:id` - 場所情報更新
- `GET /api/locations/:id/availability` - 空き状況確認
- `GET /api/locations/:id/schedule` - スケジュール取得

### 展示API
- `GET /api/exhibitions` - 展示一覧取得
- `POST /api/exhibitions` - 新規展示登録
- `PUT /api/exhibitions/:id` - 展示情報更新
- `DELETE /api/exhibitions/:id` - 展示削除
- `GET /api/exhibitions/current` - 現在展示中の作品

### データベースAPI
- `GET /api/database/tables` - テーブル一覧取得
- `GET /api/database/:table` - 指定テーブルの全データ取得
- `GET /api/database/stats/summary` - データベース統計取得
- `GET /api/database/health` - データベースヘルスチェック

## データベース設計

### artworks テーブル
```sql
CREATE TABLE artworks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    detail_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### locations テーブル
```sql
CREATE TABLE locations (
    id INTEGER PRIMARY KEY,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### exhibitions テーブル
```sql
CREATE TABLE exhibitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artwork_id INTEGER NOT NULL,
    location_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'scheduled',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artwork_id) REFERENCES artworks(id),
    FOREIGN KEY (location_id) REFERENCES locations(id),
    UNIQUE(location_id, start_date, end_date)
);
```

## 初期データ

アプリケーション初回起動時に以下のサンプルデータが自動的に投入されます：

- **場所**: 10箇所（各種サイズの展示スペース）
- **絵画**: 5作品のサンプル
- **展示**: 数件のサンプル展示データ（異なるステータス）

## 主な機能詳細

### 展示期間の競合制御

展示登録時に同じ場所・期間での重複を防ぐため、以下の仕組みを実装：

1. **データベースレベル**: UNIQUE制約による重複防止
2. **アプリケーションレベル**: トランザクション内での競合チェック
3. **UIレベル**: リアルタイム空き状況表示

### テーブルソート機能

全ての一覧画面でカラムヘッダークリックによるソートを実装：

- 昇順・降順・ソートなしの3状態
- 日本語ロケール対応の文字列ソート
- 数値・日付の適切なソート
- ソート状態のビジュアル表示

### 楽観的ロック制御

データの同時編集を防ぐため、`updated_at`フィールドを使用した楽観的ロックを実装：

- 編集開始時のタイムスタンプを保持
- 更新時に他のユーザーによる変更をチェック
- 競合検出時は分かりやすいエラーメッセージを表示

## 開発用コマンド

### プロダクションビルド
```bash
npm run build
```

### コード品質管理
```bash
# サーバー側
cd server
npm run lint      # ESLint実行
npm run format    # Prettier実行

# クライアント側  
cd client
npm run lint      # ESLint実行
npm run format    # Prettier実行
```

## トラブルシューティング

### データベース関連
- データベースヘルスチェック: `GET /api/database/health`
- SQLite BUSY エラーが発生した場合は、しばらく時間をおいて再試行

### 同時アクセス関連
- 楽観的ロック競合が発生した場合は、画面を更新してから再試行
- 展示期間の重複エラーは、他の期間または場所を選択

### 開発環境
- ポート3000（サーバー）、5173（クライアント）が使用されていないか確認
- TypeScriptコンパイルエラーがある場合は、型定義を確認

## ライセンス

このプロジェクトはサンプルアプリケーションです。