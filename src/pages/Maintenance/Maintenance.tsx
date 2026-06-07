import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Wrench,
  Calendar,
  User as UserIcon,
  CheckCircle,
  Clock,
  DollarSign,
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
} from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import StatusBadge from '@/components/StatusBadge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate, maintenanceTypes } from '@/utils/format';
import type { MaintenanceStatus } from '../types';

export default function MaintenancePage() {
  const {
    maintenances,
    equipments,
    damageRecords,
    addMaintenance,
    updateMaintenance,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    equipmentId: '',
    date: '',
    type: '',
    description: '',
    cost: '',
    technician: '',
    damageId: '',
    status: 'pending' as MaintenanceStatus,
  });

  const filteredMaintenances = useMemo(() => {
    return maintenances
      .filter((m) => {
        const equipment = equipments.find((e) => e.id === m.equipmentId);
        const matchesSearch =
          equipment?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.technician.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || m.status === statusFilter;
        const matchesType = !typeFilter || m.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [maintenances, equipments, searchTerm, statusFilter, typeFilter]);

  const getEquipmentName = (id: string) =>
    equipments.find((e) => e.id === id)?.name || '未知';
  const getDamageInfo = (id?: string) => damageRecords.find((d) => d.id === id);

  const stats = useMemo(() => {
    const total = maintenances.length;
    const pending = maintenances.filter((m) => m.status === 'pending').length;
    const inProgress = maintenances.filter(
      (m) => m.status === 'in_progress'
    ).length;
    const completed = maintenances.filter(
      (m) => m.status === 'completed'
    ).length;
    const totalCost = maintenances.reduce((sum, m) => sum + m.cost, 0);
    return { total, pending, inProgress, completed, totalCost };
  }, [maintenances]);

  const monthlyCostData = useMemo(() => {
    const months = [
      '1月',
      '2月',
      '3月',
      '4月',
      '5月',
      '6月',
      '7月',
      '8月',
      '9月',
      '10月',
      '11月',
      '12月',
    ];
    const now = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIndex = date.getMonth();
      const monthMaintenances = maintenances.filter((m) => {
        const mDate = new Date(m.date);
        return (
          mDate.getMonth() === monthIndex &&
          mDate.getFullYear() === date.getFullYear()
        );
      });
      const cost = monthMaintenances.reduce((sum, m) => sum + m.cost, 0);

      data.push({
        name: months[monthIndex],
        维护次数: monthMaintenances.length,
        维护费用: cost,
      });
    }

    return data;
  }, [maintenances]);

  const typeStats = useMemo(() => {
    const typeMap = new Map<string, { count: number; cost: number }>();

    maintenances.forEach((m) => {
      const existing = typeMap.get(m.type) || { count: 0, cost: 0 };
      typeMap.set(m.type, {
        count: existing.count + 1,
        cost: existing.cost + m.cost,
      });
    });

    return Array.from(typeMap.entries()).map(([name, data]) => ({
      name,
      value: data.count,
      cost: data.cost,
    }));
  }, [maintenances]);

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

  const reportedDamages = useMemo(() => {
    return damageRecords.filter((d) => d.status === 'reported');
  }, [damageRecords]);

  const handleAdd = () => {
    setFormData({
      equipmentId: '',
      date: new Date().toISOString().split('T')[0],
      type: '',
      description: '',
      cost: '',
      technician: '',
      damageId: '',
      status: 'pending',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMaintenance({
      equipmentId: formData.equipmentId,
      date: formData.date,
      type: formData.type,
      description: formData.description,
      cost: Number(formData.cost),
      technician: formData.technician,
      damageId: formData.damageId || undefined,
    });
    setIsModalOpen(false);
  };

  const handleComplete = (id: string) => {
    if (confirm('确认维护已完成吗？')) {
      updateMaintenance(id, { status: 'completed' });
    }
  };

  const handleStart = (id: string) => {
    updateMaintenance(id, { status: 'in_progress' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">维护管理</h2>
          <p className="text-gray-500 mt-1">管理装备维护记录和费用核算</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleAdd}>
          新增维护
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">累计维护</p>
              <p className="text-3xl font-bold mt-1">{stats.total} 次</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">待处理</p>
              <p className="text-3xl font-bold mt-1">{stats.pending} 次</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">已完成</p>
              <p className="text-3xl font-bold mt-1">{stats.completed} 次</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">累计费用</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(stats.totalCost)}
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            月度维护费用趋势
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCostData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === '维护费用')
                      return [formatCurrency(value), name];
                    return [value, name];
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="维护次数"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="维护费用"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">维护类型分布</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {typeStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {typeStats.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></span>
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900">
                  {item.value} 次
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索装备名称、描述、维护人员..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">全部类型</option>
                {maintenanceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">全部状态</option>
                <option value="pending">待处理</option>
                <option value="in_progress">维护中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredMaintenances.map((maintenance) => {
            const damage = getDamageInfo(maintenance.damageId);
            return (
              <div
                key={maintenance.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {getEquipmentName(maintenance.equipmentId)}
                      </h3>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {maintenance.type} - {maintenance.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(maintenance.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-3.5 h-3.5" />
                          {maintenance.technician}
                        </span>
                        {damage && (
                          <span className="text-amber-600 text-xs">
                            关联损耗: {damage.description.slice(0, 20)}...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-600">
                        {formatCurrency(maintenance.cost)}
                      </p>
                      <StatusBadge
                        status={maintenance.status}
                        variant="maintenance"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      {maintenance.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleStart(maintenance.id)}
                        >
                          开始维护
                        </Button>
                      )}
                      {maintenance.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => handleComplete(maintenance.id)}
                        >
                          完成维护
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredMaintenances.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500">暂无维护记录</p>
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-500">
            共 {filteredMaintenances.length} 条维护记录
          </p>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="新增维护记录"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择装备 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.equipmentId}
                onChange={(e) =>
                  setFormData({ ...formData, equipmentId: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">请选择装备</option>
                {equipments.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} ({eq.brand} {eq.model})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                维护日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                维护类型 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">请选择维护类型</option>
                {maintenanceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                维护费用 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) =>
                  setFormData({ ...formData, cost: e.target.value })
                }
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="请输入维护费用"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                维护人员 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.technician}
                onChange={(e) =>
                  setFormData({ ...formData, technician: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="请输入维护人员姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                关联损耗记录
              </label>
              <select
                value={formData.damageId}
                onChange={(e) =>
                  setFormData({ ...formData, damageId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">无</option>
                {reportedDamages.map((d) => (
                  <option key={d.id} value={d.id}>
                    {getEquipmentName(d.equipmentId)} -{' '}
                    {d.description.slice(0, 20)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              维护描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="请详细描述维护内容"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              取消
            </Button>
            <Button type="submit">确认添加</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
