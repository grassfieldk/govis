"""
基本情報セクション

tools/input/1-*.csv から 5 つのテーブルを構築
"""

import logging
from pathlib import Path

import pandas as pd

from .common import apply_sanitize_and_normalize, load_csv, validate_table

logger = logging.getLogger(__name__)

# 正規化対象カラム（基本情報セクション）
NORMALIZE_COLUMNS = {
    "事業名", "府省庁", "局・庁", "部", "課", "室", "班", "係", "作成責任者",
    "事業の目的", "現状・課題", "事業の概要", "備考",
    "政策", "施策", "法令名", "計画通知名",
    "補助対象", "補助率", "補助上限等",
    "関連事業の事業名", "関連性"
}


def build_projects_master_table(df_org: pd.DataFrame, df_overview: pd.DataFrame) -> pd.DataFrame:
    """
    projects_master テーブルを構築（正規化済みマスタテーブル）

    データソース: 1-1 + 1-2 (INNER JOIN)

    このテーブルは事業の基本情報を一元管理するマスタテーブル
    他のすべての詳細テーブルはこのテーブルを外部キー参照する
    """
    logger.info("projects_master テーブル構築中...")

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
    result["remarks"] = df["備考"]

    # 実施方法フラグ
    result["impl_direct"] = df["実施方法ー直接実施"]
    result["impl_subsidy"] = df["実施方法ー補助"]
    result["impl_burden"] = df["実施方法ー負担"]
    result["impl_grant"] = df["実施方法ー交付"]
    result["impl_contribution"] = df["実施方法ー分担金・拠出金"]
    result["impl_other"] = df["実施方法ーその他"]

    result["old_project_number"] = df["旧事業番号"]

    logger.info(f"  projects_master テーブル完成: {len(result):,} 行, {len(result.columns)} カラム")

    return result


def build_policies_table(df: pd.DataFrame) -> pd.DataFrame:
    """
    policies テーブルを構築（正規化済み詳細テーブル）

    データソース: 1-3（政策カラムが空でない行）
    """
    logger.info("policies テーブル構築中...")

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

    logger.info(f"  policies テーブル完成: {len(result):,} 行")

    return result


def build_laws_table(df: pd.DataFrame) -> pd.DataFrame:
    """
    laws テーブルを構築（正規化済み詳細テーブル）

    データソース: 1-3（法令カラムが空でない行）
    """
    logger.info("laws テーブル構築中...")

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
    result["law_paragraph"] = df_filtered["項"]
    result["law_item_subdivision"] = df_filtered["号・号の細分"]

    logger.info(f"  laws テーブル完成: {len(result):,} 行")

    return result


def build_subsidies_table(df: pd.DataFrame) -> pd.DataFrame:
    """
    subsidies テーブルを構築（正規化済み詳細テーブル）

    データソース: 1-4
    """
    logger.info("subsidies テーブル構築中...")

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

    logger.info(f"  subsidies テーブル完成: {len(result):,} 行")

    return result


def build_related_projects_table(df: pd.DataFrame) -> pd.DataFrame:
    """
    related_projects テーブルを構築（正規化済み詳細テーブル）

    データソース: 1-5
    """
    logger.info("related_projects テーブル構築中...")

    # 関連事業IDが空でない行を抽出
    df_filtered = df[df["関連事業の事業ID"].notna()].copy()

    # カラム選択とリネーム
    result = pd.DataFrame()
    result["project_year"] = pd.to_numeric(df_filtered["事業年度"], errors='coerce').astype('Int64')
    result["project_id"] = df_filtered["予算事業ID"]
    result["seq_no"] = pd.to_numeric(df_filtered["番号（関連事業）"], errors='coerce').astype('Int64')
    result["related_project_id"] = df_filtered["関連事業の事業ID"]
    result["related_project_name"] = df_filtered["関連事業の事業名"]
    result["relation_type"] = df_filtered["関連性"]

    logger.info(f"  related_projects テーブル完成: {len(result):,} 行")

    return result


def build_basic_info_tables(input_dir: Path) -> dict[str, pd.DataFrame]:
    """
    基本情報セクション（1-*.csv）から 5 つのテーブルを構築（正規化済み）

    Args:
        input_dir: CSV ファイルが格納されているディレクトリ

    Returns:
        テーブル名をキー、DataFrame を値とする辞書

    正規化構造:
        - projects_master: 事業の基本情報マスタ（project_name を含む唯一のテーブル）
        - policies: 政策・施策の詳細（project_name なし、外部キー参照）
        - laws: 法令の詳細（project_name なし、外部キー参照）
        - subsidies: 補助率の詳細（project_name なし、外部キー参照）
        - related_projects: 関連事業の詳細（project_name なし、外部キー参照）
    """
    logger.info("=" * 60)
    logger.info("基本情報セクション（正規化済み構造）")
    logger.info("=" * 60)

    # CSV 読み込み
    df_org = load_csv(input_dir / "1-1_RS_2024_基本情報_組織情報.csv")
    df_overview = load_csv(input_dir / "1-2_RS_2024_基本情報_事業概要等.csv")
    df_policy_law = load_csv(input_dir / "1-3_RS_2024_基本情報_政策・施策、法令等.csv")
    df_subsidy = load_csv(input_dir / "1-4_RS_2024_基本情報_補助率等.csv")
    df_related = load_csv(input_dir / "1-5_RS_2024_基本情報_関連事業.csv")

    # サニタイズ・正規化
    df_org = apply_sanitize_and_normalize(df_org, NORMALIZE_COLUMNS)
    df_overview = apply_sanitize_and_normalize(df_overview, NORMALIZE_COLUMNS)
    df_policy_law = apply_sanitize_and_normalize(df_policy_law, NORMALIZE_COLUMNS)
    df_subsidy = apply_sanitize_and_normalize(df_subsidy, NORMALIZE_COLUMNS)
    df_related = apply_sanitize_and_normalize(df_related, NORMALIZE_COLUMNS)

    # テーブル構築
    logger.info("\n" + "=" * 60)
    logger.info("テーブル構築")
    logger.info("=" * 60)

    tables = {
        "projects_master": build_projects_master_table(df_org, df_overview),
        "policies": build_policies_table(df_policy_law),
        "laws": build_laws_table(df_policy_law),
        "subsidies": build_subsidies_table(df_subsidy),
        "related_projects": build_related_projects_table(df_related)
    }

    # 検証
    logger.info("\n" + "=" * 60)
    logger.info("検証")
    logger.info("=" * 60)

    validate_table(tables["projects_master"], "projects_master", ["project_year", "project_id"])
    validate_table(tables["policies"], "policies", ["project_year", "project_id", "seq_no"])
    validate_table(tables["laws"], "laws", ["project_year", "project_id", "seq_no"])
    validate_table(tables["subsidies"], "subsidies", ["project_year", "project_id", "seq_no"])
    validate_table(tables["related_projects"], "related_projects", ["project_year", "project_id", "seq_no"])

    return tables
