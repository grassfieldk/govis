"use client";

import { Eye, Info, Shield } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * ダッシュボード用の型定義
 */
export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  tooltip?: string;
  className?: string;
}

export interface SectionTitleProps {
  title: string;
  icon: React.ReactNode;
  tooltip?: string;
  className?: string;
}

export interface InfoBoxProps {
  children: ReactNode;
  className?: string;
}

export interface PercentageItem {
  label: string;
  value: string;
  percentage: number;
}

export interface TransparencyCardProps {
  transparency: {
    competitiveContractRatio: number;
    averageBidders: number;
    transparencyScore: number;
    singleBidderRatio?: number;
    totalBiddingContracts?: number;
  };
  className?: string;
}

export interface ExpenseAnalysisCardProps {
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

export interface PercentageBarProps {
  percentage: number;
  color?: string;
}

export interface ListCardItem {
  label: string;
  value?: string;
  subValue?: string;
  metadata?: string;
  percentage?: number;
}

export interface ListCardProps {
  title: string;
  icon: React.ReactNode;
  tooltip: string;
  items: ListCardItem[];
  infoText?: string;
  showNumbers?: boolean;
  showPercentage?: boolean;
  className?: string;
}

/**
 * セクションタイトル
 */
export const SectionTitle = ({
  title,
  icon,
  tooltip,
  className,
}: SectionTitleProps) => (
  <CardTitle className={`flex items-center space-x-2 ${className || ""}`}>
    {icon}
    <span>{title}</span>
    {tooltip && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}
  </CardTitle>
);

/**
 * 情報ボックス
 */
export const InfoBox = ({ children, className }: InfoBoxProps) => (
  <div className={`mt-4 p-3 bg-muted/50 rounded-lg ${className || ""}`}>
    <p className="text-sm text-muted-foreground text-center">{children}</p>
  </div>
);

/**
 * パーセンテージバー
 */
export const PercentageBar = ({
  percentage,
  color = "bg-primary",
}: PercentageBarProps) => (
  <div className="w-full bg-muted rounded-full h-2">
    <div
      className={`${color} h-2 rounded-full transition-all duration-300`}
      style={{ width: `${Math.min(percentage, 100)}%` }}
    />
  </div>
);

/**
 * 統計カード
 */
export const StatCard = ({
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

/**
 * 契約透明性指標カード
 */
export const TransparencyCard = ({
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

/**
 * リストカード（主要契約先・高額契約案件用の汎用コンポーネント）
 */
export const ListCard = ({
  title,
  icon,
  tooltip,
  items,
  showNumbers = false,
  showPercentage = false,
  className,
}: ListCardProps) => (
  <Card className={className}>
    <CardHeader>
      <SectionTitle title={title} icon={icon} tooltip={tooltip} />
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${item.label}-${index}`}>
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <div className="flex items-start gap-2">
                  {showNumbers && (
                    <span className="text-sm font-medium text-muted-foreground flex-shrink-0">
                      {index + 1}.
                    </span>
                  )}
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.metadata && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.metadata}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                {showPercentage && item.value && (
                  <span className="text-sm text-muted-foreground">
                    {item.value}
                  </span>
                )}
                {!showPercentage && item.value && (
                  <span className="text-sm font-bold text-primary">
                    {item.value}
                  </span>
                )}
                {item.subValue && (
                  <p className="text-xs text-muted-foreground">
                    {item.subValue}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

/**
 * 費目別支出分析カード
 */
export const ExpenseAnalysisCard = ({
  expenseAnalysis,
  className,
}: ExpenseAnalysisCardProps) => {
  // formatCurrency を動的にインポートして使用
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000000000) {
      return `${(amount / 1000000000000).toFixed(1)}兆円`;
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

  return (
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
      </CardContent>
    </Card>
  );
};
