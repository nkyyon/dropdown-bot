# DropDown Bot

Discord上でキャラクター選択をDropDownMenuで行えるBotです。

## 機能

- `/character select` - DropDownMenuからキャラクター選択
- `/character add <name>` - キャラクター追加（管理者のみ）
- `/character remove <name>` - キャラクター削除（管理者のみ）
- `/character list` - キャラクターリスト表示（管理者のみ）
- `/character info` - Bot情報表示（管理者のみ）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、必要な値を設定してください。

```bash
cp .env.example .env
```

### 3. Discord Application設定

1. [Discord Developer Portal](https://discord.com/developers/applications) でアプリケーション作成
2. Bot作成・Token取得
3. 必要な権限設定：
   - Send Messages
   - Use Slash Commands
   - Read Message History

### 4. 開発環境での実行

```bash
npm run dev
```

### 5. 本番環境用ビルド

```bash
npm run build
npm start
```

## デプロイ

### Koyebへのデプロイ

1. GitHubリポジトリを作成してコードをプッシュ
2. Koyebでアプリケーション作成
3. GitHub連携設定
4. 環境変数設定
5. デプロイ実行

詳細は [docs/deployment.md](./docs/deployment.md) を参照してください。

## ドキュメント

- [要件定義書](./docs/requirements.md)
- [アーキテクチャ設計書](./docs/architecture.md)
- [デプロイメント設計書](./docs/deployment.md)
- [ユーザーガイド](./docs/user-guide.md)

## ライセンス

MIT