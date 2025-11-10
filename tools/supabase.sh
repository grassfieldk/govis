#!/bin/bash

# Supabase 環境構築スクリプト

set -e

echo "ローカル環境に Supabase を構築します"

# Docker Compose がインストールされていない場合処理を終了
if ! command -v docker-compose >/dev/null 2>&1 && { ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; }; then
    echo "Docker Compose がインストールされていません" >&2
    echo "https://docs.docker.com/engine/install を参考にインストールしてください" >&2
    exit 1
fi

# プロジェクトルートディレクトリ
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"
cd "$PROJECT_ROOT"

# supabase init の実行（既に初期化されている場合はスキップ）
if [ ! -d "$PROJECT_ROOT/supabase" ]; then
    echo "Supabase 環境を作成します"
    npx supabase init > /dev/null
    echo "Supabase 環境が作成されました"
else
    echo "既存の Supabase 環境を使用します"
fi

# supabase start の実行（既に起動している場合はスキップ）
if ! npx supabase status 2>&1 | grep -q "is running"; then
    echo "Supabase サーバーを起動します"
    npx supabase start > /dev/null
    sleep 3
    echo "Supabase サーバーが起動しました"
else
    echo "起動している Supabase サーバーを使用します"
fi

# データベースの初期化
echo "データベースを初期化します"
npx supabase db reset > /dev/null
echo "データベースの初期化が完了しました"

# supabase status の実行と情報取得
echo "Supabase サーバ情報を取得します"
STATUS_OUTPUT=$(npx supabase status 2>/dev/null)

# URL と API Key を抽出
SUPABASE_URL=$(echo "$STATUS_OUTPUT" | grep -oP 'API URL: \K[^\s]+' || echo "")
SUPABASE_ANON_KEY=$(echo "$STATUS_OUTPUT" | grep -oP 'Publishable key: \K[^\s]+' || echo "")
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "エラー: Supabase の接続情報を取得できませんでした" >&2
    exit 1
fi
echo "  SUPABASE_URL     : ${SUPABASE_URL}"
echo "  SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}"

# .env ファイルの作成/更新
if [ ! -f "$ENV_FILE" ]; then
    cp "$PROJECT_ROOT/.env.example" "$ENV_FILE"
fi
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL|" "$ENV_FILE"
    sed -i '' "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|" "$ENV_FILE"
else
    sed -i "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL|" "$ENV_FILE"
    sed -i "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|" "$ENV_FILE"
fi

echo "Supabase の構築が完了しました"
echo "README.md の手順に従い、データ投入を行ってください"
