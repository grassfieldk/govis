
# CSV データのデータベース化

https://rssystem.go.jp/download-csv から入手したデータを加工しデータベース化する
元データには表記ゆれやカラム重複があるため、スクリプトで正規化を行う


## 共通の正規化方針

### サニタイズ（全カラム）

すべてのカラムに対して無効文字の除去を実施

| 処理内容       | 詳細                                                            |
| -------------- | --------------------------------------------------------------- |
| NULL 文字除去  | `\x00` を削除                                                   |
| 制御文字除去   | `\x00-\x1F`, `\x7F` を空白に置換                                |
| 改行コード統一 | `\r\n`, `\r` → `\n`                                             |
| 前後空白除去   | `strip()`                                                       |
| 欠損値統一     | `"－"`, `"─"`, `"—"`, `"該当なし"`, `"なし"`, `"無し"` → `NULL` |

### 正規化（一部のみ）

自由記述テキストのみ正規化ライブラリ [neologdn](https://github.com/ikegami-yukino/neologdn) を使用

正規化内容:
- 全角半角の統一
- Unicode NFKC 正規化
- 長音符・波ダッシュの統一
- 連続する空白の削除

正規化対象カラムは各セクションのドキュメントで定義する

### データ保持方針

- 年度・フラグ・金額などは型変換を行わず TEXT 型で保持
- データの欠損・変換失敗による情報喪失を防ぐ
- 必要に応じてクエリ時に `CAST()` で変換


## セクションごとの詳細

各セクションのテーブル設計と正規化対象カラムの詳細は以下を参照:

- **基本情報セクション**: [build_database/basic_info.md](./build_database/basic_info.md)
  - 対象: `input/1-*.csv`（5ファイル）
  - 出力: 5テーブル（`project`, `project_policy`, `project_law`, `project_subsidy`, `project_related`）

- **予算・執行セクション**: [build_database/budget_execution.md](./build_database/budget_execution.md)
  - 対象: `input/2-*.csv`（2ファイル）
  - 出力: 2テーブル（`budget_summary`, `budget_detail`）


## 設計

### 構成

```
tools/
├─ build_database.py         # メインスクリプト（セクション統合）
├─ build_database/
│   ├─ __init__.py          # パッケージ初期化（空ファイル）
│   ├─ common.py            # 共通関数（sanitize, normalize, load_csv）
│   ├─ basic_info.py        # 基本情報セクション（1-*.csv → 5テーブル）
│   └─ budget_execution.py  # 予算・執行セクション（2-*.csv → 2テーブル）
├─ requirements.txt          # pandas, neologdn
└─ .venv/                    # 仮想環境
```

### ドキュメント

```
docs/tools/build_database/
├─ basic_info.md             # 基本情報セクションの正規化方針
└─ budget_execution.md       # 予算・執行セクションの正規化方針
```

### 実装

#### メインスクリプト（`build_database.py`）

各セクションの処理を統合してデータベースを生成する

**主要な処理フロー:**
1. 基本情報セクションのテーブル構築
2. 予算・執行セクションのテーブル構築
3. SQLite への書き込み
4. データ検証

**出力:** `output/rs_data.sqlite`

#### 基本情報セクション（`basic_info.py`）

`input/1-*.csv` から5つのテーブルを構築する

**構築するテーブル:**
- `project`: 事業基本情報（1-1 と 1-2 を結合）
- `project_policy`: 政策・施策との紐付け（1-3 から抽出）
- `project_law`: 法令との紐付け（1-3 から抽出）
- `project_subsidy`: 補助率情報（1-4）
- `project_related`: 関連事業（1-5）

**主要な関数:**
- `build_basic_info_tables()`: エントリーポイント
- `build_project_table()`: project テーブルの構築
- `build_project_policy_table()`: project_policy テーブルの構築
- `build_project_law_table()`: project_law テーブルの構築
- `build_project_subsidy_table()`: project_subsidy テーブルの構築
- `build_project_related_table()`: project_related テーブルの構築

#### 予算・執行セクション（`budget_execution.py`）

`input/2-*.csv` から2つのテーブルを構築する

**構築するテーブル:**
- `budget_summary`: 予算・執行サマリ（2-1）
- `budget_detail`: 歳出予算項目の詳細（2-2）

**主要な関数:**
- `build_budget_execution_tables()`: エントリーポイント
- `build_budget_summary_table()`: budget_summary テーブルの構築
- `build_budget_detail_table()`: budget_detail テーブルの構築

#### 共通関数（`common.py`）

全セクションで使用する共通的な処理を提供する

**主要な関数:**
- `sanitize()`: 制御文字除去・欠損値統一
- `normalize()`: neologdn による正規化
- `load_csv()`: CSV 読み込み（UTF-8-SIG、dtype=str）
- `apply_sanitize_and_normalize()`: DataFrame へのサニタイズと正規化の適用
- `validate_table()`: テーブル検証（行数、主キー重複、NULL率）


## 実行方法

```bash
cd /home/grassfield/git/_team-mirai/govis

# 仮想環境の作成（初回のみ）
python3 -m venv tools/.venv
source tools/.venv/bin/activate
pip install -r tools/requirements.txt

# データベース生成
tools/.venv/bin/python3 tools/build_database.py
```

**出力:** `output/rs_data.sqlite`
