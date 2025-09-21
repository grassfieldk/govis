"use client";

import { useEffect } from "react";
import { ReloadButton } from "@/components/reload-button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Server Componentでエラーが発生した際に表示されるエラーページ
 */
export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // エラーログをコンソールに出力
    console.error("ダッシュボードページでエラーが発生:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">
            データの読み込みに失敗しました
          </h2>
          <p>
            ダッシュボードデータの取得中にエラーが発生しました。
            <br />
            しばらく時間をおいてから再度お試しください。
          </p>
          {process.env.NODE_ENV === "development" && (
            <details className="mt-4 p-4 bg-muted rounded-lg text-left">
              <summary className="cursor-pointer font-medium">
                エラー詳細（開発環境）
              </summary>
              <pre className="mt-2 text-sm text-muted-foreground overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
          <div className="space-x-4">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              再試行
            </button>
            <ReloadButton />
          </div>
        </div>
      </div>
    </div>
  );
}
