/**
 * テーブル名・カラム名マッピングテーブル作成スクリプト
 *
 * Usage: ts-node csv-header-to-sql.ts <csv-directory>
 */

import * as fs from "node:fs";
import * as path from "node:path";

async function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error("Usage: ts-node csv-header-to-sql.ts <csv-directory>");
    process.exit(1);
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".csv"));

  const tableMap: {
    table_physical_name: string;
    table_logical_name: string;
  }[] = [];
  const columnMap: {
    table_physical_name: string;
    column_physical_name: string;
    column_logical_name: string;
  }[] = [];

  files.forEach((file, i) => {
    const table_physical_name = `table${String(i + 1).padStart(2, "0")}`;
    const logicalName = file.replace(/\.csv$/i, "");
    tableMap.push({ table_physical_name, table_logical_name: logicalName });

    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const [headerLine] = content.split(/\r?\n/);
    const headers = headerLine.replace(/^\uFEFF/, "").split(","); // BOM除去
    headers.forEach((col, j) => {
      const column_physical_name = `column${String(j + 1).padStart(2, "0")}`;
      columnMap.push({
        table_physical_name,
        column_physical_name,
        column_logical_name: col,
      });
    });
  });

  console.log("DROP TABLE IF EXISTS table_name_mapping;");
  console.log(`CREATE TABLE table_name_mapping (
  table_physical_name TEXT PRIMARY KEY,
  table_logical_name TEXT NOT NULL
);`);
  console.log();
  console.log("DROP TABLE IF EXISTS column_name_mapping;");
  console.log(`CREATE TABLE column_name_mapping (
  table_physical_name TEXT NOT NULL,
  column_physical_name TEXT NOT NULL,
  column_logical_name TEXT NOT NULL,
  PRIMARY KEY (table_physical_name, column_physical_name),
  FOREIGN KEY (table_physical_name) REFERENCES table_name_mapping(table_physical_name)
);`);
  console.log();

  tableMap.forEach((row) => {
    console.log(
      `INSERT INTO table_name_mapping (table_physical_name, table_logical_name) VALUES ('${row.table_physical_name}', '${row.table_logical_name}');`,
    );
  });
  columnMap.forEach((row) => {
    console.log(
      `INSERT INTO column_name_mapping (table_physical_name, column_physical_name, column_logical_name) VALUES ('${row.table_physical_name}', '${row.column_physical_name}', '${row.column_logical_name}');`,
    );
  });
}

main();
