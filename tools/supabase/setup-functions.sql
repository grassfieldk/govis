-- 既存関数の削除
DROP FUNCTION IF EXISTS execute_sql_query(text);
DROP POLICY IF EXISTS "Enable read access for everyone" ON govis_table_01;
DROP POLICY IF EXISTS "Enable read access for everyone" ON govis_table_02;
DROP POLICY IF EXISTS "Enable read access for everyone" ON govis_table_03;
DROP POLICY IF EXISTS "Enable read access for everyone" ON govis_table_04;


-- クエリ自由実行関数の作成
CREATE OR REPLACE FUNCTION execute_sql_query(query_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    clean_query text;
BEGIN
    -- 先頭の空白・改行と末尾のセミコロンを除去
        clean_query := regexp_replace(query_text, E'^\\s+|;\\s*$', '', 'g');
    -- SELECT のみ許可
    IF NOT (UPPER(LEFT(clean_query, 6)) = 'SELECT') THEN
        RAISE EXCEPTION 'Only SELECT statements are allowed';
    END IF;
    -- 動的クエリ実行
    EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', clean_query) INTO result;

    IF result IS NULL THEN
        result := '[]'::json;
    END IF;

    RETURN result;

-- エラー処理
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('error', SQLERRM, 'sqlstate', SQLSTATE);
END;
$$;
GRANT EXECUTE ON FUNCTION execute_sql_query(text) TO public;

-- テーブルアクセス設定
CREATE POLICY "Enable read access for everyone" ON govis_table_01 FOR SELECT TO public USING (true);
CREATE POLICY "Enable read access for everyone" ON govis_table_02 FOR SELECT TO public USING (true);
CREATE POLICY "Enable read access for everyone" ON govis_table_03 FOR SELECT TO public USING (true);
CREATE POLICY "Enable read access for everyone" ON govis_table_04 FOR SELECT TO public USING (true);

-- RLS 設定
ALTER TABLE govis_table_01 ENABLE ROW LEVEL SECURITY;
ALTER TABLE govis_table_02 ENABLE ROW LEVEL SECURITY;
ALTER TABLE govis_table_03 ENABLE ROW LEVEL SECURITY;
ALTER TABLE govis_table_04 ENABLE ROW LEVEL SECURITY;
