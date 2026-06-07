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
} from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency, equipmentCategories } from '@/utils/format';
import { Trophy, TrendingUp, Clock, Package } from 'lucide-react';

export default function UsageStatsPage() {
  const { equipments, rentals, customers } = useAppStore();
  const [timeRange, setTimeRange] = useState('all');

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">使用统计</h2>
          <p className="text-gray-500 mt-1">装备使用次数和租赁数据分析</p>
        </div>
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
      </div>

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
    </div>
  );
}
