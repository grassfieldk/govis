"""
予算・執行セクション

tools/input/2-*.csv から 2 つのテーブルを構築
"""

import logging
from pathlib import Path

import pandas as pd

from .common import apply_sanitize_and_normalize, load_csv, validate_table

logger = logging.getLogger(__name__)

# 正規化対象カラム（予算・執行セクション）
NORMALIZE_COLUMNS = {
    "事業名", "府省庁", "政策所管府省庁", "局・庁", "部", "課", "室", "班", "係",
    "会計", "勘定", "所管", "組織・勘定", "項", "目",
    "主な増減理由", "その他特記事項", "備考",
    "歳出予算項目の補足情報", "備考（歳出予算項目ごと）"
}


def build_budget_summary_table(df: pd.DataFrame) -> pd.DataFrame:
    """
    budgets テーブルを構築（正規化済み）

    データソース: 2-1
    特徴: 1 事業・1 予算年度につき複数行（会計区分ごと + 合計行）
    """
    logger.info("budgets テーブル構築中...")

    # seq_no を採番（同一事業・予算年度内での連番）
    df = df.copy()
    df["seq_no"] = df.groupby(["事業年度", "予算事業ID", "予算年度"]).cumcount() + 1

    # カラム選択とリネーム
    result = pd.DataFrame()

    # 主キー
    result["project_year"] = pd.to_numeric(df["事業年度"], errors='coerce').astype('Int64')
    result["project_id"] = df["予算事業ID"]
    result["budget_year"] = pd.to_numeric(df["予算年度"], errors='coerce').astype('Int64')
    result["seq_no"] = df["seq_no"].astype('Int64')

    # 基本情報（project_name 削除）
    result["account_category"] = df["会計区分"]
    result["account"] = df["会計"]
    result["sub_account"] = df["勘定"]

    # 予算額（TEXT型で保持）
    result["initial_budget"] = df["当初予算"]
    result["supplementary_budget_1"] = df["第1次補正予算"]
    result["supplementary_budget_2"] = df["第2次補正予算"]
    result["supplementary_budget_3"] = df["第3次補正予算"]
    result["supplementary_budget_4"] = df["第4次補正予算"]
    result["supplementary_budget_5"] = df["第5次補正予算"]
    result["carryover_from_prev"] = df["前年度から繰越し"]
    result["reserve_fund_1"] = df["予備費等1"]
    result["reserve_fund_2"] = df["予備費等2"]
    result["reserve_fund_3"] = df["予備費等3"]
    result["reserve_fund_4"] = df["予備費等4"]
    result["current_budget"] = df["歳出予算現額"]

    # 執行情報（TEXT型で保持）
    result["execution_amount"] = df["執行額"]
    result["execution_rate"] = df["執行率"]
    result["carryover_to_next"] = df["翌年度への繰越し(合計）"]

    # 要求額（TEXT型で保持）
    result["next_year_request"] = df["翌年度要求額"]
    result["requested_amount"] = df["要望額"]

    # 備考・理由
    result["increase_reason"] = df["主な増減理由"]
    result["special_notes"] = df["その他特記事項"]
    result["remarks"] = df["備考"]

    logger.info(f"  budgets テーブル完成: {len(result):,} 行, {len(result.columns)} カラム")

    return result


def build_budget_detail_table(df: pd.DataFrame) -> pd.DataFrame:
    """
    budget_items テーブルを構築（正規化済み）

    データソース: 2-2
    特徴: 1 事業・1 予算年度につき、歳出予算項目（目）ごとに 1 行
    """
    logger.info("budget_items テーブル構築中...")

    # seq_no を採番（同一事業・予算年度内での連番）
    df = df.copy()
    df["seq_no"] = df.groupby(["事業年度", "予算事業ID", "予算年度"]).cumcount() + 1

    # カラム選択とリネーム
    result = pd.DataFrame()

    # 主キー
    result["project_year"] = pd.to_numeric(df["事業年度"], errors='coerce').astype('Int64')
    result["project_id"] = df["予算事業ID"]
    result["budget_year"] = pd.to_numeric(df["予算年度"], errors='coerce').astype('Int64')
    result["seq_no"] = df["seq_no"].astype('Int64')

    # 基本情報（project_name 削除）
    result["account_category"] = df["会計区分"]
    result["account"] = df["会計"]
    result["sub_account"] = df["勘定"]
    result["budget_type"] = df["予算種別"]

    # 歳出予算項目
    result["ministry"] = df["所管"]
    result["organization"] = df["組織・勘定"]
    result["item"] = df["項"]
    result["category"] = df["目"]
    result["supplement_info"] = df["歳出予算項目の補足情報"]

    # 金額（TEXT型で保持）
    result["budget_amount"] = df["予算額（歳出予算項目ごと）"]
    result["next_year_request"] = df["翌年度要求額（歳出予算項目ごと）"]

    # 備考
    result["remarks"] = df["備考（歳出予算項目ごと）"]

    logger.info(f"  budget_items テーブル完成: {len(result):,} 行, {len(result.columns)} カラム")

    return result


def build_budget_execution_tables(input_dir: Path) -> dict[str, pd.DataFrame]:
    """
    予算・執行セクション（2-*.csv）から 2 つのテーブルを構築（正規化済み）

    Args:
        input_dir: CSV ファイルが格納されているディレクトリ

    Returns:
        テーブル名をキー、DataFrame を値とする辞書

    正規化構造:
        - budgets: 予算・執行のサマリ（project_name なし、外部キー参照）
        - budget_items: 歳出予算項目の詳細（project_name なし、外部キー参照）
    """
    logger.info("=" * 60)
    logger.info("予算・執行セクション（正規化済み構造）")
    logger.info("=" * 60)

    # CSV読み込み
    df_summary = load_csv(input_dir / "2-1_RS_2024_予算・執行_サマリ.csv")
    df_detail = load_csv(input_dir / "2-2_RS_2024_予算・執行_予算種別・歳出予算項目.csv")

    # サニタイズ・正規化
    df_summary = apply_sanitize_and_normalize(df_summary, NORMALIZE_COLUMNS)
    df_detail = apply_sanitize_and_normalize(df_detail, NORMALIZE_COLUMNS)

    # テーブル構築
    logger.info("\n" + "=" * 60)
    logger.info("テーブル構築")
    logger.info("=" * 60)

    tables = {
        "budgets": build_budget_summary_table(df_summary),
        "budget_items": build_budget_detail_table(df_detail)
    }

    # 検証
    logger.info("\n" + "=" * 60)
    logger.info("検証")
    logger.info("=" * 60)

    validate_table(tables["budgets"], "budgets", ["project_year", "project_id", "budget_year", "seq_no"])
    validate_table(tables["budget_items"], "budget_items", ["project_year", "project_id", "budget_year", "seq_no"])

    return tables
