# データ正規化方針書（支出先セクション）


## 概要

- **対象データ**: `input/5-*.csv`（4ファイル、計 260,071 行）
- **出力テーブル**: 4テーブル（`expenditure_info`, `expenditure_flow`, `expenditure_usage`, `expenditure_contract`）
- **文字コード**: UTF-8 with BOM

**共通の正規化方針**: [../build_database.md](../build_database.md#共通の正規化方針) を参照


## 正規化対象カラム

名称系
- 事業名
- 府省庁
- 政策所管府省庁
- 局・庁
- 部
- 課
- 室
- 班
- 係
- 支出先ブロック名
- 支出元の支出先ブロック名
- 支出先の支出先ブロック名
- 支出先名
- 契約先名（国庫債務負担行為等による契約）

自由記述
- 事業を行う上での役割
- 契約概要
- 契約概要（契約名）（国庫債務負担行為等による契約）
- 一者応札・一者応募又は競争性のない随意契約となった理由及び改善策（支出額10億円以上）
- 一者応札・一者応募又は競争性のない随意契約となった理由及び改善策（契約額10億円以上）（国庫債務負担行為等による契約）
- 資金の流れの補足情報
- 国自らが支出する間接経費の項目

所在地・分類
- 所在地
- 契約先の所在地（国庫債務負担行為等による契約）
- 法人種別
- 契約先の法人種別（国庫債務負担行為等による契約）
- 契約方式等
- 具体的な契約方式等
- 契約方式等（国庫債務負担行為等による契約）
- 具体的な契約方式等（国庫債務負担行為等による契約）
- 費目
- 使途


## 出力テーブル構造

### `expenditure_info`（支出先情報）

データソース: `5-1_支出先_支出情報.csv`

**特徴**:
- 1事業につき複数の支出先ブロックが存在
- 各ブロック内に複数の支出先が存在
- 金額データはTEXT型で保持（カンマ区切り、全角数字混在の可能性）

**主キー**: `project_year`, `project_id`, `seq_no`

**カラム構成**:
```
- project_year (INTEGER): 事業年度
- project_id (TEXT): 予算事業ID
- seq_no (INTEGER): 連番
- project_name (TEXT, 正規化): 事業名
- block_number (TEXT): 支出先ブロック番号
- block_name (TEXT, 正規化): 支出先ブロック名
- num_recipients (TEXT): 支出先の数
- role (TEXT, 正規化): 事業を行う上での役割
- block_total_amount (TEXT): ブロックの合計支出額
- recipient_name (TEXT, 正規化): 支出先名
- corporate_number (TEXT): 法人番号
- location (TEXT, 正規化): 所在地
- corporate_type (TEXT, 正規化): 法人種別
- other_recipient (TEXT): その他支出先
- recipient_total_amount (TEXT): 支出先の合計支出額
- contract_summary (TEXT, 正規化): 契約概要
- amount (TEXT): 金額
- contract_method (TEXT, 正規化): 契約方式等
- specific_contract_method (TEXT, 正規化): 具体的な契約方式等
- num_bidders (TEXT): 入札者数
- bid_rate (TEXT): 落札率
- sole_bid_reason (TEXT, 正規化): 一者応札・一者応募又は競争性のない随意契約となった理由及び改善策（支出額10億円以上）
- other_contract (TEXT): その他の契約
```


### `expenditure_flow`（支出先ブロックのつながり）

データソース: `5-2_支出先_支出ブロックのつながり.csv`

**特徴**:
- 支出元ブロック → 支出先ブロックの資金の流れを表現
- 「担当組織からの支出」が空でない場合は起点ブロック

**主キー**: `project_year`, `project_id`, `seq_no`

**カラム構成**:
```
- project_year (INTEGER): 事業年度
- project_id (TEXT): 予算事業ID
- seq_no (INTEGER): 連番
- project_name (TEXT, 正規化): 事業名
- source_block (TEXT): 支出元の支出先ブロック
- source_block_name (TEXT, 正規化): 支出元の支出先ブロック名
- from_organization (TEXT): 担当組織からの支出
- destination_block (TEXT): 支出先の支出先ブロック
- destination_block_name (TEXT, 正規化): 支出先の支出先ブロック名
- flow_supplement (TEXT, 正規化): 資金の流れの補足情報
- indirect_cost (TEXT): 国自らが支出する間接経費
- indirect_cost_item (TEXT, 正規化): 国自らが支出する間接経費の項目
- indirect_cost_amount (TEXT): 国自らが支出する間接経費の金額
```


### `expenditure_usage`（費目・使途）

データソース: `5-3_支出先_費目・使途.csv`

**特徴**:
- 支出先ごとの費目・使途の内訳
- 同一支出先・契約概要に対して複数の費目・使途が存在

**主キー**: `project_year`, `project_id`, `seq_no`

**カラム構成**:
```
- project_year (INTEGER): 事業年度
- project_id (TEXT): 予算事業ID
- seq_no (INTEGER): 連番
- project_name (TEXT, 正規化): 事業名
- block_number (TEXT): 支出先ブロック番号
- recipient_name (TEXT, 正規化): 支出先名
- corporate_number (TEXT): 法人番号
- contract_summary (TEXT, 正規化): 契約概要
- expense_item (TEXT, 正規化): 費目
- usage (TEXT, 正規化): 使途
- amount (TEXT): 金額
```


### `expenditure_contract`（国庫債務負担行為等による契約）

データソース: `5-4_支出先_国庫債務負担行為等による契約.csv`

**特徴**:
- 国庫債務負担行為等の複数年度契約情報
- 長期契約の詳細を記録

**主キー**: `project_year`, `project_id`, `seq_no`

**カラム構成**:
```
- project_year (INTEGER): 事業年度
- project_id (TEXT): 予算事業ID
- seq_no (INTEGER): 連番
- project_name (TEXT, 正規化): 事業名
- block_number (TEXT): 支出先ブロック（国庫債務負担行為等による契約）
- contractor_name (TEXT, 正規化): 契約先名（国庫債務負担行為等による契約）
- contractor_corporate_number (TEXT): 契約先の法人番号（国庫債務負担行為等による契約）
- contractor_location (TEXT, 正規化): 契約先の所在地（国庫債務負担行為等による契約）
- contractor_type (TEXT, 正規化): 契約先の法人種別（国庫債務負担行為等による契約）
- contract_summary (TEXT, 正規化): 契約概要（契約名）（国庫債務負担行為等による契約）
- other_contract (TEXT): その他の契約
- contract_amount (TEXT): 契約額（国庫債務負担行為等による契約）
- contract_method (TEXT, 正規化): 契約方式等（国庫債務負担行為等による契約）
- specific_contract_method (TEXT, 正規化): 具体的な契約方式等（国庫債務負担行為等による契約）
- num_bidders (TEXT): 入札者数（応募者数）（国庫債務負担行為等による契約）
- bid_rate (TEXT): 落札率（％）（国庫債務負担行為等による契約）
- sole_bid_reason (TEXT, 正規化): 一者応札・一者応募又は競争性のない随意契約となった理由及び改善策（契約額10億円以上）（国庫債務負担行為等による契約）
- other_contract_detail (TEXT): その他の契約（国庫債務負担行為等による契約）
```


## データ保持方針

- 金額データ（支出額、契約額、落札率等）は **型変換を行わず** TEXT 型で保持
- 全角数字・カンマ・小数点の混在に対応
- 法人番号・ブロック番号等の識別子もTEXT型で保持（前ゼロの保持、数値でない値の対応）
- データの欠損・変換失敗による情報喪失を防ぐ
- 必要に応じてクエリ時に `CAST()` や `REPLACE()` で変換


## データ処理ロジック

### seq_no の採番

**全テーブル共通:**
```python
df["seq_no"] = df.groupby(
    ["事業年度", "予算事業ID"]
).cumcount() + 1
```

- 同一事業（`事業年度`, `予算事業ID`）内でCSVの出現順に連番（1から開始）
- 各テーブルで独立して採番（テーブル間でseq_noの値は対応しない）


## 注意事項

### 金額データの特性

- **全角数字混在**: `１２３４５` のような全角数字が含まれる可能性
- **カンマ区切り**: `1,234,567` のような桁区切り
- **単位**: 単位記号（円、千円等）が含まれる可能性
- **空文字**: 金額が存在しない場合は空文字（NULL として扱う）

### 法人番号の特性

- 13桁の数値だが TEXT 型で保持
- 前ゼロが存在する（例: `0123456789012`）
- 空の場合あり（個人事業主等）

### ブロック構造

- `expenditure_info`: 各ブロック内の支出先詳細
- `expenditure_flow`: ブロック間の資金の流れ
- ブロック番号は文字列（例: `A`, `B`, `C` または `1`, `2`, `3`）
