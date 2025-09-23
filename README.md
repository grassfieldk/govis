
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

データベースを自分で用意する場合、本手順に従ってください

1. https://rssystem.go.jp/download-csv/2024 から CSV データをダウンロード
   対象: 5-1_支出先_支出情報
2. 使用する Supabase プロジェクトを開き、ダウンロードした CSV データをインポート
3. SQL Editor を開き、次の SQL クエリを実行して関数を作成
    ```sql
    -- 既存設定の削除
    DROP FUNCTION IF EXISTS execute_sql_query(text);
    DROP POLICY IF EXISTS "Enable read access for everyone" ON govis_main_data;

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
    CREATE POLICY "Enable read access for all" ON govis_main_data
    FOR SELECT TO public
    USING (true);
    ```
