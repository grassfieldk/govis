export interface ConnectionStatus {
  status: "connected" | "disconnected" | "connecting";
  database?: string;
  tables?: string[];
  version?: string;
  error?: string;
  schemaInfo?: {
    exists: boolean;
    columnCount: number;
    sampleCount: number;
    error?: string;
  };
}
