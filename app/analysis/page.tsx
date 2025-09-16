"use client";

import { BarChart3, CheckCircle, Database, FileText, MessageSquare, X, XCircle } from "lucide-react";
import { DatabaseConnection } from "@/components/database-connection";
import { NaturalLanguage } from "@/components/analysis/natural-language";
import { PromptGeneration } from "@/components/analysis/prompt-generation";
import { UnifiedQueryEditor } from "@/components/analysis/query-editor";
import UnifiedNavigation from "@/components/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

import type { ConnectionStatus } from "@/types/database";

export default function AnalysisPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: "connecting",
  });
  return (
    <div className="min-h-screen bg-background">
      {/* 統一ナビゲーション */}
      <UnifiedNavigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-foreground">
              データ分析クエリシステム
            </h2>
            <Button
              variant={
                connectionStatus.status === "connected"
                  ? "outline"
                  : connectionStatus.status === "connecting"
                  ? "secondary"
                  : "destructive"
              }
              size="sm"
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2"
            >
              {connectionStatus.status === "connected" ? (
                <CheckCircle className="w-4 h-4" />
              ) : connectionStatus.status === "connecting" ? (
                <Database className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {connectionStatus.status === "connected" ? (
                "データベース接続済"
              ) : connectionStatus.status === "connecting" ? (
                "データベース接続中..."
              ) : (
                "接続エラー"
              )}
            </Button>
          </div>
          <p className="text-muted-foreground">
            自然言語処理、SQL実行、プロンプト生成機能を統合した連携分析ツール
          </p>
        </div>

        <Tabs defaultValue="natural-language" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="natural-language" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>自然言語分析</span>
            </TabsTrigger>
            <TabsTrigger value="query-editor" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>クエリエディター</span>
            </TabsTrigger>
            <TabsTrigger value="prompt-generation" disabled className="flex items-center space-x-2 opacity-50">
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

        <Card className={`fixed inset-x-4 bottom-4 p-6 transition-all duration-200 ${
          isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}>
          <div className="flex justify-between items-center mb-4">
            <CardTitle>データベース接続設定</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <DatabaseConnection onStatusChange={setConnectionStatus} />
        </Card>
      </main>
    </div>
  );
}
