"use client";

import { useEffect, useState } from "react";
import { ResponsiveSankey } from "@nivo/sankey";
import type { SankeyNodeDatum, SankeyLinkDatum } from "@nivo/sankey";

interface SankeyNode {
  id: string;
  description?: string;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

/**
 * 全体予算から各省庁への振り分けを示すサンキー図
 */
export function BudgetBySankeyChart() {
  const [data, setData] = useState<SankeyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ministryDescriptions: Record<string, string> = {
    厚生労働省: "年金・医療・介護などの社会保障制度を管掌",
    経済産業省: "産業振興、エネルギー政策、中小企業支援を担当",
    国土交通省: "道路、鉄道、空港などインフラ整備と観光を担当",
    文部科学省: "教育、科学技術、文化・スポーツを推進",
    防衛省: "国防と安全保障を担当",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sqlQuery = `
          SELECT
            pm.ministry,
            pm.project_id,
            pm.project_name,
            SUM(CAST(b.execution_amount AS BIGINT)) as value
          FROM budgets b
          JOIN projects_master pm ON b.project_year = pm.project_year AND b.project_id = pm.project_id
          WHERE b.budget_year = 2023
            AND b.execution_amount IS NOT NULL
            AND b.execution_amount != ''
          GROUP BY pm.ministry, pm.project_id, pm.project_name
          ORDER BY pm.ministry, value DESC
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

        interface MinistryData {
          total: number;
          projects: Array<{ id: string; name: string; value: number }>;
        }
        const ministryDataMap = new Map<string, MinistryData>();

        if (result.data && Array.isArray(result.data)) {
          for (const row of result.data) {
            const ministry = row.ministry;
            const projectId = row.project_id;
            const projectName = row.project_name;
            const value = Number(row.value) || 0;

            if (ministry && projectName && value > 0) {
              if (!ministryDataMap.has(ministry)) {
                ministryDataMap.set(ministry, { total: 0, projects: [] });
              }
              const ministryData = ministryDataMap.get(ministry);
              if (ministryData) {
                ministryData.total += value;
                ministryData.projects.push({
                  id: projectId,
                  name: projectName,
                  value,
                });
              }
            }
          }
        }

        const sortedMinistries = Array.from(ministryDataMap.entries())
          .sort((a, b) => b[1].total - a[1].total)
          .slice(0, 5);

        const top5MinistryNames = new Set(sortedMinistries.map(([name]) => name));

        const nodes: Set<string> = new Set();
        const links: SankeyLink[] = [];

        nodes.add("全体予算");

        for (const [ministry, ministryData] of sortedMinistries) {
          nodes.add(ministry);
          const ministryValueInMillions = Math.floor(ministryData.total / 1000000);
          if (ministryValueInMillions > 0) {
            links.push({
              source: "全体予算",
              target: ministry,
              value: ministryValueInMillions,
            });
          }

          let otherProjectValue = 0;

          for (let i = 0; i < ministryData.projects.length; i++) {
            const project = ministryData.projects[i];
            if (i < 5) {
              nodes.add(project.name);
              const projectValueInMillions = Math.floor(project.value / 1000000);
              if (projectValueInMillions > 0) {
                links.push({
                  source: ministry,
                  target: project.name,
                  value: projectValueInMillions,
                });
              }
            } else {
              otherProjectValue += project.value;
            }
          }

          if (otherProjectValue > 0) {
            const otherKey = `${ministry}_Other`;
            nodes.add(otherKey);
            const otherValueInMillions = Math.floor(otherProjectValue / 1000000);
            if (otherValueInMillions > 0) {
              links.push({
                source: ministry,
                target: otherKey,
                value: otherValueInMillions,
              });
            }
          }
        }

        let otherMinistryValue = 0;
        for (const [ministryName, ministryData] of ministryDataMap.entries()) {
          if (!top5MinistryNames.has(ministryName)) {
            otherMinistryValue += ministryData.total;
          }
        }

        if (otherMinistryValue > 0) {
          nodes.add("その他");
          const otherValueInMillions = Math.floor(otherMinistryValue / 1000000);
          if (otherValueInMillions > 0) {
            links.push({
              source: "全体予算",
              target: "その他",
              value: otherValueInMillions,
            });
          }
        }

        const sankeyData: SankeyData = {
          nodes: Array.from(nodes).map((id) => ({
            id,
            description: ministryDescriptions[id as keyof typeof ministryDescriptions] || "",
          })),
          links,
        };

        setData(sankeyData);
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

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-sm text-gray-500">データがありません</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-white rounded-lg border border-gray-200 p-4">
      <ResponsiveSankey
        data={data}
        margin={{ top: 20, right: 100, bottom: 20, left: 100 }}
        align="justify"
        colors={{ scheme: "category10" }}
        nodeOpacity={1}
        nodeHoverOpacity={1}
        nodeThickness={18}
        nodeInnerPadding={3}
        linkOpacity={0.5}
        linkHoverOpacity={0.75}
        linkContract={3}
        enableLinkGradient={true}
        labelPosition="outside"
        labelPadding={8}
        labelTextColor={{
          from: "color",
          modifiers: [["darker", 1]],
        }}
        nodeTooltip={({ node }: { node: SankeyNodeDatum<SankeyNode, SankeyLink> }) => {
          const formattedValue = node.value.toLocaleString("ja-JP");
          return (
            <div
              style={{
                background: "white",
                padding: "12px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "12px",
                whiteSpace: "nowrap",
              }}
            >
              <strong>{node.id}</strong>
              <div style={{ marginTop: "4px" }}>{formattedValue} 百万円</div>
              {node.description && (
                <div style={{ marginTop: "4px", fontSize: "11px", color: "#666", whiteSpace: "normal" }}>
                  {node.description}
                </div>
              )}
            </div>
          );
        }}
        linkTooltip={({ link }: { link: SankeyLinkDatum<SankeyNode, SankeyLink> }) => {
          const formattedValue = link.value.toLocaleString("ja-JP");
          const targetId =
            typeof link.target === "string"
              ? link.target
              : (link.target as SankeyNodeDatum<SankeyNode, SankeyLink>).id;
          const targetNode = link.target as SankeyNodeDatum<SankeyNode, SankeyLink>;
          const targetDescription = targetNode?.description || "";

          return (
            <div
              style={{
                background: "white",
                padding: "12px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "12px",
                whiteSpace: "nowrap",
              }}
            >
              <div>
                <strong>{targetId}</strong>
              </div>
              <div style={{ marginTop: "4px" }}>{formattedValue} 百万円</div>
              {targetDescription && (
                <div style={{ marginTop: "6px", fontSize: "11px", color: "#666", whiteSpace: "normal" }}>
                  {targetDescription}
                </div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}
