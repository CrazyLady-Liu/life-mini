import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency, formatDate } from '@/utils/format';
import {
  calculateAllHealthScores,
  getHealthScoreColor,
  getRiskLevelLabel,
  getRiskLevelColor,
} from '@/utils/health';
import { exportToCSV } from '@/utils/export';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import Button from './Button';
import {
  ChevronRight,
  ArrowLeft,
  Download,
  User,
  Package,
  FileText,
  AlertTriangle,
  Wrench,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Calendar as CalendarIcon,
  DollarSign,
  Users,
  Activity,
} from 'lucide-react';
import type { Rental, DamageRecord, Maintenance, Equipment } from '@/types';

export type DrillDownLevel =
  | 'monthly'
  | 'allEquipments'
  | 'category'
  | 'equipment'
  | 'rentalDetail'
  | 'damageDetail'
  | 'maintenanceDetail';

export interface DrillDownContext {
  level: DrillDownLevel;
  title: string;
  month?: string;
  monthIndex?: number;
  year?: number;
  category?: string;
  equipmentId?: string;
  equipmentName?: string;
}

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: DrillDownContext;
  onDrillDown: (context: DrillDownContext) => void;
  onDrillUp: () => void;
}

const COLORS = [
  '#10b981',
  '#f59e0b',
  '#3b82f6',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#6366f1',
];

export default function DrillDownModal({
  isOpen,
  onClose,
  context,
  onDrillDown,
  onDrillUp,
}: DrillDownModalProps) {
  const { equipments, rentals, customers, damageRecords, maintenances } =
    useAppStore();

  const healthScores = useMemo(() => {
    return calculateAllHealthScores(equipments, damageRecords, maintenances);
  }, [equipments, damageRecords, maintenances]);

  const getCustomerName = (id: string) => {
    return customers.find((c) => c.id === id)?.name || '未知';
  };

  const getEquipmentName = (id: string) => {
    return equipments.find((e) => e.id === id)?.name || '未知';
  };

  const getMonthlyRentals = (monthIndex: number, year: number) => {
    return rentals.filter((r) => {
      const rDate = new Date(r.createdAt);
      return rDate.getMonth() === monthIndex && rDate.getFullYear() === year;
    });
  };

  const getMonthlyCategoryStats = (monthIndex: number, year: number) => {
    const monthRentals = getMonthlyRentals(monthIndex, year);
    const categoryMap = new Map<string, { count: number; revenue: number }>();

    monthRentals.forEach((r) => {
      const equipment = equipments.find((e) => e.id === r.equipmentId);
      if (!equipment) return;
      const existing = categoryMap.get(equipment.category) || { count: 0, revenue: 0 };
      categoryMap.set(equipment.category, {
        count: existing.count + 1,
        revenue: existing.revenue + r.price,
      });
    });

    return Array.from(categoryMap.entries()).map(([name, data], idx) => ({
      name,
      租赁次数: data.count,
      收入: data.revenue,
      color: COLORS[idx % COLORS.length],
    }));
  };

  const getCategoryEquipments = (category: string) => {
    return equipments
      .filter((eq) => eq.category === category)
      .sort((a, b) => b.usageCount - a.usageCount);
  };

  const getEquipmentRentals = (equipmentId: string) => {
    return rentals.filter((r) => r.equipmentId === equipmentId);
  };

  const getEquipmentDamages = (equipmentId: string) => {
    return damageRecords.filter((d) => d.equipmentId === equipmentId);
  };

  const getEquipmentMaintenances = (equipmentId: string) => {
    return maintenances.filter((m) => m.equipmentId === equipmentId);
  };

  const exportRentals = (rentalList: Rental[], filename: string) => {
    const data = rentalList.map((r) => ({
      ...r,
      customerName: getCustomerName(r.customerId),
      equipmentName: getEquipmentName(r.equipmentId),
    }));
    exportToCSV(data, filename, [
      { key: 'id', label: '租赁单号' },
      { key: 'equipmentName', label: '装备名称' },
      { key: 'customerName', label: '客户姓名' },
      { key: 'startDate', label: '开始日期' },
      { key: 'endDate', label: '结束日期' },
      { key: 'price', label: '租赁费用' },
      { key: 'status', label: '状态' },
      { key: 'notes', label: '备注' },
    ]);
  };

  const exportDamages = (damageList: DamageRecord[], filename: string) => {
    const data = damageList.map((d) => ({
      ...d,
      equipmentName: getEquipmentName(d.equipmentId),
    }));
    exportToCSV(data, filename, [
      { key: 'id', label: '损耗单号' },
      { key: 'equipmentName', label: '装备名称' },
      { key: 'date', label: '登记日期' },
      { key: 'level', label: '损耗程度' },
      { key: 'description', label: '损耗描述' },
      { key: 'reporter', label: '登记人' },
      { key: 'status', label: '状态' },
    ]);
  };

  const exportMaintenances = (maintenanceList: Maintenance[], filename: string) => {
    const data = maintenanceList.map((m) => ({
      ...m,
      equipmentName: getEquipmentName(m.equipmentId),
    }));
    exportToCSV(data, filename, [
      { key: 'id', label: '维护单号' },
      { key: 'equipmentName', label: '装备名称' },
      { key: 'date', label: '维护日期' },
      { key: 'type', label: '维护类型' },
      { key: 'description', label: '维护描述' },
      { key: 'cost', label: '维护费用' },
      { key: 'technician', label: '维护人员' },
      { key: 'status', label: '状态' },
    ]);
  };

  const renderMonthly = () => {
    const { monthIndex, year, month } = context;
    if (monthIndex === undefined || year === undefined) return null;

    const monthRentals = getMonthlyRentals(monthIndex, year);
    const monthCats = getMonthlyCategoryStats(monthIndex, year);
    const revenue = monthRentals.reduce((sum, r) => sum + r.price, 0);
    const uniqueCustomers = new Set(monthRentals.map((r) => r.customerId)).size;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-emerald-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <p className="text-sm text-emerald-600">租赁次数</p>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{monthRentals.length} 次</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-600">租赁收入</p>
            </div>
            <p className="text-2xl font-bold text-amber-700">{formatCurrency(revenue)}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-blue-600">服务客户</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">{uniqueCustomers} 人</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-purple-600" />
              <p className="text-sm text-purple-600">涉及分类</p>
            </div>
            <p className="text-2xl font-bold text-purple-700">{monthCats.length} 个</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-emerald-500" />
            各分类租赁情况（点击下钻查看装备）
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {monthCats.map((cat) => (
              <div
                key={cat.name}
                className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors group"
                onClick={() =>
                  onDrillDown({
                    level: 'category',
                    title: `${month} - ${cat.name}`,
                    month,
                    monthIndex,
                    year,
                    category: cat.name,
                  })
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      <Package className="w-5 h-5" style={{ color: cat.color }} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{cat.name}</p>
                      <p className="text-sm text-gray-500">{cat.租赁次数} 次租赁</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-amber-600">{formatCurrency(cat.收入)}</p>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
            {monthCats.length === 0 && (
              <div className="col-span-2 py-8 text-center text-gray-500">
                本月暂无租赁数据
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" />
              本月租赁记录
            </h4>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() => exportRentals(monthRentals, `${month}-租赁记录`)}
            >
              导出全部
            </Button>
          </div>
          <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-xl">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                    单号
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                    装备
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                    客户
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                    租期
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">
                    费用
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthRentals.slice(0, 20).map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{r.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {getEquipmentName(r.equipmentId)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {getCustomerName(r.customerId)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(r.startDate)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-amber-600 text-right">
                      {formatCurrency(r.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {monthRentals.length > 20 && (
              <div className="py-2 text-center text-xs text-gray-400 bg-gray-50">
                共 {monthRentals.length} 条，显示前 20 条
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const sortedEquipments = useMemo(() => {
    return [...equipments].sort((a, b) => b.usageCount - a.usageCount);
  }, [equipments]);

  const renderAllEquipments = () => {
    const totalUsage = equipments.reduce((sum, e) => sum + e.usageCount, 0);
    const totalValue = equipments.reduce((sum, e) => sum + e.purchasePrice, 0);
    const avgUsage = equipments.length ? Math.round(totalUsage / equipments.length) : 0;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-emerald-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <p className="text-sm text-emerald-600">装备总数</p>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{equipments.length} 件</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-600">累计使用</p>
            </div>
            <p className="text-2xl font-bold text-amber-700">{totalUsage} 次</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-blue-600">平均使用</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">{avgUsage} 次/件</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-purple-600" />
              <p className="text-sm text-purple-600">采购总价值</p>
            </div>
            <p className="text-2xl font-bold text-purple-700">{formatCurrency(totalValue)}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            全部装备使用排行（点击查看装备详情）
          </h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sortedEquipments.map((eq, idx) => {
              const health = healthScores.find((h) => h.equipmentId === eq.id);
              return (
                <div
                  key={eq.id}
                  className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors group"
                  onClick={() =>
                    onDrillDown({
                      level: 'equipment',
                      title: eq.name,
                      equipmentId: eq.id,
                      equipmentName: eq.name,
                    })
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 flex items-center justify-center bg-amber-100 text-amber-700 rounded-full text-sm font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{eq.name}</p>
                        <p className="text-xs text-gray-500">
                          {eq.brand} {eq.model} · {eq.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">{eq.usageCount} 次</p>
                        {health && (
                          <div className="flex items-center gap-1 justify-end">
                            <div className="w-16 bg-gray-200 rounded-full h-1">
                              <div
                                className="h-1 rounded-full"
                                style={{
                                  width: `${health.healthScore}%`,
                                  backgroundColor: getHealthScoreColor(health.healthScore),
                                }}
                              ></div>
                            </div>
                            <span
                              className="text-xs"
                              style={{ color: getHealthScoreColor(health.healthScore) }}
                            >
                              {health.healthScore}分
                            </span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderCategory = () => {
    const { category, month, monthIndex, year } = context;
    const categoryEqs = getCategoryEquipments(category || '');
    const totalUsage = categoryEqs.reduce((sum, e) => sum + e.usageCount, 0);
    const totalValue = categoryEqs.reduce((sum, e) => sum + e.purchasePrice, 0);
    const avgUsage = categoryEqs.length ? Math.round(totalUsage / categoryEqs.length) : 0;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-emerald-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <p className="text-sm text-emerald-600">装备数量</p>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{categoryEqs.length} 件</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-600">累计使用</p>
            </div>
            <p className="text-2xl font-bold text-amber-700">{totalUsage} 次</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-blue-600">平均使用</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">{avgUsage} 次/件</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-purple-600" />
              <p className="text-sm text-purple-600">采购价值</p>
            </div>
            <p className="text-2xl font-bold text-purple-700">{formatCurrency(totalValue)}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            装备使用排行（点击查看装备详情）
          </h4>
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryEqs.slice(0, 10).map((e, i) => ({
                  name: e.name,
                  使用次数: e.usageCount,
                  color: COLORS[i % COLORS.length],
                }))}
                layout="vertical"
                onClick={(data) => {
                  if (data && data.activePayload && data.activePayload[0]) {
                    const item = data.activePayload[0].payload;
                    const eq = categoryEqs.find((e) => e.name === item.name);
                    if (eq) {
                      onDrillDown({
                        level: 'equipment',
                        title: eq.name,
                        month,
                        monthIndex,
                        year,
                        category,
                        equipmentId: eq.id,
                        equipmentName: eq.name,
                      });
                    }
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={80}
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                />
                <Tooltip />
                <Bar dataKey="使用次数" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categoryEqs.map((eq, idx) => {
              const health = healthScores.find((h) => h.equipmentId === eq.id);
              return (
                <div
                  key={eq.id}
                  className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors group"
                  onClick={() =>
                    onDrillDown({
                      level: 'equipment',
                      title: eq.name,
                      month,
                      monthIndex,
                      year,
                      category,
                      equipmentId: eq.id,
                      equipmentName: eq.name,
                    })
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{eq.name}</p>
                        <p className="text-xs text-gray-500">
                          {eq.brand} {eq.model}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-emerald-600 text-sm">
                          {eq.usageCount} 次
                        </p>
                        {health && (
                          <div className="flex items-center gap-1 justify-end">
                            <div className="w-12 bg-gray-200 rounded-full h-1">
                              <div
                                className="h-1 rounded-full"
                                style={{
                                  width: `${health.healthScore}%`,
                                  backgroundColor: getHealthScoreColor(health.healthScore),
                                }}
                              ></div>
                            </div>
                            <span
                              className="text-xs"
                              style={{ color: getHealthScoreColor(health.healthScore) }}
                            >
                              {health.healthScore}分
                            </span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderEquipment = () => {
    const { equipmentId, equipmentName } = context;
    const equipment = equipments.find((e) => e.id === equipmentId);
    const eqRentals = getEquipmentRentals(equipmentId || '');
    const eqDamages = getEquipmentDamages(equipmentId || '');
    const eqMaintenances = getEquipmentMaintenances(equipmentId || '');
    const health = healthScores.find((h) => h.equipmentId === equipmentId);

    if (!equipment) return <div className="py-12 text-center text-gray-500">装备不存在</div>;

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{equipment.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {equipment.brand} {equipment.model} · {equipment.category}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div>
                  <p className="text-xs text-gray-500">采购价格</p>
                  <p className="font-bold text-amber-600">
                    {formatCurrency(equipment.purchasePrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">采购日期</p>
                  <p className="font-medium text-gray-700">
                    {formatDate(equipment.purchaseDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">使用次数</p>
                  <p className="font-bold text-emerald-600">{equipment.usageCount} 次</p>
                </div>
              </div>
            </div>
            {health && (
              <div className="text-right">
                <p className="text-sm text-gray-600">健康度</p>
                <p
                  className="text-3xl font-bold"
                  style={{ color: getHealthScoreColor(health.healthScore) }}
                >
                  {health.healthScore}
                </p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                  style={{
                    backgroundColor: `${getRiskLevelColor(health.riskLevel)}20`,
                    color: getRiskLevelColor(health.riskLevel),
                  }}
                >
                  {getRiskLevelLabel(health.riskLevel)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 cursor-pointer transition-colors group"
            onClick={() =>
              onDrillDown({
                ...context,
                level: 'rentalDetail',
                title: `${equipmentName} - 租赁记录`,
              })
            }
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-200 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">租赁记录</p>
                  <p className="text-sm text-gray-500">共 {eqRentals.length} 条</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    exportRentals(eqRentals, `${equipment.name}-租赁记录`);
                  }}
                  leftIcon={<Download className="w-3 h-3" />}
                >
                  导出
                </Button>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
              </div>
            </div>
          </div>

          <div
            className="p-4 bg-red-50 rounded-xl hover:bg-red-100 cursor-pointer transition-colors group"
            onClick={() =>
              onDrillDown({
                ...context,
                level: 'damageDetail',
                title: `${equipmentName} - 损耗记录`,
              })
            }
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-700" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">损耗记录</p>
                  <p className="text-sm text-gray-500">共 {eqDamages.length} 条</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    exportDamages(eqDamages, `${equipment.name}-损耗记录`);
                  }}
                  leftIcon={<Download className="w-3 h-3" />}
                >
                  导出
                </Button>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
              </div>
            </div>
          </div>

          <div
            className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 cursor-pointer transition-colors group"
            onClick={() =>
              onDrillDown({
                ...context,
                level: 'maintenanceDetail',
                title: `${equipmentName} - 维护记录`,
              })
            }
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">维护记录</p>
                  <p className="text-sm text-gray-500">共 {eqMaintenances.length} 条</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    exportMaintenances(eqMaintenances, `${equipment.name}-维护记录`);
                  }}
                  leftIcon={<Download className="w-3 h-3" />}
                >
                  导出
                </Button>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {health && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h4 className="font-semibold text-gray-900 mb-4">健康度分析</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">使用磨损率</p>
                <p className="text-xl font-bold text-orange-600">{health.wearRate}%</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div
                    className="bg-orange-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(health.wearRate, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">损耗评分</p>
                <p className="text-xl font-bold" style={{ color: getHealthScoreColor(health.damageScore) }}>
                  {health.damageScore}分
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${health.damageScore}%`, backgroundColor: getHealthScoreColor(health.damageScore) }}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">维护评分</p>
                <p className="text-xl font-bold" style={{ color: getHealthScoreColor(health.maintenanceScore) }}>
                  {health.maintenanceScore}分
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${health.maintenanceScore}%`, backgroundColor: getHealthScoreColor(health.maintenanceScore) }}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">预计报废</p>
                <p className="text-lg font-bold text-gray-700">
                  {new Date(health.estimatedScrapDate).toLocaleDateString('zh-CN')}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  剩余 {health.remainingLifespanDays} 天
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRentalDetail = () => {
    const { equipmentId, equipmentName } = context;
    const eqRentals = getEquipmentRentals(equipmentId || '');

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">共 {eqRentals.length} 条租赁记录</p>
          <Button
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() =>
              exportRentals(eqRentals, `${equipmentName || '装备'}-租赁记录`)
            }
          >
            导出全部
          </Button>
        </div>
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  租赁单号
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  客户
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  租期
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  费用
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  状态
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {eqRentals.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{r.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <span className="text-sm text-gray-900">
                        {getCustomerName(r.customerId)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(r.startDate)} ~ {formatDate(r.endDate)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-amber-600 text-right">
                    {formatCurrency(r.price)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={r.status} variant="rental" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {eqRentals.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>暂无租赁记录</p>
          </div>
        )}
      </div>
    );
  };

  const renderDamageDetail = () => {
    const { equipmentId, equipmentName } = context;
    const eqDamages = getEquipmentDamages(equipmentId || '');

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">共 {eqDamages.length} 条损耗记录</p>
          <Button
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() =>
              exportDamages(eqDamages, `${equipmentName || '装备'}-损耗记录`)
            }
          >
            导出全部
          </Button>
        </div>
        <div className="space-y-3">
          {eqDamages.map((d) => (
            <div key={d.id} className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      d.level === 'severe'
                        ? 'bg-red-100'
                        : d.level === 'moderate'
                        ? 'bg-amber-100'
                        : 'bg-green-100'
                    }`}
                  >
                    <AlertTriangle
                      className={`w-5 h-5 ${
                        d.level === 'severe'
                          ? 'text-red-600'
                          : d.level === 'moderate'
                          ? 'text-amber-600'
                          : 'text-green-600'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{d.description}</span>
                      <StatusBadge status={d.level} variant="damage" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(d.date)} · 登记人：{d.reporter}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      状态：
                      {d.status === 'reported'
                        ? '待处理'
                        : d.status === 'repaired'
                        ? '已修复'
                        : '已报废'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {eqDamages.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>暂无损耗记录</p>
          </div>
        )}
      </div>
    );
  };

  const renderMaintenanceDetail = () => {
    const { equipmentId, equipmentName } = context;
    const eqMaintenances = getEquipmentMaintenances(equipmentId || '');

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">共 {eqMaintenances.length} 条维护记录</p>
          <Button
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() =>
              exportMaintenances(eqMaintenances, `${equipmentName || '装备'}-维护记录`)
            }
          >
            导出全部
          </Button>
        </div>
        <div className="space-y-3">
          {eqMaintenances.map((m) => (
            <div key={m.id} className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{m.type}</span>
                      <StatusBadge status={m.status} variant="maintenance" />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{m.description}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(m.date)} · 维护人员：{m.technician}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-600">{formatCurrency(m.cost)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {eqMaintenances.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <Wrench className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>暂无维护记录</p>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (context.level) {
      case 'monthly':
        return renderMonthly();
      case 'allEquipments':
        return renderAllEquipments();
      case 'category':
        return renderCategory();
      case 'equipment':
        return renderEquipment();
      case 'rentalDetail':
        return renderRentalDetail();
      case 'damageDetail':
        return renderDamageDetail();
      case 'maintenanceDetail':
        return renderMaintenanceDetail();
      default:
        return null;
    }
  };

  const getBreadcrumbs = () => {
    const crumbs: { label: string; level: DrillDownLevel }[] = [];
    if (context.level === 'monthly' || context.month) {
      crumbs.push({ label: context.month || '月度概览', level: 'monthly' });
    }
    if (context.level === 'allEquipments') {
      crumbs.push({ label: '全部装备', level: 'allEquipments' });
    }
    if (context.category) {
      crumbs.push({ label: context.category, level: 'category' });
    }
    if (context.equipmentName) {
      crumbs.push({ label: context.equipmentName, level: 'equipment' });
    }
    if (context.level === 'rentalDetail') {
      crumbs.push({ label: '租赁记录', level: 'rentalDetail' });
    }
    if (context.level === 'damageDetail') {
      crumbs.push({ label: '损耗记录', level: 'damageDetail' });
    }
    if (context.level === 'maintenanceDetail') {
      crumbs.push({ label: '维护记录', level: 'maintenanceDetail' });
    }
    return crumbs;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={context.title} size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={onDrillUp}
            className="flex items-center gap-1 text-gray-500 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
          <span className="text-gray-300">|</span>
          <span className="text-gray-400">数据溯源：</span>
          <span className="text-emerald-600 font-medium">总览</span>
          {getBreadcrumbs().map((crumb, idx) => (
            <span key={idx} className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <span
                className={
                  idx === getBreadcrumbs().length - 1
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-emerald-600 cursor-pointer'
                }
              >
                {crumb.label}
              </span>
            </span>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-2">{renderContent()}</div>
      </div>
    </Modal>
  );
}
