"use client";

import { ResponsiveSankey } from "@nivo/sankey";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * お金の動きをさまざまな視点で図表を用いて可視化するページ
 * 全体的な統計を一覧するダッシュボードに対し、ある観点に基づいてもう少し詳しく確認できる
 */
export default function ChartsPage() {
  const [mergedData, setMergedData] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState<string>("");

  useEffect(() => {
    fetch("/api/data")
      .then((res) => res.json())
      .then((data) => {
        setMergedData(data);
        setSelectedYear(Object.keys(data.ministries)[0]);
      });
  }, []);

  if (!mergedData || !selectedYear) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  const year = selectedYear;
  const ministries = mergedData.ministries[year] || [];
  const ministryProjects = mergedData.ministryprojects[year] || {};
  const projectExpenditures = mergedData.projectexpenditures[year] || {};
  const statistics = mergedData.statistics[year] || {};

  // ノードとリンクを作成
  const nodes: any[] = [];
  const links: any[] = [];

  // 総予算ノード
  const totalBudget = statistics.totalBudget || 0;
  nodes.push({ id: "総予算" });

  // 省庁ノードとリンク
  ministries.forEach((ministry: any, index: number) => {
    const ministryId = ministry.name;
    nodes.push({ id: ministryId });
    links.push({
      source: "総予算",
      target: ministryId,
      value: ministry.budget,
    });
  });

  // プロジェクトノードとリンク
  Object.entries(ministryProjects).forEach(
    ([ministryName, data]: [string, any]) => {
      const ministryIndex = ministries.findIndex(
        (m: any) => m.name === ministryName,
      );
      if (ministryIndex === -1) return;
      const ministryId = ministryName;

      data.top10.forEach((project: any, pIndex: number) => {
        const projectId = `${ministryName}_${project.name}`;
        nodes.push({ id: projectId });
        links.push({
          source: ministryId,
          target: projectId,
          value: project.budget,
        });
      });
    },
  );

  // 支出先ノードとリンク (トップ5に絞る)
  Object.entries(projectExpenditures).forEach(
    ([projectId, data]: [string, any]) => {
      // projectId から ministryIndex と pIndex を逆算 (仮定)
      const parts = projectId.split("_");
      if (parts.length < 3) return;
      const ministryIndex = parseInt(parts[1]);
      const pIndex = parseInt(parts[2]);
      const ministryName = ministries[ministryIndex]?.name;
      if (!ministryName) return;
      const project = ministryProjects[ministryName]?.top10?.[pIndex];
      if (!project) return;
      const projectNodeId = `${ministryName}_${project.name}`;

      const top5 = data.top20Expenditures.slice(0, 5);
      top5.forEach((exp: any, eIndex: number) => {
        const expId = `${projectNodeId}_${exp.name}`;
        nodes.push({ id: expId });
        links.push({ source: projectNodeId, target: expId, value: exp.amount });
      });
    },
  );

  const chartData = { nodes, links };

  console.log("chartData:", chartData);

  const years = Object.keys(mergedData.ministries);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">予算内訳</h1>
      <div className="mb-4">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="年度を選択" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year}>
                {year}年度
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="h-[800px]">
        <ResponsiveSankey
          data={chartData}
          margin={{ top: 40, right: 160, bottom: 40, left: 50 }}
          align="justify"
          colors={{ scheme: "category10" }}
          nodeOpacity={1}
          nodeHoverOthersOpacity={0.35}
          nodeThickness={18}
          nodeSpacing={24}
          nodeBorderWidth={0}
          nodeBorderColor={{
            from: "color",
            modifiers: [["darker", 0.8]],
          }}
          nodeBorderRadius={3}
          linkOpacity={0.5}
          linkHoverOthersOpacity={0.1}
          linkContract={3}
          enableLinkGradient={true}
          labelPosition="outside"
          labelOrientation="vertical"
          labelPadding={16}
          labelTextColor={{
            from: "color",
            modifiers: [["darker", 1]],
          }}
          legends={[
            {
              anchor: "bottom-right",
              direction: "column",
              translateX: 130,
              itemWidth: 100,
              itemHeight: 14,
              itemDirection: "right-to-left",
              itemsSpacing: 2,
              itemTextColor: "#999",
              symbolSize: 14,
              effects: [
                {
                  on: "hover",
                  style: {
                    itemTextColor: "#000",
                  },
                },
              ],
            },
          ]}
        />
      </div>
    </div>
  );
}
