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

CSV ファイルを SQLite データベースに変換します。

**実行方法**

```bash
python3 ./tools/build_database.py
```

**入力**

- `input/1-1_基本情報_組織情報.csv`
- `input/1-2_基本情報_事業概要等.csv`
- `input/1-3_基本情報_政策・施策、法令等.csv`
- `input/1-4_基本情報_補助率等.csv`
- `input/1-5_基本情報_関連事業.csv`

**出力**

- `output/gyosei-review-2024.sqlite` (5テーブル)
  - `project` - 事業基本情報
  - `project_policy` - 政策・施策との紐付け
  - `project_law` - 法令との紐付け
  - `project_subsidy` - 補助率情報
  - `project_related` - 関連事業

詳細は `work/normalization-policy.md` を参照してください。
