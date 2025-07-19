# デプロイメント設計書

## デプロイ戦略

### 概要
KoyebのGitHub連携による自動デプロイメントを採用

### デプロイフロー
```
Local Development
    ↓ git push
GitHub Repository
    ↓ webhook
Koyeb Auto Deploy
    ↓ build & deploy
Production Environment
```

## Koyeb設定

### 基本設定
- **Region**: Washington D.C. (us-east)
- **Instance Type**: Web Service
- **Port**: 3000
- **Health Check**: `/health` エンドポイント

### リソース制限
```yaml
Resources:
  Memory: 512MB
  CPU: 0.2 vCPU
  Storage: Ephemeral
  Network: Shared
```

### 環境変数
```bash
# 必須環境変数
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
NODE_ENV=production

# オプション環境変数
GUILD_ID=your_guild_id_here  # 特定サーバー限定の場合
LOG_LEVEL=info
```

## Docker設定

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 依存関係のインストール
COPY package*.json ./
RUN npm ci --only=production

# アプリケーションコードのコピー
COPY . .

# TypeScriptビルド
RUN npm run build

# 非rootユーザーでの実行
USER node

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# アプリケーション起動
CMD ["npm", "start"]
```

### .dockerignore
```
node_modules
npm-debug.log
.git
.gitignore
README.md
Dockerfile
.dockerignore
docs/
*.md
.env
```

## CI/CD設定

### GitHub Actions（オプション）
```yaml
# .github/workflows/deploy.yml
name: Deploy to Koyeb

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: TypeScript check
        run: npm run type-check
        
      # Koyebが自動でビルド・デプロイを実行
```

## デプロイ手順

### 初回デプロイ
1. **GitHub Repository作成**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <repository-url>
   git push -u origin main
   ```

2. **Discord Application設定**
   - Discord Developer Portalでアプリケーション作成
   - Bot作成・Token取得
   - 必要な権限設定

3. **Koyebアプリケーション作成**
   - GitHub連携設定
   - 環境変数設定
   - デプロイ実行

4. **Discord Bot招待**
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2048&scope=bot%20applications.commands
   ```

### 日常デプロイ
```bash
# 変更をコミット
git add .
git commit -m "Add new feature"

# リモートにプッシュ（自動デプロイトリガー）
git push origin main

# Koyebダッシュボードでデプロイ状況確認
```

## 環境別設定

### Development
```bash
NODE_ENV=development
LOG_LEVEL=debug
DISCORD_TOKEN=dev_bot_token
GUILD_ID=dev_guild_id
```

### Production
```bash
NODE_ENV=production
LOG_LEVEL=info
DISCORD_TOKEN=prod_bot_token
# GUILD_ID は設定しない（全サーバー対応）
```

## モニタリング設定

### Koyeb監視
- **CPU使用率**: 80%以下維持
- **メモリ使用率**: 400MB以下維持
- **応答時間**: 3秒以内
- **稼働率**: 99%以上

### ログ監視
```typescript
// アプリケーションログ
console.log('[DEPLOY] Application started');
console.log('[HEALTH] Health check passed');
console.error('[ERROR] Deployment failed');
```

### アラート設定
- **サービス停止**: 5分以上応答なし
- **メモリ制限**: 450MB超過
- **エラー率**: 5%超過

## バックアップ・復旧

### データバックアップ
```bash
# characters.json の手動バックアップ
cp src/data/characters.json backup/characters_$(date +%Y%m%d).json

# Git経由での自動バックアップ
git add src/data/characters.json
git commit -m "Backup characters data"
git push origin main
```

### 復旧手順
1. **設定ファイル復旧**
   ```bash
   git checkout HEAD -- src/data/characters.json
   git push origin main
   ```

2. **アプリケーション再起動**
   - Koyebダッシュボードから手動再起動
   - または空コミットでの自動再デプロイ

3. **動作確認**
   - Discord Botの応答確認
   - キャラクター選択機能テスト

## トラブルシューティング

### よくある問題
1. **Bot Token無効**
   - 環境変数の確認
   - Discord Developer Portalでの再生成

2. **権限不足**
   - Bot権限の確認
   - サーバー招待URLの再生成

3. **JSON読み込みエラー**
   - ファイル形式の確認
   - 文法エラーの修正

4. **デプロイ失敗**
   - ビルドログの確認
   - 依存関係の見直し

### ログ確認方法
```bash
# Koyebログ確認
# ダッシュボードから Logs タブを参照

# ローカル確認
npm run dev
```