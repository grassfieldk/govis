-- ============================================================
-- 基本情報
-- ============================================================

-- policies_with_project: 政策情報に事業名を付与
CREATE VIEW IF NOT EXISTS policies_with_project AS
SELECT
    pm.project_name,
    pm.ministry,
    pm.bureau,
    p.*
FROM policies p
JOIN projects_master pm USING (project_year, project_id);

-- laws_with_project: 法令情報に事業名を付与
CREATE VIEW IF NOT EXISTS laws_with_project AS
SELECT
    pm.project_name,
    pm.ministry,
    pm.bureau,
    l.*
FROM laws l
JOIN projects_master pm USING (project_year, project_id);

-- subsidies_with_project: 補助率情報に事業名を付与
CREATE VIEW IF NOT EXISTS subsidies_with_project AS
SELECT
    pm.project_name,
    pm.ministry,
    pm.bureau,
    s.*
FROM subsidies s
JOIN projects_master pm USING (project_year, project_id);

-- related_projects_with_project: 関連事業情報に事業名を付与
CREATE VIEW IF NOT EXISTS related_projects_with_project AS
SELECT
    pm.project_name,
    pm.ministry,
    pm.bureau,
    rp.*
FROM related_projects rp
JOIN projects_master pm USING (project_year, project_id);

-- ============================================================
-- 予算・執行
-- ============================================================

-- budgets_with_project: 予算サマリに事業名を付与
CREATE VIEW IF NOT EXISTS budgets_with_project AS
SELECT
    pm.project_name,
    pm.ministry,
    pm.bureau,
    b.*
FROM budgets b
JOIN projects_master pm USING (project_year, project_id);

-- budget_items_with_project: 予算項目に事業名を付与
CREATE VIEW IF NOT EXISTS budget_items_with_project AS
SELECT
    pm.project_name,
    pm.ministry,
    pm.bureau,
    bi.*
FROM budget_items bi
JOIN projects_master pm USING (project_year, project_id);

-- ============================================================
-- 支出先
-- ============================================================

-- expenditures_with_project: 支出先情報に事業名を付与
CREATE VIEW IF NOT EXISTS expenditures_with_project AS
SELECT
    pm.project_name,
    pm.ministry,
    pm.bureau,
    e.*
FROM expenditures e
JOIN projects_master pm USING (project_year, project_id);

-- expenditure_flows_with_project: 支出ブロックの流れに事業名を付与
CREATE VIEW IF NOT EXISTS expenditure_flows_with_project AS
SELECT
    pm.project_name,
    pm.ministry,
    pm.bureau,
    ef.*
FROM expenditure_flows ef
JOIN projects_master pm USING (project_year, project_id);

-- expenditure_usages_with_project: 費目・使途に事業名を付与
CREATE VIEW IF NOT EXISTS expenditure_usages_with_project AS
SELECT
    pm.project_name,
    pm.ministry,
    pm.bureau,
    eu.*
FROM expenditure_usages eu
JOIN projects_master pm USING (project_year, project_id);

-- expenditure_contracts_with_project: 契約情報に事業名を付与
CREATE VIEW IF NOT EXISTS expenditure_contracts_with_project AS
SELECT
    pm.project_name,
    pm.ministry,
    pm.bureau,
    ec.*
FROM expenditure_contracts ec
JOIN projects_master pm USING (project_year, project_id);

-- ============================================================
-- 統合
-- ============================================================

-- projects_summary: 事業ごとの関連情報サマリ
CREATE VIEW IF NOT EXISTS projects_summary AS
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

-- ============================================================
-- 使用例
-- ============================================================
--
-- 1. 政策情報を事業名付きで取得:
--    SELECT * FROM policies_with_project WHERE project_id = '0001';
--
-- 2. 支出先情報を事業名付きで取得:
--    SELECT * FROM expenditures_with_project
--    WHERE ministry = '内閣府'
--    ORDER BY amount DESC LIMIT 10;
--
-- 3. 事業サマリを取得:
--    SELECT * FROM projects_summary
--    WHERE policy_count > 0 OR expenditure_count > 0
--    ORDER BY expenditure_count DESC;
--
