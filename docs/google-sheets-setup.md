# Google Sheets セットアップガイド

## 概要

このBotはGoogle Sheetsをデータベースとして使用します。非技術者でも簡単にキャラクターデータを管理できます。

## 1. Google Cloud Consoleでの設定

### Service Accountの作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. **APIs & Services** → **Library** で **Google Sheets API** を有効化
4. **APIs & Services** → **Credentials** → **Create Credentials** → **Service Account**
5. Service Account名を入力（例：`dropdown-bot-service`）
6. **Keys** タブ → **Add Key** → **Create New Key** → **JSON**
7. JSONファイルをダウンロード

### 認証情報の取得

JSONファイルから以下の情報を取得：
- `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → `GOOGLE_PRIVATE_KEY`

## 2. Google Sheetsの作成

### スプレッドシート作成

1. [Google Sheets](https://sheets.google.com/) で新しいスプレッドシートを作成
2. スプレッドシート名：`DropDown Bot Characters`
3. URLから Spreadsheet ID を取得
   ```
   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   ```

### シート構成

#### Characters シート
| A (ID) | B (Name) | C (Created) | D (Updated) |
|--------|----------|-------------|-------------|
| 1      | 春麗     | 2025-07-19T... | 2025-07-19T... |
| 2      | リュウ   | 2025-07-19T... | 2025-07-19T... |
| 3      | ケン     | 2025-07-19T... | 2025-07-19T... |
| 4      | ザンギエフ | 2025-07-19T... | 2025-07-19T... |

#### Metadata シート
| A (Key) | B (Value) |
|---------|-----------|
| version | 1.0 |
| max_characters | 25 |
| last_updated | 2025-07-19T... |

### 権限設定

1. スプレッドシートの **共有** ボタンをクリック
2. Service Account のメールアドレス（`GOOGLE_SERVICE_ACCOUNT_EMAIL`）を追加
3. 権限を **編集者** に設定

## 3. 環境変数設定

### ローカル開発（.env）
```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
```

### Koyeb本番環境
Koyebの環境変数設定で上記3つの値を設定

## 4. 日常運用

### キャラクター管理方法

#### Discord コマンド（推奨）
```bash
/character add 新キャラクター    # キャラクター追加
/character remove 古キャラクター # キャラクター削除
/character list                 # 現在のリスト確認
```

#### スプレッドシート直接編集
1. Characters シートを開く
2. B列（Name列）に新しいキャラクター名を入力
3. 自動的にBotに反映される（再起動不要）

**注意事項：**
- A列（ID）は手動で変更しないでください
- 空の行は自動的にスキップされます
- Metadata シートの max_characters で上限設定が可能

### バックアップ
- Google Sheetsは自動的にバージョン管理される
- **ファイル** → **版履歴** → **版履歴を表示** でバックアップ確認

## 5. トラブルシューティング

### よくある問題

#### 認証エラー
- Service Account の権限確認
- スプレッドシートの共有設定確認
- GOOGLE_PRIVATE_KEY の改行文字確認（\nが正しく設定されているか）

#### データが反映されない
- シート名が正確か確認（"Characters", "Metadata"）
- スプレッドシートIDが正確か確認

#### 権限エラー
- Service Account にスプレッドシートの編集権限があるか確認

### デバッグ方法
```bash
# ローカルでの接続テスト
npm run dev
# ログで "[INFO] Connected to spreadsheet:" が表示されるか確認
```

## 6. スプレッドシートテンプレート

### テンプレートファイル
初期設定用のテンプレートファイルを提供します：

**Characters シート:**
```
ID	Name	Created	Updated
1	春麗	2025-07-19T12:00:00Z	2025-07-19T12:00:00Z
2	リュウ	2025-07-19T12:00:00Z	2025-07-19T12:00:00Z
3	ケン	2025-07-19T12:00:00Z	2025-07-19T12:00:00Z
4	ザンギエフ	2025-07-19T12:00:00Z	2025-07-19T12:00:00Z
```

**Metadata シート:**
```
Key	Value
version	1.0
max_characters	25
last_updated	2025-07-19T12:00:00Z
```

このテンプレートをコピーしてスプレッドシートに貼り付けることで、簡単に初期設定が完了します。