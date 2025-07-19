# アーキテクチャ設計書

## システム構成図

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Discord UI    │    │   Discord API   │    │   Koyeb Cloud   │
│                 │    │                 │    │                 │
│  - SlashCommand │◄──►│  - Interactions │◄──►│  - Node.js App  │
│  - SelectMenu   │    │  - Gateway      │    │  - JSON Storage │
│  - Chat Output  │    │  - REST API     │    │  - Auto Deploy  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   GitHub Repo   │
                                               │                 │
                                               │  - Source Code  │
                                               │  - JSON Data    │
                                               │  - CI/CD        │
                                               └─────────────────┘
```

## 技術スタック

### フロントエンド
- **Discord Client**: ユーザーインターフェース
- **Slash Commands**: コマンド入力
- **Select Menu**: DropDown UI
- **Message**: 結果出力

### バックエンド
- **Runtime**: Node.js v18+
- **Language**: TypeScript
- **Discord Library**: discord.js v14
- **Data Format**: JSON
- **Process Manager**: PM2（Koyeb内）

### インフラストラクチャ
- **Hosting**: Koyeb（PaaS）
- **CI/CD**: GitHub Actions → Koyeb Auto Deploy
- **Monitoring**: Koyeb Dashboard
- **Storage**: ファイルシステム（JSON）

## アプリケーション構成

### ディレクトリ構造
```
drop-down-bot/
├── src/
│   ├── commands/              # スラッシュコマンド
│   │   ├── character.ts       # キャラクター管理
│   │   └── index.ts          # コマンド登録
│   ├── handlers/              # イベントハンドラー
│   │   ├── interactionCreate.ts
│   │   └── ready.ts
│   ├── utils/                 # ユーティリティ
│   │   ├── characterManager.ts
│   │   └── permissions.ts
│   ├── data/                  # データファイル
│   │   └── characters.json
│   ├── types/                 # 型定義
│   │   └── index.ts
│   └── index.ts              # メインエントリーポイント
├── docs/                      # ドキュメント
├── package.json
├── tsconfig.json
├── Dockerfile                # Koyeb用
└── CLAUDE.md
```

### データフロー

#### キャラクター選択フロー
```
1. User: /character select
2. Bot: characters.json 読み込み
3. Bot: SelectMenu 生成・送信
4. User: DropDown選択
5. Bot: 選択結果をチャットに出力
```

#### キャラクター管理フロー
```
【コマンド経由】
1. Admin: /character add "春麗"
2. Bot: characters.json 更新
3. Bot: 完了メッセージ送信

【JSON直接編集】
1. Admin: characters.json 編集
2. Admin: Git push
3. Koyeb: 自動デプロイ実行
4. Bot: 新データで再起動
```

## データ設計

### characters.json構造
```json
{
  "characters": [
    "春麗",
    "リュウ",
    "ケン",
    "ザンギエフ",
    "さくら"
  ],
  "metadata": {
    "lastUpdated": "2025-07-19T12:00:00Z",
    "version": "1.0",
    "maxCharacters": 25
  }
}
```

### Discord Interaction Data
```typescript
interface CharacterSelectInteraction {
  customId: 'character_select';
  values: string[];
  user: {
    id: string;
    username: string;
  };
  guild: {
    id: string;
    name: string;
  };
}
```

## セキュリティ設計

### 認証・認可
- **Discord OAuth**: Discord標準認証
- **Bot Token**: 環境変数で管理
- **Role Check**: 管理者権限確認
- **Guild Restriction**: 特定サーバー限定

### データ保護
- **Token Management**: 環境変数・Secret管理
- **Input Validation**: コマンド引数検証
- **Rate Limiting**: Discord標準制限
- **Error Handling**: 機密情報の非表示

## パフォーマンス設計

### 最適化戦略
- **JSON Cache**: メモリキャッシュ
- **Lazy Loading**: 必要時のみファイル読み込み
- **Connection Pool**: Discord接続の再利用
- **Error Recovery**: 自動再接続

### 制限事項
- **Memory**: 512MB（Koyeb制限）
- **CPU**: 0.2 CPU（Koyeb制限）
- **Storage**: 一時的（再デプロイで初期化）
- **Network**: 従量制（Koyeb）

## 監視・運用設計

### ログ出力
```typescript
// コンソールログ
console.log('[INFO] Bot started successfully');
console.log('[COMMAND] Character added: 春麗');
console.log('[ERROR] Failed to load characters.json');
```

### ヘルスチェック
- **Discord Connection**: Ready イベント
- **Command Response**: 3秒以内応答
- **File Access**: JSON読み書き確認

### バックアップ戦略
- **Git Repository**: 全データのバージョン管理
- **Manual Backup**: 定期的なJSON手動保存
- **Deployment History**: Koyebデプロイ履歴