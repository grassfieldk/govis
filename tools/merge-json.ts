import fs from "node:fs";
import path from "node:path";

/**
 * JSONファイルを統合するスクリプト
 * 年度ごとに分かれたJSONファイルを統合して、src/data/json/ に各ファイルを出力
 */
const outputDir = path.join(__dirname, "..", "src", "data", "json");

const years = fs.readdirSync(outputDir).filter((dir) => dir.startsWith("year_"));

const mergedData: { [key: string]: { [year: string]: any } } = {
  ministries: {},
  ministryprojects: {},
  projectexpenditures: {},
  sankey: {},
  statistics: {},
};

years.forEach((year) => {
  const yearDir = path.join(outputDir, year);
  const yearNum = year.replace("year_", "");
  const files = fs.readdirSync(yearDir);
  files.forEach((file) => {
    const filePath = path.join(yearDir, file);
    const key = file.replace(".json", "").replace(/-/g, "");
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    mergedData[key][yearNum] = data;
  });
});

Object.keys(mergedData).forEach((key) => {
  const outputFile = path.join(outputDir, `${key}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(mergedData[key], null, 2));
});

console.log("Merged data saved to data/json/merged/");
