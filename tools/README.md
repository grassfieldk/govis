# tools

RS システムからダウンロードしたデータをデータベースへ登録するためのツール群


## セットアップ

```bash
# Python 仮想環境の作成
python3 -m venv ./.venv
source ./.venv/bin/activate

# 依存ライブラリのインストール
pip install -r requirements.txt
```


## スクリプト

### build_database.py

CSV ファイルを SQLite データベースに変換します

**実行方法**

```bash
python3 ./tools/build_database.py
```

**入力**

- `tools/input/1-1_基本情報_組織情報.csv`
- `tools/input/1-2_基本情報_事業概要等.csv`
- `tools/input/1-3_基本情報_政策・施策、法令等.csv`
- `tools/input/1-4_基本情報_補助率等.csv`
- `tools/input/1-5_基本情報_関連事業.csv`

**出力**

- `tools/output/rs_data.sqlite` (11テーブル + 11ビュー)
  - `projects_master` - 事業基本情報マスタ
  - `policies` - 政策・施策との紐付け
  - `laws` - 法令との紐付け
  - `subsidies` - 補助率情報
  - `related_projects` - 関連事業
  - `budgets` - 予算・執行サマリ
  - `budget_items` - 歳出予算項目の詳細
  - `expenditures` - 支出先情報
  - `expenditure_flows` - 支出先ブロックのつながり
  - `expenditure_usages` - 費目・使途
  - `expenditure_contracts` - 国庫債務負担行為等による契約
  - 11個の VIEW（各テーブルに対応する *_with_project ビュー + projects_summary）

詳細は `docs/tools/build_database.md` を参照してください
