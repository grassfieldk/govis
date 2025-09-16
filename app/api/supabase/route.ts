import { type NextRequest, NextResponse } from "next/server";
import { executeSQLQuery } from "@/lib/supabase";

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

      default:
        return NextResponse.json(
          { error: "サポートされていないアクションです" },
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
