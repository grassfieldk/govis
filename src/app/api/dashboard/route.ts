import { NextResponse } from "next/server";
import { executeSQLQuery, supabase } from "@/lib/supabase";

/**
 * ダッシュボード用の統計データを取得するAPIエンドポイント
 */
export async function GET() {
  try {
    // メインデータ - 全件取得（制限なし）
    const { data: mainData, error: mainError } = await supabase
      .from("govis_table_03")
      .select("*")
      .not("column_26", "is", null)
      .neq("column_26", "")
      .order("column_02", { ascending: true }) // 順序を固定
      .limit(2147483647); // PostgreSQLの最大整数値

    if (mainError) {
      console.error("メインデータ取得エラー:", mainError);
      return NextResponse.json(
        { error: "メインデータの取得に失敗しました" },
        { status: 500 },
      );
    }

    // ユニーク事業数
    const uniqueProjectCountQuery = `
      SELECT COUNT(DISTINCT concat("column_02", '-', "column_03")) as count
      FROM govis_table_03
      WHERE "column_04" IS NOT NULL AND "column_04" != ''
    `;
    const uniqueProjectCountResult = await executeSQLQuery(
      uniqueProjectCountQuery,
    );

    if (!uniqueProjectCountResult.success) {
      console.error(
        "ユニーク事業数取得エラー:",
        uniqueProjectCountResult.error,
      );
      return NextResponse.json(
        {
          error: `ユニーク事業数の取得に失敗しました: ${uniqueProjectCountResult.error}`,
        },
        { status: 500 },
      );
    }
    const totalProjects = uniqueProjectCountResult.data?.[0]?.count || 0;

    // 費目別分析用データ - 全件取得（制限なし）
    const { data: expenseData, error: expenseError } = await supabase
      .from("govis_table_04")
      .select("*")
      .not("column_20", "is", null)
      .neq("column_20", "")
      .order("column_02", { ascending: true }) // 順序を固定
      .limit(2147483647); // PostgreSQLの最大整数値

    if (expenseError) {
      console.error("費目データ取得エラー:", expenseError);
      return NextResponse.json(
        { error: "費目データの取得に失敗しました" },
        { status: 500 },
      );
    }

    // 最新年度
    const { data: latestYearData, error: latestYearError } = await supabase
      .from("govis_table_03")
      .select("column_02")
      .not("column_02", "is", null)
      .order("column_02", { ascending: false })
      .limit(1);

    if (latestYearError) {
      console.error("最新年度取得エラー:", latestYearError);
      return NextResponse.json(
        { error: "最新年度の取得に失敗しました" },
        { status: 500 },
      );
    }

    // ヘルパー関数
    const safeGetValue = (
      row: Record<string, unknown>,
      key: string,
    ): string => {
      const value = row[key];
      return typeof value === "string" ? value : "";
    };
    const safeParseFloat = (value: string): number => {
      const parsed = Number.parseFloat(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    // === 基本統計の計算 ===

    // 総支出額
    const totalAmount = (mainData || []).reduce((sum, item) => {
      const amount = safeParseFloat(safeGetValue(item, "column_26"));
      return sum + amount;
    }, 0);

    // ユニーク契約先数
    const uniqueContractors = new Set(
      (mainData || [])
        .map((item) => safeGetValue(item, "column_19"))
        .filter(Boolean),
    ).size;

    // 平均契約額
    const averageAmount = totalProjects > 0 ? totalAmount / totalProjects : 0;

    // === 府省庁別分析 ===

    const ministryStats: Record<
      string,
      { amount: number; projects: Set<string> }
    > = {};
    (mainData || []).forEach((item) => {
      const ministry = safeGetValue(item, "column_06");
      const amount = safeParseFloat(safeGetValue(item, "column_26"));
      const projectId = `${safeGetValue(item, "column_02")}-${safeGetValue(item, "column_03")}`;

      if (ministry && amount > 0) {
        if (!ministryStats[ministry]) {
          ministryStats[ministry] = { amount: 0, projects: new Set() };
        }
        ministryStats[ministry].amount += amount;
        if (projectId !== "-") {
          ministryStats[ministry].projects.add(projectId);
        }
      }
    });

    const topMinistries = Object.entries(ministryStats)
      .sort(([, a], [, b]) => b.amount - a.amount)
      .slice(0, 5)
      .map(([ministry, data]) => ({
        ministry,
        amount: data.amount,
        projects: data.projects.size,
        percentage: (data.amount / totalAmount) * 100,
      }));

    // === 契約方式別分析 ===

    const contractTypeStats: Record<string, number> = {};
    (mainData || []).forEach((item) => {
      const type = safeGetValue(item, "column_27");
      if (type) {
        contractTypeStats[type] = (contractTypeStats[type] || 0) + 1;
      }
    });

    const contractTypePercentages = Object.entries(contractTypeStats).map(
      ([type, count]) => ({
        type,
        count,
        percentage: (count / (mainData?.length || 1)) * 100,
      }),
    );

    // 競争性指標の計算
    const competitiveTypes = ["一般競争契約", "指名競争契約"];
    const competitiveCount = contractTypePercentages
      .filter((item) =>
        competitiveTypes.some((type) => item.type.includes(type)),
      )
      .reduce((sum, item) => sum + item.count, 0);
    const competitiveness =
      (mainData?.length || 0) > 0
        ? (competitiveCount / mainData.length) * 100
        : 0;

    // === 契約先分析 ===

    const contractorStats: Record<string, { count: number; amount: number }> =
      {};
    (mainData || []).forEach((item) => {
      const contractor = safeGetValue(item, "column_19");
      const amount = safeParseFloat(safeGetValue(item, "column_26"));
      if (contractor && amount > 0) {
        if (!contractorStats[contractor]) {
          contractorStats[contractor] = { count: 0, amount: 0 };
        }
        contractorStats[contractor].count += 1;
        contractorStats[contractor].amount += amount;
      }
    });

    const topContractors = Object.entries(contractorStats)
      .sort(([, a], [, b]) => b.amount - a.amount)
      .slice(0, 5)
      .map(([contractor, data]) => ({
        contractor,
        amount: data.amount,
        count: data.count,
      }));

    // === 事業規模分布 ===

    const sizeDistribution: Record<string, number> = {};
    (mainData || []).forEach((item) => {
      const amount = safeParseFloat(safeGetValue(item, "column_26"));
      if (amount > 0) {
        let category: string;
        if (amount < 1000000) category = "100万円未満";
        else if (amount < 10000000) category = "100万円〜1000万円";
        else if (amount < 100000000) category = "1000万円〜1億円";
        else if (amount < 1000000000) category = "1億円〜10億円";
        else category = "10億円以上";

        sizeDistribution[category] = (sizeDistribution[category] || 0) + 1;
      }
    });

    // === 高額契約案件 ===

    const highValueContracts = (mainData || [])
      .map((item) => ({
        contractName: safeGetValue(item, "column_04"),
        amount: safeGetValue(item, "column_26"),
        ministry: safeGetValue(item, "column_06"),
        numericAmount: safeParseFloat(safeGetValue(item, "column_26")),
      }))
      .filter((item) => item.numericAmount > 0)
      .sort((a, b) => b.numericAmount - a.numericAmount)
      .slice(0, 3)
      .map((item, index) => ({
        contractName: item.contractName,
        amount: item.amount,
        ministry: item.ministry,
        id: `contract-${index}-${item.contractName}-${item.amount}`,
      }));

    // === 費目別分析 ===

    const expenseTypeStats: Record<string, number> = {};

    (expenseData || []).forEach((item) => {
      const expense = safeGetValue(item, "column_18");
      const amount = safeParseFloat(safeGetValue(item, "column_20"));

      if (expense && amount > 0) {
        expenseTypeStats[expense] = (expenseTypeStats[expense] || 0) + amount;
      }
    });

    const topExpenseTypes = Object.entries(expenseTypeStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, amount]) => ({
        type,
        amount,
        percentage:
          (amount /
            Object.values(expenseTypeStats).reduce(
              (sum, val) => sum + val,
              0,
            )) *
          100,
      }));

    // === 競争性詳細分析 ===

    // 平均入札者数の計算（govis_table_03から）
    const biddersData = (mainData || [])
      .map((item) => {
        const bidders = safeGetValue(item, "column_29");
        return safeParseFloat(bidders);
      })
      .filter((count) => count > 0); // 0より大きい有効な入札者数のみ

    const averageBidders =
      biddersData.length > 0
        ? biddersData.reduce((sum, count) => sum + count, 0) /
          biddersData.length
        : 0;

    // 一者応札率の計算
    const singleBidderCount = biddersData.filter((count) => count === 1).length;
    const singleBidderRatio =
      biddersData.length > 0
        ? (singleBidderCount / biddersData.length) * 100
        : 0;

    // 透明性スコアの改善（複数指標の統合）
    const transparencyScore = Math.max(
      0,
      Math.min(
        100,
        competitiveness * 0.6 + // 競争入札率: 60%
          (100 - singleBidderRatio) * 0.4, // 一者応札回避率: 40%
      ),
    );

    // === レスポンスデータの構築 ===

    const dashboardData = {
      summary: {
        totalAmount,
        totalProjects,
        uniqueContractors,
        averageAmount,
        competitiveness,
        lastUpdated:
          latestYearData?.[0] && typeof latestYearData[0] === "object"
            ? safeGetValue(
                latestYearData[0] as Record<string, unknown>,
                "column_02",
              )
            : null,
      },
      ministryBreakdown: topMinistries,
      contractTypes: contractTypePercentages,
      topContractors,
      sizeDistribution,
      highValueContracts,
      expenseAnalysis: {
        byType: topExpenseTypes,
        totalExpenseRecords: expenseData?.length || 0,
      },
      transparency: {
        competitiveContractRatio: competitiveness,
        averageBidders: Math.round(averageBidders * 10) / 10,
        transparencyScore: Math.round(transparencyScore * 10) / 10,
        singleBidderRatio: Math.round(singleBidderRatio * 10) / 10,
        totalBiddingContracts: biddersData.length,
      },
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("ダッシュボードAPI エラー:", error);
    return NextResponse.json(
      { error: "ダッシュボードデータの取得に失敗しました" },
      { status: 500 },
    );
  }
}
