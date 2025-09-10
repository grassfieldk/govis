"use client";

import {
  BarChart3,
  BookOpen,
  Copy,
  FileSearch,
  FileText,
  Lightbulb,
  Settings,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: string;
  variables: string[];
}

export function PromptGeneration() {
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [customContext, setCustomContext] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [customVariables, setCustomVariables] = useState<
    Record<string, string>
  >({});

  const analysisTypes = [
    { value: "data-exploration", label: "データ探索・概要把握" },
    { value: "statistical-analysis", label: "統計分析・相関分析" },
    { value: "trend-analysis", label: "トレンド分析・時系列分析" },
    { value: "comparative-analysis", label: "比較分析・ベンチマーク" },
    { value: "report-generation", label: "レポート作成・要約" },
    { value: "insight-discovery", label: "インサイト発見・仮説検証" },
  ];

  const llmModels = [
    { value: "gpt-4", label: "GPT-4 (OpenAI)" },
    { value: "claude-3", label: "Claude 3 (Anthropic)" },
    { value: "gemini-pro", label: "Gemini Pro (Google)" },
    { value: "llama-2", label: "Llama 2 (Meta)" },
    { value: "general", label: "汎用LLM" },
  ];

  const promptTemplates: PromptTemplate[] = [
    {
      id: "data-exploration",
      name: "データ探索プロンプト",
      description: "行政事業レビューデータの基本的な探索と概要把握",
      category: "exploration",
      template: `# 行政事業レビューデータ分析タスク

## データセット概要
行政事業レビューのCSVデータをDuckDBに格納したデータセットを分析してください。

## 分析目的
{purpose}

## データ構造
- 事業名: 各行政事業の名称
- 省庁名: 実施省庁
- 予算額: 事業予算（円）
- 執行率: 予算執行率（%）
- 年度: 実施年度
- 効果測定指標: 事業の効果を測る指標

## 分析要求
1. データの基本統計情報を提供してください
2. 主要な傾向やパターンを特定してください
3. 注目すべき異常値や特徴的な事業を抽出してください
4. {custom_context}

## 出力形式
- 分析結果の要約
- 具体的な数値とデータ
- 実行可能なSQLクエリ例
- 政策提言や改善案`,
      variables: ["purpose", "custom_context"],
    },
    {
      id: "statistical-analysis",
      name: "統計分析プロンプト",
      description: "統計的手法を用いた詳細な数値分析",
      category: "analysis",
      template: `# 行政事業レビュー統計分析

## 分析対象
行政事業レビューデータセット（DuckDB格納）

## 統計分析要求
{purpose}

## 実施する分析
1. **記述統計**: 平均、中央値、標準偏差、分布の特徴
2. **相関分析**: 予算額と執行率の関係性
3. **分散分析**: 省庁間の予算配分の違い
4. **回帰分析**: 予算額に影響する要因の特定
5. **時系列分析**: 年度別の変化傾向

## カスタム分析要求
{custom_context}

## 期待する出力
- 統計的有意性の検証結果
- 可視化用のデータ抽出クエリ
- 政策的含意の解釈
- 追加調査の提案`,
      variables: ["purpose", "custom_context"],
    },
    {
      id: "report-generation",
      name: "レポート作成プロンプト",
      description: "包括的な分析レポートの自動生成",
      category: "reporting",
      template: `# 行政事業レビュー分析レポート作成

## レポート目的
{purpose}

## データソース
行政事業レビューCSVデータ（DuckDB処理済み）

## レポート構成要求
1. **エグゼクティブサマリー**
   - 主要な発見事項
   - 重要な数値指標
   - 政策提言の要約

2. **データ概要**
   - データセットの規模と範囲
   - データ品質の評価

3. **詳細分析**
   - 省庁別予算分析
   - 執行率の傾向分析
   - 効果測定指標の評価

4. **カスタム分析**
   {custom_context}

5. **結論と提言**
   - 政策改善の提案
   - 今後の調査方向

## 出力要求
- 日本語での詳細レポート
- 根拠となるSQLクエリ
- グラフ・表作成用データ`,
      variables: ["purpose", "custom_context"],
    },
  ];

  const generatePrompt = () => {
    if (!selectedPurpose) return;

    const template = promptTemplates.find((t) => t.id === selectedPurpose);
    if (!template) return;

    let prompt = template.template;
    prompt = prompt.replace(
      "{purpose}",
      analysisTypes.find((t) => t.value === selectedPurpose)?.label || "",
    );
    prompt = prompt.replace("{custom_context}", customContext || "特になし");

    // Replace custom variables
    Object.entries(customVariables).forEach(([key, value]) => {
      prompt = prompt.replace(`{${key}}`, value);
    });

    setGeneratedPrompt(prompt);
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
  };

  const handleVariableChange = (variable: string, value: string) => {
    setCustomVariables((prev) => ({
      ...prev,
      [variable]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generator">プロンプト生成</TabsTrigger>
          <TabsTrigger value="templates">テンプレート一覧</TabsTrigger>
          <TabsTrigger value="custom">カスタム作成</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wand2 className="w-5 h-5 text-primary" />
                <span>自動プロンプト生成</span>
              </CardTitle>
              <CardDescription>
                分析目的とLLMモデルを選択して、最適化されたプロンプトを自動生成します。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purpose">分析目的</Label>
                  <Select
                    value={selectedPurpose}
                    onValueChange={setSelectedPurpose}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="分析の目的を選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {analysisTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">対象LLMモデル</Label>
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="LLMモデルを選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {llmModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="context">追加コンテキスト（オプション）</Label>
                <Textarea
                  id="context"
                  placeholder="特定の分析要求や注目したい観点があれば記入してください"
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <Button
                onClick={generatePrompt}
                disabled={!selectedPurpose}
                className="w-full"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                プロンプトを生成
              </Button>
            </CardContent>
          </Card>

          {generatedPrompt && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>生成されたプロンプト</CardTitle>
                  <Button variant="outline" size="sm" onClick={copyPrompt}>
                    <Copy className="w-4 h-4 mr-1" />
                    コピー
                  </Button>
                </div>
                <CardDescription>
                  {selectedModel &&
                    `${llmModels.find((m) => m.value === selectedModel)?.label} 向けに最適化`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md">
                  <pre className="text-sm whitespace-pre-wrap overflow-x-auto">
                    {generatedPrompt}
                  </pre>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    {generatedPrompt.length} 文字
                  </span>
                  <div className="flex space-x-2">
                    <Badge variant="outline">
                      {
                        analysisTypes.find((t) => t.value === selectedPurpose)
                          ?.label
                      }
                    </Badge>
                    {selectedModel && (
                      <Badge variant="outline">
                        {
                          llmModels.find((m) => m.value === selectedModel)
                            ?.label
                        }
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span>プロンプトテンプレート</span>
              </CardTitle>
              <CardDescription>
                用途別に最適化されたプロンプトテンプレートの一覧です。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {promptTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-2">
                        {template.category === "exploration" && (
                          <FileSearch className="w-4 h-4 text-primary" />
                        )}
                        {template.category === "analysis" && (
                          <BarChart3 className="w-4 h-4 text-primary" />
                        )}
                        {template.category === "reporting" && (
                          <FileText className="w-4 h-4 text-primary" />
                        )}
                        <CardTitle className="text-sm">
                          {template.name}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground mb-3">
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.variables.map((variable) => (
                          <Badge
                            key={variable}
                            variant="outline"
                            className="text-xs"
                          >
                            {variable}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                        onClick={() => {
                          setSelectedPurpose(template.id);
                          generatePrompt();
                        }}
                      >
                        このテンプレートを使用
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-primary" />
                <span>カスタムプロンプト作成</span>
              </CardTitle>
              <CardDescription>
                独自の要求に合わせてプロンプトを自由に作成できます。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-prompt">カスタムプロンプト</Label>
                <Textarea
                  id="custom-prompt"
                  placeholder="行政事業レビューデータを分析するためのカスタムプロンプトを作成してください..."
                  value={generatedPrompt}
                  onChange={(e) => setGeneratedPrompt(e.target.value)}
                  className="min-h-[300px]"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {generatedPrompt.length} 文字
                </span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyPrompt}
                    disabled={!generatedPrompt}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    コピー
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGeneratedPrompt("")}
                  >
                    クリア
                  </Button>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-md">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 text-accent mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">プロンプト作成のヒント</p>
                    <ul className="text-muted-foreground space-y-1 text-xs">
                      <li>
                        •
                        データ構造（事業名、省庁名、予算額、執行率、年度、効果測定指標）を明記
                      </li>
                      <li>• 具体的な分析要求と期待する出力形式を指定</li>
                      <li>• SQLクエリ例の提供を求める</li>
                      <li>• 政策的含意や改善提案の生成を依頼</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
