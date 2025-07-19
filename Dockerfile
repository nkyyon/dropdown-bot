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

# アプリケーション起動
CMD ["npm", "start"]