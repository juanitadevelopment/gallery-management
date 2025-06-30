# Render.com デプロイメントガイド

このドキュメントでは、Gallery Management SystemをRender.comにデプロイする手順を説明します。

## 🚀 デプロイ手順

### 1. Render.com での設定

#### オプション1: Blueprint を使用（推奨）
1. [Render Dashboard](https://dashboard.render.com) にログイン
2. "Blueprints" → "Create Blueprint"
3. GitHubリポジトリを接続：`https://github.com/juanitadevelopment/gallery-management`
4. `render.yaml` ファイルが自動的に検出されます
5. "Apply" をクリックしてデプロイ開始

#### オプション2: 手動設定
バックエンド（Web Service）:
- **Name**: `gallery-management-api`
- **Environment**: `Node`
- **Build Command**: `cd server && npm install && npm run build`
- **Start Command**: `cd server && npm start`
- **Plan**: `Free`

フロントエンド（Static Site）:
- **Name**: `gallery-management-frontend`
- **Environment**: `Static Site`
- **Build Command**: `cd client && npm install && npm run build`
- **Publish Directory**: `client/dist`
- **Plan**: `Free`

### 2. 環境変数の設定

#### バックエンド環境変数
```
NODE_ENV=production
PORT=10000
```

#### フロントエンド環境変数
```
VITE_API_URL=https://gallery-management-api.onrender.com
```

### 3. デプロイ後の確認

デプロイが完了したら、以下をテストしてください：

1. **API Health Check**: `https://gallery-management-api.onrender.com/api/health`
2. **フロントエンド**: `https://gallery-management-frontend.onrender.com`
3. **データベース機能**: データの登録・表示・編集

## 📝 重要な注意点

### データベースについて
- Render.comの無料プランでは **ephemeral storage** を使用
- アプリの再起動時にデータが消失します
- 本格運用には PostgreSQL などの永続化ストレージが推奨

### 制限事項
- **スリープ機能**: 15分間アクセスがないとサービスがスリープ
- **起動時間**: スリープからの復帰に30秒程度かかる場合があります
- **月間制限**: 750時間/月の稼働時間制限

## 🔄 更新手順

コードを更新してデプロイするには：

1. ローカルで変更を加える
2. GitHubにプッシュ：
```bash
git add .
git commit -m "機能追加: 新機能の説明"
git push
```
3. Render.com で自動デプロイが開始されます

## 🐛 トラブルシューティング

### よくある問題

#### 1. CORS エラー
フロントエンドのURLがバックエンドのCORS設定に含まれているか確認

#### 2. データベース接続エラー
- `/tmp/database.db` パスが正しく設定されているか確認
- サーバーログでエラー詳細を確認

#### 3. ビルドエラー
- `package.json` の依存関係が正しいか確認
- TypeScript コンパイルエラーがないか確認

### ログの確認方法
1. Render Dashboard → サービス選択
2. "Logs" タブでリアルタイムログを確認
3. エラーメッセージを元にデバッグ

## 📊 本格運用への移行

### 推奨アップグレード
1. **Paid Plan**: スリープ機能を無効化
2. **PostgreSQL**: 永続的なデータストレージ
3. **Custom Domain**: 独自ドメインの設定
4. **SSL証明書**: 自動更新のHTTPS対応

### セキュリティ向上
1. **環境変数**: APIキーやデータベース認証情報
2. **認証機能**: ユーザーログインシステム
3. **レート制限**: API呼び出し頻度の制限

## 🔗 参考リンク

- [Render.com Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/node-express)
- [Static Sites on Render](https://render.com/docs/static-sites)