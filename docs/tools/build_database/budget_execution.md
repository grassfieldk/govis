
# データ正規化方針書（予算・執行セクション）


## 概要

- **対象データ**: `input/2-*.csv`（2ファイル、計 93,592 行）
- **出力テーブル**: 2テーブル（`budget_summary`, `budget_detail`）
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
- 会計
- 勘定
- 所管
- 組織・勘定
- 項
- 目

自由記述
- 主な増減理由
- その他特記事項
- 備考
- 歳出予算項目の補足情報
- 備考（歳出予算項目ごと）


## 出力テーブル構造

### `budget_summary`（予算・執行サマリ）

データソース: `2-1_予算・執行_サマリ.csv`

**特徴**:
- 1 事業・1 予算年度につき複数行存在（会計区分ごとの明細行 + 合計行）
- 合計行は `会計区分` が空で識別
- 金額カラムは TEXT 型で保持（全角数字・カンマ混在の可能性）

```json
{
  "primary_key": ["project_year", "project_id", "budget_year", "seq_no"],
  "columns": {
    "project_year": { "type": "INTEGER", "normalize": false, "note": "事業年度" },
    "project_id": { "type": "TEXT", "normalize": false, "note": "予算事業ID" },
    "project_name": { "type": "TEXT", "normalize": true },
    "budget_year": { "type": "INTEGER", "normalize": false, "note": "予算年度" },
    "seq_no": { "type": "INTEGER", "normalize": false, "note": "連番（会計区分ごと）" },
    "account_category": { "type": "TEXT", "normalize": false, "note": "会計区分（空=合計行）" },
    "account": { "type": "TEXT", "normalize": true, "note": "会計" },
    "sub_account": { "type": "TEXT", "normalize": true, "note": "勘定" },
    "initial_budget": { "type": "TEXT", "normalize": false, "note": "当初予算" },
    "supplementary_budget_1": { "type": "TEXT", "normalize": false, "note": "第1次補正予算" },
    "supplementary_budget_2": { "type": "TEXT", "normalize": false, "note": "第2次補正予算" },
    "supplementary_budget_3": { "type": "TEXT", "normalize": false, "note": "第3次補正予算" },
    "supplementary_budget_4": { "type": "TEXT", "normalize": false, "note": "第4次補正予算" },
    "supplementary_budget_5": { "type": "TEXT", "normalize": false, "note": "第5次補正予算" },
    "carryover_from_prev": { "type": "TEXT", "normalize": false, "note": "前年度から繰越し" },
    "reserve_fund_1": { "type": "TEXT", "normalize": false, "note": "予備費等1" },
    "reserve_fund_2": { "type": "TEXT", "normalize": false, "note": "予備費等2" },
    "reserve_fund_3": { "type": "TEXT", "normalize": false, "note": "予備費等3" },
    "reserve_fund_4": { "type": "TEXT", "normalize": false, "note": "予備費等4" },
    "current_budget": { "type": "TEXT", "normalize": false, "note": "歳出予算現額" },
    "execution_amount": { "type": "TEXT", "normalize": false, "note": "執行額" },
    "execution_rate": { "type": "TEXT", "normalize": false, "note": "執行率（合計行のみ）" },
    "carryover_to_next": { "type": "TEXT", "normalize": false, "note": "翌年度への繰越し（合計行のみ）" },
    "next_year_request": { "type": "TEXT", "normalize": false, "note": "翌年度要求額" },
    "requested_amount": { "type": "TEXT", "normalize": false, "note": "要望額" },
    "increase_reason": { "type": "TEXT", "normalize": true, "note": "主な増減理由（合計行のみ）" },
    "special_notes": { "type": "TEXT", "normalize": true, "note": "その他特記事項（合計行のみ）" },
    "remarks": { "type": "TEXT", "normalize": true, "note": "備考" }
  }
}
```

### `budget_detail`（歳出予算項目の詳細）

データソース: `2-2_予算・執行_予算種別・歳出予算項目.csv`

**特徴**:
- 1 事業・1 予算年度につき、歳出予算項目（目）ごとに 1 行
- 予算種別: `当初予算`, `第1次補正予算`, `第2次補正予算`, ...

```json
{
  "primary_key": ["project_year", "project_id", "budget_year", "seq_no"],
  "columns": {
    "project_year": { "type": "INTEGER", "normalize": false, "note": "事業年度" },
    "project_id": { "type": "TEXT", "normalize": false, "note": "予算事業ID" },
    "project_name": { "type": "TEXT", "normalize": true },
    "budget_year": { "type": "INTEGER", "normalize": false, "note": "予算年度" },
    "seq_no": { "type": "INTEGER", "normalize": false, "note": "連番（歳出予算項目ごと）" },
    "account_category": { "type": "TEXT", "normalize": false, "note": "会計区分" },
    "account": { "type": "TEXT", "normalize": true, "note": "会計" },
    "sub_account": { "type": "TEXT", "normalize": true, "note": "勘定" },
    "budget_type": { "type": "TEXT", "normalize": false, "note": "予算種別" },
    "ministry": { "type": "TEXT", "normalize": true, "note": "所管" },
    "organization": { "type": "TEXT", "normalize": true, "note": "組織・勘定" },
    "item": { "type": "TEXT", "normalize": true, "note": "項" },
    "category": { "type": "TEXT", "normalize": true, "note": "目" },
    "supplement_info": { "type": "TEXT", "normalize": true, "note": "歳出予算項目の補足情報" },
    "budget_amount": { "type": "TEXT", "normalize": false, "note": "予算額（歳出予算項目ごと）" },
    "next_year_request": { "type": "TEXT", "normalize": false, "note": "翌年度要求額（歳出予算項目ごと）" },
    "remarks": { "type": "TEXT", "normalize": true, "note": "備考（歳出予算項目ごと）" }
  }
}
```

---

## データ保持方針

- 年度・金額・執行率などは **型変換を行わず** TEXT 型で保持
- 全角数字・カンマ・小数点の混在に対応
- データの欠損・変換失敗による情報喪失を防ぐ
- 必要に応じてクエリ時に `CAST()` や `REPLACE()` で変換

---

## 注意事項

### 金額データの特性

- **全角数字混在**: `１２３４５` のような全角数字が含まれる可能性
- **カンマ区切り**: `1,234,567` のような桁区切り
- **小数点**: 執行率は `0.33608` のような小数
- **空文字**: 金額が存在しない場合は空文字（NULL として扱う）

### サマリテーブルの構造

`2-1` は複数行構造になっており、以下のパターンが混在:

1. **合計行**: `会計区分` が空、`執行率`・`翌年度への繰越し`・`主な増減理由`・`その他特記事項` が存在
2. **明細行**: `会計区分` に `一般会計` などの値、上記カラムは空

どちらも保持し、`seq_no` で区別する

### 予算年度の複数年対応

1 つの事業（`project_year`, `project_id`）に対して、複数の `budget_year` が存在する
- 例: 2024 年事業に対して、2023 年度予算と 2024 年度予算の両方


## データ処理ロジック

### CSVカラム名のマッピング

2-1 CSVの実際のカラム名とテーブルカラムのマッピング:

| テーブルカラム | CSVカラム名 | 備考 |
|-------------|-----------|------|
| `carryover_to_next` | `翌年度への繰越し(合計）` | 括弧が半角、閉じ括弧が全角 |

※ その他のカラムは仕様書通り

### seq_no の採番

**budget_summary, budget_detail 共通:**
```python
df["seq_no"] = df.groupby(
    ["事業年度", "予算事業ID", "予算年度"]
).cumcount() + 1
```

- 同一の `(事業年度, 予算事業ID, 予算年度)` 内でCSVの出現順に連番（1から開始）
- `budget_summary` では会計区分ごとの明細行と合計行を含む全行に連番
