/**
 * データインポートスクリプト
 *
 * Usage: npx tsx import-csv-to-supabase.ts <csvDir> <dbUrl>
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { Client } from "pg";
import { tablePrefix } from "./table-prefix";

/**
 * 指定ディレクトリ内の CSV ファイル一覧を取得
 * @param dirPath
 * @returns string[]
 */
function getCsvFiles(dirPath: string): string[] {
  return fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(".csv"))
    .map((f) => path.join(dirPath, f));
}

/**
 * CSV のヘッダ行からカラム名リストを取得
 * @param csvPath
 * @returns string[]
 */
function getColumns(csvPath: string): string[] {
  const firstLine = fs.readFileSync(csvPath, "utf8").split("\n")[0];
  return firstLine.split(",").map((col) => col.trim());
}

/**
 * CREATE TABLE 文を生成
 * @param tableName
 * @param columns
 * @returns string
 */
function generateCreateTableSql(tableName: string, columns: string[]): string {
  const colDefs = columns.map((col) => `  "${col}" TEXT`).join(",\n");
  return `CREATE TABLE IF NOT EXISTS "${tableName}" (
  id SERIAL PRIMARY KEY,
${colDefs}
);`;
}

async function main() {
  const [csvDir] = process.argv.slice(2);
  if (!csvDir) {
    console.error("Usage: npx tsx import-csv-to-supabase.ts <csvDir>");
    process.exit(1);
  }

  const { execSync } = await import("node:child_process");

  let psqlAvailable = true;
  try {
    execSync("psql --version", { stdio: "ignore" });
  } catch {
    psqlAvailable = false;
  }
  if (!psqlAvailable) {
    console.warn(
      `[WARNING] psql command is not available.\n` +
        `- Import will be slower for large CSV files.\n` +
        `- You will also need to manually execute SQL files for function and policy setup after import.`,
    );
  }

  // Supabase 接続情報の取得
  const statusOut = execSync("npx supabase status", { encoding: "utf8" });
  const dbUrlMatch = statusOut.match(/Database URL:\s*(postgresql:[^\s]+)/);
  if (!dbUrlMatch) {
    console.error("Database URL not found in supabase status output");
    process.exit(1);
  }
  const dbUrl = dbUrlMatch[1];

  // Supabase クライアントの作成
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  // 既存テーブルの削除
  const getTablesSql = `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '${tablePrefix}_%';`;
  const tablesToDrop = (await client.query(getTablesSql)).rows.map(
    (row) => row.tablename,
  );
  if (tablesToDrop.length > 0) {
    console.log(
      `The following tables will be dropped: ${tablesToDrop.join(", ")}`,
    );
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const answer: string = await new Promise((resolve) => {
      rl.question(
        "Are you sure you want to drop these tables? (y/N): ",
        resolve,
      );
    });
    rl.close();
    if (answer.toLowerCase() !== "y") {
      console.log("Table drop cancelled. Import aborted.");
      await client.end();
      process.exit(0);
    }
    for (const table of tablesToDrop) {
      await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
    }
  } else {
    console.log(`No tables to drop with prefix '${tablePrefix}_'.`);
  }

  // CSV ファイルのインポート
  const csvFiles = getCsvFiles(csvDir);
  for (const csvPath of csvFiles) {
    const tableName = path.basename(csvPath, ".csv");
    const columns = getColumns(csvPath);
    const createSql = generateCreateTableSql(tableName, columns);

    console.log(`\nCreating table: ${tableName}`);
    await client.query(createSql);
    const colList = columns.map((col) => `"${col}"`).join(", ");
    const absCsvPath = path.resolve(csvPath);
    const copySql = `\\copy "${tableName}" (${colList}) FROM '${absCsvPath}' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');`;

    console.log(`Importing data from: ${csvPath}`);
    if (psqlAvailable) {
      execSync(`psql "${dbUrl}" -c "${copySql}"`, { stdio: "inherit" });
    } else {
      const csvContent = fs.readFileSync(csvPath, "utf8");
      const lines = csvContent
        .split("\n")
        .filter((line) => line.trim().length > 0);
      const header = lines[0].split(",").map((col) => col.trim());
      const colList = header.map((col) => `"${col}"`).join(", ");
      const bulkSize = 1000;

      let buffer: string[] = [];
      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i]
          .split(",")
          .map((val) => val.trim().replace(/'/g, "''"));
        if (values.length !== header.length) continue;

        buffer.push(`(${values.map((val) => `'${val}'`).join(", ")})`);
        if (buffer.length === bulkSize) {
          const sql = `INSERT INTO "${tableName}" (${colList}) VALUES ${buffer.join(",\n")};`;
          await client.query(sql);
          imported += buffer.length;
          buffer = [];
        }
      }

      if (buffer.length > 0) {
        const sql = `INSERT INTO "${tableName}" (${colList}) VALUES ${buffer.join(",\n")};`;
        await client.query(sql);
        imported += buffer.length;
      }
      console.log(
        `Imported ${imported} rows into ${tableName} using bulk INSERT.`,
      );
    }
  }

  // 関数・ポリシー設定用クエリ実行
  const setupSqlPath = path.resolve(__dirname, "setup-functions.sql");
  if (psqlAvailable) {
    console.log(`\nApplying function and policy setup from: ${setupSqlPath}`);
    execSync(`psql "${dbUrl}" -f "${setupSqlPath}"`, { stdio: "inherit" });
  } else {
    console.warn(
      "[WARNING] psql is not available. Please apply setup-functions.sql manually.",
    );
  }
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
