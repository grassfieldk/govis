"use client";

import {
  CheckCircle,
  Clock,
  Copy,
  Database,
  Download,
  FileText,
  History,
  Loader2,
  Play,
  XCircle,
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface SQLResult {
  id: string;
  query: string;
  timestamp: Date;
  status: "success" | "error" | "pending";
  results?: any[];
  error?: string;
  executionTime?: number;
  rowCount?: number;
}

export function SQLExecutionPanel() {
  const [sqlQuery, setSqlQuery] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryHistory, setQueryHistory] = useState<SQLResult[]>([]);
  const [currentResult, setCurrentResult] = useState<SQLResult | null>(null);

  const sqlTemplates = [
    {
      name: "基本的な事業一覧",
      query: `SELECT
  事業名,
  省庁名,
  予算額,
  執行率
FROM administrative_reviews
WHERE 年度 = '令和4年度'
ORDER BY 予算額 DESC
LIMIT 20;`,
    },
    {
      name: "省庁別予算集計",
      query: `SELECT
  省庁名,
  COUNT(*) as 事業数,
  SUM(予算額) as 総予算額,
  AVG(執行率) as 平均執行率
FROM administrative_reviews
GROUP BY 省庁名
ORDER BY 総予算額 DESC;`,
    },
    {
      name: "効果測定指標分析",
      query: `SELECT
  効果測定指標,
  COUNT(*) as 事業数,
  AVG(予算額) as 平均予算額
FROM administrative_reviews
WHERE 効果測定指標 IS NOT NULL
GROUP BY 効果測定指標
ORDER BY 事業数 DESC;`,
    },
    {
      name: "年度別予算推移",
      query: `SELECT
  年度,
  COUNT(*) as 事業数,
  SUM(予算額) as 総予算額,
  AVG(執行率) as 平均執行率
FROM administrative_reviews
GROUP BY 年度
ORDER BY 年度;`,
    },
  ];

  const executeSQL = async () => {
    if (!sqlQuery.trim()) return;

    setIsExecuting(true);
    const newResult: SQLResult = {
      id: Date.now().toString(),
      query: sqlQuery.trim(),
      timestamp: new Date(),
      status: "pending",
    };

    setCurrentResult(newResult);
    setQueryHistory((prev) => [newResult, ...prev]);

    try {
      const response = await fetch("/api/duckdb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: sqlQuery.trim(),
          type: "query",
        }),
      });

      const data = await response.json();

      if (data.success) {
        const results = data.result.rows.map((row: any[]) => {
          const obj: any = {};
          data.result.columns.forEach((col: string, index: number) => {
            obj[col] = row[index];
          });
          return obj;
        });

        const updatedResult: SQLResult = {
          ...newResult,
          status: "success",
          results,
          executionTime: data.result.executionTime,
          rowCount: data.result.rowCount,
        };

        setCurrentResult(updatedResult);
        setQueryHistory((prev) =>
          prev.map((q) => (q.id === newResult.id ? updatedResult : q)),
        );
      } else {
        const updatedResult: SQLResult = {
          ...newResult,
          status: "error",
          error: data.error || "クエリの実行中にエラーが発生しました",
        };

        setCurrentResult(updatedResult);
        setQueryHistory((prev) =>
          prev.map((q) => (q.id === newResult.id ? updatedResult : q)),
        );
      }
    } catch (error) {
      const updatedResult: SQLResult = {
        ...newResult,
        status: "error",
        error: "ネットワークエラーが発生しました",
      };

      setCurrentResult(updatedResult);
      setQueryHistory((prev) =>
        prev.map((q) => (q.id === newResult.id ? updatedResult : q)),
      );
    } finally {
      setIsExecuting(false);
    }
  };

  const loadTemplate = (template: string) => {
    setSqlQuery(template);
  };

  const copyQuery = (query: string) => {
    navigator.clipboard.writeText(query);
  };

  const exportResults = () => {
    if (!currentResult?.results) return;

    const csv = [
      Object.keys(currentResult.results[0]).join(","),
      ...currentResult.results.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query_results_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="editor">SQLエディター</TabsTrigger>
          <TabsTrigger value="templates">クエリテンプレート</TabsTrigger>
          <TabsTrigger value="history">実行履歴</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-primary" />
                <span>SQL クエリエディター</span>
              </CardTitle>
              <CardDescription>
                DuckDBに対してSQLクエリを直接実行します。行政事業レビューデータを分析できます。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="SELECT * FROM administrative_reviews LIMIT 10;"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="min-h-[200px] font-mono text-sm resize-none"
                  disabled={isExecuting}
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {sqlQuery.length} 文字
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyQuery(sqlQuery)}
                      disabled={!sqlQuery.trim()}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      コピー
                    </Button>
                    <Button
                      onClick={executeSQL}
                      disabled={!sqlQuery.trim() || isExecuting}
                      className="flex items-center space-x-2"
                    >
                      {isExecuting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      <span>{isExecuting ? "実行中..." : "クエリ実行"}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>クエリテンプレート</span>
              </CardTitle>
              <CardDescription>
                よく使用されるクエリのテンプレートです。クリックしてエディターに読み込めます。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sqlTemplates.map((template, index) => (
                  <Card
                    key={index}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-2 rounded text-muted-foreground overflow-hidden">
                        {template.query.slice(0, 100)}...
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full bg-transparent"
                        onClick={() => loadTemplate(template.query)}
                      >
                        エディターに読み込み
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="w-5 h-5 text-primary" />
                <span>実行履歴</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {queryHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  まだクエリを実行していません
                </p>
              ) : (
                <div className="space-y-3">
                  {queryHistory.slice(0, 10).map((historyItem, index) => (
                    <div key={historyItem.id}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {historyItem.status === "success" ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : historyItem.status === "error" ? (
                              <XCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-yellow-500" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {historyItem.timestamp.toLocaleString("ja-JP")}
                            </span>
                            {historyItem.executionTime && (
                              <Badge variant="outline" className="text-xs">
                                {historyItem.executionTime.toFixed(0)}ms
                              </Badge>
                            )}
                          </div>
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            {historyItem.query.slice(0, 200)}
                            {historyItem.query.length > 200 && "..."}
                          </pre>
                          {historyItem.rowCount && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {historyItem.rowCount} 行を取得
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadTemplate(historyItem.query)}
                          className="ml-2"
                        >
                          再実行
                        </Button>
                      </div>
                      {index < queryHistory.slice(0, 10).length - 1 && (
                        <Separator className="mt-3" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results Display */}
      {currentResult && currentResult.status !== "pending" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <span>実行結果</span>
                <Badge
                  variant={
                    currentResult.status === "success"
                      ? "default"
                      : "destructive"
                  }
                >
                  {currentResult.status === "success" ? "成功" : "エラー"}
                </Badge>
              </CardTitle>
              {currentResult.results && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportResults}
                  className="flex items-center space-x-1 bg-transparent"
                >
                  <Download className="w-3 h-3" />
                  <span>CSV出力</span>
                </Button>
              )}
            </div>
            {currentResult.executionTime && (
              <CardDescription>
                実行時間: {currentResult.executionTime.toFixed(0)}ms | 取得行数:{" "}
                {currentResult.rowCount}行
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {currentResult.results ? (
              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        {Object.keys(currentResult.results[0] || {}).map(
                          (key) => (
                            <th
                              key={key}
                              className="px-3 py-2 text-left font-medium"
                            >
                              {key}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {currentResult.results.map((row, index) => (
                        <tr key={index} className="border-t hover:bg-muted/50">
                          {Object.values(row).map((value, cellIndex) => (
                            <td key={cellIndex} className="px-3 py-2">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              currentResult.error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                  <p className="text-sm text-destructive font-medium">
                    エラーが発生しました
                  </p>
                  <pre className="text-xs text-destructive mt-2 overflow-x-auto">
                    {currentResult.error}
                  </pre>
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
