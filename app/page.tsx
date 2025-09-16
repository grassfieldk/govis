'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Database, Building2, TrendingUp, Users, Calculator, Clock, Briefcase, Award, Info } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// 型定義
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
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * パーセンテージバーコンポーネント
 */
const PercentageBar = ({ percentage, color = "bg-primary" }: { percentage: number; color?: string }) => (
  <div className="w-full bg-muted rounded-full h-2">
    <div
      className={`${color} h-2 rounded-full transition-all duration-300`}
      style={{ width: `${Math.min(percentage, 100)}%` }}
    />
  </div>
);

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('データの取得に失敗しました');
        }
        const dashboardData = await response.json() as DashboardData;
        setData(dashboardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">データを読み込み中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-destructive mb-4">{error || 'データの取得に失敗しました'}</p>
            <Button onClick={() => window.location.reload()}>再読み込み</Button>
          </div>
        </div>
      </div>
    );
  }

  const topThreeMinistries = data.ministryBreakdown.slice(0, 3);
  const topThreeShare = topThreeMinistries.reduce((sum, item) => sum + item.percentage, 0);

  // 各セクションの説明文
  const sectionDescriptions = {
    ministryBreakdown: "国の各府省庁ごとの支出額と構成比を表示しています。どの分野に多くの予算が配分されているかを把握できます。",
    contractTypes: "一般競争入札や随意契約など、契約方式ごとの件数比率を示しています。競争性指標は透明性の目安となります。",
    sizeDistribution: "事業規模別の件数分布を表示しています。小規模から大規模まで、どの規模の事業が多いかを確認できます。",
    topContractors: "支出額が多い主要な契約先を表示しています。政府調達の主要な受注者を把握できます。",
    highValueContracts: "特に支出額が大きい契約案件を表示しています。大型事業の内容と担当府省庁を確認できます。",
    dataSource: "このダッシュボードで使用しているデータの出典と最終更新日を表示しています。",
    totalProjects: "2024年度に実施された行政事業の総件数です。",
    uniqueContractors: "政府と契約を結んでいる企業・団体の総数です。",
    averageAmount: "1件あたりの平均契約金額です。事業規模の平均的な水準を示しています。"
  };

  return (
    <TooltipProvider delayDuration={100} skipDelayDuration={500}>
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <Database className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  🏛️ 行政事業レビュー 2024年度
                </h1>
                <p className="text-sm text-muted-foreground">
                  Administrative Business Review Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Link href="/analysis">
                <Button variant="outline" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  詳細分析
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 1. ヘッダ概要セクション */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-muted-foreground mb-3">
                  総支出額
                </h3>
                <h2 className="text-4xl font-bold text-foreground mb-2">
                  {formatCurrency(data.summary.totalAmount)}
                </h2>
                <p className="text-muted-foreground">
                  更新日: {data.summary.lastUpdated || '不明'} | 総事業数: {data.summary.totalProjects.toLocaleString()}件
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 2. 府省庁別支出構成 */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5" />
                <span>府省庁別支出構成</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{sectionDescriptions.ministryBreakdown}</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.ministryBreakdown.map((item) => (
                  <div key={item.ministry} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{item.ministry}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(item.amount)} ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <PercentageBar percentage={item.percentage} />
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  上位3府省庁で {topThreeShare.toFixed(1)}% を占めています
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 3. 契約方式別分析 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>契約方式別分析</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{sectionDescriptions.contractTypes}</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.contractTypes.slice(0, 3).map((item) => (
                  <div key={item.type} className="flex justify-between items-center">
                    <span className="text-sm font-medium">{item.type}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-center">
                  競争性指標: {data.summary.competitiveness.toFixed(1)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 4. 簡易指標列 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="w-4 h-4" />
                <span>総事業数</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{sectionDescriptions.totalProjects}</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {data.summary.totalProjects.toLocaleString()}件
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>総支出先</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{sectionDescriptions.uniqueContractors}</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {data.summary.uniqueContractors.toLocaleString()}社/団体
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>平均契約額</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{sectionDescriptions.averageAmount}</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(data.summary.averageAmount)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 5. 事業規模分布 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>事業規模分布</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{sectionDescriptions.sizeDistribution}</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(() => {
                  const totalSizeCount = Object.values(data.sizeDistribution).reduce((sum, count) => sum + count, 0);
                  return Object.entries(data.sizeDistribution).map(([category, count]) => (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{category}</span>
                        <span>{count}件 ({((count / totalSizeCount) * 100).toFixed(1)}%)</span>
                      </div>
                      <PercentageBar
                        percentage={(count / totalSizeCount) * 100}
                      />
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>

          {/* 6. 契約先分析 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5" />
                <span>主要契約先</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{sectionDescriptions.topContractors}</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topContractors.slice(0, 5).map((item, index) => (
                  <div key={item.contractor} className="flex justify-between items-center">
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
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>高額契約案件</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{sectionDescriptions.highValueContracts}</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.highValueContracts.map((item, index) => (
                  <div key={item.id || `contract-${index}-${item.contractName}-${item.amount}`} className="border rounded-lg p-3 bg-muted/30">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        {index + 1}.
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {formatCurrency(Number.parseFloat(item.amount))}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1 line-clamp-2">
                      {item.contractName}
                    </p>
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
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>データ出典</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{sectionDescriptions.dataSource}</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-muted-foreground" />
                  <a href='https://rssystem.go.jp/download-csv/2024' target='blank' className="text-sm">行政事業レビューデータ</a>
                </div>
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground text-center">
                    最終更新: {data.summary.lastUpdated || 'データベースから取得'}
                  </p>
                </div>
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
      </main>
    </div>
    </TooltipProvider>
  );
}
