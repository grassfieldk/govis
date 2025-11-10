import {
  Award,
  BarChart3,
  Briefcase,
  Building2,
  Calculator,
  Database,
  Eye,
  Info,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { ReloadButton } from "@/components/reload-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const dynamic = "force-dynamic";

// ダッシュボード用コンポーネント
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  tooltip?: string;
  className?: string;
}

const StatCard = ({
  title,
  value,
  icon,
  tooltip,
  className,
}: StatCardProps) => (
  <Card className={className}>
    <CardHeader>
      <SectionTitle title={title} icon={icon} tooltip={tooltip} />
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-bold text-primary">{value}</p>
    </CardContent>
  </Card>
);

interface SectionTitleProps {
  title: string;
  icon: React.ReactNode;
  tooltip?: string;
  className?: string;
}

const SectionTitle = ({
  title,
  icon,
  tooltip,
  className,
}: SectionTitleProps) => (
  <CardTitle className={`flex items-center space-x-2 ${className || ""}`}>
    {icon}
    <span>{title}</span>
    {tooltip && (
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    )}
  </CardTitle>
);

interface InfoBoxProps {
  children: ReactNode;
  className?: string;
}

const InfoBox = ({ children, className }: InfoBoxProps) => (
  <div className={`mt-4 p-3 bg-muted/50 rounded-lg ${className || ""}`}>
    <p className="text-sm text-muted-foreground text-center">{children}</p>
  </div>
);

interface PercentageItem {
  label: string;
  value: string;
  percentage: number;
}

interface PercentageListCardProps {
  title: string;
  icon: React.ReactNode;
  tooltip: string;
  items: PercentageItem[];
  infoText?: string;
  showBars?: boolean;
  className?: string;
}

const PercentageListCard = ({
  title,
  icon,
  tooltip,
  items,
  infoText,
  showBars = true,
  className,
}: PercentageListCardProps) => (
  <Card className={className}>
    <CardHeader>
      <SectionTitle title={title} icon={icon} tooltip={tooltip} />
    </CardHeader>
    <CardContent>
      <div className={showBars ? "space-y-4" : "space-y-3"}>
        {items.map((item) => (
          <div key={item.label} className={showBars ? "space-y-2" : undefined}>
            <div className="flex justify-between items-center">
              <span
                className={
                  showBars ? "font-medium text-sm" : "text-sm font-medium"
                }
              >
                {item.label}
              </span>
              <span className="text-sm text-muted-foreground">
                {item.value && `${item.value} `}({item.percentage.toFixed(1)}%)
              </span>
            </div>
            {showBars && <PercentageBar percentage={item.percentage} />}
          </div>
        ))}
      </div>
      {infoText && <InfoBox>{infoText}</InfoBox>}
    </CardContent>
  </Card>
);

interface TransparencyCardProps {
  transparency: {
    competitiveContractRatio: number;
    averageBidders: number;
    transparencyScore: number;
    singleBidderRatio?: number;
    totalBiddingContracts?: number;
  };
  className?: string;
}

const TransparencyCard = ({
  transparency,
  className,
}: TransparencyCardProps) => (
  <Card className={className}>
    <CardHeader>
      <SectionTitle
        title="契約透明性指標"
        icon={<Shield className="w-5 h-5" />}
        tooltip="政府契約の透明性と競争性を示す指標です。高いほど健全な契約が行われています。"
      />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">競争入札率</span>
          <span className="text-sm font-bold text-primary">
            {transparency.competitiveContractRatio.toFixed(1)}%
          </span>
        </div>
        <PercentageBar
          percentage={transparency.competitiveContractRatio}
          color={
            transparency.competitiveContractRatio >= 70
              ? "bg-green-500"
              : transparency.competitiveContractRatio >= 50
                ? "bg-yellow-500"
                : "bg-red-500"
          }
        />

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">平均入札者数</span>
          <span className="text-sm font-bold text-primary">
            {transparency.averageBidders.toFixed(1)}社
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">透明性スコア</span>
          <span className="text-sm font-bold text-primary">
            {transparency.transparencyScore.toFixed(1)}点
          </span>
        </div>
        <PercentageBar
          percentage={transparency.transparencyScore}
          color={
            transparency.transparencyScore >= 70
              ? "bg-green-500"
              : transparency.transparencyScore >= 50
                ? "bg-yellow-500"
                : "bg-red-500"
          }
        />
      </div>

      <InfoBox className="mt-4">
        {transparency.transparencyScore >= 70
          ? "良好: 競争性の高い契約が適切に行われています"
          : transparency.transparencyScore >= 50
            ? "注意: 競争性向上の余地があります"
            : "要改善: 随意契約の割合が高く、競争性の向上が必要です"}
        {transparency.singleBidderRatio !== undefined && (
          <span className="block text-xs mt-1">
            一者応札率: {transparency.singleBidderRatio.toFixed(1)}% (
            {transparency.totalBiddingContracts || 0}件中の分析)
          </span>
        )}
      </InfoBox>
    </CardContent>
  </Card>
);

interface ExpenseAnalysisCardProps {
  expenseAnalysis: {
    byType: Array<{
      type: string;
      amount: number;
      percentage: number;
    }>;
    totalExpenseRecords: number;
  };
  className?: string;
}

const ExpenseAnalysisCard = ({
  expenseAnalysis,
  className,
}: ExpenseAnalysisCardProps) => (
  <Card className={className}>
    <CardHeader>
      <SectionTitle
        title="費目別支出分析"
        icon={<Eye className="w-5 h-5" />}
        tooltip="政府支出の用途を費目別に分類した分析です。予算がどのような目的で使われているかを確認できます。"
      />
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {expenseAnalysis.byType.slice(0, 5).map((item) => (
          <div key={item.type} className="flex justify-between items-center">
            <span className="text-sm font-medium truncate max-w-[150px]">
              {item.type}
            </span>
            <div className="text-right">
              <span className="text-sm font-bold text-primary">
                {formatCurrency(item.amount)}
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                ({item.percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        ))}
      </div>

      <InfoBox className="mt-4">
        費目別データ: {expenseAnalysis.totalExpenseRecords.toLocaleString()}
        件の詳細支出を分析
      </InfoBox>
    </CardContent>
  </Card>
);
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
 * 数値を日本円形式でフォーマット
 */
const formatCurrency = (amount: number): string => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}兆円`;
  }
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}億円`;
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(1)}万円`;
  }
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * パーセンテージバーコンポーネント
 */
const PercentageBar = ({
  percentage,
  color = "bg-primary",
}: {
  percentage: number;
  color?: string;
}) => (
  <div className="w-full bg-muted rounded-full h-2">
    <div
      className={`${color} h-2 rounded-full transition-all duration-300`}
      style={{ width: `${Math.min(percentage, 100)}%` }}
    />
  </div>
);

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
    dataSource:
      "このダッシュボードで使用しているデータの出典と最終更新日を表示しています。",
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
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
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
          <PercentageListCard
            title="府省庁別支出構成"
            icon={<Building2 className="w-5 h-5" />}
            tooltip={sectionDescriptions.ministryBreakdown}
            items={data.ministryBreakdown.map((item) => ({
              label: item.ministry,
              value: `${formatCurrency(item.amount)} | ${item.projects}事業`,
              percentage: item.percentage,
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
          <PercentageListCard
            title="契約方式別分析"
            icon={<Award className="w-5 h-5" />}
            tooltip={sectionDescriptions.contractTypes}
            items={data.contractTypes.slice(0, 5).map((item) => ({
              label: item.type,
              value: `${item.count}件`,
              percentage: item.percentage,
            }))}
            infoText={`競争性指標: ${data.summary.competitiveness.toFixed(1)}%`}
            showBars={true}
          />

          {/* 6. 事業規模分布 */}
          <PercentageListCard
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
                  percentage: (count / totalSizeCount) * 100,
                }),
              );
            })()}
          />

          {/* 7. 費目別支出分析 */}
          <ExpenseAnalysisCard expenseAnalysis={data.expenseAnalysis} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 8. 主要契約先 */}
          <Card>
            <CardHeader>
              <SectionTitle
                title="主要契約先"
                icon={<Briefcase className="w-5 h-5" />}
                tooltip={sectionDescriptions.topContractors}
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topContractors.slice(0, 5).map((item, index) => (
                  <div
                    key={item.contractor}
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        {index + 1}.
                      </span>
                      <span className="text-sm font-medium truncate max-w-[150px]">
                        {item.contractor}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(item.amount)}
                      </span>
                      <span className="text-xs text-muted-foreground block">
                        {item.count}件
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 9. 高額契約案件 */}
          <Card>
            <CardHeader>
              <SectionTitle
                title="高額契約案件"
                icon={<TrendingUp className="w-5 h-5" />}
                tooltip={sectionDescriptions.highValueContracts}
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.highValueContracts.map((item, index) => (
                  <div
                    key={
                      item.id ||
                      `contract-${index}-${item.contractName}-${item.amount}`
                    }
                    className="border rounded-lg p-3 bg-muted/30"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium">
                        {index + 1}. {item.contractName}
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {formatCurrency(Number.parseFloat(item.amount))}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.ministry}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
          {/* 10. データ出典と詳細情報 */}
          <Card>
            <CardHeader>
              <SectionTitle
                title="データ出典と分析詳細"
                icon={<Database className="w-5 h-5" />}
                tooltip={sectionDescriptions.dataSource}
              />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">データソース</h4>
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <a
                      href="https://rssystem.go.jp/download-csv/2024"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      行政事業レビューデータ
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    最終更新:{" "}
                    {data.summary.lastUpdated || "データベースから取得"}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">分析範囲</h4>
                  <p className="text-xs text-muted-foreground">
                    • 支出情報: {data.summary.totalProjects.toLocaleString()}
                    件の事業
                  </p>
                  <p className="text-xs text-muted-foreground">
                    • 費目詳細:{" "}
                    {data.expenseAnalysis.totalExpenseRecords.toLocaleString()}
                    件の支出記録
                  </p>
                  <p className="text-xs text-muted-foreground">
                    • 契約先: {data.summary.uniqueContractors.toLocaleString()}
                    社・団体
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">透明性指標</h4>
                  <p className="text-xs text-muted-foreground">
                    競争入札率:{" "}
                    {data.transparency.competitiveContractRatio.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    透明性スコア:{" "}
                    {data.transparency.transparencyScore.toFixed(1)}点
                  </p>
                  <p className="text-xs text-muted-foreground">
                    総支出額: {formatCurrency(data.summary.totalAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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
