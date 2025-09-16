"use client";

import { BarChart3, FileText, MessageSquare } from "lucide-react";
import { NaturalLanguage } from "@/components/analysis/natural-language";
import { PromptGeneration } from "@/components/analysis/prompt-generation";
import { UnifiedQueryEditor } from "@/components/analysis/query-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AnalysisPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-foreground mb-2">
          データ分析クエリシステム
        </h2>
        <p className="text-muted-foreground">
          自然言語処理、SQL実行、プロンプト生成機能を統合した連携分析ツール
        </p>
      </div>

      <Tabs defaultValue="natural-language" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger
            value="natural-language"
            className="flex items-center space-x-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>自然言語分析</span>
          </TabsTrigger>
          <TabsTrigger
            value="query-editor"
            className="flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>クエリエディター</span>
          </TabsTrigger>
          <TabsTrigger
            value="prompt-generation"
            disabled
            className="flex items-center space-x-2 opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>プロンプト生成（未実装）</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="natural-language">
          <NaturalLanguage />
        </TabsContent>
        <TabsContent value="query-editor">
          <UnifiedQueryEditor />
        </TabsContent>
        <TabsContent value="prompt-generation">
          <PromptGeneration />
        </TabsContent>
      </Tabs>
    </div>
  );
}
