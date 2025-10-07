import { type NextRequest, NextResponse } from "next/server";
import schemaInfo from "@/data/schema-info.json";
import { generateSQLFromNaturalLanguage } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: "質問が指定されていません" },
        { status: 400 },
      );
    }

    // SQLクエリ生成リクエスト
    const sqlResult = await generateSQLFromNaturalLanguage(
      question,
      JSON.stringify(schemaInfo),
    );

    if (!sqlResult.success || !sqlResult.sql) {
      return NextResponse.json(
        { error: sqlResult.error || "SQL生成に失敗しました" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      sql: sqlResult.sql,
      rawResponse: sqlResult.rawResponse,
    });
  } catch (error) {
    console.error("AI処理エラー:", error);
    return NextResponse.json(
      { error: "AI処理中にエラーが発生しました" },
      { status: 500 },
    );
  }
}
