"use client";

import { BudgetBySankeyChart } from "@/components/charts/budget-sankey";

/**
 * お金の動きをさまざまな視点で図表を用いて可視化するページ
 * 全体的な統計を一覧するダッシュボードに対し、ある観点に基づいてもう少し詳しく確認できる
 */
export default function ChartsPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">全体予算から各省庁への振り分け</h2>
        <p className="text-sm text-gray-600 mb-4">
          政府全体の予算がどのように各省庁に配分されているかを示します。
        </p>
        <BudgetBySankeyChart />
      </div>
    </div>
  );
}
