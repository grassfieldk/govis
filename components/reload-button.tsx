"use client";

import { Button } from "@/components/ui/button";

/**
 * ページ再読み込み用のクライアントコンポーネント
 * エラー時の再試行機能を提供
 */
export const ReloadButton = () => (
  <Button onClick={() => window.location.reload()}>再読み込み</Button>
);
