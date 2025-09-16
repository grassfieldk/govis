import { type NextRequest, NextResponse } from "next/server";
import {
  executeSQLQuery,
  getTableSchema,
  supabase,
  testConnection,
} from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { action, query } = await request.json();

    switch (action) {
      case "execute": {
        if (!query) {
          return NextResponse.json(
            { error: "SQLクエリが指定されていません" },
            { status: 400 },
          );
        }

        const result = await executeSQLQuery(query);

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({
          result: result.data,
          rowCount: Array.isArray(result.data) ? result.data.length : 0,
          executionTime: Math.floor(Math.random() * 1000) + 100, // 仮の実行時間
        });
      }

      // テーブル一覧を取得するテストケース
      case "list_tables":
        try {
          // information_schemaを利用してテーブル一覧を取得
          const { data: tables, error: listError } =
            await supabase.rpc("get_tables_list");

          if (listError) {
            // 代替手段：直接SQLクエリを実行
            const { data: directQuery, error: directError } = await supabase
              .from("information_schema.tables")
              .select("table_name")
              .eq("table_schema", "public");

            if (directError) {
              return NextResponse.json({
                success: false,
                error: `テーブル一覧取得失敗: ${directError.message}`,
                tables: [],
              });
            }

            return NextResponse.json({
              success: true,
              tables: directQuery?.map((t) => t.table_name) || [],
            });
          }

          return NextResponse.json({
            success: true,
            tables: tables || [],
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: `テーブル一覧取得エラー: ${error}`,
            tables: [],
          });
        }

      case "schema":
        try {
          const tableName = query || "govis_main_data";
          console.log(`スキーマ情報取得開始: テーブル名=${tableName}`);

          const schemaInfo = await getTableSchema(tableName);
          console.log(
            "スキーマ情報取得結果:",
            JSON.stringify(schemaInfo, null, 2),
          );

          return NextResponse.json(schemaInfo);
        } catch (error) {
          console.error("スキーマ取得中のエラー:", error);
          return NextResponse.json({
            success: false,
            error: `スキーマ取得エラー: ${error}`,
            exists: false,
            columns: [],
            sampleCount: 0,
          });
        }
      case "test": {
        const connectionTest = await testConnection();
        return NextResponse.json(connectionTest);
      }

      default:
        return NextResponse.json(
          { error: "無効なアクションです" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("API エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}

// GET リクエスト: 接続テスト用
export async function GET() {
  try {
    const connectionTest = await testConnection();
    return NextResponse.json(connectionTest);
  } catch (error) {
    console.error("接続テストエラー:", error);
    return NextResponse.json(
      { error: "データベース接続に失敗しました" },
      { status: 500 },
    );
  }
}
