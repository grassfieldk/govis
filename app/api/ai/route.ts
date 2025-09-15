import { type NextRequest, NextResponse } from "next/server";
import { generateSQLFromNaturalLanguage } from "@/lib/gemini";
import { getTableSchema } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: "質問が指定されていません" },
        { status: 400 }
      );
    }

    // 1. スキーマ情報を取得
    const schemaData = await getTableSchema("govis_main_data");

    if (!schemaData.exists || !schemaData.columns) {
      return NextResponse.json(
        { error: "スキーマ情報の取得に失敗しました" },
        { status: 500 }
      );
    }

    // スキーマ情報を文字列に変換
    const schemaInfo = `テーブル名: govis_main_data\n列一覧:\n${schemaData.columns.map(col => `- ${col.column_name} (${col.data_type})`).join('\n')}`;

    // 2. AIでSQLを生成
    const sqlResult = await generateSQLFromNaturalLanguage(question, schemaInfo, "govis_main_data");

    if (!sqlResult.success || !sqlResult.sql) {
      return NextResponse.json(
        { error: sqlResult.error || "SQL生成に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sql: sqlResult.sql,
      rawResponse: sqlResult.rawResponse
    });

  } catch (error) {
    console.error("AI処理エラー:", error);
    return NextResponse.json(
      { error: "AI処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
