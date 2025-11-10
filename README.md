
# GOVIS - Government Visualization

政府資金の流れを政府が実施する予算事業の資金の流れを可視化するサイト


## 開発環境構築

本サイトは Next.js + Supabase で構築されます
Supabase へのデータ登録を行ったのち Next.js を立ち上げる流れになります

Windows の場合、WSL2 での開発を推奨します（本手順も WSL2 を使用する前提です）


### パッケージのインストール

Node.js と Python の環境を初期化する

```bash
# Node.js
npm install

# Python
python3 -m venv ./.venv
source ./.venv/bin/activate
pip install -r ./tools/requirements.txt
```

### Supabase へのデータ登録

<details>
<summary>Supabase とは</summary>

PostgreSQL をアプリケーション感覚で使用することができるオープンソースサービス・ツール
DB サーバの立ち上げやユーザー管理などを考えずに Web API をインターフェイスとして手軽に PostgreSQL を利用することができる
</details>

[CSVデータのダウンロード](https://rssystem.go.jp/download-csv/2024) ページから、次のセクションのデータをすべてダウンロードする

- 基本情報
- 予算・執行
- 支出先

ダウンロードした Zip ファイルをすべて tools/input/ に配置する

```bash
$ ls -1 ./tools/input/
1-1_RS_2024_基本情報_組織情報.zip
1-2_RS_2024_基本情報_事業概要等.zip
1-3_RS_2024_基本情報_政策・施策、法令等.zip
1-4_RS_2024_基本情報_補助率等.zip
1-5_RS_2024_基本情報_関連事業.zip
2-1_RS_2024_予算・執行_サマリ.zip
2-2_RS_2024_予算・執行_予算種別・歳出予算項目.zip
5-1_RS_2024_支出先_支出情報.zip
5-2_RS_2024_支出先_支出ブロックのつながり.zip
5-3_RS_2024_支出先_費目・使途.zip
5-4_RS_2024_支出先_国庫債務負担行為等による契約.zip
```

配置した Zip ファイルからデータを抽出し、正規化した状態で Supabase に登録する
スクリプトを使用しローカル環境に Supabase 環境を構築できるようになっているが、
既存の Supabase 環境を利用することも可能

#### ローカル環境に新しく Supabase を構築する場合

スクリプトを実行することで Supabase 環境の作成とデータ投入まで行える
このとき、.env ファイルの作成も同時に行われる

```bash
# ローカル環境に Supabase の環境を構築
bash ./tools/supabase.sh

# tools/input/ に配置した Zip ファイルからデータを生成し登録
python tools/build_database.py
```

#### 既存の Supabase を使用する場合

.env.example を コピーして .env を作成

```bash
cp ./.env.example ./.env
```

`NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定

スクリプトを実行し、データを登録
```
python tools/build_database.py
```

### 環境変数の設定

.env ファイルの値を設定する

- `NEXT_PUBLIC_URL`: サイトトップページとなるアドレス（ローカルの場合、ポートだけ確認すればよい）
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase のプロジェクト URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase の anon_key
- `GOOGLE_API_KEY`: Gemini が使用可能な Goole API Key
- `GEMINI_MODEL`: 使用する Gemini モデル指定文字列（基本的に変更不要）


## プログラムの起動

[開発環境構築](#開発環境構築) が完了したら、開発環境として起動してください

```bash
npx supabase start # ローカル環境の Supabase を使う場合
npm run dev
```

起動後、http://localhost:3000 に接続してトップページが表示されることを確認してください

うまくいかない場合、次の点を確認してください
- 別のポートで起動されていないか（起動時のコンソールログを確認）
- Supabase 環境が稼働しているか（`npx supabase status`）
- データベースは作成されているか
- データベースにデータが投入されているか
