import { GoogleGenerativeAI } from "@google/generative-ai";

// Google Gemini API設定
const API_KEY = process.env.GOOGLE_API_KEY;
const MODELS = process.env.GEMINI_MODEL;
if (!API_KEY) {
  throw new Error("Google API キーが設定されていません");
}
if (!MODELS) {
  throw new Error("Gemini モデルが指定されていません");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODELS });

/**
 * 自然言語からSQLクエリを生成する
 */
export async function generateSQLFromNaturalLanguage(
  userQuestion: string,
  schemaInfo: string,
  // TODO: テーブル選択・クエリ生成の二段階生成実装後、ここでテーブル名を指定させる必要がある
  // tableName: string,
) {
  try {
    const systemPrompt = `
あなたは、PostgreSQLデータベースを操作する優秀なSQLデータアナリストです。
次のテーブル定義を分析し、以下のタスクを実行してください。

\`\`\`json
${schemaInfo}
\`\`\`

# データ形式の注意点
- "金額", "支出先の合計支出額", "ブロックの合計支出額" などの金額系列は、TEXT型で保存されています
- これらの列には数値文字列（例："10070000"）または空文字（""）が入っています
- 金額を数値として使用する場合は、以下の変換パターンを必ず使用してください：
  \`CASE WHEN "列名" = '' OR "列名" IS NULL THEN 0 ELSE CAST("列名" AS numeric) END\`
- テーブル名およびカラム名の物理名/論理名を意識し、論理名でクエリを生成しないように気をつけてください
- カラムにデータが入っていないことも考慮し、無効データを除外する条件を加えるようにしてください

# あなたのタスク
ユーザーからの自然言語による質問を解釈し、その答えを導き出すための**PostgreSQLで実行可能なSQLクエリを1つだけ**生成してください。

# 遵守すべきルール
1. SQL内の列名は、必ずダブルクォート \`"\` で囲んでください。
2. **金額系列の計算**: 空文字と数値文字列が混在するため、以下のパターンを使用してください：
   \`CASE WHEN "金額" = '' OR "金額" IS NULL THEN 0 ELSE CAST("金額" AS numeric) END\`
3. **フィルタリング**: \`WHERE "列名" != '' AND "列名" IS NOT NULL\` を使用してください。
4. ユーザーの入力の表記揺れを吸収するため、\`LIKE\` 演算子を使用してください。
5. 集計関数には \`AS\` を使って分かりやすい別名を付けてください。
6. 回答には、SQLクエリ以外の説明を含めず、SQLクエリのみを出力してください。
7. SQLクエリは、\`\`\`sql ... \`\`\` のようにマークダウンのコードブロックで囲んで出力してください。

# ユーザーの質問
${userQuestion}
    `.trim();

    const result = await model.generateContent(systemPrompt);
    const response = result.response;
    const generatedText = response.text();

    // SQLコードブロックを抽出
    const sqlMatch = generatedText.match(/```sql\s*([\s\S]*?)\s*```/);
    if (sqlMatch?.[1]) {
      return {
        success: true,
        sql: sqlMatch[1].trim(),
        rawResponse: generatedText,
      };
    }

    // コードブロックがない場合は、生の回答をそのまま返す
    return {
      success: true,
      sql: generatedText.trim(),
      rawResponse: generatedText,
    };
  } catch (error) {
    console.error("SQL生成エラー:", error);

    if (error instanceof Error) {
      // API制限エラーの場合
      if (error.message.includes("quota") || error.message.includes("limit")) {
        return {
          success: false,
          error:
            "AIへのリクエストが無料利用枠の上限に達しました。しばらく待ってから再試行してください。",
        };
      }
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "SQL生成中に予期せぬエラーが発生しました",
    };
  }
}

/**
 * 他のLLM用のプロンプトを生成する
 */
export function createPromptForOtherLLMs(
  userQuestion: string,
  schemaInfo: string,
  tableName: string = "main_data",
) {
  return `
あなたは、PostgreSQLデータベースを操作する優秀なSQLデータアナリストです。
\`${tableName}\` という名前のテーブルを分析し、以下のタスクを実行してください。

${schemaInfo}

# 主要な列の解説
- "金額", "支出先の合計支出額": これらの金額列には、データが存在しないNULL値が含まれています。

# あなたのタスク
ユーザーからの自然言語による質問を解釈し、その答えを導き出すための**PostgreSQLで実行可能なSQLクエリを1つだけ**生成してください。

# 遵守すべきルール
1. SQL内の列名は、必ずダブルクォート \`"\` で囲んでください。
2. **計算の場合**: \`NULL\`を\`0\`として扱うため \`COALESCE(column, 0)\` を使用してください。
3. **フィルタリング/ランキングの場合**: \`WHERE "列名" IS NOT NULL\` を使用してください。
4. ユーザーの入力の表記揺れを吸収するため、\`LIKE\` 演算子を使用してください。
5. 集計関数には \`AS\` を使って分かりやすい別名を付けてください。
6. 回答には、SQLクエリ以外の説明を含めず、SQLクエリのみを出力してください。
7. SQLクエリは、\`\`\`sql ... \`\`\` のようにマークダウンのコードブロックで囲んで出力してください。

# ユーザーの質問
${userQuestion}
  `.trim();
}
