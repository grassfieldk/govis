-- データベーステーブル定義
-- このファイルは Supabase の初期化時に自動実行されます

-- 基本情報セクション

CREATE TABLE IF NOT EXISTS "projects_master" (
    "project_year" BIGINT,            -- 事業年度
    "project_id" TEXT,                -- 予算事業ID
    "project_name" TEXT,              -- 事業名
    "ministry" TEXT,                  -- 府省庁
    "bureau" TEXT,                    -- 局・庁
    "department" TEXT,                -- 部
    "division" TEXT,                  -- 課
    "section" TEXT,                   -- 室
    "unit" TEXT,                      -- 班
    "project_group" TEXT,             -- 係
    "creator" TEXT,                   -- 作成責任者
    "purpose" TEXT,                   -- 事業の目的
    "current_issues" TEXT,            -- 現状・課題
    "overview" TEXT,                  -- 事業の概要
    "overview_url" TEXT,              -- 事業概要URL
    "project_category" TEXT,          -- 事業区分
    "start_year" TEXT,                -- 事業開始年度
    "start_year_unknown" TEXT,        -- 開始年度不明
    "end_year" TEXT,                  -- 事業終了（予定）年度
    "end_year_indefinite" TEXT,       -- 終了予定なし
    "major_expense" TEXT,             -- 主要経費
    "remarks" TEXT,                   -- 備考
    "impl_direct" TEXT,               -- 実施方法ー直接実施
    "impl_subsidy" TEXT,              -- 実施方法ー補助
    "impl_burden" TEXT,               -- 実施方法ー負担
    "impl_grant" TEXT,                -- 実施方法ー交付
    "impl_contribution" TEXT,         -- 実施方法ー分担金・拠出金
    "impl_other" TEXT,                -- 実施方法ーその他
    "old_project_number" TEXT,        -- 旧事業番号
    PRIMARY KEY ("project_year", "project_id")
);

COMMENT ON COLUMN projects_master.project_year IS '事業年度';
COMMENT ON COLUMN projects_master.project_id IS '予算事業ID';
COMMENT ON COLUMN projects_master.project_name IS '事業名';
COMMENT ON COLUMN projects_master.ministry IS '府省庁';
COMMENT ON COLUMN projects_master.bureau IS '局・庁';
COMMENT ON COLUMN projects_master.department IS '部';
COMMENT ON COLUMN projects_master.division IS '課';
COMMENT ON COLUMN projects_master.section IS '室';
COMMENT ON COLUMN projects_master.unit IS '班';
COMMENT ON COLUMN projects_master.project_group IS '係';
COMMENT ON COLUMN projects_master.creator IS '作成責任者';
COMMENT ON COLUMN projects_master.purpose IS '事業の目的';
COMMENT ON COLUMN projects_master.current_issues IS '現状・課題';
COMMENT ON COLUMN projects_master.overview IS '事業の概要';
COMMENT ON COLUMN projects_master.overview_url IS '事業概要URL';
COMMENT ON COLUMN projects_master.project_category IS '事業区分';
COMMENT ON COLUMN projects_master.start_year IS '事業開始年度';
COMMENT ON COLUMN projects_master.start_year_unknown IS '開始年度不明';
COMMENT ON COLUMN projects_master.end_year IS '事業終了（予定）年度';
COMMENT ON COLUMN projects_master.end_year_indefinite IS '終了予定なし';
COMMENT ON COLUMN projects_master.major_expense IS '主要経費';
COMMENT ON COLUMN projects_master.remarks IS '備考';
COMMENT ON COLUMN projects_master.impl_direct IS '実施方法ー直接実施';
COMMENT ON COLUMN projects_master.impl_subsidy IS '実施方法ー補助';
COMMENT ON COLUMN projects_master.impl_burden IS '実施方法ー負担';
COMMENT ON COLUMN projects_master.impl_grant IS '実施方法ー交付';
COMMENT ON COLUMN projects_master.impl_contribution IS '実施方法ー分担金・拠出金';
COMMENT ON COLUMN projects_master.impl_other IS '実施方法ーその他';
COMMENT ON COLUMN projects_master.old_project_number IS '旧事業番号';

CREATE TABLE IF NOT EXISTS "policies" (
    "project_year" BIGINT,            -- 事業年度
    "project_id" TEXT,                -- 予算事業ID
    "seq_no" BIGINT,                  -- 番号（政策・施策）
    "policy_ministry" TEXT,           -- 政策所管府省庁_P
    "policy_name" TEXT,               -- 政策
    "measure_name" TEXT,              -- 施策
    "policy_url" TEXT,                -- 政策・施策URL
    PRIMARY KEY ("project_year", "project_id", "seq_no")
);

COMMENT ON COLUMN policies.project_year IS '事業年度';
COMMENT ON COLUMN policies.project_id IS '予算事業ID';
COMMENT ON COLUMN policies.seq_no IS '番号（政策・施策）';
COMMENT ON COLUMN policies.policy_ministry IS '政策所管府省庁_P';
COMMENT ON COLUMN policies.policy_name IS '政策';
COMMENT ON COLUMN policies.measure_name IS '施策';
COMMENT ON COLUMN policies.policy_url IS '政策・施策URL';

CREATE TABLE IF NOT EXISTS "laws" (
    "project_year" BIGINT,            -- 事業年度
    "project_id" TEXT,                -- 予算事業ID
    "seq_no" BIGINT,                  -- 番号（根拠法令）
    "law_name" TEXT,                  -- 法令名
    "law_number" TEXT,                -- 法令番号
    "law_id" TEXT,                    -- 法令ID
    "article" TEXT,                   -- 条
    "law_paragraph" TEXT,             -- 項
    "law_item_subdivision" TEXT,      -- 号・号の細分
    PRIMARY KEY ("project_year", "project_id", "seq_no")
);

COMMENT ON COLUMN laws.project_year IS '事業年度';
COMMENT ON COLUMN laws.project_id IS '予算事業ID';
COMMENT ON COLUMN laws.seq_no IS '番号（根拠法令）';
COMMENT ON COLUMN laws.law_name IS '法令名';
COMMENT ON COLUMN laws.law_number IS '法令番号';
COMMENT ON COLUMN laws.law_id IS '法令ID';
COMMENT ON COLUMN laws.article IS '条';
COMMENT ON COLUMN laws.law_paragraph IS '項';
COMMENT ON COLUMN laws.law_item_subdivision IS '号・号の細分';

CREATE TABLE IF NOT EXISTS "subsidies" (
    "project_year" BIGINT,            -- 事業年度
    "project_id" TEXT,                -- 予算事業ID
    "seq_no" BIGINT,                  -- 番号（補助率等）
    "subsidy_target" TEXT,            -- 補助対象
    "subsidy_rate" TEXT,              -- 補助率
    "subsidy_cap" TEXT,               -- 補助上限等
    "subsidy_url" TEXT,               -- 補助率URL
    PRIMARY KEY ("project_year", "project_id", "seq_no")
);

COMMENT ON COLUMN subsidies.project_year IS '事業年度';
COMMENT ON COLUMN subsidies.project_id IS '予算事業ID';
COMMENT ON COLUMN subsidies.seq_no IS '番号（補助率等）';
COMMENT ON COLUMN subsidies.subsidy_target IS '補助対象';
COMMENT ON COLUMN subsidies.subsidy_rate IS '補助率';
COMMENT ON COLUMN subsidies.subsidy_cap IS '補助上限等';
COMMENT ON COLUMN subsidies.subsidy_url IS '補助率URL';

CREATE TABLE IF NOT EXISTS "related_projects" (
    "project_year" BIGINT,            -- 事業年度
    "project_id" TEXT,                -- 予算事業ID
    "seq_no" BIGINT,                  -- 番号（関連事業）
    "related_project_id" TEXT,        -- 関連事業の事業ID
    "related_project_name" TEXT,      -- 関連事業の事業名
    "relation_type" TEXT,             -- 関連性
    PRIMARY KEY ("project_year", "project_id", "seq_no")
);

COMMENT ON COLUMN related_projects.project_year IS '事業年度';
COMMENT ON COLUMN related_projects.project_id IS '予算事業ID';
COMMENT ON COLUMN related_projects.seq_no IS '番号（関連事業）';
COMMENT ON COLUMN related_projects.related_project_id IS '関連事業の事業ID';
COMMENT ON COLUMN related_projects.related_project_name IS '関連事業の事業名';
COMMENT ON COLUMN related_projects.relation_type IS '関連性';

-- 予算・執行セクション

CREATE TABLE IF NOT EXISTS "budgets" (
    "project_year" BIGINT,            -- 事業年度
    "project_id" TEXT,                -- 予算事業ID
    "budget_year" BIGINT,             -- 予算年度
    "seq_no" BIGINT,
    "account_category" TEXT,          -- 会計区分
    "account" TEXT,                   -- 会計
    "sub_account" TEXT,               -- 勘定
    "initial_budget" TEXT,            -- 当初予算
    "supplementary_budget_1" TEXT,    -- 第1次補正予算
    "supplementary_budget_2" TEXT,    -- 第2次補正予算
    "supplementary_budget_3" TEXT,    -- 第3次補正予算
    "supplementary_budget_4" TEXT,    -- 第4次補正予算
    "supplementary_budget_5" TEXT,    -- 第5次補正予算
    "carryover_from_prev" TEXT,       -- 前年度から繰越し
    "reserve_fund_1" TEXT,            -- 予備費等1
    "reserve_fund_2" TEXT,            -- 予備費等2
    "reserve_fund_3" TEXT,            -- 予備費等3
    "reserve_fund_4" TEXT,            -- 予備費等4
    "current_budget" TEXT,            -- 歳出予算現額
    "execution_amount" TEXT,          -- 執行額
    "execution_rate" TEXT,            -- 執行率
    "carryover_to_next" TEXT,         -- 翌年度への繰越し(合計）
    "next_year_request" TEXT,         -- 翌年度要求額
    "requested_amount" TEXT,          -- 要望額
    "increase_reason" TEXT,           -- 主な増減理由
    "special_notes" TEXT,             -- その他特記事項
    "remarks" TEXT,                   -- 備考
    PRIMARY KEY ("project_year", "project_id", "budget_year", "seq_no")
);

COMMENT ON COLUMN budgets.project_year IS '事業年度';
COMMENT ON COLUMN budgets.project_id IS '予算事業ID';
COMMENT ON COLUMN budgets.budget_year IS '予算年度';
COMMENT ON COLUMN budgets.account_category IS '会計区分';
COMMENT ON COLUMN budgets.account IS '会計';
COMMENT ON COLUMN budgets.sub_account IS '勘定';
COMMENT ON COLUMN budgets.initial_budget IS '当初予算';
COMMENT ON COLUMN budgets.supplementary_budget_1 IS '第1次補正予算';
COMMENT ON COLUMN budgets.supplementary_budget_2 IS '第2次補正予算';
COMMENT ON COLUMN budgets.supplementary_budget_3 IS '第3次補正予算';
COMMENT ON COLUMN budgets.supplementary_budget_4 IS '第4次補正予算';
COMMENT ON COLUMN budgets.supplementary_budget_5 IS '第5次補正予算';
COMMENT ON COLUMN budgets.carryover_from_prev IS '前年度から繰越し';
COMMENT ON COLUMN budgets.reserve_fund_1 IS '予備費等1';
COMMENT ON COLUMN budgets.reserve_fund_2 IS '予備費等2';
COMMENT ON COLUMN budgets.reserve_fund_3 IS '予備費等3';
COMMENT ON COLUMN budgets.reserve_fund_4 IS '予備費等4';
COMMENT ON COLUMN budgets.current_budget IS '歳出予算現額';
COMMENT ON COLUMN budgets.execution_amount IS '執行額';
COMMENT ON COLUMN budgets.execution_rate IS '執行率';
COMMENT ON COLUMN budgets.carryover_to_next IS '翌年度への繰越し(合計）';
COMMENT ON COLUMN budgets.next_year_request IS '翌年度要求額';
COMMENT ON COLUMN budgets.requested_amount IS '要望額';
COMMENT ON COLUMN budgets.increase_reason IS '主な増減理由';
COMMENT ON COLUMN budgets.special_notes IS 'その他特記事項';
COMMENT ON COLUMN budgets.remarks IS '備考';

CREATE TABLE IF NOT EXISTS "budget_items" (
    "project_year" BIGINT,            -- 事業年度
    "project_id" TEXT,                -- 予算事業ID
    "budget_year" BIGINT,             -- 予算年度
    "seq_no" BIGINT,
    "account_category" TEXT,          -- 会計区分
    "account" TEXT,                   -- 会計
    "sub_account" TEXT,               -- 勘定
    "budget_type" TEXT,               -- 予算種別
    "jurisdiction" TEXT,              -- 所管
    "organization" TEXT,              -- 組織・勘定
    "budget_item" TEXT,               -- 項
    "category" TEXT,                  -- 目
    "supplement_info" TEXT,           -- 歳出予算項目の補足情報
    "budget_amount" TEXT,             -- 予算額（歳出予算項目ごと）
    "next_year_request" TEXT,         -- 翌年度要求額（歳出予算項目ごと）
    "remarks" TEXT,                   -- 備考（歳出予算項目ごと）
    PRIMARY KEY ("project_year", "project_id", "budget_year", "seq_no")
);

COMMENT ON COLUMN budget_items.project_year IS '事業年度';
COMMENT ON COLUMN budget_items.project_id IS '予算事業ID';
COMMENT ON COLUMN budget_items.budget_year IS '予算年度';
COMMENT ON COLUMN budget_items.account_category IS '会計区分';
COMMENT ON COLUMN budget_items.account IS '会計';
COMMENT ON COLUMN budget_items.sub_account IS '勘定';
COMMENT ON COLUMN budget_items.budget_type IS '予算種別';
COMMENT ON COLUMN budget_items.jurisdiction IS '所管';
COMMENT ON COLUMN budget_items.organization IS '組織・勘定';
COMMENT ON COLUMN budget_items.budget_item IS '項';
COMMENT ON COLUMN budget_items.category IS '目';
COMMENT ON COLUMN budget_items.supplement_info IS '歳出予算項目の補足情報';
COMMENT ON COLUMN budget_items.budget_amount IS '予算額（歳出予算項目ごと）';
COMMENT ON COLUMN budget_items.next_year_request IS '翌年度要求額（歳出予算項目ごと）';
COMMENT ON COLUMN budget_items.remarks IS '備考（歳出予算項目ごと）';

-- 支出先セクション

CREATE TABLE IF NOT EXISTS "expenditures" (
    "project_year" BIGINT,                -- 事業年度
    "project_id" TEXT,                    -- 予算事業ID
    "seq_no" BIGINT,
    "block_number" TEXT,                  -- 支出先ブロック番号
    "block_name" TEXT,                    -- 支出先ブロック名
    "num_recipients" TEXT,                -- 支出先の数
    "role" TEXT,                          -- 事業を行う上での役割
    "block_total_amount" TEXT,            -- ブロックの合計支出額
    "recipient_name" TEXT,                -- 支出先名
    "corporate_number" TEXT,              -- 法人番号
    "location" TEXT,                      -- 所在地
    "corporate_type" TEXT,                -- 法人種別
    "other_recipient" TEXT,               -- その他支出先
    "recipient_total_amount" TEXT,        -- 支出先の合計支出額
    "contract_summary" TEXT,              -- 契約概要
    "amount" TEXT,                        -- 金額
    "contract_method" TEXT,               -- 契約方式等
    "specific_contract_method" TEXT,      -- 具体的な契約方式等
    "num_bidders" TEXT,                   -- 入札者数
    "bid_rate" TEXT,                      -- 落札率
    "sole_bid_reason" TEXT,               -- 一者応札・一者応募又は競争性のない随意契約となった理由及び改善策（支出額10億円以上）
    "other_contract" TEXT,                -- その他の契約
    PRIMARY KEY ("project_year", "project_id", "seq_no")
);

COMMENT ON COLUMN expenditures.project_year IS '事業年度';
COMMENT ON COLUMN expenditures.project_id IS '予算事業ID';
COMMENT ON COLUMN expenditures.block_number IS '支出先ブロック番号';
COMMENT ON COLUMN expenditures.block_name IS '支出先ブロック名';
COMMENT ON COLUMN expenditures.num_recipients IS '支出先の数';
COMMENT ON COLUMN expenditures.role IS '事業を行う上での役割';
COMMENT ON COLUMN expenditures.block_total_amount IS 'ブロックの合計支出額';
COMMENT ON COLUMN expenditures.recipient_name IS '支出先名';
COMMENT ON COLUMN expenditures.corporate_number IS '法人番号';
COMMENT ON COLUMN expenditures.location IS '所在地';
COMMENT ON COLUMN expenditures.corporate_type IS '法人種別';
COMMENT ON COLUMN expenditures.other_recipient IS 'その他支出先';
COMMENT ON COLUMN expenditures.recipient_total_amount IS '支出先の合計支出額';
COMMENT ON COLUMN expenditures.contract_summary IS '契約概要';
COMMENT ON COLUMN expenditures.amount IS '金額';
COMMENT ON COLUMN expenditures.contract_method IS '契約方式等';
COMMENT ON COLUMN expenditures.specific_contract_method IS '具体的な契約方式等';
COMMENT ON COLUMN expenditures.num_bidders IS '入札者数';
COMMENT ON COLUMN expenditures.bid_rate IS '落札率';
COMMENT ON COLUMN expenditures.sole_bid_reason IS '一者応札・一者応募又は競争性のない随意契約となった理由及び改善策（支出額10億円以上）';
COMMENT ON COLUMN expenditures.other_contract IS 'その他の契約';

CREATE TABLE IF NOT EXISTS "expenditure_flows" (
    "project_year" BIGINT,                -- 事業年度
    "project_id" TEXT,                    -- 予算事業ID
    "seq_no" BIGINT,
    "source_block" TEXT,                  -- 支出元の支出先ブロック
    "source_block_name" TEXT,             -- 支出元の支出先ブロック名
    "from_organization" TEXT,             -- 担当組織からの支出
    "destination_block" TEXT,             -- 支出先の支出先ブロック
    "destination_block_name" TEXT,        -- 支出先の支出先ブロック名
    "flow_supplement" TEXT,               -- 資金の流れの補足情報
    "indirect_cost" TEXT,                 -- 国自らが支出する間接経費
    "indirect_cost_item" TEXT,            -- 国自らが支出する間接経費の項目
    "indirect_cost_amount" TEXT,          -- 国自らが支出する間接経費の金額
    PRIMARY KEY ("project_year", "project_id", "seq_no")
);

COMMENT ON COLUMN expenditure_flows.project_year IS '事業年度';
COMMENT ON COLUMN expenditure_flows.project_id IS '予算事業ID';
COMMENT ON COLUMN expenditure_flows.source_block IS '支出元の支出先ブロック';
COMMENT ON COLUMN expenditure_flows.source_block_name IS '支出元の支出先ブロック名';
COMMENT ON COLUMN expenditure_flows.from_organization IS '担当組織からの支出';
COMMENT ON COLUMN expenditure_flows.destination_block IS '支出先の支出先ブロック';
COMMENT ON COLUMN expenditure_flows.destination_block_name IS '支出先の支出先ブロック名';
COMMENT ON COLUMN expenditure_flows.flow_supplement IS '資金の流れの補足情報';
COMMENT ON COLUMN expenditure_flows.indirect_cost IS '国自らが支出する間接経費';
COMMENT ON COLUMN expenditure_flows.indirect_cost_item IS '国自らが支出する間接経費の項目';
COMMENT ON COLUMN expenditure_flows.indirect_cost_amount IS '国自らが支出する間接経費の金額';

CREATE TABLE IF NOT EXISTS "expenditure_usages" (
    "project_year" BIGINT,                -- 事業年度
    "project_id" TEXT,                    -- 予算事業ID
    "seq_no" BIGINT,
    "block_number" TEXT,                  -- 支出先ブロック番号
    "recipient_name" TEXT,                -- 支出先名
    "corporate_number" TEXT,              -- 法人番号
    "contract_summary" TEXT,              -- 契約概要
    "expense_item" TEXT,                  -- 費目
    "usage" TEXT,                         -- 使途
    "amount" TEXT,                        -- 金額
    PRIMARY KEY ("project_year", "project_id", "seq_no")
);

COMMENT ON COLUMN expenditure_usages.project_year IS '事業年度';
COMMENT ON COLUMN expenditure_usages.project_id IS '予算事業ID';
COMMENT ON COLUMN expenditure_usages.block_number IS '支出先ブロック番号';
COMMENT ON COLUMN expenditure_usages.recipient_name IS '支出先名';
COMMENT ON COLUMN expenditure_usages.corporate_number IS '法人番号';
COMMENT ON COLUMN expenditure_usages.contract_summary IS '契約概要';
COMMENT ON COLUMN expenditure_usages.expense_item IS '費目';
COMMENT ON COLUMN expenditure_usages.usage IS '使途';
COMMENT ON COLUMN expenditure_usages.amount IS '金額';

CREATE TABLE IF NOT EXISTS "expenditure_contracts" (
    "project_year" BIGINT,                -- 事業年度
    "project_id" TEXT,                    -- 予算事業ID
    "seq_no" BIGINT,
    "block_number" TEXT,                  -- 支出先ブロック（国庫債務負担行為等による契約）
    "contractor_name" TEXT,               -- 契約先名（国庫債務負担行為等による契約）
    "contractor_corporate_number" TEXT,   -- 契約先の法人番号（国庫債務負担行為等による契約）
    "contractor_location" TEXT,           -- 契約先の所在地（国庫債務負担行為等による契約）
    "contractor_type" TEXT,               -- 契約先の法人種別（国庫債務負担行為等による契約）
    "contract_summary" TEXT,              -- 契約概要（契約名）（国庫債務負担行為等による契約）
    "other_contract" TEXT,                -- その他の契約
    "contract_amount" TEXT,               -- 契約額（国庫債務負担行為等による契約）
    "contract_method" TEXT,               -- 契約方式等（国庫債務負担行為等による契約）
    "specific_contract_method" TEXT,      -- 具体的な契約方式等（国庫債務負担行為等による契約）
    "num_bidders" TEXT,                   -- 入札者数（応募者数）（国庫債務負担行為等による契約）
    "bid_rate" TEXT,                      -- 落札率（％）（国庫債務負担行為等による契約）
    "sole_bid_reason" TEXT,               -- 一者応札・一者応募又は競争性のない随意契約となった理由及び改善策（契約額10億円以上）（国庫債務負担行為等による契約）
    "other_contract_detail" TEXT,         -- その他の契約（国庫債務負担行為等による契約）
    PRIMARY KEY ("project_year", "project_id", "seq_no")
);

COMMENT ON COLUMN expenditure_contracts.project_year IS '事業年度';
COMMENT ON COLUMN expenditure_contracts.project_id IS '予算事業ID';
COMMENT ON COLUMN expenditure_contracts.block_number IS '支出先ブロック（国庫債務負担行為等による契約）';
COMMENT ON COLUMN expenditure_contracts.contractor_name IS '契約先名（国庫債務負担行為等による契約）';
COMMENT ON COLUMN expenditure_contracts.contractor_corporate_number IS '契約先の法人番号（国庫債務負担行為等による契約）';
COMMENT ON COLUMN expenditure_contracts.contractor_location IS '契約先の所在地（国庫債務負担行為等による契約）';
COMMENT ON COLUMN expenditure_contracts.contractor_type IS '契約先の法人種別（国庫債務負担行為等による契約）';
COMMENT ON COLUMN expenditure_contracts.contract_summary IS '契約概要（契約名）（国庫債務負担行為等による契約）';
COMMENT ON COLUMN expenditure_contracts.other_contract IS 'その他の契約';
COMMENT ON COLUMN expenditure_contracts.contract_amount IS '契約額（国庫債務負担行為等による契約）';
COMMENT ON COLUMN expenditure_contracts.contract_method IS '契約方式等（国庫債務負担行為等による契約）';
COMMENT ON COLUMN expenditure_contracts.specific_contract_method IS '具体的な契約方式等（国庫債務負担行為等による契約）';
COMMENT ON COLUMN expenditure_contracts.num_bidders IS '入札者数（応募者数）（国庫債務負担行為等による契約）';
COMMENT ON COLUMN expenditure_contracts.bid_rate IS '落札率（％）（国庫債務負担行為等による契約）';
COMMENT ON COLUMN expenditure_contracts.sole_bid_reason IS '一者応札・一者応募又は競争性のない随意契約となった理由及び改善策（契約額10億円以上）（国庫債務負担行為等による契約）';
COMMENT ON COLUMN expenditure_contracts.other_contract_detail IS 'その他の契約（国庫債務負担行為等による契約）';

-- ============================================================
-- ビュー定義
-- ============================================================

-- 基本情報セクション

CREATE OR REPLACE VIEW policies_with_project AS
SELECT
    pm.project_name,
    pm.ministry,
    pm.bureau,
    p.*
FROM policies p
JOIN projects_master pm USING (project_year, project_id);

CREATE OR REPLACE VIEW laws_with_project AS
SELECT
    pm.project_name,
    pm.ministry,
    pm.bureau,
    l.*
FROM laws l
JOIN projects_master pm USING (project_year, project_id);

CREATE OR REPLACE VIEW subsidies_with_project AS
SELECT
    pm.project_name,
    pm.ministry,
    pm.bureau,
    s.*
FROM subsidies s
JOIN projects_master pm USING (project_year, project_id);

CREATE OR REPLACE VIEW related_projects_with_project AS
SELECT
    pm.project_name,
    pm.ministry,
    pm.bureau,
    rp.*
FROM related_projects rp
JOIN projects_master pm USING (project_year, project_id);

-- 予算・執行セクション

CREATE OR REPLACE VIEW budgets_with_project AS
SELECT
    pm.project_name,
    pm.ministry,
    pm.bureau,
    b.*
FROM budgets b
JOIN projects_master pm USING (project_year, project_id);

CREATE OR REPLACE VIEW budget_items_with_project AS
SELECT
    pm.project_name,
    pm.ministry,
    pm.bureau,
    bi.*
FROM budget_items bi
JOIN projects_master pm USING (project_year, project_id);

-- 支出先セクション

CREATE OR REPLACE VIEW expenditures_with_project AS
SELECT
    pm.project_name,
    pm.ministry,
    pm.bureau,
    e.*
FROM expenditures e
JOIN projects_master pm USING (project_year, project_id);

CREATE OR REPLACE VIEW expenditure_flows_with_project AS
SELECT
    pm.project_name,
    pm.ministry,
    pm.bureau,
    ef.*
FROM expenditure_flows ef
JOIN projects_master pm USING (project_year, project_id);

CREATE OR REPLACE VIEW expenditure_usages_with_project AS
SELECT
    pm.project_name,
    pm.ministry,
    pm.bureau,
    eu.*
FROM expenditure_usages eu
JOIN projects_master pm USING (project_year, project_id);

CREATE OR REPLACE VIEW expenditure_contracts_with_project AS
SELECT
    pm.project_name,
    pm.ministry,
    pm.bureau,
    ec.*
FROM expenditure_contracts ec
JOIN projects_master pm USING (project_year, project_id);

-- 統合ビュー

CREATE OR REPLACE VIEW projects_summary AS
SELECT
    pm.project_year,
    pm.project_id,
    pm.project_name,
    pm.ministry,
    pm.bureau,
    pm.project_category,
    pm.overview,
    COUNT(DISTINCT p.seq_no) as policy_count,
    COUNT(DISTINCT l.seq_no) as law_count,
    COUNT(DISTINCT s.seq_no) as subsidy_count,
    COUNT(DISTINCT b.seq_no) as budget_count,
    COUNT(DISTINCT e.seq_no) as expenditure_count
FROM projects_master pm
LEFT JOIN policies p USING (project_year, project_id)
LEFT JOIN laws l USING (project_year, project_id)
LEFT JOIN subsidies s USING (project_year, project_id)
LEFT JOIN budgets b USING (project_year, project_id)
LEFT JOIN expenditures e USING (project_year, project_id)
GROUP BY
    pm.project_year,
    pm.project_id,
    pm.project_name,
    pm.ministry,
    pm.bureau,
    pm.project_category,
    pm.overview;
