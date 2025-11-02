
# CSV データのデータベース化

https://rssystem.go.jp/download-csv から入手したデータを加工し Supabase データベースにデータを登録する
元データには表記ゆれやカラム重複があるため、スクリプトで正規化を行う


## プログラム構成

```plaintext
tools/
├─ build_database.py         # メインスクリプト
├─ build_database/
│   ├─ __init__.py
│   ├─ common.py            # 共通関数（sanitize, normalize, load_csv）
│   ├─ basic_info.py        # 基本情報セクション
│   ├─ budget_execution.py  # 予算・執行セクション
│   └─ expenditure.py       # 支出先セクション
├─ supabase.sh              # Supabase 環境構築スクリプト
└─ requirements.txt

supabase/
└─ seed.sql                  # テーブル・ビュー定義（自動実行）
```


## 処理概要

1. `.env` から Supabase 接続情報を読み込み（`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`）
2. Zip ファイルを解凍し CSV ファイルを抽出
3. 各セクションのテーブル構築
4. Supabase へのデータ投入


## テーブル正規化

セクションごとにテーブルを作成

### 基本情報セクション（basic_info.py）

**入力ファイル**: tools/input/csv/1-*.csv

**出力テーブル**
- `projects_master`: 事業基本情報マスタ（1-1 と 1-2 を結合）
- `policies`: 政策・施策との紐付け（1-3 から抽出）
- `laws`: 法令との紐付け（1-3 から抽出）
- `subsidies`: 補助率情報（1-4）
- `related_projects`: 関連事業（1-5）

### 予算・執行セクション（budget_execution.py）

**入力ファイル**: tools/input/csv/2-*.csv

**出力テーブル**
- `budgets`: 予算・執行サマリ（2-1）
- `budget_items`: 歳出予算項目の詳細（2-2）

### 支出先セクション（expenditure.py）

**入力ファイル**: tools/input/csv/5-*.csv

**出力テーブル**
- `expenditures`: 支出先情報（5-1）
- `expenditure_flows`: 支出先ブロックのつながり（5-2）
- `expenditure_usages`: 費目・使途（5-3）
- `expenditure_contracts`: 国庫債務負担行為等による契約（5-4）


## カラムデータ修正

### サニタイズ（全カラム）

すべてのカラムに対して無効文字の除去を実施

| 処理内容       | 詳細                                      |
| -------------- | ----------------------------------------- |
| NULL 文字除去  | `\x00` を削除                             |
| 制御文字除去   | `\x00-\x1F`, `\x7F` を空白に置換          |
| 改行コード統一 | `\r\n`, `\r` を `\n` に統一               |
| 前後空白除去   | `strip()`                                 |
| 欠損値統一     | `－`, `なし`, `無し` などを `NULL` に変換 |

### データ正規化（一部のみ）

自由記述カラムに対して [neologdn](https://github.com/ikegami-yukino/neologdn) を使用し正規化

正規化内容:
- 全角半角の統一
- Unicode NFKC 正規化
- 長音符・波ダッシュの統一
- 連続する空白の削除

正規化対象カラムは各セクションのドキュメントで定義する


## テーブル・ビュー一覧

[ER 図](../database/rs_data.mermaid)

| 種別     | 名前                                 | 説明                         |
| -------- | ------------------------------------ | ---------------------------- |
| テーブル | `projects_master`                    | 事業の基本情報マスタ         |
| テーブル | `policies`                           | 政策・施策の詳細             |
| テーブル | `laws`                               | 法令の詳細                   |
| テーブル | `subsidies`                          | 補助率の詳細                 |
| テーブル | `related_projects`                   | 関連事業の詳細               |
| テーブル | `budgets`                            | 予算・執行のサマリ           |
| テーブル | `budget_items`                       | 歳出予算項目の詳細           |
| テーブル | `expenditures`                       | 支出先情報                   |
| テーブル | `expenditure_flows`                  | 支出先ブロックの資金の流れ   |
| テーブル | `expenditure_usages`                 | 費目・使途の詳細             |
| テーブル | `expenditure_contracts`              | 国庫債務負担行為等の契約情報 |
| ビュー   | `policies_with_project`              | 政策情報 + 事業名            |
| ビュー   | `laws_with_project`                  | 法令情報 + 事業名            |
| ビュー   | `subsidies_with_project`             | 補助率情報 + 事業名          |
| ビュー   | `related_projects_with_project`      | 関連事業情報 + 事業名        |
| ビュー   | `budgets_with_project`               | 予算サマリ + 事業名          |
| ビュー   | `budget_items_with_project`          | 予算項目 + 事業名            |
| ビュー   | `expenditures_with_project`          | 支出先情報 + 事業名          |
| ビュー   | `expenditure_flows_with_project`     | 支出ブロックの流れ + 事業名  |
| ビュー   | `expenditure_usages_with_project`    | 費目・使途 + 事業名          |
| ビュー   | `expenditure_contracts_with_project` | 契約情報 + 事業名            |
| ビュー   | `projects_summary`                   | 事業ごとの関連情報サマリ     |
