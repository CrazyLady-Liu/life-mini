import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency, equipmentCategories } from '@/utils/format';
import {
  calculateAllHealthScores,
  getHealthScoreColor,
  getRiskLevelLabel,
  getRiskLevelColor,
  getHealthStats,
  getCategoryHealthStats,
} from '@/utils/health';
import {
  Trophy,
  TrendingUp,
  Clock,
  Package,
  Heart,
  AlertTriangle,
  Calendar as CalendarIcon,
  Wrench,
  Activity,
  ShieldAlert,
  Zap,
} from 'lucide-react';

export default function UsageStatsPage() {
  const { equipments, rentals, customers, damageRecords, maintenances } = useAppStore();
  const [timeRange, setTimeRange] = useState('all');
  const [activeTab, setActiveTab] = useState<'usage' | 'health'>('usage');

  const healthScores = useMemo(() => {
    return calculateAllHealthScores(equipments, damageRecords, maintenances);
  }, [equipments, damageRecords, maintenances]);

  const healthStats = useMemo(() => {
    return getHealthStats(healthScores);
  }, [healthScores]);

  const topEquipments = useMemo(() => {
    return [...equipments]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
      .map((eq) => ({
        name: eq.name,
        使用次数: eq.usageCount,
        category: eq.category,
      }));
  }, [equipments]);

  const categoryStats = useMemo(() => {
    const categoryMap = new Map<string, { count: number; usage: number }>();
    
    equipments.forEach((eq) => {
      const existing = categoryMap.get(eq.category) || { count: 0, usage: 0 };
      categoryMap.set(eq.category, {
        count: existing.count + 1,
        usage: existing.usage + eq.usageCount,
      });
    });
    
    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      装备数量: data.count,
      使用次数: data.usage,
    }));
  }, [equipments]);

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#64748b'];

  const rentalTrend = useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const now = new Date();
    const data = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIndex = date.getMonth();
      const monthRentals = rentals.filter((r) => {
        const rDate = new Date(r.createdAt);
        return rDate.getMonth() === monthIndex && rDate.getFullYear() === date.getFullYear();
      });
      const revenue = monthRentals.reduce((sum, r) => sum + r.price, 0);
      
      data.push({
        name: months[monthIndex],
        租赁次数: monthRentals.length,
        收入: revenue,
      });
    }
    
    return data;
  }, [rentals]);

  const customerStats = useMemo(() => {
    return [...customers]
      .sort((a, b) => b.rentalCount - a.rentalCount)
      .slice(0, 5)
      .map((c) => ({
        name: c.name,
        租赁次数: c.rentalCount,
      }));
  }, [customers]);

  const totalUsageCount = useMemo(() => {
    return equipments.reduce((sum, eq) => sum + eq.usageCount, 0);
  }, [equipments]);

  const avgUsageCount = useMemo(() => {
    if (equipments.length === 0) return 0;
    return Math.round(totalUsageCount / equipments.length);
  }, [equipments, totalUsageCount]);

  const mostUsedEquipment = useMemo(() => {
    if (equipments.length === 0) return null;
    return [...equipments].sort((a, b) => b.usageCount - a.usageCount)[0];
  }, [equipments]);

  const healthDistribution = useMemo(() => {
    const ranges = [
      { name: '优秀 (80-100)', min: 80, max: 100, count: 0 },
      { name: '良好 (60-79)', min: 60, max: 79, count: 0 },
      { name: '一般 (40-59)', min: 40, max: 59, count: 0 },
      { name: '较差 (0-39)', min: 0, max: 39, count: 0 },
    ];

    healthScores.forEach((h) => {
      for (const range of ranges) {
        if (h.healthScore >= range.min && h.healthScore <= range.max) {
          range.count++;
          break;
        }
      }
    });

    return ranges.filter((r) => r.count > 0).map((r) => ({
      name: r.name,
      value: r.count,
    }));
  }, [healthScores]);

  const highRiskEquipments = useMemo(() => {
    return healthScores
      .filter((h) => h.riskLevel === 'high' || h.remainingLifespanDays <= 90)
      .sort((a, b) => a.healthScore - b.healthScore)
      .slice(0, 8)
      .map((h) => {
        const equipment = equipments.find((e) => e.id === h.equipmentId);
        return {
          ...h,
          name: equipment?.name || '未知',
          category: equipment?.category || '未知',
        };
      });
  }, [healthScores, equipments]);

  const healthRankings = useMemo(() => {
    return healthScores
      .sort((a, b) => b.healthScore - a.healthScore)
      .slice(0, 10)
      .map((h) => {
        const equipment = equipments.find((e) => e.id === h.equipmentId);
        return {
          name: equipment?.name || '未知',
          健康度: h.healthScore,
          category: equipment?.category || '未知',
        };
      });
  }, [healthScores, equipments]);

  const categoryHealthStats = useMemo(() => {
    return getCategoryHealthStats(healthScores, equipments);
  }, [healthScores, equipments]);

  const selectedEquipmentHealth = useMemo(() => {
    if (healthRankings.length === 0) return null;
    const topHealth = healthScores.find((h) => h.healthScore === healthRankings[0]?.健康度);
    if (!topHealth) return null;
    
    return [
      { subject: '使用磨损', A: topHealth.wearRate, fullMark: 100 },
      { subject: '损耗记录', A: 100 - topHealth.damageScore, fullMark: 100 },
      { subject: '维护状况', A: 100 - topHealth.maintenanceScore, fullMark: 100 },
      { subject: '使用年限', A: 100 - topHealth.ageScore, fullMark: 100 },
    ];
  }, [healthRankings, healthScores]);

  const HEALTH_COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">使用统计</h2>
          <p className="text-gray-500 mt-1">装备使用次数、健康度和租赁数据分析</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('usage')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'usage'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              使用统计
            </button>
            <button
              onClick={() => setActiveTab('health')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'health'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              健康度评估
            </button>
          </div>
          {activeTab === 'usage' && (
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">全部时间</option>
              <option value="year">本年度</option>
              <option value="quarter">本季度</option>
              <option value="month">本月</option>
            </select>
          )}
        </div>
      </div>

      {activeTab === 'usage' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">累计使用次数</p>
                  <p className="text-3xl font-bold mt-1">{totalUsageCount}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">装备总数</p>
                  <p className="text-3xl font-bold mt-1">{equipments.length}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">平均使用次数</p>
                  <p className="text-3xl font-bold mt-1">{avgUsageCount} 次/件</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">最热门装备</p>
                  <p className="text-xl font-bold mt-1 truncate">
                    {mostUsedEquipment?.name || '-'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">租赁收入趋势</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rentalTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === '收入') return [formatCurrency(value), name];
                        return [value, name];
                      }}
                    />
                    <Bar yAxisId="left" dataKey="租赁次数" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="收入" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">装备分类使用占比</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="使用次数"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">装备使用次数排名</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topEquipments} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar dataKey="使用次数" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">活跃客户排名</h3>
              <div className="space-y-4">
                {customerStats.map((customer, index) => (
                  <div key={customer.name} className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                        index === 0
                          ? 'bg-amber-500'
                          : index === 1
                          ? 'bg-gray-400'
                          : index === 2
                          ? 'bg-amber-700'
                          : 'bg-gray-300'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{customer.name}</span>
                        <span className="text-sm text-gray-500">{customer.租赁次数} 次</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{
                            width: `${(customer.租赁次数 / customerStats[0].租赁次数) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">分类详情统计</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      分类
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      装备数量
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      累计使用次数
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      平均使用次数
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      使用率排名
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categoryStats
                    .sort((a, b) => b.使用次数 - a.使用次数)
                    .map((stat, index) => (
                      <tr key={stat.name} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></div>
                            <span className="font-medium text-gray-900">{stat.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600">
                          {stat.装备数量} 件
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-emerald-600">
                          {stat.使用次数} 次
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600">
                          {Math.round(stat.使用次数 / stat.装备数量)} 次/件
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                            {index + 1}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">平均健康度</p>
                  <p className="text-3xl font-bold mt-1">{healthStats.avgScore} 分</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">高风险装备</p>
                  <p className="text-3xl font-bold mt-1">{healthStats.highRisk} 件</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">即将报废</p>
                  <p className="text-3xl font-bold mt-1">{healthStats.soonToScrap} 件</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">累计维护费用</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(healthStats.totalMaintenanceCost)}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Wrench className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">健康度分布</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={healthDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar dataKey="value" name="装备数量" radius={[4, 4, 0, 0]}>
                      {healthDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={HEALTH_COLORS[index % HEALTH_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">风险等级分布</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: '低风险', value: healthStats.lowRisk },
                        { name: '中风险', value: healthStats.medium },
                        { name: '高风险', value: healthStats.highRisk },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-gray-600">低风险</span>
                  </div>
                  <span className="font-medium text-gray-900">{healthStats.lowRisk} 件</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span className="text-gray-600">中风险</span>
                  </div>
                  <span className="font-medium text-gray-900">{healthStats.mediumRisk} 件</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="text-gray-600">高风险</span>
                  </div>
                  <span className="font-medium text-gray-900">{healthStats.highRisk} 件</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                高风险预警列表
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {highRiskEquipments.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-2 text-emerald-300" />
                    <p>暂无高风险装备</p>
                  </div>
                ) : (
                  highRiskEquipments.map((eq) => (
                    <div key={eq.equipmentId} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{eq.name}</span>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${getRiskLevelColor(eq.riskLevel)}20`,
                                color: getRiskLevelColor(eq.riskLevel),
                              }}
                            >
                              {getRiskLevelLabel(eq.riskLevel)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{eq.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold" style={{ color: getHealthScoreColor(eq.healthScore) }}>
                            {eq.healthScore}分
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          月均使用 {eq.monthlyUsageRate} 次
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          预计 {new Date(eq.estimatedScrapDate).toLocaleDateString('zh-CN')} 报废
                        </span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${eq.healthScore}%`,
                            backgroundColor: getHealthScoreColor(eq.healthScore),
                          }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">健康度最佳装备</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={healthRankings.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar dataKey="健康度" radius={[0, 4, 4, 0]}>
                      {healthRankings.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getHealthScoreColor(entry.健康度)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">分类健康度统计</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      分类
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      装备数量
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      平均健康度
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      高风险数量
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      健康状况
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categoryHealthStats
                    .sort((a, b) => b.平均健康度 - a.平均健康度)
                    .map((stat, index) => (
                      <tr key={stat.name} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></div>
                            <span className="font-medium text-gray-900">{stat.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600">
                          {stat.装备数量} 件
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className="font-bold"
                            style={{ color: getHealthScoreColor(stat.平均健康度) }}
                          >
                            {stat.平均健康度} 分
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {stat.高风险数量 > 0 ? (
                            <span className="text-red-600 font-medium">{stat.高风险数量} 件</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${stat.平均健康度}%`,
                                  backgroundColor: getHealthScoreColor(stat.平均健康度),
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">装备健康度明细表</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      装备名称
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      分类
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      健康度得分
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      风险等级
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      使用次数
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      损耗次数
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      维护次数
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      维护费用
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      预计报废日期
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {healthScores
                    .sort((a, b) => a.healthScore - b.healthScore)
                    .map((health) => {
                      const equipment = equipments.find((e) => e.id === health.equipmentId);
                      return (
                        <tr key={health.equipmentId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-900">
                              {equipment?.name || '未知'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600 text-sm">
                            {equipment?.category || '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full"
                                  style={{
                                    width: `${health.healthScore}%`,
                                    backgroundColor: getHealthScoreColor(health.healthScore),
                                  }}
                                ></div>
                              </div>
                              <span
                                className="font-bold text-sm"
                                style={{ color: getHealthScoreColor(health.healthScore) }}
                              >
                                {health.healthScore}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className="text-xs px-2 py-1 rounded-full"
                              style={{
                                backgroundColor: `${getRiskLevelColor(health.riskLevel)}20`,
                                color: getRiskLevelColor(health.riskLevel),
                              }}
                            >
                              {getRiskLevelLabel(health.riskLevel)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600 text-sm">
                            {health.details.usageCount} 次
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600 text-sm">
                            {health.totalDamageCount} 次
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600 text-sm">
                            {health.totalMaintenanceCount} 次
                          </td>
                          <td className="px-4 py-3 text-center text-amber-600 font-medium text-sm">
                            {formatCurrency(health.totalMaintenanceCost)}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600 text-sm">
                            {new Date(health.estimatedScrapDate).toLocaleDateString('zh-CN')}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
