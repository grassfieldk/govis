import {
  Award,
  BarChart3,
  Briefcase,
  Building2,
  Calculator,
  Clock,
  Database,
  Info,
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

function StatCard({ title, value, icon, tooltip, className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <SectionTitle title={title} icon={icon} tooltip={tooltip} />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-primary">{value}</p>
      </CardContent>
    </Card>
  );
}

interface SectionTitleProps {
  title: string;
  icon: React.ReactNode;
  tooltip?: string;
  className?: string;
}

function SectionTitle({ title, icon, tooltip, className }: SectionTitleProps) {
  return (
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
}

interface InfoBoxProps {
  children: ReactNode;
  className?: string;
}

function InfoBox({ children, className }: InfoBoxProps) {
  return (
    <div className={`mt-4 p-3 bg-muted/50 rounded-lg ${className || ""}`}>
      <p className="text-sm text-muted-foreground text-center">{children}</p>
    </div>
  );
}

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

function PercentageListCard({
  title,
  icon,
  tooltip,
  items,
  infoText,
  showBars = true,
  className,
}: PercentageListCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <SectionTitle title={title} icon={icon} tooltip={tooltip} />
      </CardHeader>
      <CardContent>
        <div className={showBars ? "space-y-4" : "space-y-3"}>
          {items.map((item) => (
            <div key={item.label} className={showBars ? "space-y-2" : undefined}>
              <div className="flex justify-between items-center">
                <span className={showBars ? "font-medium text-sm" : "text-sm font-medium"}>
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
} // 型定義
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
function ErrorDisplay({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <ReloadButton />
        </div>
      </div>
    </div>
  );
}

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
      "国の各府省庁ごとの支出額と構成比を表示しています。どの分野に多くの予算が配分されているかを把握できます。",
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
              value: formatCurrency(item.amount),
              percentage: item.percentage,
            }))}
            infoText={`上位3府省庁で ${topThreeShare.toFixed(1)}% を占めています`}
            className="lg:col-span-2"
          />

          {/* 3. 契約方式別分析 */}
          <PercentageListCard
            title="契約方式別分析"
            icon={<Award className="w-5 h-5" />}
            tooltip={sectionDescriptions.contractTypes}
            items={data.contractTypes.slice(0, 3).map((item) => ({
              label: item.type,
              value: "",
              percentage: item.percentage,
            }))}
            infoText={`競争性指標: ${data.summary.competitiveness.toFixed(1)}%`}
            showBars={false}
          />
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
            title="平均契約額"
            value={formatCurrency(data.summary.averageAmount)}
            icon={<TrendingUp className="w-4 h-4" />}
            tooltip={sectionDescriptions.averageAmount}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 5. 事業規模分布 */}
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

          {/* 6. 契約先分析 */}
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
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 7. 高額契約案件 */}
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

          {/* 8. データ出典 */}
          <Card>
            <CardHeader>
              <SectionTitle
                title="データ出典"
                icon={<Clock className="w-5 h-5" />}
                tooltip={sectionDescriptions.dataSource}
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-muted-foreground" />
                  <a
                    href="https://rssystem.go.jp/download-csv/2024"
                    target="blank"
                    className="text-sm"
                  >
                    行政事業レビューデータ
                  </a>
                </div>
                <InfoBox>
                  最終更新: {data.summary.lastUpdated || "データベースから取得"}
                </InfoBox>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* フッター情報 */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            このダッシュボードは、国民が「今年のお金の全体像と特徴を10秒で理解できる」ことを目的としています。
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
