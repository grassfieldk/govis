
# データ正規化方針書（基本情報セクション）


## 概要

- **対象データ**: `tools/input/1-*.csv`（5ファイル、計 41,701 行）
- **出力テーブル**: 5テーブル（`project`, `project_policy`, `project_law`, `project_subsidy`, `project_related`）
- **文字コード**: UTF-8 with BOM

**共通の正規化方針**: [../build_database.md](../build_database.md#共通の正規化方針) を参照


## 正規化対象カラム

名称系
- 事業名
- 府省庁
- 局・庁
- 部
- 課
- 室
- 班
- 係
- 作成責任者

自由記述
- 事業の目的
- 現状・課題
- 事業の概要
- 備考

政策・法令
- 政策
- 施策
- 法令名
- 計画通知名

補助関連
- 補助対象
- 補助率 ※ 全角半角混在あり（例: "1/2" と "１/２"）
- 補助上限等 ※ 全角数字混在あり

関連事業
- 関連事業の事業名
- 関連性 ※ カテゴリ値だが念のため正規化


## 出力テーブル構造

### project（事業基本情報）

データソース: 1-1_基本情報_組織情報.csv + 1-2_基本情報_事業概要等.csv（INNER JOIN）

主キー: project_year, project_id

カラム: 29 カラム（正規化対象は事業名、組織名、自由記述など）


### project_policy（政策・施策との紐付け）

データソース: 1-3_基本情報_政策・施策、法令等.csv（政策カラムが空でない行）

主キー: project_year, project_id, seq_no


### project_law（法令との紐付け）

データソース: 1-3_基本情報_政策・施策、法令等.csv（法令カラムが空でない行）

主キー: project_year, project_id, seq_no


### project_subsidy（補助率情報）

データソース: 1-4_基本情報_補助率等.csv

主キー: project_year, project_id, seq_no


### project_related（関連事業）

データソース: 1-5_基本情報_関連事業.csv

主キー: project_year, project_id, seq_no

関連性の値例: その他関連元、分割先、統合先、統合元、子事業、運用交付先セグメントシート


## 追加処理

### project テーブル構築時の重複除去

1-1 および 1-2 の CSV には、同一の `(事業年度, 予算事業ID)` に対して複数行が存在するケース（「その他担当組織」として複数担当者が記録されている等）があるため、INNER JOIN 前に重複除去が必要

**処理:**
```python
df_org_unique = df_org.drop_duplicates(
    subset=["事業年度", "予算事業ID"],
    keep="first"
)
df_overview_unique = df_overview.drop_duplicates(
    subset=["事業年度", "予算事業ID"],
    keep="first"
)
```

- 最初の行を採用（`keep="first"`）
- 重複行の差分は軽微（空白有無、表記揺れ程度）であるため先頭行を正とする

### seq_no の採番

**project_policy, project_law:**
```python
df_filtered["seq_no"] = df_filtered.groupby(
    ["事業年度", "予算事業ID"]
).cumcount() + 1
```
同一事業内でCSVの出現順に連番（1から開始）

**project_subsidy:**
元CSVの「番号（補助率等）」カラムを使用（採番不要）

**project_related:**
元CSVの「番号（関連事業）」カラムを使用（採番不要）
