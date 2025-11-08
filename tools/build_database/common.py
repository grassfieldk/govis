"""
共通関数モジュール

全セクションで使用する共通的な処理を提供する。
"""

import logging
from pathlib import Path
from typing import Optional

import neologdn
import pandas as pd

logger = logging.getLogger(__name__)


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


def apply_sanitize_and_normalize(df: pd.DataFrame, normalize_columns: set) -> pd.DataFrame:
    """
    DataFrame 全体にサニタイズと正規化を適用

    Args:
        df: 対象DataFrame
        normalize_columns: 正規化対象カラム名のセット

    Returns:
        処理後のDataFrame
    """
    logger.info("サニタイズ・正規化を適用中...")

    # 1. 全カラムにサニタイズ
    for col in df.columns:
        df[col] = df[col].apply(sanitize)

    # 2. 正規化対象カラムのみ処理
    for col in df.columns:
        if col in normalize_columns:
            # 正規化
            df[col] = df[col].apply(normalize)
            logger.info(f"  正規化: {col}")

    return df


def validate_table(df: pd.DataFrame, table_name: str, primary_keys: list) -> None:
    """
    テーブルのデータ品質を検証

    Args:
        df: 対象DataFrame
        table_name: テーブル名
        primary_keys: 主キーカラム名のリスト
    """
    logger.info(f"=== {table_name} テーブル検証 ===")

    # 行数
    logger.info(f"  行数: {len(df):,}")

    # 主キー重複チェック
    duplicates = df.duplicated(subset=primary_keys, keep=False).sum()
    if duplicates > 0:
        logger.warning(f"  主キー重複: {duplicates} 件")
    else:
        logger.info("  主キー重複: なし")

    # NULL率チェック（50%以上のカラムを報告）
    null_rates = df.isna().sum() / len(df)
    high_null_cols = null_rates[null_rates > 0.5]
    if len(high_null_cols) > 0:
        logger.info(f"  NULL率50%超のカラム: {len(high_null_cols)} 個")
