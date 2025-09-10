"use client";

import {
  AlertCircle,
  CheckCircle,
  Database,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConnectionStatus {
  status: "connected" | "disconnected" | "connecting";
  database?: string;
  tables?: string[];
  version?: string;
  error?: string;
}

export function DatabaseConnection() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: "connecting",
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkConnection = async () => {
    setIsRefreshing(true);
    setConnectionStatus({ status: "connecting" });

    try {
      const response = await fetch("/api/duckdb");
      const data = await response.json();

      if (data.success) {
        setConnectionStatus({
          status: "connected",
          database: data.database,
          tables: data.tables,
          version: data.version,
        });
      } else {
        setConnectionStatus({
          status: "disconnected",
          error: data.error,
        });
      }
    } catch (error) {
      setConnectionStatus({
        status: "disconnected",
        error: "ネットワークエラーが発生しました",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

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
        return <Badge className="bg-green-500">接続済み</Badge>;
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
            <span>DuckDB接続状態</span>
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
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">
                利用可能テーブル:
              </span>
              <div className="flex flex-wrap gap-1">
                {connectionStatus.tables?.map((table) => (
                  <Badge key={table} variant="outline" className="text-xs">
                    {table}
                  </Badge>
                ))}
              </div>
            </div>
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
