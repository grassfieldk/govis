
# GOVIS - Government Visualization

政府資金の流れを政府が実施する予算事業の資金の流れを可視化するサイト


## 開発環境構築

データベースとして Supabase を使用します

Supabase 環境を自分で構築する場合、[データベース作成](#データベース作成方法) に従ってください

開発チーム共有の環境を使用する場合、リポジトリオーナーに尋ねるか、Slack で質問してください

### 環境変数の設定

1. `.env.example` を コピーして `.env` を作成
    ```bash
    cp .env.example .env
    ```
2. 各変数の値を環境に応じて変更
    - `NEXT_PUBLIC_URL`: サイトトップページとなるアドレス（ローカルの場合、ポートだけ確認すればよい）
    - `NEXT_PUBLIC_SUPABASE_URL`: Supabase のプロジェクト URL
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase の anon_key
    - `GOOGLE_API_KEY`: Gemini が使用可能な Goole API Key
    - `GEMINI_MODEL`: 使用する Gemini モデル指定文字列（基本的に変更不要）

### Node 環境初期化

npm パッケージのインストールを行ってください

```bash
npm install
```


## プログラムの起動

開発環境として起動してください

```bash
npm run dev
```


## データベース作成方法

メイン開発チームが使用している Supabase 環境にアクセスできない場合、自分でデータベースを作成する必要があります

データベースとしては Supabase を使用しています
基本的にはローカルで立ち上げる方法を推奨しますが、複数の PC で作業したい場合などはウェブ上で作成することもできます

<details>
<summary>Supabase とは</summary>

PostgreSQL をアプリケーション感覚で使用することができるオープンソースサービス・ツール
DB サーバの立ち上げやユーザー管理などを考えずに Web API をインターフェイスとして手軽に PostgreSQL を利用することができる
</details>

### 1. CSV データのダウンロード

https://rssystem.go.jp/download-csv/2024 から CSV データをダウンロード
対象: "5-" で始まる支出先情報の CSV ファイルすべて

### 2-A. Supabase 環境の作成（ローカル）

ダウンロードしたファイルを input/ 配下に配置し、下記コマンドに従い環境作成とインポートを行う

```bash
# Supabase 環境作成
npx supabase init # 質問はすべて "n" と回答
npx supabase start

# スキーマ定義の生成とインポート用の CSV ファイル生成
npx tsx ./tools/supabase/create-schema-info.ts ./input/ > ./src/data/schema-info.json

# CSV ファイルのインポート
npx tsx ./tools/supabase/import-csv-files.ts ./input/converted_csv/
```

### 2-B. Supabase 環境の作成（ウェブ）

https://supabase.com/ でプロジェクトを作成しておく

使用する Supabase プロジェクトを開き、ダウンロードした CSV データをインポート

インポート完了後、SQL Editor を開き、次の SQL クエリを実行して関数を作成

```sql
-- 既存設定の削除
DROP FUNCTION IF EXISTS execute_sql_query(text);
DROP POLICY IF EXISTS "Enable read access for everyone" ON govis_table_01;
DROP POLICY IF EXISTS "Enable read access for everyone" ON govis_table_02;
DROP POLICY IF EXISTS "Enable read access for everyone" ON govis_table_03;
DROP POLICY IF EXISTS "Enable read access for everyone" ON govis_table_04;

-- クエリ自由実行関数
CREATE OR REPLACE FUNCTION execute_sql_query(query_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
result json;
clean_query text;
BEGIN
-- セキュリティ: SELECT文のみ許可
IF NOT (UPPER(TRIM(query_text)) LIKE 'SELECT%') THEN
    RAISE EXCEPTION 'Only SELECT statements are allowed';
END IF;

-- セミコロンを除去してクリーンなクエリにする
clean_query := TRIM(TRAILING ';' FROM TRIM(query_text));

-- 動的SQLを実行
EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', clean_query) INTO result;

-- 結果がNULLの場合は空配列を返す
IF result IS NULL THEN
    result := '[]'::json;
END IF;

RETURN result;
EXCEPTION
WHEN OTHERS THEN
    -- エラーが発生した場合はエラー情報を返す
    RETURN json_build_object('error', SQLERRM, 'sqlstate', SQLSTATE);
END;
$$;
GRANT EXECUTE ON FUNCTION execute_sql_query(text) TO public;

-- テーブルアクセス設定
CREATE POLICY "Enable read access for all" ON govis_table_01 FOR SELECT TO public USING (true);
CREATE POLICY "Enable read access for all" ON govis_table_02 FOR SELECT TO public USING (true);
CREATE POLICY "Enable read access for all" ON govis_table_03 FOR SELECT TO public USING (true);
CREATE POLICY "Enable read access for all" ON govis_table_04 FOR SELECT TO public USING (true);
```
