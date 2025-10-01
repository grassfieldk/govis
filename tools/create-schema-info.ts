/**
 * テーブル名・カラム名マッピングテーブル作成スクリプト
 *
 * Usage: ts-node csv-header-to-sql.ts <csv-directory>
 */

import * as fs from "node:fs";
import * as path from "node:path";

const table_prefix = "govis";

async function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error("Usage: ts-node csv-header-to-sql.ts <csv-directory>");
    process.exit(1);
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".csv"));

  // converted_csv ディレクトリ作成
  const convertedDir = path.join(dir, "converted_csv");
  if (!fs.existsSync(convertedDir)) {
    fs.mkdirSync(convertedDir);
  }

  const tables: {
    table_physical_name: string;
    table_logical_name: string;
    columns: {
      column_physical_name: string;
      column_logical_name: string;
    }[];
  }[] = [];

  files.forEach((file, i) => {
  const table_physical_name = `${table_prefix}_table_${String(i + 1).padStart(2, "0")}`;
    const table_logical_name = file.replace(/\.csv$/i, "");
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split(/\r?\n/);
    const headerLine = lines[0];
    const headers = headerLine.replace(/^\uFEFF/, "").split(","); // BOM除去
    const columns = headers.map((col, j) => ({
      column_physical_name: `column_${String(j + 1).padStart(2, "0")}`,
      column_logical_name: col,
    }));
    tables.push({
      table_physical_name,
      table_logical_name,
      columns,
    });

  // 物理名ヘッダで新しい CSV を物理テーブル名で出力
  const physicalHeader = columns.map((c) => c.column_physical_name).join(",");
  const convertedCsvName = `${table_physical_name}.csv`;
  const convertedCsvPath = path.join(convertedDir, convertedCsvName);
  const restLines = lines.slice(1);
  const outputContent = [physicalHeader, ...restLines].join("\n");
  fs.writeFileSync(convertedCsvPath, outputContent, "utf-8");
  });

  console.log(JSON.stringify(tables, null, 2));
}

main();
