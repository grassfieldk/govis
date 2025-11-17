import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

interface SqlRequest {
  query: string;
}

/**
 * SQL クエリを直接実行するエンドポイント
 * POST で query フィールドに SQL を送信
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body: SqlRequest = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string") {
      return Response.json(
        { error: "query フィールドが必要です" },
        { status: 400 },
      );
    }

    // Supabase の RPC を使用して SQL を実行
    const { data, error } = await supabase.rpc("exec_sql", { sql: query });

    if (error) {
      console.error("SQL 実行エラー:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // exec_sql は jsonb_agg() の result を返すため、データを抽出
    let parsedData = [];
    if (data && Array.isArray(data) && data.length > 0) {
      const result = data[0]?.result;
      if (result && Array.isArray(result)) {
        parsedData = result;
      }
    }

    return Response.json({ data: parsedData });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("API エラー:", errorMessage, err);
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
