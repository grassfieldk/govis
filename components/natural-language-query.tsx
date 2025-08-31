"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/app/app/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Send, Loader2, Copy, History, Lightbulb } from "lucide-react"

interface QueryResult {
  id: string
  query: string
  sql: string
  timestamp: Date
  status: "success" | "error" | "pending"
  results?: any[]
  error?: string
}

export function NaturalLanguageQuery() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([])
  const [currentResult, setCurrentResult] = useState<QueryResult | null>(null)

  const exampleQueries = [
    "令和4年度の予算額が最も大きい事業を教えて",
    "厚生労働省の事業で効果測定指標が設定されているものは？",
    "予算執行率が90%以下の事業を省庁別に集計して",
    "過去3年間で予算が増加している事業の傾向を分析して",
  ]

  const handleSubmit = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    const newQuery: QueryResult = {
      id: Date.now().toString(),
      query: query.trim(),
      sql: "",
      timestamp: new Date(),
      status: "pending",
    }

    setCurrentResult(newQuery)
    setQueryHistory((prev) => [newQuery, ...prev])

    // Simulate natural language processing
    setTimeout(() => {
      const mockSQL = `-- 自然言語から生成されたSQL
SELECT 
  事業名,
  省庁名,
  予算額,
  執行率
FROM administrative_reviews 
WHERE 年度 = '令和4年度'
ORDER BY 予算額 DESC
LIMIT 10;`

      const updatedQuery: QueryResult = {
        ...newQuery,
        sql: mockSQL,
        status: "success",
        results: [
          { 事業名: "社会保障制度改革", 省庁名: "厚生労働省", 予算額: "1,200億円", 執行率: "95%" },
          { 事業名: "インフラ整備事業", 省庁名: "国土交通省", 予算額: "800億円", 執行率: "88%" },
          { 事業名: "教育振興事業", 省庁名: "文部科学省", 予算額: "600億円", 執行率: "92%" },
        ],
      }

      setCurrentResult(updatedQuery)
      setQueryHistory((prev) => prev.map((q) => (q.id === newQuery.id ? updatedQuery : q)))
      setIsLoading(false)
      setQuery("")
    }, 2000)
  }

  const copySQL = (sql: string) => {
    navigator.clipboard.writeText(sql)
  }

  return (
    <div className="space-y-6">
      {/* Query Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <span>自然言語クエリ入力</span>
          </CardTitle>
          <CardDescription>
            日本語で質問を入力してください。システムが自動的にSQLクエリに変換して実行します。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="例：令和4年度の予算額が最も大きい事業を教えて"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isLoading}
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{query.length}/500文字</span>
              <Button
                onClick={handleSubmit}
                disabled={!query.trim() || isLoading}
                className="flex items-center space-x-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isLoading ? "分析中..." : "クエリ実行"}</span>
              </Button>
            </div>
          </div>

          {/* Example Queries */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">質問例</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {exampleQueries.map((example, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => setQuery(example)}
                >
                  {example}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Result */}
      {currentResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>クエリ結果</span>
              <Badge variant={currentResult.status === "success" ? "default" : "secondary"}>
                {currentResult.status === "success" ? "成功" : currentResult.status === "error" ? "エラー" : "処理中"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">入力された質問</h4>
              <p className="text-sm bg-muted p-3 rounded-md">{currentResult.query}</p>
            </div>

            {currentResult.sql && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">生成されたSQL</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copySQL(currentResult.sql)}
                    className="flex items-center space-x-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>コピー</span>
                  </Button>
                </div>
                <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
                  <code>{currentResult.sql}</code>
                </pre>
              </div>
            )}

            {currentResult.results && (
              <div>
                <h4 className="font-medium mb-2">実行結果</h4>
                <div className="border rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {Object.keys(currentResult.results[0] || {}).map((key) => (
                            <th key={key} className="px-3 py-2 text-left font-medium">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {currentResult.results.map((row, index) => (
                          <tr key={index} className="border-t">
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
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Query History */}
      {queryHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <History className="w-5 h-5 text-primary" />
              <span>クエリ履歴</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {queryHistory.slice(0, 5).map((historyItem, index) => (
                <div key={historyItem.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{historyItem.query}</p>
                      <p className="text-xs text-muted-foreground">{historyItem.timestamp.toLocaleString("ja-JP")}</p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {historyItem.status === "success" ? "成功" : historyItem.status === "error" ? "エラー" : "処理中"}
                    </Badge>
                  </div>
                  {index < queryHistory.slice(0, 5).length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
