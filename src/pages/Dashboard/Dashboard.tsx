import { useMemo } from 'react';
import {
  Package,
  Users,
  ClipboardList,
  Wrench,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  Plus,
  ArrowRight,
} from 'lucide-react';
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
  LineChart,
  Line,
} from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/utils/format';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const { equipments, customers, rentals, maintenances, damageRecords } = useAppStore();

  const stats = useMemo(() => {
    const totalEquipment = equipments.length;
    const availableEquipment = equipments.filter((e) => e.status === 'available').length;
    const rentedEquipment = equipments.filter((e) => e.status === 'rented').length;
    const maintenanceEquipment = equipments.filter((e) => e.status === 'maintenance').length;
    const totalCustomers = customers.length;
    const activeRentals = rentals.filter((r) => r.status === 'active').length;
    
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    const monthlyRevenue = rentals
      .filter((r) => {
        const date = new Date(r.createdAt);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      })
      .reduce((sum, r) => sum + r.price, 0);
    
    const monthlyMaintenanceCost = maintenances
      .filter((m) => {
        const date = new Date(m.date);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      })
      .reduce((sum, m) => sum + m.cost, 0);
    
    const totalDamageRecords = damageRecords.length;
    const pendingMaintenance = maintenances.filter((m) => m.status === 'pending' || m.status === 'in_progress').length;
    
    return {
      totalEquipment,
      availableEquipment,
      rentedEquipment,
      maintenanceEquipment,
      totalCustomers,
      activeRentals,
      monthlyRevenue,
      monthlyMaintenanceCost,
      totalDamageRecords,
      pendingMaintenance,
    };
  }, [equipments, customers, rentals, maintenances, damageRecords]);

  const equipmentByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();
    equipments.forEach((e) => {
      categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + 1);
    });
    return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
  }, [equipments]);

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#64748b'];

  const monthlyRentalData = useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const now = new Date();
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
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

  const equipmentStatusData = useMemo(() => {
    return [
      { name: '在库可用', value: stats.availableEquipment, color: '#10b981' },
      { name: '已租出', value: stats.rentedEquipment, color: '#3b82f6' },
      { name: '维护中', value: stats.maintenanceEquipment, color: '#f59e0b' },
      { name: '损坏待修', value: equipments.filter((e) => e.status === 'damaged').length, color: '#ef4444' },
    ];
  }, [stats, equipments]);

  const recentRentals = useMemo(() => {
    return [...rentals]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [rentals]);

  const getEquipmentName = (id: string) => equipments.find((e) => e.id === id)?.name || '未知';
  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name || '未知';

  const quickActions = [
    { label: '新增装备', icon: Package, path: '/equipment', color: 'emerald' },
    { label: '新增租赁', icon: ClipboardList, path: '/rentals', color: 'blue' },
    { label: '损耗登记', icon: AlertTriangle, path: '/damage', color: 'amber' },
    { label: '维护记录', icon: Wrench, path: '/maintenance', color: 'purple' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">欢迎回来 👋</h2>
          <p className="text-gray-500 mt-1">这是您的露营装备租赁台账概览</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">今天是</p>
          <p className="text-lg font-semibold text-gray-800">{formatDate(new Date())}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="装备总数"
          value={stats.totalEquipment}
          icon={Package}
          color="emerald"
          trend={`${stats.availableEquipment} 台可用`}
          trendUp
        />
        <StatCard
          title="客户总数"
          value={stats.totalCustomers}
          icon={Users}
          color="blue"
          trend="本月新增 3 位"
          trendUp
        />
        <StatCard
          title="进行中租赁"
          value={stats.activeRentals}
          icon={ClipboardList}
          color="amber"
          trend={`${stats.rentedEquipment} 台装备在外`}
        />
        <StatCard
          title="本月收入"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={DollarSign}
          color="emerald"
          trend="较上月增长 12%"
          trendUp
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">租赁趋势</h3>
            <span className="text-sm text-gray-500">近6个月</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRentalData}>
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
                />
                <Bar yAxisId="left" dataKey="租赁次数" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="收入" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">装备状态分布</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={equipmentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {equipmentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {equipmentStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900">{item.value} 台</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">快捷操作</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-emerald-50 transition-colors group"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    action.color === 'emerald'
                      ? 'bg-emerald-100 text-emerald-600'
                      : action.color === 'blue'
                      ? 'bg-blue-100 text-blue-600'
                      : action.color === 'amber'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-purple-100 text-purple-600'
                  }`}
                >
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">最近租赁记录</h3>
            <button
              onClick={() => navigate('/rentals')}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              查看全部 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {recentRentals.map((rental) => (
              <div
                key={rental.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{getEquipmentName(rental.equipmentId)}</p>
                    <p className="text-sm text-gray-500">客户：{getCustomerName(rental.customerId)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={rental.status} variant="rental" />
                  <p className="text-sm text-gray-500 mt-1">{formatDate(rental.startDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{stats.totalDamageRecords}</p>
              <p className="text-sm text-amber-600">累计损耗记录</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.pendingMaintenance}</p>
              <p className="text-sm text-blue-600">待处理维护</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-5 border border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(stats.monthlyMaintenanceCost)}</p>
              <p className="text-sm text-red-600">本月维护费用</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(stats.monthlyRevenue - stats.monthlyMaintenanceCost)}</p>
              <p className="text-sm text-emerald-600">本月净收益</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
