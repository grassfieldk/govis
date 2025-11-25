import {
  Award,
  BarChart3,
  Briefcase,
  Building2,
  Calculator,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  ExpenseAnalysisCard,
  ListCard,
  type ListCardItem,
  StatCard,
  TransparencyCard,
} from "@/components/dashboard/components";
import { ReloadButton } from "@/components/reload-button";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface DashboardData {
  summary: {
    totalAmount: number;
    totalProjects: number;
    uniqueContractors: number;
    averageAmount: number;
    competitiveness: number;
    lastUpdated: string | null;
  };
  ministryBreakdown: Array<{
    ministry: string;
    amount: number;
    projects: number;
    percentage: number;
  }>;
  contractTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  topContractors: Array<{
    contractor: string;
    amount: number;
    count: number;
  }>;
  sizeDistribution: Record<string, number>;
  highValueContracts: Array<{
    contractName: string;
    amount: string;
    ministry: string;
    id?: string;
  }>;
  expenseAnalysis: {
    byType: Array<{
      type: string;
      amount: number;
      percentage: number;
    }>;
    totalExpenseRecords: number;
  };
  transparency: {
    competitiveContractRatio: number;
    averageBidders: number;
    transparencyScore: number;
    singleBidderRatio?: number;
    totalBiddingContracts?: number;
  };
}

/**
 * サーバーサイドでダッシュボードデータを取得
 */
async function getDashboardData(): Promise<DashboardData> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL;
    const response = await fetch(`${baseUrl}/api/dashboard`, {
      next: {
        revalidate: 3600, // 1時間キャッシュ
      },
    });

    if (!response.ok) {
      throw new Error(`APIエラー: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("ダッシュボードデータの取得に失敗:", error);
    throw error;
  }
}

/**
 * エラー表示コンポーネント
 */
const ErrorDisplay = ({ error }: { error: string }) => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <p className="text-destructive mb-4">{error}</p>
        <ReloadButton />
      </div>
    </div>
  </div>
);

export default async function DashboardPage() {
  let data: DashboardData;

  try {
    data = await getDashboardData();
  } catch (error) {
    return (
      <ErrorDisplay
        error={
          error instanceof Error ? error.message : "データの取得に失敗しました"
        }
      />
    );
  }

  const topThreeMinistries = data.ministryBreakdown.slice(0, 3);
  const topThreeShare = topThreeMinistries.reduce(
    (sum, item) => sum + item.percentage,
    0,
  );

  // 各セクションの説明文
  const sectionDescriptions = {
    ministryBreakdown:
      "国の各府省庁ごとの支出額と事業数を表示しています。どの分野に多くの予算が配分され、どの程度の事業が実施されているかを把握できます。",
    contractTypes:
      "一般競争入札や随意契約など、契約方式ごとの件数比率を示しています。競争性指標は透明性の目安となります。",
    sizeDistribution:
      "事業規模別の件数分布を表示しています。小規模から大規模まで、どの規模の事業が多いかを確認できます。",
    topContractors:
      "支出額が多い主要な契約先を表示しています。政府調達の主要な受注者を把握できます。",
    highValueContracts:
      "特に支出額が大きい契約案件を表示しています。大型事業の内容と担当府省庁を確認できます。",
    totalProjects: "2024年度に実施された行政事業の総件数です。",
    uniqueContractors: "政府と契約を結んでいる企業・団体の総数です。",
    averageAmount:
      "1件あたりの平均契約金額です。事業規模の平均的な水準を示しています。",
    transparency:
      "政府契約の透明性と競争性を数値化した指標です。競争入札の比率などから算出されます。",
    expenseAnalysis:
      "政府支出を費目別に分類した分析です。役務費、印刷製本費、通信運搬費など、具体的な用途を確認できます。",
  };
  return (
    <TooltipProvider delayDuration={100} skipDelayDuration={500}>
      {/* 1. ヘッダ概要セクション */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className="text-muted-foreground mb-3">総支出額</h3>
                <h2 className="text-4xl font-bold text-foreground mb-2">
                  {formatCurrency(data.summary.totalAmount)}
                </h2>
                <p className="text-muted-foreground">
                  更新日: {data.summary.lastUpdated || "不明"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 2. 府省庁別支出構成 */}
          <ListCard
            title="府省庁別支出構成"
            icon={<Building2 className="w-5 h-5" />}
            tooltip={sectionDescriptions.ministryBreakdown}
            items={data.ministryBreakdown.map((item) => ({
              label: item.ministry,
              value: `${formatCurrency(item.amount)} | ${item.projects}事業`,
            }))}
            infoText={`上位3府省庁で ${topThreeShare.toFixed(1)}% を占めています`}
            className="lg:col-span-2"
          />

          {/* 3. 契約透明性指標 */}
          <TransparencyCard transparency={data.transparency} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 4. 統計カード */}
          <StatCard
            title="総事業数"
            value={`${data.summary.totalProjects.toLocaleString()}件`}
            icon={<Calculator className="w-4 h-4" />}
            tooltip={sectionDescriptions.totalProjects}
          />
          <StatCard
            title="総支出先"
            value={`${data.summary.uniqueContractors.toLocaleString()}社・団体`}
            icon={<Users className="w-4 h-4" />}
            tooltip={sectionDescriptions.uniqueContractors}
          />
          <StatCard
            title="契約透明性"
            value={`${data.summary.competitiveness.toFixed(1)}%`}
            icon={<Shield className="w-4 h-4" />}
            tooltip={sectionDescriptions.transparency}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 5. 契約方式別分析 */}
          <ListCard
            title="契約方式別分析"
            icon={<Award className="w-5 h-5" />}
            tooltip={sectionDescriptions.contractTypes}
            items={data.contractTypes.slice(0, 5).map((item) => ({
              label: item.type,
              value: `${item.count}件`,
            }))}
            infoText={`競争性指標: ${data.summary.competitiveness.toFixed(1)}%`}
          />

          {/* 6. 事業規模分布 */}
          <ListCard
            title="事業規模分布"
            icon={<BarChart3 className="w-5 h-5" />}
            tooltip={sectionDescriptions.sizeDistribution}
            items={(() => {
              const totalSizeCount = Object.values(
                data.sizeDistribution,
              ).reduce((sum, count) => sum + count, 0);
              return Object.entries(data.sizeDistribution).map(
                ([category, count]) => ({
                  label: category,
                  value: `${count}件`,
                }),
              );
            })()}
          />

          {/* 7. 費目別支出分析 */}
          <ExpenseAnalysisCard expenseAnalysis={data.expenseAnalysis} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 8. 主要契約先 */}
          <ListCard
            title="主要契約先"
            icon={<Briefcase className="w-5 h-5" />}
            tooltip={sectionDescriptions.topContractors}
            items={data.topContractors.slice(0, 5).map(
              (item): ListCardItem => ({
                label: item.contractor,
                value: formatCurrency(item.amount),
                subValue: `${item.count}件`,
              }),
            )}
            showNumbers={true}
          />

          {/* 9. 高額契約案件 */}
          <ListCard
            title="高額契約案件"
            icon={<TrendingUp className="w-5 h-5" />}
            tooltip={sectionDescriptions.highValueContracts}
            items={data.highValueContracts.map(
              (item): ListCardItem => ({
                label: item.contractName,
                value: formatCurrency(Number.parseFloat(item.amount)),
                metadata: item.ministry,
              }),
            )}
            showNumbers={true}
          />
        </div>

        {/* フッター情報 */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            このダッシュボードは、国民が「政府支出の全体像と健全性を理解できる」ことを目的としています。
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
