import { NextResponse } from 'next/server';
import { executeSQLQuery, supabase } from '@/lib/supabase';

/**
 * ダッシュボード用の統計データを取得するAPIエンドポイント
 */
export async function GET() {
  try {
    // 1. 総支出額と基本統計
    const uniqueProjectCountQuery = `SELECT COUNT(DISTINCT "事業名") as count FROM govis_main_data WHERE "事業名" IS NOT NULL AND "事業名" != ''`;
    const uniqueProjectCountResult = await executeSQLQuery(uniqueProjectCountQuery);

    if (!uniqueProjectCountResult.success) {
      console.error('ユニーク事業数取得エラー:', uniqueProjectCountResult.error);
      return NextResponse.json({ error: `ユニーク事業数の取得に失敗しました: ${uniqueProjectCountResult.error}` }, { status: 500 });
    }
    const totalProjects = uniqueProjectCountResult.data?.[0]?.count || 0;

    const { data: totalStats, error: totalError } = await supabase
      .from('govis_main_data')
      .select('*')
      .not('金額', 'is', null)
      .neq('金額', '');

    if (totalError) {
      console.error('総統計取得エラー:', totalError);
      return NextResponse.json({ error: '総統計データの取得に失敗しました' }, { status: 500 });
    }

    // 2. 府省庁別支出構成
    const { data: ministryData, error: ministryError } = await supabase
      .from('govis_main_data')
      .select('*')
      .not('政策所管府省庁', 'is', null)
      .not('金額', 'is', null)
      .neq('金額', '');

    if (ministryError) {
      console.error('府省庁別データ取得エラー:', ministryError);
      return NextResponse.json({ error: '府省庁別データの取得に失敗しました' }, { status: 500 });
    }

    // 3. 契約方式別分析
    const { data: contractTypeData, error: contractTypeError } = await supabase
      .from('govis_main_data')
      .select('*')
      .not('契約方式等', 'is', null);

    if (contractTypeError) {
      console.error('契約方式データ取得エラー:', contractTypeError);
      return NextResponse.json({ error: '契約方式データの取得に失敗しました' }, { status: 500 });
    }

    // 4. 契約先分析
    const { data: contractorData, error: contractorError } = await supabase
      .from('govis_main_data')
      .select('*')
      .not('支出先名', 'is', null)
      .not('金額', 'is', null)
      .neq('金額', '');

    if (contractorError) {
      console.error('契約先データ取得エラー:', contractorError);
      return NextResponse.json({ error: '契約先データの取得に失敗しました' }, { status: 500 });
    }

    // 5. 高額契約案件
    const { data: highValueData, error: highValueError } = await supabase
      .from('govis_main_data')
      .select('*')
      .not('事業名', 'is', null)
      .not('金額', 'is', null)
      .neq('金額', '')
      .order('金額', { ascending: false })
      .limit(10);

    if (highValueError) {
      console.error('高額契約データ取得エラー:', highValueError);
      return NextResponse.json({ error: '高額契約データの取得に失敗しました' }, { status: 500 });
    }

        // 6. 最新事業年度（契約締結日の代替）
    const { data: latestContractData, error: latestContractError } = await supabase
      .from('govis_main_data')
      .select('*')
      .not('事業年度', 'is', null)
      .order('事業年度', { ascending: false })
      .limit(1);

    if (latestContractError) {
      console.error('最新年度取得エラー:', latestContractError);
      return NextResponse.json({ error: '最新年度の取得に失敗しました' }, { status: 500 });
    }

    // 安全にデータを処理するヘルパー関数
    const safeGetValue = (row: Record<string, unknown>, key: string): string => {
      const value = row[key];
      return typeof value === 'string' ? value : '';
    };

    const safeParseFloat = (value: string): number => {
      const parsed = Number.parseFloat(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    // データ処理
    const totalAmount = (totalStats || []).reduce((sum, item) => {
      const amount = safeParseFloat(safeGetValue(item, '金額'));
      return sum + amount;
    }, 0);

    // デバッグ情報をログ出力
    console.log('デバッグ情報:');
    console.log(`- SQLから取得したユニークな事業名数: ${totalProjects}`);
    console.log(`- 総支出額データ数: ${totalStats?.length || 0}`);

    // 府省庁別集計
    const ministryStats: Record<string, number> = {};
    (ministryData || []).forEach(item => {
      const ministry = safeGetValue(item, '政策所管府省庁');
      const amount = safeParseFloat(safeGetValue(item, '金額'));
      if (ministry && amount > 0) {
        ministryStats[ministry] = (ministryStats[ministry] || 0) + amount;
      }
    });

    const topMinistries = Object.entries(ministryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([ministry, amount]) => ({
        ministry,
        amount,
        percentage: (amount / totalAmount) * 100
      }));

    // 契約方式別集計
    const contractTypeStats: Record<string, number> = {};
    (contractTypeData || []).forEach(item => {
      const type = safeGetValue(item, '契約方式等');
      if (type) {
        contractTypeStats[type] = (contractTypeStats[type] || 0) + 1;
      }
    });

    const contractTypePercentages = Object.entries(contractTypeStats).map(([type, count]) => ({
      type,
      count,
      percentage: (count / (contractTypeData?.length || 1)) * 100
    }));

    // 契約先別集計
    const contractorStats: Record<string, { count: number; amount: number }> = {};
    (contractorData || []).forEach(item => {
      const contractor = safeGetValue(item, '支出先名');
      const amount = safeParseFloat(safeGetValue(item, '金額'));
      if (contractor && amount > 0) {
        if (!contractorStats[contractor]) {
          contractorStats[contractor] = { count: 0, amount: 0 };
        }
        contractorStats[contractor].count += 1;
        contractorStats[contractor].amount += amount;
      }
    });

    const topContractors = Object.entries(contractorStats)
      .sort(([,a], [,b]) => b.amount - a.amount)
      .slice(0, 5)
      .map(([contractor, data]) => ({
        contractor,
        amount: data.amount,
        count: data.count
      }));

    // 事業規模分布
    const sizeDistribution: Record<string, number> = {};
    (totalStats || []).forEach(item => {
      const amount = safeParseFloat(safeGetValue(item, '金額'));
      if (amount > 0) {
        let category: string;
        if (amount < 1000000) category = '100万円未満';
        else if (amount < 10000000) category = '100万円〜1000万円';
        else if (amount < 100000000) category = '1000万円〜1億円';
        else if (amount < 1000000000) category = '1億円〜10億円';
        else category = '10億円以上';

        sizeDistribution[category] = (sizeDistribution[category] || 0) + 1;
      }
    });

    // 支出先統計
    const uniqueContractors = new Set((contractorData || []).map(item => safeGetValue(item, '支出先名')).filter(Boolean)).size;
    const averageAmount = totalProjects > 0 ? totalAmount / totalProjects : 0;

    // 競争性指標計算
    const competitiveTypes = ['一般競争入札', '指名競争入札'];
    const competitiveCount = contractTypePercentages
      .filter(item => competitiveTypes.some(type => item.type.includes(type)))
      .reduce((sum, item) => sum + item.count, 0);
    const competitiveness = (contractTypeData?.length || 0) > 0 ? (competitiveCount / contractTypeData.length) * 100 : 0;

    const dashboardData = {
      summary: {
        totalAmount,
        totalProjects,
        uniqueContractors,
        averageAmount,
        competitiveness,
        lastUpdated: (latestContractData?.[0] ? safeGetValue(latestContractData[0], '事業年度') : null)
      },
      ministryBreakdown: topMinistries,
      contractTypes: contractTypePercentages,
      topContractors,
      sizeDistribution,
      highValueContracts: (highValueData || []).slice(0, 3).map((item, index) => ({
        contractName: safeGetValue(item, '事業名'),
        amount: safeGetValue(item, '金額'),
        ministry: safeGetValue(item, '政策所管府省庁'),
        id: `contract-${index}-${safeGetValue(item, '事業名')}-${safeGetValue(item, '金額')}`
      }))
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('ダッシュボードAPI エラー:', error);
    return NextResponse.json(
      { error: 'ダッシュボードデータの取得に失敗しました' },
      { status: 500 }
    );
  }
}
