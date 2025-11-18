"use client";

import { BarChart3, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * サイト全体で使用する統一ナビゲーションヘッダー
 * GOVIS ブランディングと右側ナビゲーション（ダッシュボード、分析パネル、テーマ切り替え）を含む
 */
const Header = () => {
  const pathname = usePathname();
  return (
    <header className="bg-white sticky top-4 z-50 shadow-md container rounded-2xl mx-auto px-8 py-3">
      <div className="flex items-center justify-between">
        {/* 左側: タイトル */}
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
          <Link href="/dashboard">
            <Button
              variant={pathname === "/dashboard" ? "default" : "ghost"}
              size="sm"
              className="hidden sm:flex"
            >
              <Home className="w-4 h-4 mr-2" />
              ダッシュボード
            </Button>
            <Button
              variant={pathname === "/dashboard" ? "default" : "ghost"}
              size="sm"
              className="sm:hidden p-2"
            >
              <Home className="w-4 h-4" />
            </Button>
          </Link>
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
        </nav>
      </div>
    </header>
  );
};

export default Header;
