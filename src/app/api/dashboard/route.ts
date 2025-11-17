import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

/**
 * SQL クエリを実行してデータを取得
 */
async function executeSQLQuery(sqlQuery: string) {
  const { data, error } = await supabase.rpc("exec_sql", { sql: sqlQuery });

  if (error) {
    throw new Error(`SQL実行エラー: ${error.message}`);
  }

  // exec_sql は jsonb_agg() の result を返すため、データを抽出
  let parsedData = [];
  if (data && Array.isArray(data) && data.length > 0) {
    const result = data[0]?.result;
    if (result && Array.isArray(result)) {
      parsedData = result;
    }
  }

  return parsedData;
}

const safeParseFloat = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

/**
 * ダッシュボード用の統計データを取得するAPIエンドポイント
 */
export async function GET() {
  try {
    // === 基本統計：府省庁別予算 ===
    const ministryQuery = `
      SELECT
        pm.ministry,
        COUNT(DISTINCT CONCAT(pm.project_year, '-', pm.project_id)) as project_count,
        SUM(CAST(b.execution_amount AS BIGINT)) as total_amount
      FROM projects_master pm
      LEFT JOIN budgets b ON pm.project_year = b.project_year AND pm.project_id = b.project_id
      WHERE b.budget_year = 2023 AND b.execution_amount IS NOT NULL AND b.execution_amount != ''
      GROUP BY pm.ministry
      ORDER BY total_amount DESC
      LIMIT 10
    `;

    const ministryData = await executeSQLQuery(ministryQuery);
    const totalAmount = ministryData.reduce(
      (sum: number, row: Record<string, unknown>) =>
        sum + safeParseFloat(row.total_amount),
      0,
    );

    const ministryBreakdown = ministryData
      .slice(0, 5)
      .map((row: Record<string, unknown>) => ({
        ministry: String(row.ministry || ""),
        amount: safeParseFloat(row.total_amount),
        projects: Number(row.project_count || 0),
        percentage:
          totalAmount > 0
            ? (safeParseFloat(row.total_amount) / totalAmount) * 100
            : 0,
      }));

    // === 総事業数 ===
    const projectCountQuery = `
      SELECT COUNT(DISTINCT CONCAT(project_year, '-', project_id)) as count
      FROM projects_master
    `;

    const projectCountData = await executeSQLQuery(projectCountQuery);
    const totalProjects = safeParseFloat(projectCountData[0]?.count || 0);

    // === ユニーク契約先数 ===
    const contractorsQuery = `
      SELECT COUNT(DISTINCT recipient_name) as count
      FROM expenditures
      WHERE recipient_name IS NOT NULL AND recipient_name != ''
    `;

    const contractorsData = await executeSQLQuery(contractorsQuery);
    const uniqueContractors = safeParseFloat(contractorsData[0]?.count || 0);

    // === 平均契約額 ===
    const averageAmount = totalProjects > 0 ? totalAmount / totalProjects : 0;

    // === 契約方式別分析 ===
    const contractTypeQuery = `
      SELECT
        specific_contract_method as contract_method,
        COUNT(*) as count
      FROM expenditures
      WHERE specific_contract_method IS NOT NULL AND specific_contract_method != ''
      GROUP BY specific_contract_method
      ORDER BY count DESC
    `;

    const contractTypeData = await executeSQLQuery(contractTypeQuery);
    const totalContractCount = contractTypeData.reduce(
      (sum: number, row: Record<string, unknown>) =>
        sum + safeParseFloat(row.count),
      0,
    );

    const contractTypes = contractTypeData.map(
      (row: Record<string, unknown>) => ({
        type: String(row.contract_method || ""),
        count: safeParseFloat(row.count),
        percentage:
          totalContractCount > 0
            ? (safeParseFloat(row.count) / totalContractCount) * 100
            : 0,
      }),
    );

    // === 競争性指標 ===
    const competitiveTypes = ["一般競争契約", "指名競争契約"];
    const competitiveCount = contractTypeData
      .filter((row: Record<string, unknown>) =>
        competitiveTypes.some((type) =>
          String(row.contract_method || "").includes(type),
        ),
      )
      .reduce(
        (sum: number, row: Record<string, unknown>) =>
          sum + safeParseFloat(row.count),
        0,
      );

    const competitiveness =
      totalContractCount > 0
        ? (competitiveCount / totalContractCount) * 100
        : 0;

    // === 事業規模分布 ===
    const sizeDistQuery = `
      WITH size_categories AS (
        SELECT
          CONCAT(pm.project_year, '-', pm.project_id) as project_key,
          CAST(SUM(CAST(b.execution_amount AS BIGINT)) AS BIGINT) as total_amount
        FROM projects_master pm
        LEFT JOIN budgets b ON pm.project_year = b.project_year AND pm.project_id = b.project_id
        WHERE b.budget_year = 2023 AND b.execution_amount IS NOT NULL AND b.execution_amount != ''
        GROUP BY pm.project_year, pm.project_id
      )
      SELECT
        CASE
          WHEN total_amount < 1000000 THEN '100万円未満'
          WHEN total_amount < 10000000 THEN '100万円〜1000万円'
          WHEN total_amount < 100000000 THEN '1000万円〜1億円'
          WHEN total_amount < 1000000000 THEN '1億円〜10億円'
          ELSE '10億円以上'
        END as category,
        COUNT(*) as count
      FROM size_categories
      GROUP BY category
    `;
    const sizeDistData = await executeSQLQuery(sizeDistQuery);
    const sizeDistribution: Record<string, number> = {};
    sizeDistData.forEach((row: Record<string, unknown>) => {
      sizeDistribution[String(row.category || "")] = safeParseFloat(row.count);
    });

    // === 主要契約先（TOP 5） ===
    const topContractorsQuery = `
      SELECT
        recipient_name as contractor,
        COUNT(*) as count,
        SUM(CAST(amount AS BIGINT)) as total_amount
      FROM expenditures
      WHERE recipient_name IS NOT NULL AND recipient_name != '' AND amount IS NOT NULL AND amount != ''
      GROUP BY recipient_name
      ORDER BY total_amount DESC
      LIMIT 5
    `;

    const topContractorsData = await executeSQLQuery(topContractorsQuery);
    const topContractors = topContractorsData.map(
      (row: Record<string, unknown>) => ({
        contractor: String(row.contractor || ""),
        count: safeParseFloat(row.count),
        amount: safeParseFloat(row.total_amount),
      }),
    );

    // === 高額契約案件（TOP 5） ===
    const highValueQuery = `
      SELECT DISTINCT
        contract_summary as contract_name,
        CAST(amount AS BIGINT) as amount,
        pm.ministry
      FROM expenditures e
      LEFT JOIN projects_master pm ON e.project_year = pm.project_year AND e.project_id = pm.project_id
      WHERE e.amount IS NOT NULL AND e.amount != ''
      ORDER BY CAST(e.amount AS BIGINT) DESC
      LIMIT 5
    `;

    const highValueData = await executeSQLQuery(highValueQuery);
    const highValueContracts = highValueData.map(
      (row: Record<string, unknown>, index: number) => ({
        contractName: String(row.contract_name || ""),
        amount: String(safeParseFloat(row.amount)),
        ministry: String(row.ministry || ""),
        id: `contract-${index}`,
      }),
    );

    // === 費目別支出分析 ===
    const expenseQuery = `
      SELECT
        expense_item as expense_type,
        SUM(CAST(amount AS BIGINT)) as total_amount
      FROM expenditure_usages
      WHERE expense_item IS NOT NULL AND expense_item != '' AND amount IS NOT NULL AND amount != ''
      GROUP BY expense_item
      ORDER BY total_amount DESC
      LIMIT 5
    `;

    const expenseData = await executeSQLQuery(expenseQuery);
    const totalExpenseAmount = expenseData.reduce(
      (sum: number, row: Record<string, unknown>) =>
        sum + safeParseFloat(row.total_amount),
      0,
    );

    const expenseAnalysis = {
      byType: expenseData.map((row: Record<string, unknown>) => ({
        type: String(row.expense_type || ""),
        amount: safeParseFloat(row.total_amount),
        percentage:
          totalExpenseAmount > 0
            ? (safeParseFloat(row.total_amount) / totalExpenseAmount) * 100
            : 0,
      })),
      totalExpenseRecords: expenseData.length,
    };

    // === 競争性詳細分析 ===
    const biddersQuery = `
      SELECT
        CAST(num_bidders AS INTEGER) as bidder_count
      FROM expenditures
      WHERE num_bidders IS NOT NULL AND num_bidders != '' AND CAST(num_bidders AS INTEGER) > 0
    `;

    const biddersData = await executeSQLQuery(biddersQuery);
    const bidderCounts = biddersData
      .map((row: Record<string, unknown>) => safeParseFloat(row.bidder_count))
      .filter((count: number) => count > 0);

    const averageBidders =
      bidderCounts.length > 0
        ? bidderCounts.reduce((sum: number, count: number) => sum + count, 0) /
          bidderCounts.length
        : 0;

    const singleBidderCount = bidderCounts.filter(
      (count: number) => count === 1,
    ).length;
    const singleBidderRatio =
      bidderCounts.length > 0
        ? (singleBidderCount / bidderCounts.length) * 100
        : 0;

    const transparencyScore = Math.max(
      0,
      Math.min(100, competitiveness * 0.6 + (100 - singleBidderRatio) * 0.4),
    );

    // === レスポンスデータの構築 ===
    const dashboardData = {
      summary: {
        totalAmount,
        totalProjects: Math.floor(totalProjects),
        uniqueContractors: Math.floor(uniqueContractors),
        averageAmount,
        competitiveness,
        lastUpdated: "2023",
      },
      ministryBreakdown,
      contractTypes,
      topContractors,
      sizeDistribution,
      highValueContracts,
      expenseAnalysis,
      transparency: {
        competitiveContractRatio: competitiveness,
        averageBidders: Math.round(averageBidders * 10) / 10,
        transparencyScore: Math.round(transparencyScore * 10) / 10,
        singleBidderRatio: Math.round(singleBidderRatio * 10) / 10,
        totalBiddingContracts: bidderCounts.length,
      },
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("ダッシュボードAPI エラー:", error);
    return NextResponse.json(
      {
        error: `ダッシュボードデータの取得に失敗しました: ${
          error instanceof Error ? error.message : "不明なエラー"
        }`,
      },
      { status: 500 },
    );
  }
}
