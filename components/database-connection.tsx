"use client";

import {
  AlertCircle,
  CheckCircle,
  Database,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { ConnectionStatus } from "@/types/database";

interface DatabaseConnectionProps {
  onStatusChange?: (status: ConnectionStatus) => void;
}

export function DatabaseConnection({ onStatusChange }: DatabaseConnectionProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: "connecting",
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const updateStatus = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    onStatusChange?.(status);
  }, [onStatusChange]);

  const checkConnection = useCallback(async () => {
    setIsRefreshing(true);
    updateStatus({ status: "connecting" });

    try {
      // 1. 接続テスト
      const connectionResponse = await fetch("/api/supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      const connectionData = await connectionResponse.json();

      if (!connectionData.success) {
        updateStatus({
          status: "disconnected",
          error: connectionData.error,
        });
        return;
      }

      // 2. スキーマ情報取得
      const schemaResponse = await fetch("/api/supabase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "schema", query: "govis_main_data" }),
      });
      const schemaData = await schemaResponse.json();

      updateStatus({
        status: "connected",
        database: "Supabase PostgreSQL",
        tables: ["govis_main_data"],
        version: "PostgreSQL 14+",
        schemaInfo: {
          exists: schemaData.exists || false,
          columnCount: schemaData.columns?.length || 0,
          sampleCount: schemaData.sampleCount || 0,
          error: schemaData.error
        }
      });

    } catch (error) {
      updateStatus({
        status: "disconnected",
        error: `ネットワークエラーが発生しました: ${error}`,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [updateStatus]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "disconnected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "connecting":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus.status) {
      case "connected":
        return <Badge className="bg-green-500">接続済</Badge>;
      case "disconnected":
        return <Badge variant="destructive">未接続</Badge>;
      case "connecting":
        return <Badge variant="secondary">接続中...</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-primary" />
            <span>データベース接続状態</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={checkConnection}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`}
            />
            更新
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="font-medium">接続状態</span>
          </div>
          {getStatusBadge()}
        </div>

        {connectionStatus.status === "connected" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">データベース:</span>
              <span className="font-mono">{connectionStatus.database}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">バージョン:</span>
              <span className="font-mono">{connectionStatus.version}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">利用可能テーブル:</span>
              <span className="font-mono">                {connectionStatus.tables?.map((table) => (
                  <Badge key={table} variant="outline" className="text-xs">
                    {table}
                  </Badge>
                ))}</span>
            </div>

            {/* スキーマ情報表示 */}
            {connectionStatus.schemaInfo && (
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-medium mb-2">スキーマ情報</h4>
                <div className="space-y-1 text-xs">
                  {connectionStatus.schemaInfo.exists && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">カラム数:</span>
                        <span className="font-mono">{connectionStatus.schemaInfo.columnCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">データ件数:</span>
                        <span className="font-mono">{connectionStatus.schemaInfo.sampleCount.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  {connectionStatus.schemaInfo.error && (
                    <div className="text-destructive text-xs mt-1">
                      エラー: {connectionStatus.schemaInfo.error}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {connectionStatus.status === "disconnected" &&
          connectionStatus.error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <p className="text-sm text-destructive">
                {connectionStatus.error}
              </p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
