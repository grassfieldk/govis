"use client";

import Editor from "@monaco-editor/react";
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
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
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
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

export const UnifiedQueryEditor = () => {
  const historySize = 10;
  // 初期値は空で、useEffectでLocalStorageから読み込み
  const [sqlQuery, setSqlQuery] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryHistory, setQueryHistory] = useState<SQLResult[]>([]);
  const [currentResult, setCurrentResult] = useState<SQLResult | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showAllRows, setShowAllRows] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(historySize);
  const [expandedHistoryItems, setExpandedHistoryItems] = useState<Set<string>>(
    new Set(),
  );
  const { theme } = useTheme();

  // クライアントサイドでのみLocalStorageから読み込み
  useEffect(() => {
    setIsClient(true);

    // SQLクエリを復元
    const savedQuery = localStorage.getItem("sql-query");
    if (savedQuery) {
      setSqlQuery(savedQuery);
    }

    // クエリ履歴を復元
    const savedHistory = localStorage.getItem("sql-query-history");
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      const restored = parsed.map(
        (item: SQLResult & { timestamp: string }) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }),
      );
      setQueryHistory(restored);
    }

    // 現在の結果を復元
    const savedResult = localStorage.getItem("sql-current-result");
    if (savedResult) {
      const parsed = JSON.parse(savedResult);
      setCurrentResult({
        ...parsed,
        timestamp: new Date(parsed.timestamp),
      });
    }
  }, []);

  // SQLクエリの変更をLocalStorageに保存
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("sql-query", sqlQuery);
    }
  }, [sqlQuery, isClient]);

  // クエリ履歴の変更をLocalStorageに保存
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("sql-query-history", JSON.stringify(queryHistory));
    }
  }, [queryHistory, isClient]);

  // 現在の結果の変更をLocalStorageに保存
  useEffect(() => {
    if (isClient) {
      if (currentResult) {
        localStorage.setItem(
          "sql-current-result",
          JSON.stringify(currentResult),
        );
      } else {
        localStorage.removeItem("sql-current-result");
      }
    }
  }, [currentResult, isClient]);

  const sqlTemplates = [
    {
      name: "全データの概要",
      query: `SELECT
  COUNT(*) as 総件数,
  COUNT(DISTINCT "政策所管府省庁") as 府省庁数,
  COUNT(DISTINCT "事業名") as 事業数
FROM govis_main_data;`,
    },
    {
      name: "府省庁別事業数",
      query: `SELECT
  "政策所管府省庁" as 府省庁名,
  COUNT(*) as 事業数
FROM govis_main_data
WHERE "政策所管府省庁" IS NOT NULL AND "政策所管府省庁" != ''
GROUP BY "政策所管府省庁"
ORDER BY 事業数 DESC
LIMIT 10;`,
    },
    {
      name: "支出額が設定されている事業の分析",
      query: `SELECT
  "政策所管府省庁" as 府省庁名,
  COUNT(*) as 件数,
  SUM(CASE WHEN "金額" = '' OR "金額" IS NULL THEN 0 ELSE CAST("金額" AS numeric) END) as 総支出額
FROM govis_main_data
WHERE "金額" IS NOT NULL AND "金額" != ''
GROUP BY "政策所管府省庁"
ORDER BY 総支出額 DESC
LIMIT 10;`,
    },
    {
      name: "データサンプル表示",
      query: `SELECT
  "事業名",
  "政策所管府省庁",
  "金額",
  "支出先ブロック名"
FROM govis_main_data
WHERE "事業名" IS NOT NULL AND "事業名" != ''
LIMIT 5;`,
    },
  ];

  const executeSQL = async () => {
    if (!sqlQuery.trim()) return;

    setIsExecuting(true);
    // 新しいクエリ実行時に表示設定をリセット
    setShowAllRows(false);
    setDisplayLimit(10);

    const newResult: SQLResult = {
      id: Date.now().toString(),
      query: sqlQuery.trim(),
      timestamp: new Date(),
      status: "pending",
    };

    setCurrentResult(newResult);
    setQueryHistory((prev) => [newResult, ...prev].slice(0, 10));

    try {
      const response = await fetch("/api/supabase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "execute",
          query: sqlQuery.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "SQLの実行に失敗しました");
      }

      const updatedResult: SQLResult = {
        ...newResult,
        status: "success",
        results: data.result || [],
        executionTime: data.executionTime || 0,
        rowCount: data.rowCount || 0,
      };

      setCurrentResult(updatedResult);
      setQueryHistory((prev) =>
        prev
          .map((q) => (q.id === newResult.id ? updatedResult : q))
          .slice(0, 10),
      );
    } catch (err) {
      console.error("SQL実行エラー:", err);
      const updatedResult: SQLResult = {
        ...newResult,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      };

      setCurrentResult(updatedResult);
      setQueryHistory((prev) =>
        prev
          .map((q) => (q.id === newResult.id ? updatedResult : q))
          .slice(0, 10),
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

  const formatDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${year}${month}${day}_${hours}${minutes}_${seconds}`;
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
    a.download = `query_results_${formatDateTime()}.csv`;
    a.click();
  };

  const exportSQLQuery = (query: string) => {
    const datetime = formatDateTime();
    const blob = new Blob([query], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query_${datetime}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportHistoryResults = (historyItem: SQLResult) => {
    if (!historyItem.results || historyItem.results.length === 0) {
      return;
    }

    const datetime = formatDateTime();
    const headers = Object.keys(historyItem.results[0]);
    const csvContent = [
      headers.join(","),
      ...historyItem.results.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // 値にカンマやダブルクォートが含まれている場合はエスケープ
            if (
              typeof value === "string" &&
              (value.includes(",") ||
                value.includes('"') ||
                value.includes("\n"))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `results_${datetime}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleHistoryExpansion = (itemId: string) => {
    setExpandedHistoryItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-primary" />
              <span>SQLクエリエディタ</span>
            </CardTitle>
            <CardDescription>
              SQLクエリを直接実行します。行政事業レビューデータを分析できます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="border rounded-md overflow-hidden">
                <Editor
                  height="250px"
                  defaultLanguage="sql"
                  value={sqlQuery}
                  onChange={(value) => setSqlQuery(value || "")}
                  theme={theme === "dark" ? "vs-dark" : "vs-light"}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    fontFamily:
                      'Monaco, "Cascadia Code", "Roboto Mono", monospace',
                    lineNumbers: "on",
                    wordWrap: "on",
                    automaticLayout: true,
                    readOnly: isExecuting,
                    tabSize: 2,
                    insertSpaces: true,
                    formatOnPaste: true,
                    formatOnType: true,
                    padding: { top: 12, bottom: 12 },
                  }}
                />
              </div>
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
                    className="flex items-center space-x-1"
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>クエリテンプレート</span>
            </CardTitle>
            <CardDescription>
              よく使用されるクエリのテンプレートです。エディタに反映できます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {sqlTemplates.map((template, index) => (
                <div
                  key={template.name}
                  className="p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{template.name}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        loadTemplate(template.query);
                      }}
                    >
                      エディタへ反映
                    </Button>
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded text-muted-foreground overflow-hidden">
                    {template.query.slice(0, 80)}...
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
                {currentResult.executionTime && (
                  <p className="text-muted-foreground text-sm">
                    {currentResult.executionTime.toFixed(0)}ms |{" "}
                    {currentResult.rowCount}行
                  </p>
                )}
              </CardTitle>
              {currentResult.results && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportSQLQuery(currentResult.query)}
                    className="flex items-center space-x-1"
                  >
                    <FileText className="w-3 h-3" />
                    <span>SQL出力</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportResults}
                    className="flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>CSV出力</span>
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {currentResult.results ? (
              <div className="space-y-2">
                {currentResult.results.length > 10 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        表示件数:
                      </span>
                      <select
                        value={showAllRows ? "all" : displayLimit}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "all") {
                            setShowAllRows(true);
                          } else {
                            setShowAllRows(false);
                            setDisplayLimit(Number(value));
                          }
                        }}
                        className="text-xs border border-border bg-background text-foreground rounded px-2 py-1"
                      >
                        <option value={10}>10件</option>
                        <option value={50}>50件</option>
                        <option value={100}>100件</option>
                        <option value="all">
                          全件（{currentResult.rowCount}件）
                        </option>
                      </select>
                    </div>
                  </div>
                )}
                <div className="border border-border rounded-md overflow-hidden">
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          {Object.keys(currentResult.results[0] || {}).map(
                            (key) => (
                              <th
                                key={key}
                                className="px-3 py-2 text-left font-medium text-muted-foreground"
                              >
                                {key}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {(showAllRows
                          ? currentResult.results
                          : currentResult.results.slice(0, displayLimit)
                        ).map((row, rowIndex) => (
                          <tr
                            key={`row-${rowIndex}`}
                            className="border-t border-border hover:bg-muted/50"
                          >
                            {Object.values(row).map((value, cellIndex) => (
                              <td
                                key={`cell-${rowIndex}-${cellIndex}`}
                                className="px-3 py-2"
                              >
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="p-2 text-xs text-muted-foreground bg-muted">
                      {showAllRows
                        ? `全${currentResult.rowCount}件を表示中`
                        : `${Math.min(displayLimit, currentResult.results.length)}件を表示中（全${currentResult.rowCount}件）`}
                    </div>
                  </div>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="w-5 h-5 text-primary" />
            <span>実行履歴（最大{historySize}件）</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queryHistory.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              まだクエリを実行していません
            </p>
          ) : (
            <div className="space-y-3">
              {queryHistory.map((historyItem) => {
                const isExpanded = expandedHistoryItems.has(historyItem.id);

                return (
                  <div key={historyItem.id} className="space-y-3">
                    <div className="flex items-start">
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
                      </div>
                    </div>

                    {historyItem.results && historyItem.results.length > 0 && (
                      <div className="border border-border rounded-md bg-muted/20">
                        <div className="p-3 border-b border-border bg-muted/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  toggleHistoryExpansion(historyItem.id)
                                }
                                className="flex items-center space-x-1 -ml-2"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                                <span>実行結果</span>
                              </Button>
                              <Badge variant="outline" className="text-xs">
                                {historyItem.rowCount} 行
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadTemplate(historyItem.query)}
                                className="flex items-center space-x-1 text-xs"
                              >
                                エディタへ反映
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  exportSQLQuery(historyItem.query)
                                }
                                className="flex items-center space-x-1 text-xs"
                              >
                                <FileText className="w-3 h-3" />
                                <span>SQL</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  exportHistoryResults(historyItem)
                                }
                                className="flex items-center space-x-1 text-xs"
                              >
                                <Download className="w-3 h-3" />
                                <span>CSV</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="p-3 max-h-60 overflow-auto">
                            <div className="border border-border rounded-md overflow-hidden">
                              <table className="w-full text-xs">
                                <thead className="bg-muted sticky top-0">
                                  <tr>
                                    {Object.keys(historyItem.results[0]).map(
                                      (header) => (
                                        <th
                                          key={header}
                                          className="text-left p-2 font-medium border-r border-border last:border-r-0"
                                        >
                                          {header}
                                        </th>
                                      ),
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {historyItem.results
                                    .slice(0, 5)
                                    .map((row, rowIndex) => (
                                      <tr
                                        key={`history-${historyItem.id}-row-${rowIndex}`}
                                        className="border-t border-border hover:bg-muted/50"
                                      >
                                        {Object.values(row).map(
                                          (cell, cellIndex) => (
                                            <td
                                              key={`history-${historyItem.id}-cell-${rowIndex}-${cellIndex}`}
                                              className="px-2 py-1 border-r border-border last:border-r-0"
                                            >
                                              {String(cell)}
                                            </td>
                                          ),
                                        )}
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                              {historyItem.results.length > 5 && (
                                <div className="p-2 text-xs text-muted-foreground text-center bg-muted/50">
                                  ... 他 {historyItem.results.length - 5}{" "}
                                  行（完全な結果を見るにはCSVをダウンロード）
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {queryHistory.indexOf(historyItem) <
                      queryHistory.length - 1 && <Separator className="my-3" />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
