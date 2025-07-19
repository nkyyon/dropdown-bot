# CLAUDE.md

このファイルはClaude Codeが参照するプロジェクト情報を記載しています。

## プロジェクト概要

**プロジェクト名**: DropDown Bot  
**目的**: Discord上でキャラクター選択をDropDownMenuで行えるBot  
**用途**: ゲーム大会などで選手が使用キャラクターを運営に報告するため

## 技術スタック

- **言語**: Node.js + TypeScript
- **Discordライブラリ**: discord.js v14
- **データストレージ**: JSONファイル
- **デプロイ先**: Koyeb（無料枠）
- **バージョン管理**: Git + GitHub

## 開発・運用コマンド

```bash
# 開発環境
npm install
npm run dev

# ビルド・実行
npm run build
npm start

# テスト
npm test

# デプロイ
git push origin main  # Koyeb自動デプロイ
```

## 環境変数

- `DISCORD_TOKEN`: Discord Bot Token
- `CLIENT_ID`: Discord Application Client ID
- `GUILD_ID`: 対象Discord Server ID（オプション）

## 主要機能

### コマンド一覧
- `/character add <name>` - キャラクター追加（管理者のみ）
- `/character remove <name>` - キャラクター削除（管理者のみ）
- `/character select` - キャラクター選択（全ユーザー）

### キャラクター管理方式
- **ハイブリッド方式**: Discordコマンド + JSON直接編集
- **反映方法**: 再起動方式（Git push → Koyeb自動デプロイ）

## ファイル構成

```
drop-down-bot/
├── src/
│   ├── commands/          # スラッシュコマンド
│   ├── handlers/          # イベントハンドラー
│   ├── data/             # データファイル
│   │   └── characters.json
│   └── index.ts          # メインエントリーポイント
├── docs/                 # ドキュメント
├── package.json
├── tsconfig.json
├── Dockerfile           # Koyeb用
└── CLAUDE.md           # このファイル
```

## 権限設計

- **管理者**: キャラクター追加・削除権限
- **一般ユーザー**: キャラクター選択のみ

## 運用フロー

1. **日常運用**: `/character add リュウ` でキャラクター追加
2. **一括更新**: `characters.json` 直接編集 → Git push → 自動デプロイ
3. **選択**: `/character select` → DropDownMenu表示 → 選択結果をチャットに出力

## 詳細ドキュメント

- [要件定義書](./docs/requirements.md) - 機能要件・非機能要件の詳細
- [アーキテクチャ設計書](./docs/architecture.md) - システム構成・技術構成の詳細  
- [デプロイメント設計書](./docs/deployment.md) - Koyebデプロイ・CI/CD設定
- [ユーザーガイド](./docs/user-guide.md) - 操作方法・トラブルシューティング

## 開発状況

要件定義・技術選定完了、実装準備中