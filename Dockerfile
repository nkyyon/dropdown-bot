FROM node:18-alpine

WORKDIR /app

# 依存関係のインストール（開発依存関係も含む）
COPY package*.json ./
RUN npm ci

# アプリケーションコードのコピー
COPY . .

# TypeScriptビルド
RUN npm run build

# 本番用依存関係のみ再インストール
RUN npm ci --only=production && npm cache clean --force

# 非rootユーザーでの実行
USER node

# ポート公開
EXPOSE 3000

# ヘルスチェック用エンドポイント作成
RUN echo 'const express = require("express"); const app = express(); app.get("/health", (req, res) => res.json({status: "ok", timestamp: new Date().toISOString()})); app.listen(3000, () => console.log("Health check server running on port 3000"));' > health-server.js

# アプリケーション起動
CMD ["sh", "-c", "node health-server.js & npm start"]