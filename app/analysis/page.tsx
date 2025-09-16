import { BarChart3, FileText, MessageSquare } from "lucide-react";
import { DatabaseConnection } from "@/components/database-connection";
import { NaturalLanguageQuery } from "@/components/natural-language-query";
import { PromptGeneration } from "@/components/prompt-generation";
import { SQLExecutionPanel } from "@/components/sql-execution-panel";
import UnifiedNavigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AnalysisPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* 統一ナビゲーション */}
      <UnifiedNavigation />

      {/* メインタイトルセクション */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              🔍 行政事業レビュー分析システム
            </h1>
            <p className="text-muted-foreground">
              Administrative Business Review Analysis System
            </p>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            データ分析クエリシステム
          </h2>
          <p className="text-lg text-muted-foreground">
            自然言語処理、SQL実行、プロンプト生成機能を統合したPostgreSQL連携分析ツール
          </p>
        </div>

        <Tabs defaultValue="natural-language" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="natural-language" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>自然言語分析</span>
            </TabsTrigger>
            <TabsTrigger value="sql-execution" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>クエリエディター</span>
            </TabsTrigger>
            <TabsTrigger value="prompt-generation" disabled className="flex items-center space-x-2 opacity-50">
              <FileText className="w-4 h-4" />
              <span>プロンプト生成（未実装）</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="natural-language">
            <NaturalLanguageQuery />
          </TabsContent>          <TabsContent value="sql-execution">
            <SQLExecutionPanel />
          </TabsContent>

          <TabsContent value="prompt-generation">
            <PromptGeneration />
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <DatabaseConnection />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                データセット
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                行政事業レビュー
              </p>
              <p className="text-sm text-muted-foreground">CSV → PostgreSQL</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                利用可能機能
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">3</p>
              <p className="text-sm text-muted-foreground">分析ツール</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
