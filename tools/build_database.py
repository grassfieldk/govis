#!/usr/bin/env python3
"""
行政事業レビューシート CSV データを SQLite データベースに変換するスクリプト

入力: input/*.csv (5ファイル)
出力: output/rs_data.sqlite (5テーブル)
"""

import logging
import sqlite3
from pathlib import Path
from typing import Optional

import neologdn
import pandas as pd

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# プロジェクトルート
PROJECT_ROOT = Path(__file__).parent.parent
INPUT_DIR = PROJECT_ROOT / "input"
OUTPUT_DIR = PROJECT_ROOT / "output"

# 正規化対象カラム（日本語カラム名）
NORMALIZE_COLUMNS = {
    "事業名", "府省庁", "局・庁", "部", "課", "室", "班", "係", "作成責任者",
    "事業の目的", "現状・課題", "事業の概要", "備考",
    "政策", "施策", "法令名", "計画通知名",
    "補助対象", "補助率", "補助上限等",
    "関連事業の事業名", "関連性"
}




def sanitize(text: str) -> Optional[str]:
    """
    無効文字の除去・欠損値統一（全カラム対象）

    - NULL文字除去
    - 制御文字を空白に置換
    - 改行コード統一
    - 前後空白除去
    - 欠損値統一
    """
    if pd.isna(text) or text == "":
        return None

    # 文字列に変換
    text = str(text)

    # NULL文字除去
    text = text.replace('\x00', '')

    # 制御文字を空白に（改行は保持）
    text = ''.join(c if c >= ' ' or c == '\n' else ' ' for c in text)

    # 改行統一
    text = text.replace('\r\n', '\n').replace('\r', '\n')

    # 前後空白除去
    text = text.strip()

    # 欠損値統一
    if text in ['－', '─', '—', '該当なし', 'なし', '無し']:
        return None

    return text if text else None


def normalize(text: str) -> Optional[str]:
    """
    neologdn による正規化（選択的適用）

    - 全角半角統一
    - Unicode正規化
    - 連続空白統一
    - 長音符・波ダッシュ統一
    """
    if text is None:
        return None

    try:
        return neologdn.normalize(text)
    except Exception as e:
        logger.warning(f"正規化失敗: {text[:50]}... - {e}")
        return text


def load_csv(filepath: Path) -> pd.DataFrame:
    """
    CSV ファイルを読み込む

    - UTF-8-SIG（BOM付き）
    - 全カラムを文字列型として読み込み
    """
    logger.info(f"読み込み中: {filepath.name}")
    df = pd.read_csv(filepath, encoding='utf-8-sig', dtype=str)
    logger.info(f"  行数: {len(df):,}, カラム数: {len(df.columns)}")
    return df


def apply_sanitize_and_normalize(df: pd.DataFrame) -> pd.DataFrame:
    """
    DataFrame 全体にサニタイズと正規化を適用

    1. 全カラムにサニタイズ
    2. 正規化対象カラムのみ：_raw作成 → 正規化
    """
    logger.info("サニタイズ・正規化を適用中...")

    # 1. 全カラムにサニタイズ
    for col in df.columns:
        df[col] = df[col].apply(sanitize)

    # 2. 正規化対象カラムのみ処理
    for col in df.columns:
        if col in NORMALIZE_COLUMNS:
            # 正規化
            df[col] = df[col].apply(normalize)
            logger.info(f"  正規化: {col}")

    return df


def build_project_table(df_org: pd.DataFrame, df_overview: pd.DataFrame) -> pd.DataFrame:
    """
    project テーブルを構築

    データソース: 1-1 + 1-2 (INNER JOIN)
    """
    logger.info("project テーブル構築中...")

    # 1-1, 1-2 両方に同一事業が複数行ある場合があるため、最初の行のみを使用
    df_org_unique = df_org.drop_duplicates(subset=["事業年度", "予算事業ID"], keep="first")
    df_overview_unique = df_overview.drop_duplicates(subset=["事業年度", "予算事業ID"], keep="first")
    logger.info(f"  1-1 重複除去: {len(df_org):,} → {len(df_org_unique):,} 行")
    logger.info(f"  1-2 重複除去: {len(df_overview):,} → {len(df_overview_unique):,} 行")

    # INNER JOIN
    df = pd.merge(
        df_org_unique,
        df_overview_unique,
        on=["事業年度", "予算事業ID"],
        how="inner",
        suffixes=("_org", "_overview")
    )

    logger.info(f"  結合後の行数: {len(df):,}")

    # カラム選択とリネーム
    result = pd.DataFrame()

    # 主キー
    result["project_year"] = pd.to_numeric(df["事業年度"], errors='coerce').astype('Int64')
    result["project_id"] = df["予算事業ID"]

    # 基本情報（_org から）
    result["project_name"] = df["事業名_org"]

    result["ministry"] = df["府省庁_org"]

    result["bureau"] = df["局・庁_org"]
    result["department"] = df["部_org"]
    result["division"] = df["課_org"]
    result["section"] = df["室_org"]
    result["unit"] = df["班_org"]
    result["project_group"] = df["係_org"]

    result["creator"] = df["作成責任者"]

    # 事業詳細（_overview から）
    result["purpose"] = df["事業の目的"]

    result["current_issues"] = df["現状・課題"]

    result["overview"] = df["事業の概要"]

    result["overview_url"] = df["事業概要URL"]
    result["project_category"] = df["事業区分"]

    # 年度情報
    result["start_year"] = df["事業開始年度"]
    result["start_year_unknown"] = df["開始年度不明"]
    result["end_year"] = df["事業終了（予定）年度"]
    result["end_year_indefinite"] = df["終了予定なし"]

    result["major_expense"] = df["主要経費"]
    result["remarks"] = df["備考"]    # 実施方法フラグ
    result["impl_direct"] = df["実施方法ー直接実施"]
    result["impl_subsidy"] = df["実施方法ー補助"]
    result["impl_burden"] = df["実施方法ー負担"]
    result["impl_grant"] = df["実施方法ー交付"]
    result["impl_contribution"] = df["実施方法ー分担金・拠出金"]
    result["impl_other"] = df["実施方法ーその他"]

    result["old_project_number"] = df["旧事業番号"]

    logger.info(f"  project テーブル完成: {len(result):,} 行, {len(result.columns)} カラム")

    return result


def build_project_policy_table(df: pd.DataFrame) -> pd.DataFrame:
    """
    project_policy テーブルを構築

    データソース: 1-3（政策カラムが空でない行）
    """
    logger.info("project_policy テーブル構築中...")

    # 政策カラムが空でない行を抽出
    df_filtered = df[df["政策"].notna()].copy()

    # seq_no を採番（同一事業内での連番）
    df_filtered["seq_no"] = df_filtered.groupby(["事業年度", "予算事業ID"]).cumcount() + 1

    # カラム選択とリネーム
    result = pd.DataFrame()
    result["project_year"] = pd.to_numeric(df_filtered["事業年度"], errors='coerce').astype('Int64')
    result["project_id"] = df_filtered["予算事業ID"]
    result["seq_no"] = df_filtered["seq_no"].astype('Int64')
    result["policy_ministry"] = df_filtered["政策所管府省庁_P"]
    result["policy_name"] = df_filtered["政策"]
    result["measure_name"] = df_filtered["施策"]
    result["policy_url"] = df_filtered["政策・施策URL"]

    logger.info(f"  project_policy テーブル完成: {len(result):,} 行")

    return result


def build_project_law_table(df: pd.DataFrame) -> pd.DataFrame:
    """
    project_law テーブルを構築

    データソース: 1-3（法令カラムが空でない行）
    """
    logger.info("project_law テーブル構築中...")

    # 法令カラムが空でない行を抽出
    df_filtered = df[df["法令名"].notna()].copy()

    # seq_no を採番
    df_filtered["seq_no"] = df_filtered.groupby(["事業年度", "予算事業ID"]).cumcount() + 1

    # カラム選択とリネーム
    result = pd.DataFrame()
    result["project_year"] = pd.to_numeric(df_filtered["事業年度"], errors='coerce').astype('Int64')
    result["project_id"] = df_filtered["予算事業ID"]
    result["seq_no"] = df_filtered["seq_no"].astype('Int64')
    result["law_name"] = df_filtered["法令名"]
    result["law_number"] = df_filtered["法令番号"]
    result["law_id"] = df_filtered["法令ID"]
    result["article"] = df_filtered["条"]
    result["paragraph"] = df_filtered["項"]
    result["item"] = df_filtered["号・号の細分"]

    logger.info(f"  project_law テーブル完成: {len(result):,} 行")

    return result


def build_project_subsidy_table(df: pd.DataFrame) -> pd.DataFrame:
    """
    project_subsidy テーブルを構築

    データソース: 1-4
    """
    logger.info("project_subsidy テーブル構築中...")

    # 番号カラムをそのまま seq_no として使用（空行は除外）
    df_filtered = df[df["番号（補助率等）"].notna()].copy()

    # カラム選択とリネーム
    result = pd.DataFrame()
    result["project_year"] = pd.to_numeric(df_filtered["事業年度"], errors='coerce').astype('Int64')
    result["project_id"] = df_filtered["予算事業ID"]
    result["seq_no"] = pd.to_numeric(df_filtered["番号（補助率等）"], errors='coerce').astype('Int64')
    result["subsidy_target"] = df_filtered["補助対象"]
    result["subsidy_rate"] = df_filtered["補助率"]
    result["subsidy_cap"] = df_filtered["補助上限等"]
    result["subsidy_url"] = df_filtered["補助率URL"]

    logger.info(f"  project_subsidy テーブル完成: {len(result):,} 行")

    return result


def build_project_related_table(df: pd.DataFrame) -> pd.DataFrame:
    """
    project_related テーブルを構築

    データソース: 1-5
    """
    logger.info("project_related テーブル構築中...")

    # 関連事業IDが空でない行を抽出
    df_filtered = df[df["関連事業の事業ID"].notna()].copy()

    # 番号カラムをそのまま seq_no として使用
    # カラム選択とリネーム
    result = pd.DataFrame()
    result["project_year"] = pd.to_numeric(df_filtered["事業年度"], errors='coerce').astype('Int64')
    result["project_id"] = df_filtered["予算事業ID"]
    result["seq_no"] = pd.to_numeric(df_filtered["番号（関連事業）"], errors='coerce').astype('Int64')
    result["related_project_id"] = df_filtered["関連事業の事業ID"]
    result["related_project_name"] = df_filtered["関連事業の事業名"]
    result["relation_type"] = df_filtered["関連性"]

    logger.info(f"  project_related テーブル完成: {len(result):,} 行")

    return result


def validate_table(df: pd.DataFrame, table_name: str, primary_keys: list):
    """
    テーブルの検証

    - 行数
    - 主キー重複チェック
    - NULL率
    """
    logger.info(f"=== {table_name} テーブル検証 ===")
    logger.info(f"  行数: {len(df):,}")

    # 主キー重複チェック
    duplicates = df.duplicated(subset=primary_keys, keep=False).sum()
    if duplicates > 0:
        logger.warning(f"  主キー重複: {duplicates} 件")
    else:
        logger.info("  主キー重複: なし")

    # NULL率
    null_rates = (df.isnull().sum() / len(df) * 100).round(2)
    high_null = null_rates[null_rates > 50]
    if len(high_null) > 0:
        logger.info(f"  NULL率50%超のカラム: {len(high_null)} 個")


def main():
    """メイン処理"""
    logger.info("=" * 60)
    logger.info("行政事業レビューシート DB 構築開始")
    logger.info("=" * 60)

    # 出力ディレクトリ作成
    OUTPUT_DIR.mkdir(exist_ok=True)

    # CSV読み込み
    df_org = load_csv(INPUT_DIR / "1-1_基本情報_組織情報.csv")
    df_overview = load_csv(INPUT_DIR / "1-2_基本情報_事業概要等.csv")
    df_policy_law = load_csv(INPUT_DIR / "1-3_基本情報_政策・施策、法令等.csv")
    df_subsidy = load_csv(INPUT_DIR / "1-4_基本情報_補助率等.csv")
    df_related = load_csv(INPUT_DIR / "1-5_基本情報_関連事業.csv")

    # サニタイズ・正規化
    df_org = apply_sanitize_and_normalize(df_org)
    df_overview = apply_sanitize_and_normalize(df_overview)
    df_policy_law = apply_sanitize_and_normalize(df_policy_law)
    df_subsidy = apply_sanitize_and_normalize(df_subsidy)
    df_related = apply_sanitize_and_normalize(df_related)

    # テーブル構築
    logger.info("\n" + "=" * 60)
    logger.info("テーブル構築")
    logger.info("=" * 60)

    table_project = build_project_table(df_org, df_overview)
    table_policy = build_project_policy_table(df_policy_law)
    table_law = build_project_law_table(df_policy_law)
    table_subsidy = build_project_subsidy_table(df_subsidy)
    table_related = build_project_related_table(df_related)

    # SQLite に書き込み
    logger.info("\n" + "=" * 60)
    logger.info("SQLite に書き込み")
    logger.info("=" * 60)

    output_path = OUTPUT_DIR / "rs_data.sqlite"
    conn = sqlite3.connect(output_path)

    try:
        table_project.to_sql("project", conn, if_exists="replace", index=False)
        logger.info("  project テーブル書き込み完了")

        table_policy.to_sql("project_policy", conn, if_exists="replace", index=False)
        logger.info("  project_policy テーブル書き込み完了")

        table_law.to_sql("project_law", conn, if_exists="replace", index=False)
        logger.info("  project_law テーブル書き込み完了")

        table_subsidy.to_sql("project_subsidy", conn, if_exists="replace", index=False)
        logger.info("  project_subsidy テーブル書き込み完了")

        table_related.to_sql("project_related", conn, if_exists="replace", index=False)
        logger.info("  project_related テーブル書き込み完了")

    finally:
        conn.close()

    logger.info(f"\n出力: {output_path}")

    # 検証
    logger.info("\n" + "=" * 60)
    logger.info("検証")
    logger.info("=" * 60)

    validate_table(table_project, "project", ["project_year", "project_id"])
    validate_table(table_policy, "project_policy", ["project_year", "project_id", "seq_no"])
    validate_table(table_law, "project_law", ["project_year", "project_id", "seq_no"])
    validate_table(table_subsidy, "project_subsidy", ["project_year", "project_id", "seq_no"])
    validate_table(table_related, "project_related", ["project_year", "project_id", "seq_no"])

    logger.info("\n" + "=" * 60)
    logger.info("完了")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
