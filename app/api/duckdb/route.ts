import { type NextRequest, NextResponse } from "next/server";

// DuckDB connection simulation - in production, use actual DuckDB client
interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock data for demonstration
    const mockData = {
      administrative_reviews: [
        [
          "社会保障制度改革推進事業",
          "厚生労働省",
          "1200000000",
          "95.2",
          "令和4年度",
          "受給者数",
        ],
        [
          "道路インフラ整備事業",
          "国土交通省",
          "800000000",
          "88.7",
          "令和4年度",
          "整備延長",
        ],
        [
          "教育振興支援事業",
          "文部科学省",
          "600000000",
          "92.1",
          "令和4年度",
          "参加者数",
        ],
        [
          "地域活性化推進事業",
          "内閣府",
          "450000000",
          "89.3",
          "令和4年度",
          "雇用創出数",
        ],
        [
          "環境保全対策事業",
          "環境省",
          "320000000",
          "91.8",
          "令和4年度",
          "CO2削減量",
        ],
        [
          "デジタル化推進事業",
          "総務省",
          "280000000",
          "87.5",
          "令和4年度",
          "システム導入数",
        ],
        [
          "農業振興事業",
          "農林水産省",
          "250000000",
          "93.4",
          "令和4年度",
          "生産量増加",
        ],
        [
          "中小企業支援事業",
          "経済産業省",
          "220000000",
          "90.1",
          "令和4年度",
          "支援企業数",
        ],
      ],
    };

    const columns = [
      "事業名",
      "省庁名",
      "予算額",
      "執行率",
      "年度",
      "効果測定指標",
    ];

    // Simple query parsing for demonstration
    let resultRows = mockData.administrative_reviews;

    if (query.toLowerCase().includes("limit")) {
      const limitMatch = query.match(/limit\s+(\d+)/i);
      if (limitMatch) {
        const limit = Number.parseInt(limitMatch[1], 10);
        resultRows = resultRows.slice(0, limit);
      }
    }

    if (query.toLowerCase().includes("order by 予算額 desc")) {
      resultRows = [...resultRows].sort(
        (a, b) => Number.parseInt(b[2], 10) - Number.parseInt(a[2], 10),
      );
    }

    if (query.toLowerCase().includes("where")) {
      if (query.toLowerCase().includes("厚生労働省")) {
        resultRows = resultRows.filter((row) => row[1] === "厚生労働省");
      }
    }

    const result: QueryResult = {
      columns,
      rows: resultRows,
      rowCount: resultRows.length,
      executionTime: Math.random() * 500 + 100,
    };

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("DuckDB query error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "クエリの実行中にエラーが発生しました",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    // Check connection status
    await new Promise((resolve) => setTimeout(resolve, 200));

    return NextResponse.json({
      success: true,
      status: "connected",
      database: "administrative_reviews.db",
      tables: ["administrative_reviews"],
      version: "DuckDB v0.9.0",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: "disconnected",
        error: `データベースに接続できません: ${error}`,
      },
      { status: 500 },
    );
  }
}
