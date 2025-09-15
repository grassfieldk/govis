"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface QueryResult {
  data: Record<string, unknown>[];
  rowCount: number;
  executionTime: number;
  generatedSQL: string;
}

export function NaturalLanguageQuery() {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // サンプル質問（元のアプリから）
  const sampleQuestions = [
    "デジタル庁の支出額の合計はいくらですか？",
    "こども家庭庁が最も多く支出している事業名トップ3を教えてください。",
    "防衛省への支出で、契約相手が多い法人名を5つリストアップしてください。",
    "支出額が10億円を超えている契約の府省庁別件数を教えて。",
    "全データの最初の5件を表示してください。"
  ];

  const handleSubmit = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. AIでSQLを生成（サーバーサイド）
      console.log("自然言語質問:", question);

      const aiResponse = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });

      const aiData = await aiResponse.json();

      if (!aiResponse.ok || !aiData.success) {
        throw new Error(aiData.error || "SQL生成に失敗しました");
      }

      console.log("生成されたSQL:", aiData.sql);

      // 2. SQLを実行
      const response = await fetch("/api/supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          query: aiData.sql
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "クエリの実行に失敗しました");
      }

      setResult({
        data: data.result || [],
        rowCount: data.rowCount || 0,
        executionTime: data.executionTime || 0,
        generatedSQL: aiData.sql
      });

    } catch (err) {
      console.error("クエリ実行エラー:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>自然言語でデータを分析</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* サンプル質問 */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">質問例（クリックして使用）:</h4>
            <div className="flex flex-wrap gap-2">
              {sampleQuestions.map((q, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="h-auto whitespace-normal text-left justify-start"
                  onClick={() => setQuestion(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>

          {/* 質問入力 */}
          <div className="space-y-2">
            <Textarea
              placeholder="分析したいことを日本語で入力してください（例：デジタル庁の支出額の合計は？）"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
            />
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !question.trim()}
              className="w-full"
            >
              {isLoading ? "AI が分析中..." : "分析実行"}
            </Button>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">エラー: {error}</p>
            </div>
          )}

          {/* 結果表示 */}
          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">件数: {result.rowCount}</Badge>
                <Badge variant="outline">実行時間: {result.executionTime}ms</Badge>
              </div>

              {/* 生成されたSQL */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">生成されたSQL:</h4>
                <pre className="p-3 bg-gray-50 rounded-md text-xs overflow-x-auto">
                  {result.generatedSQL}
                </pre>
              </div>

              {/* 結果テーブル */}
              {result.data.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">実行結果:</h4>
                  <div className="border rounded-md overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(result.data[0]).map((key) => (
                            <th key={key} className="p-2 text-left font-medium">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.data.slice(0, 10).map((row, index) => (
                          <tr key={index} className="border-t">
                            {Object.values(row).map((value, cellIndex) => (
                              <td key={cellIndex} className="p-2">
                                {typeof value === 'string' && value.length > 50
                                  ? `${value.substring(0, 50)}...`
                                  : String(value || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {result.data.length > 10 && (
                      <div className="p-2 text-xs text-gray-500 bg-gray-50">
                        最初の10件を表示（全{result.rowCount}件）
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
