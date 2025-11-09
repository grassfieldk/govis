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

RS システムからダウンロードした Zip ファイル

- `tools/input/
  - `1-1_RS_2024_基本情報_組織情報.zip`
  - `1-2_RS_2024_基本情報_事業概要等.zip`
  - `1-3_RS_2024_基本情報_政策・施策、法令等.zip`
  - `1-4_RS_2024_基本情報_補助率等.zip`
  - `1-5_RS_2024_基本情報_関連事業.zip`
  - `2-1_RS_2024_予算・執行_サマリ.zip`
  - `2-2_RS_2024_予算・執行_予算種別・歳出予算項目.zip`
  - `5-1_RS_2024_支出先_支出情報.zip`
  - `5-2_RS_2024_支出先_支出ブロックのつながり.zip`
  - `5-3_RS_2024_支出先_費目・使途.zip`
  - `5-4_RS_2024_支出先_国庫債務負担行為等による契約.zip`

**出力**

- `tools/output/rs_data.sqlite`

詳細は `docs/tools/build_database.md` を参照してください
