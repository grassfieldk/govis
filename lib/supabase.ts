import { createClient } from "@supabase/supabase-js";

// Supabase設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase環境変数が設定されていません");
}

// Supabaseクライアントを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * データベーススキーマ情報を取得する
 * オリジナルと同様の方式でinformation_schemaから取得
 */
export async function getTableSchema(tableName: string = "govis_main_data") {
  try {
    console.log(`=== スキーマ取得開始: ${tableName} ===`);

    // Supabaseでは直接SQLクエリを実行するためのRPC関数が必要
    // まずは簡易版として、テーブルの存在確認とサンプルデータから推測
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .limit(1);

    console.log("サンプルデータクエリ結果:", { data, error });

    if (error) {
      console.error("スキーマ取得エラー:", error);

      // テーブルが存在しない場合のエラーハンドリング
      if (error.code === "PGRST106" || error.message.includes("relation") || error.message.includes("does not exist")) {
      return {
        error: `テーブル "${tableName}" が存在しません。Supabaseにデータをインポートしてください。`,
        exists: false,
        columns: [],
        sampleCount: 0
      };
      }

      return {
        error: `スキーマ取得に失敗しました: ${error.message}`,
        exists: false,
        columns: [],
        sampleCount: 0
      };
    }

    // テーブルが存在し、データがある場合
    if (data && data.length > 0) {
      console.log("サンプルデータあり:", data[0]);

      const columns = Object.keys(data[0]).map(key => ({
        column_name: key,
        data_type: typeof data[0][key] === 'number' ? 'numeric' : 'text'
      }));

      console.log("カラム情報:", columns);

      // 実際の行数を取得
      console.log("行数カウント開始...");
      const { count, error: countError } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true });

      console.log("行数カウント結果:", { count, error: countError });

      if (countError) {
        console.error("行数取得エラー:", countError);
      }

      return {
        columns,
        exists: true,
        sampleCount: count || 0
      };
    }

    // テーブルは存在するがデータが空の場合
    console.log("データが空、またはアクセス権限なし");
    return {
      columns: [],
      exists: true,
      sampleCount: 0,
      error: "テーブルは存在しますが、データが空です。またはRLSポリシーによりアクセスが制限されています。"
    };

  } catch (error) {
    console.error("スキーマ取得中の予期せぬエラー:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      exists: false,
      columns: [],
      sampleCount: 0
    };
  }
}

/**
 * SQLクエリを実行する（SELECT文のみ）
 * 注意: 現在は基本的なSELECT文のみサポート
 */
export async function executeSQLQuery(sqlQuery: string) {
  try {
    // セキュリティチェック: SELECT文のみ許可
    if (!sqlQuery.trim().toUpperCase().startsWith("SELECT")) {
      throw new Error("実行できるのはSELECT文のみです。");
    }

    // 簡単なSELECT文の場合のみ実行（フルSQL実行は今後実装）
    if (sqlQuery.includes("main_data")) {
      const { data, error } = await supabase
        .from("main_data")
        .select("*")
        .limit(10);

      if (error) {
        console.error("SQL実行エラー:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    }

    // 他のクエリは未実装
    return {
      success: false,
      error: "現在は main_data テーブルの基本SELECT文のみサポートしています"
    };
  } catch (error) {
    console.error("SQL実行中の予期せぬエラー:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * データベース接続をテストする
 */
export async function testConnection() {
  try {
    const { error } = await supabase
      .from("main_data")
      .select("*", { count: "exact", head: true })
      .limit(1);

    if (error) {
      console.error("接続テストエラー:", error);
      return { success: false, error: error.message };
    }

    return { success: true, message: "データベース接続成功" };
  } catch (error) {
    console.error("接続テスト中の予期せぬエラー:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
