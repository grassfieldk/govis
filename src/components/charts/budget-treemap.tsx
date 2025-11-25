"use client";

import { ResponsiveTreeMap } from "@nivo/treemap";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface TreemapData {
  name: string;
  value: number;
  percentage?: number;
}

interface RootData {
  name: string;
  children: TreemapData[];
}

/**
 * 全体予算に対する省庁ごとの割合を示すツリーマップ
 * すべての省庁を表示する
 */
export function BudgetByTreemapChart() {
  const [data, setData] = useState<RootData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ministryDescriptions: Record<string, string> = {
    厚生労働省:
      "年金・医療・介護などの社会保障制度を管掌。国民の健康と福祉の維持向上を図る",
    経済産業省:
      "産業振興、エネルギー政策、中小企業支援を担当。日本経済の成長を推進",
    国土交通省:
      "道路、鉄道、空港などインフラ整備と観光を担当。都市開発と地域活性化を推進",
    文部科学省:
      "教育、科学技術、文化・スポーツを推進。人材育成と知識基盤社会の構築",
    防衛省: "国防と安全保障を担当。日本の防衛力の整備と運用を担当",
    総務省:
      "地方分権、地方交付税、通信・放送を担当。地域振興と行政情報化を推進",
    財務省: "国家予算、税務、造幣、印刷を担当。国の財政運営と金融行政を司る",
    外務省:
      "外交、国際関係、駐外公館を管掌。日本の国際的地位向上と外交交渉を担当",
    法務省: "司法、矯正、人権擁護を担当。法治国家の維持と国民の権利保護を推進",
    農林水産省: "農業、林業、水産業振興を担当。食料安全保障と地域振興を推進",
    環境省:
      "環境保全、気候変動対策、廃棄物管理を担当。持続可能な社会づくりを推進",
    内閣府: "政府全体の総合調整と重要政策の企画立案を担当。重要国策を推進",
    内閣官房: "内閣総理大臣を補佐し、内閣の重要政策を推進。政策調整を司る",
    復興庁: "東日本大震災からの復興政策を統括実施。被災地の復興と再生を推進",
    デジタル庁:
      "デジタル化による社会全体の変革とDX推進を担当。行政のDX化を推進",
    こども家庭庁: "こども政策の総合調整と施策の推進。次世代の健全育成を支援",
    国土交通省気象庁:
      "気象観測と予報、地震・津波警報を担当。防災情報提供の中核機関",
    国土交通省海上保安庁:
      "海上の安全確保と海洋秩序の維持を担当。海上パトロール等を実施",
    国土交通省観光庁:
      "観光地域づくりと観光産業振興を担当。インバウンド推進を支援",
    国土交通省運輸安全委員会:
      "交通事故の調査と再発防止を推進。安全な運輸体系を構築",
    文化庁: "文化芸術の振興と文化財保護を担当。日本文化の発展を推進",
    林野庁: "森林の保全管理と林業振興を担当。林業の成長産業化を推進",
    水産庁: "水産業の振興と水産資源管理を担当。水産業の持続可能性を推進",
    国税庁: "税務行政と国税徴収を担当。公平な税務執行を実現",
    消費者庁: "消費者保護と消費生活の安全を担当。消費者権利の擁護を推進",
    消防庁: "消防行政と災害対応を統括。地域防災体制の強化を推進",
    特許庁: "知的財産の保護と創出を担当。イノベーション環境の整備を推進",
    原子力規制委員会:
      "原子力施設の安全規制と核セキュリティを確保。原子力安全を重視",
    カジノ管理委員会:
      "統合型リゾート（IR）のカジノ事業を規制。ギャンブル依存症対策を推進",
    スポーツ庁: "スポーツの推進と競技力向上を担当。国際競技力の強化を支援",
    中央労働委員会:
      "労使紛争の調整と労働関係法の運用を担当。良好な労使関係を構築",
    個人情報保護委員会:
      "個人情報保護制度の運用と監督を担当。プライバシー保護を推進",
    公安調査庁: "公共の安全と秩序維持を担当。情報収集と分析を実施",
    公害等調整委員会:
      "公害に関する紛争処理と解決を担当。環境問題の円滑な解決を推進",
    公正取引委員会: "独占禁止法の運用と競争政策を担当。公正な市場競争を実現",
    金融庁: "金融機関の監督と市場監視を担当。金融システムの安定を確保",
    警察庁: "警察行政の統括と治安維持を担当。国民の安全確保を推進",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sqlQuery = `
          SELECT
            pm.ministry,
            SUM(CAST(b.execution_amount AS BIGINT)) as total_amount
          FROM budgets b
          JOIN projects_master pm ON b.project_year = pm.project_year AND b.project_id = pm.project_id
          WHERE b.budget_year = 2023
            AND b.execution_amount IS NOT NULL
            AND b.execution_amount != ''
          GROUP BY pm.ministry
          ORDER BY total_amount DESC
        `;

        const response = await fetch("/api/sql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: sqlQuery }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();

        if (
          !result.data ||
          !Array.isArray(result.data) ||
          result.data.length === 0
        ) {
          setData(null);
          return;
        }

        const ministries: TreemapData[] = [];
        let totalAmount = 0;

        for (const row of result.data) {
          const amount = Number(row.total_amount) || 0;
          if (amount > 0) {
            totalAmount += amount;
            ministries.push({
              name: String(row.ministry || ""),
              value: amount,
            });
          }
        }

        // パーセンテージを計算
        for (const ministry of ministries) {
          ministry.percentage =
            totalAmount > 0 ? (ministry.value / totalAmount) * 100 : 0;
        }

        setData({
          name: "全体予算",
          children: ministries,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch data";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-sm text-gray-500">データを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg">
        <p className="text-sm text-red-700">エラー: {error}</p>
      </div>
    );
  }

  if (!data || !data.children || data.children.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-sm text-gray-500">データがありません</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-white rounded-lg border border-gray-200 p-4">
      <ResponsiveTreeMap
        data={data}
        identity="name"
        label="name"
        value="value"
        valueFormat=".0s"
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        labelSkipSize={12}
        labelTextColor={{
          from: "color",
          modifiers: [["darker", 1.5]],
        }}
        parentLabelPosition="top"
        parentLabelPadding={4}
        parentLabelTextColor={{
          from: "color",
          modifiers: [["darker", 2]],
        }}
        colors={{ scheme: "category10" }}
        borderColor={{
          from: "color",
          modifiers: [["darker", 0.1]],
        }}
        tooltip={(data: { node: any }) => {
          const node = data.node;
          const formattedValue = formatCurrency(node.value);
          const percentage = node.data?.percentage || 0;
          const description =
            ministryDescriptions[
              node.id as keyof typeof ministryDescriptions
            ] || "";

          return (
            <div
              style={{
                background: "white",
                padding: "12px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "12px",
              }}
            >
              <strong>{node.id}</strong>
              <div style={{ marginTop: "4px" }}>{formattedValue}</div>
              <div style={{ marginTop: "2px", fontSize: "11px" }}>
                ({percentage.toFixed(1)}%)
              </div>
              {description && (
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "11px",
                    color: "#666",
                    whiteSpace: "normal",
                    maxWidth: "200px",
                  }}
                >
                  {description}
                </div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}
