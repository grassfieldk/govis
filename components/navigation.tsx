"use client";

import { BarChart3, Database, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

/**
 * サイト全体で使用する統一ナビゲーションヘッダー
 * GOVIS ブランディングと右側ナビゲーション（ダッシュボード、分析パネル、テーマ切り替え）を含む
 */
export default function UnifiedNavigation() {
  const pathname = usePathname();

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 左側: ブランディング */}
          <Link
            href="/"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div>
              <h1 className="text-2xl font-bold text-foreground">GOVIS</h1>
              <p className="text-xs text-muted-foreground hidden sm:block leading-tight">
                Government Visualization
              </p>
            </div>
          </Link>

          {/* 右側: ナビゲーション */}
          <nav className="flex items-center space-x-1">
            {/* ダッシュボード */}
            <Link href="/">
              <Button
                variant={pathname === "/" ? "default" : "ghost"}
                size="sm"
                className="hidden sm:flex"
              >
                <Home className="w-4 h-4 mr-2" />
                ダッシュボード
              </Button>
              <Button
                variant={pathname === "/" ? "default" : "ghost"}
                size="sm"
                className="sm:hidden p-2"
              >
                <Home className="w-4 h-4" />
              </Button>
            </Link>

            {/* データ分析 */}
            <Link href="/analysis">
              <Button
                variant={pathname === "/analysis" ? "default" : "ghost"}
                size="sm"
                className="hidden sm:flex"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                データ分析
              </Button>
              <Button
                variant={pathname === "/analysis" ? "default" : "ghost"}
                size="sm"
                className="sm:hidden p-2"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            </Link>

            {/* テーマ切り替え */}
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
