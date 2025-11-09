"""
支出先セクション

tools/input/5-*.csv から 4 つのテーブルを構築
"""

import logging
from pathlib import Path

import pandas as pd

from .common import apply_sanitize_and_normalize, load_csv, validate_table

logger = logging.getLogger(__name__)

# 正規化対象カラム（支出先セクション）
NORMALIZE_COLUMNS = {
    "事業名", "府省庁", "政策所管府省庁", "局・庁", "部", "課", "室", "班", "係",
    "支出先ブロック名", "支出元の支出先ブロック名", "支出先の支出先ブロック名",
    "支出先名", "契約先名（国庫債務負担行為等による契約）",
    "事業を行う上での役割", "契約概要",
    "契約概要（契約名）（国庫債務負担行為等による契約）",
    "一者応札・一者応募又は競争性のない随意契約となった理由及び改善策（支出額10億円以上）",
    "一者応札・一者応募又は競争性のない随意契約となった理由及び改善策（契約額10億円以上）（国庫債務負担行為等による契約）",
    "資金の流れの補足情報", "国自らが支出する間接経費の項目",
    "所在地", "契約先の所在地（国庫債務負担行為等による契約）",
    "法人種別", "契約先の法人種別（国庫債務負担行為等による契約）",
    "契約方式等", "具体的な契約方式等",
    "契約方式等（国庫債務負担行為等による契約）",
    "具体的な契約方式等（国庫債務負担行為等による契約）",
    "費目", "使途"
}


def build_expenditure_info_table(df: pd.DataFrame) -> pd.DataFrame:
    """
    expenditures テーブルを構築（正規化済み）

    データソース: 5-1
    特徴: 1 事業につき複数の支出先ブロック、各ブロック内に複数の支出先
    """
    logger.info("expenditures テーブル構築中...")

    # seq_no を採番
    df = df.copy()
    df["seq_no"] = df.groupby(["事業年度", "予算事業ID"]).cumcount() + 1

    # カラム選択とリネーム
    result = pd.DataFrame()

    # 主キー
    result["project_year"] = pd.to_numeric(df["事業年度"], errors='coerce').astype('Int64')
    result["project_id"] = df["予算事業ID"]
    result["seq_no"] = df["seq_no"].astype('Int64')

    # 基本情報（project_name 削除）
    result["block_number"] = df["支出先ブロック番号"]
    result["block_name"] = df["支出先ブロック名"]
    result["num_recipients"] = df["支出先の数"]
    result["role"] = df["事業を行う上での役割"]
    result["block_total_amount"] = df["ブロックの合計支出額"]

    # 支出先情報
    result["recipient_name"] = df["支出先名"]
    result["corporate_number"] = df["法人番号"]
    result["location"] = df["所在地"]
    result["corporate_type"] = df["法人種別"]
    result["other_recipient"] = df["その他支出先"]
    result["recipient_total_amount"] = df["支出先の合計支出額"]

    # 契約情報
    result["contract_summary"] = df["契約概要"]
    result["amount"] = df["金額"]
    result["contract_method"] = df["契約方式等"]
    result["specific_contract_method"] = df["具体的な契約方式等"]
    result["num_bidders"] = df["入札者数"]
    result["bid_rate"] = df["落札率"]
    result["sole_bid_reason"] = df["一者応札・一者応募又は競争性のない随意契約となった理由及び改善策（支出額10億円以上）"]
    result["other_contract"] = df["その他の契約"]

    logger.info(f"  expenditures テーブル完成: {len(result):,} 行, {len(result.columns)} カラム")

    return result


def build_expenditure_flow_table(df: pd.DataFrame) -> pd.DataFrame:
    """
    expenditure_flows テーブルを構築（正規化済み）

    データソース: 5-2
    特徴: 支出元ブロック → 支出先ブロックの資金の流れ
    """
    logger.info("expenditure_flows テーブル構築中...")

    # seq_no を採番
    df = df.copy()
    df["seq_no"] = df.groupby(["事業年度", "予算事業ID"]).cumcount() + 1

    # カラム選択とリネーム
    result = pd.DataFrame()

    # 主キー
    result["project_year"] = pd.to_numeric(df["事業年度"], errors='coerce').astype('Int64')
    result["project_id"] = df["予算事業ID"]
    result["seq_no"] = df["seq_no"].astype('Int64')

    # 資金の流れ（project_name 削除）
    result["source_block"] = df["支出元の支出先ブロック"]
    result["source_block_name"] = df["支出元の支出先ブロック名"]
    result["from_organization"] = df["担当組織からの支出"]
    result["destination_block"] = df["支出先の支出先ブロック"]
    result["destination_block_name"] = df["支出先の支出先ブロック名"]
    result["flow_supplement"] = df["資金の流れの補足情報"]

    # 間接経費
    result["indirect_cost"] = df["国自らが支出する間接経費"]
    result["indirect_cost_item"] = df["国自らが支出する間接経費の項目"]
    result["indirect_cost_amount"] = df["国自らが支出する間接経費の金額"]

    logger.info(f"  expenditure_flows テーブル完成: {len(result):,} 行, {len(result.columns)} カラム")

    return result


def build_expenditure_usage_table(df: pd.DataFrame) -> pd.DataFrame:
    """
    expenditure_usages テーブルを構築（正規化済み）

    データソース: 5-3
    特徴: 支出先ごとの費目・使途の内訳
    """
    logger.info("expenditure_usages テーブル構築中...")

    # seq_no を採番
    df = df.copy()
    df["seq_no"] = df.groupby(["事業年度", "予算事業ID"]).cumcount() + 1

    # カラム選択とリネーム
    result = pd.DataFrame()

    # 主キー
    result["project_year"] = pd.to_numeric(df["事業年度"], errors='coerce').astype('Int64')
    result["project_id"] = df["予算事業ID"]
    result["seq_no"] = df["seq_no"].astype('Int64')

    # 基本情報（project_name 削除）
    result["block_number"] = df["支出先ブロック番号"]
    result["recipient_name"] = df["支出先名"]
    result["corporate_number"] = df["法人番号"]
    result["contract_summary"] = df["契約概要"]

    # 費目・使途
    result["expense_item"] = df["費目"]
    result["usage"] = df["使途"]
    result["amount"] = df["金額"]

    logger.info(f"  expenditure_usages テーブル完成: {len(result):,} 行, {len(result.columns)} カラム")

    return result


def build_expenditure_contract_table(df: pd.DataFrame) -> pd.DataFrame:
    """
    expenditure_contracts テーブルを構築（正規化済み）

    データソース: 5-4
    特徴: 国庫債務負担行為等の複数年度契約情報
    """
    logger.info("expenditure_contracts テーブル構築中...")

    # seq_no を採番
    df = df.copy()
    df["seq_no"] = df.groupby(["事業年度", "予算事業ID"]).cumcount() + 1

    # カラム選択とリネーム
    result = pd.DataFrame()

    # 主キー
    result["project_year"] = pd.to_numeric(df["事業年度"], errors='coerce').astype('Int64')
    result["project_id"] = df["予算事業ID"]
    result["seq_no"] = df["seq_no"].astype('Int64')

    # 基本情報（project_name 削除）
    result["block_number"] = df["支出先ブロック（国庫債務負担行為等による契約）"]

    # 契約先情報
    result["contractor_name"] = df["契約先名（国庫債務負担行為等による契約）"]
    result["contractor_corporate_number"] = df["契約先の法人番号（国庫債務負担行為等による契約）"]
    result["contractor_location"] = df["契約先の所在地（国庫債務負担行為等による契約）"]
    result["contractor_type"] = df["契約先の法人種別（国庫債務負担行為等による契約）"]

    # 契約情報
    result["contract_summary"] = df["契約概要（契約名）（国庫債務負担行為等による契約）"]
    result["other_contract"] = df["その他の契約"]
    result["contract_amount"] = df["契約額（国庫債務負担行為等による契約）"]
    result["contract_method"] = df["契約方式等（国庫債務負担行為等による契約）"]
    result["specific_contract_method"] = df["具体的な契約方式等（国庫債務負担行為等による契約）"]
    result["num_bidders"] = df["入札者数（応募者数）（国庫債務負担行為等による契約）"]
    result["bid_rate"] = df["落札率（％）（国庫債務負担行為等による契約）"]
    result["sole_bid_reason"] = df["一者応札・一者応募又は競争性のない随意契約となった理由及び改善策（契約額10億円以上）（国庫債務負担行為等による契約）"]
    result["other_contract_detail"] = df["その他の契約（国庫債務負担行為等による契約）"]

    logger.info(f"  expenditure_contracts テーブル完成: {len(result):,} 行, {len(result.columns)} カラム")

    return result


def build_expenditure_tables(input_dir: Path) -> dict[str, pd.DataFrame]:
    """
    支出先セクション（5-*.csv）から4つのテーブルを構築（正規化済み）

    Args:
        input_dir: CSV ファイルが格納されているディレクトリ

    Returns:
        テーブル名をキー、DataFrame を値とする辞書

    正規化構造:
        - expenditures: 支出先情報（project_name なし、外部キー参照）
        - expenditure_flows: 支出先ブロックの資金の流れ（project_name なし、外部キー参照）
        - expenditure_usages: 費目・使途の詳細（project_name なし、外部キー参照）
        - expenditure_contracts: 国庫債務負担行為等の契約情報（project_name なし、外部キー参照）
    """
    logger.info("=" * 60)
    logger.info("支出先セクション（正規化済み構造）")
    logger.info("=" * 60)

    # CSV 読み込み
    df_info = load_csv(input_dir / "5-1_RS_2024_支出先_支出情報.csv")
    df_flow = load_csv(input_dir / "5-2_RS_2024_支出先_支出ブロックのつながり.csv")
    df_usage = load_csv(input_dir / "5-3_RS_2024_支出先_費目・使途.csv")
    df_contract = load_csv(input_dir / "5-4_RS_2024_支出先_国庫債務負担行為等による契約.csv")

    # サニタイズ・正規化
    df_info = apply_sanitize_and_normalize(df_info, NORMALIZE_COLUMNS)
    df_flow = apply_sanitize_and_normalize(df_flow, NORMALIZE_COLUMNS)
    df_usage = apply_sanitize_and_normalize(df_usage, NORMALIZE_COLUMNS)
    df_contract = apply_sanitize_and_normalize(df_contract, NORMALIZE_COLUMNS)

    # テーブル構築
    logger.info("\n" + "=" * 60)
    logger.info("テーブル構築")
    logger.info("=" * 60)

    tables = {
        "expenditures": build_expenditure_info_table(df_info),
        "expenditure_flows": build_expenditure_flow_table(df_flow),
        "expenditure_usages": build_expenditure_usage_table(df_usage),
        "expenditure_contracts": build_expenditure_contract_table(df_contract)
    }

    # 検証
    logger.info("\n" + "=" * 60)
    logger.info("検証")
    logger.info("=" * 60)

    validate_table(tables["expenditures"], "expenditures", ["project_year", "project_id", "seq_no"])
    validate_table(tables["expenditure_flows"], "expenditure_flows", ["project_year", "project_id", "seq_no"])
    validate_table(tables["expenditure_usages"], "expenditure_usages", ["project_year", "project_id", "seq_no"])
    validate_table(tables["expenditure_contracts"], "expenditure_contracts", ["project_year", "project_id", "seq_no"])

    return tables
