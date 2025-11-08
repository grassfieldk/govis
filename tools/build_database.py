#!/usr/bin/env python3
"""
データベース構築スクリプト

input/*.csv から SQLite データベースを生成する。
"""

import logging
import sqlite3
from pathlib import Path

from build_database.basic_info import build_basic_info_tables
from build_database.budget_execution import build_budget_execution_tables
from build_database.expenditure import build_expenditure_tables

# 定数
PROJECT_ROOT = Path(__file__).resolve().parent.parent
INPUT_DIR = PROJECT_ROOT / "input"
OUTPUT_DIR = PROJECT_ROOT / "output"

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def main():
    """メイン処理"""
    logger.info("=" * 60)
    logger.info("データベース構築開始")
    logger.info("=" * 60)

    # 出力ディレクトリ作成
    OUTPUT_DIR.mkdir(exist_ok=True)

    # 基本情報セクションのテーブルを構築
    basic_info_tables = build_basic_info_tables(INPUT_DIR)

    # 予算・執行セクションのテーブルを構築
    budget_execution_tables = build_budget_execution_tables(INPUT_DIR)

    # 支出先セクションのテーブルを構築
    expenditure_tables = build_expenditure_tables(INPUT_DIR)

    # 全テーブルを統合
    tables = {**basic_info_tables, **budget_execution_tables, **expenditure_tables}

    # SQLite に書き込み
    logger.info("\n" + "=" * 60)
    logger.info("SQLite に書き込み")
    logger.info("=" * 60)

    output_path = OUTPUT_DIR / "rs_data.sqlite"
    conn = sqlite3.connect(output_path)

    try:
        for table_name, df in tables.items():
            df.to_sql(table_name, conn, if_exists="replace", index=False)
            logger.info(f"  {table_name} テーブル書き込み完了")

    finally:
        conn.close()

    logger.info(f"\n出力: {output_path}")
    logger.info("\n" + "=" * 60)
    logger.info("完了")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
