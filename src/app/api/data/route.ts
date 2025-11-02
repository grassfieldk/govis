import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  const mergedDir = path.join(process.cwd(), "src", "data", "json");
  const files = [
    "ministries.json",
    "ministryprojects.json",
    "projectexpenditures.json",
    "sankey.json",
    "statistics.json",
  ];

  const data: { [key: string]: any } = {};

  files.forEach((file) => {
    const filePath = path.join(mergedDir, file);
    if (fs.existsSync(filePath)) {
      data[file.replace(".json", "")] = JSON.parse(
        fs.readFileSync(filePath, "utf-8"),
      );
    }
  });

  return NextResponse.json(data);
}
