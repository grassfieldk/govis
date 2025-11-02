#!/usr/bin/env python3
"""
データベース構築スクリプト

tools/input/ 配下の Zip ファイルを解凍して Supabase データベースにデータを登録する。
"""

import logging
import os
import shutil
import zipfile
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client, Client

from build_database.basic_info import build_basic_info_tables
from build_database.budget_execution import build_budget_execution_tables
from build_database.expenditure import build_expenditure_tables

# 定数
PROJECT_ROOT = Path(__file__).resolve().parent.parent
ZIP_DIR = PROJECT_ROOT / "tools" / "input"
CSV_DIR = PROJECT_ROOT / "tools" / "input" / "csv"
OUTPUT_DIR = PROJECT_ROOT / "tools" / "output"

# .env ファイルの読み込み
load_dotenv(PROJECT_ROOT / ".env")

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def extract_zip_files(zip_dir: Path, csv_dir: Path) -> None:
    """指定された Zip ファイルを解凍して CSV ファイルを csv_dir に配置する"""
    logger.info("Zip ファイルの解凍を開始")

    # csv_dir が存在する場合は削除して再作成
    if csv_dir.exists():
        shutil.rmtree(csv_dir)
    csv_dir.mkdir(parents=True, exist_ok=True)

    # 対象の Zip ファイル名を定義
    target_zip_files = [
        "1-1_RS_2024_基本情報_組織情報.zip",
        "1-2_RS_2024_基本情報_事業概要等.zip",
        "1-3_RS_2024_基本情報_政策・施策、法令等.zip",
        "1-4_RS_2024_基本情報_補助率等.zip",
        "1-5_RS_2024_基本情報_関連事業.zip",
        "2-1_RS_2024_予算・執行_サマリ.zip",
        "2-2_RS_2024_予算・執行_予算種別・歳出予算項目.zip",
        "5-1_RS_2024_支出先_支出情報.zip",
        "5-2_RS_2024_支出先_支出ブロックのつながり.zip",
        "5-3_RS_2024_支出先_費目・使途.zip",
        "5-4_RS_2024_支出先_国庫債務負担行為等による契約.zip"
    ]

    for zip_filename in target_zip_files:
        zip_file = zip_dir / zip_filename
        if not zip_file.exists():
            raise FileNotFoundError(f"Zip ファイルが見つかりません: {zip_file}")

        logger.info(f"  解凍中: {zip_filename}")

        # 一時解凍ディレクトリ
        temp_extract_dir = csv_dir / f"temp_{zip_file.stem}"
        temp_extract_dir.mkdir(exist_ok=True)

        # Zip ファイルを解凍
        with zipfile.ZipFile(zip_file, 'r') as zip_ref:
            zip_ref.extractall(temp_extract_dir)

        # 解凍されたファイルから CSV ファイルを検索して移動
        _move_csv_files_to_csv_dir(temp_extract_dir, csv_dir)

        # 一時ディレクトリを削除
        shutil.rmtree(temp_extract_dir)

    logger.info(f"Zip ファイルの解凍が完了しました: {csv_dir}")


def _move_csv_files_to_csv_dir(source_dir: Path, target_dir: Path) -> None:
    """再帰的に CSV ファイルを検索して target_dir 直下に移動する"""
    for item in source_dir.rglob('*'):
        if item.is_file() and item.suffix.lower() == '.csv':
            # ファイル名が重複しないようにする（必要に応じて）
            target_path = target_dir / item.name
            if target_path.exists():
                logger.warning(f"  CSV ファイル名が重複しています: {item.name} (上書きします)")
            shutil.move(str(item), str(target_path))
            logger.info(f"    CSV ファイル移動: {item.name}")


def main():
    """メイン処理"""
    logger.info("=" * 60)
    logger.info("データベース構築開始")
    logger.info("=" * 60)

    # Supabase 接続情報を取得
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_key:
        logger.error("環境変数 NEXT_PUBLIC_SUPABASE_URL または NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていません")
        return

    supabase: Client = create_client(supabase_url, supabase_key)
    logger.info("Supabase に接続しました")

    # Zip ファイルの解凍
    extract_zip_files(ZIP_DIR, CSV_DIR)

    # 出力ディレクトリ作成
    OUTPUT_DIR.mkdir(exist_ok=True)

    # 基本情報セクションのテーブルを構築
    basic_info_tables = build_basic_info_tables(CSV_DIR)

    # 予算・執行セクションのテーブルを構築
    budget_execution_tables = build_budget_execution_tables(CSV_DIR)

    # 支出先セクションのテーブルを構築
    expenditure_tables = build_expenditure_tables(CSV_DIR)

    # 全テーブルを統合
    tables = {**basic_info_tables, **budget_execution_tables, **expenditure_tables}

    # Supabase に書き込み
    logger.info("\n" + "=" * 60)
    logger.info("Supabase に書き込み")
    logger.info("=" * 60)

    for table_name, df in tables.items():
        logger.info(f"  {table_name} テーブル書き込み中... ({len(df):,} 行)")
        records = df.to_dict('records')

        # バッチサイズを指定して分割アップロード
        batch_size = 1000
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            supabase.table(table_name).upsert(batch).execute()  # type: ignore

        logger.info(f"  {table_name} テーブル書き込み完了")

    logger.info("=" * 60)
    logger.info("完了")
    logger.info("=" * 60)
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
