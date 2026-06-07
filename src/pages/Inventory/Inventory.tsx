import { useState, useMemo } from 'react';
import { Plus, Search, Warehouse, Calendar, User, CheckCircle, Package, AlertCircle, Eye } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import StatusBadge from '@/components/StatusBadge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { formatDate } from '@/utils/format';
import type { EquipmentStatus, InventoryCheckStatus } from '@/types';

export default function InventoryPage() {
  const {
    inventoryChecks,
    inventoryItems,
    equipments,
    addInventoryCheck,
    addInventoryItem,
    completeInventoryCheck,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCheckId, setSelectedCheckId] = useState('');
  const [formData, setFormData] = useState({
    date: '',
    checker: '',
    notes: '',
  });

  const filteredChecks = useMemo(() => {
    return inventoryChecks
      .filter((check) => {
        const matchesSearch =
          check.checker.toLowerCase().includes(searchTerm.toLowerCase()) ||
          check.notes?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || check.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [inventoryChecks, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = inventoryChecks.length;
    const completed = inventoryChecks.filter((c) => c.status === 'completed').length;
    const pending = inventoryChecks.filter((c) => c.status === 'pending').length;
    const inProgress = inventoryChecks.filter((c) => c.status === 'in_progress').length;
    return { total, completed, pending, inProgress };
  }, [inventoryChecks]);

  const equipmentByLocation = useMemo(() => {
    const locationMap = new Map<string, number>();
    equipments.forEach((eq) => {
      locationMap.set(eq.location, (locationMap.get(eq.location) || 0) + 1);
    });
    return Array.from(locationMap.entries()).map(([location, count]) => ({ location, count }));
  }, [equipments]);

  const handleAdd = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      checker: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addInventoryCheck({
      date: formData.date,
      checker: formData.checker,
      notes: formData.notes,
      status: 'in_progress',
    });
    setIsModalOpen(false);
  };

  const handleViewDetail = (checkId: string) => {
    setSelectedCheckId(checkId);
    setIsDetailModalOpen(true);
  };

  const handleComplete = (checkId: string) => {
    if (confirm('确认盘点已完成吗？')) {
      completeInventoryCheck(checkId);
    }
  };

  const getCheckItems = (checkId: string) => {
    return inventoryItems.filter((item) => item.checkId === checkId);
  };

  const selectedCheck = inventoryChecks.find((c) => c.id === selectedCheckId);
  const selectedItems = getCheckItems(selectedCheckId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">收纳盘点</h2>
          <p className="text-gray-500 mt-1">管理库存盘点和装备收纳记录</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleAdd}>
          新建盘点
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">累计盘点</p>
              <p className="text-3xl font-bold mt-1">{stats.total} 次</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Warehouse className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">装备总数</p>
              <p className="text-3xl font-bold mt-1">{equipments.length} 件</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">在库装备</p>
              <p className="text-3xl font-bold mt-1">
                {equipments.filter((e) => e.status === 'available').length} 件
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">存放位置</p>
              <p className="text-3xl font-bold mt-1">{equipmentByLocation.length} 个</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="搜索盘点人、备注..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">全部状态</option>
                <option value="pending">待盘点</option>
                <option value="in_progress">盘点中</option>
                <option value="completed">已完成</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredChecks.map((check) => {
              const items = getCheckItems(check.id);
              const normalCount = items.filter(
                (i) => i.expectedStatus === i.actualStatus
              ).length;
              const diffCount = items.length - normalCount;

              return (
                <div key={check.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Warehouse className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          盘点单 - {formatDate(check.date)}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {check.checker}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" />
                            {items.length} 件装备
                          </span>
                          {diffCount > 0 && (
                            <span className="text-red-500 font-medium">
                              {diffCount} 件异常
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={check.status} variant="inventory" />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => handleViewDetail(check.id)}
                        >
                          查看详情
                        </Button>
                        {check.status === 'in_progress' && (
                          <Button size="sm" onClick={() => handleComplete(check.id)}>
                            完成盘点
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {check.notes && (
                    <p className="mt-2 text-sm text-gray-500 ml-16">
                      备注：{check.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {filteredChecks.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-gray-500">暂无盘点记录</p>
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-500">
              共 {filteredChecks.length} 条盘点记录
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">库存位置分布</h3>
          <div className="space-y-3">
            {equipmentByLocation.map((loc, index) => (
              <div key={loc.location} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Warehouse className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {loc.location}
                    </span>
                    <span className="text-sm text-gray-500">{loc.count} 件</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{
                        width: `${(loc.count / equipments.length) * 100}%`,
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
        <h3 className="text-lg font-semibold text-gray-900 mb-6">装备库存明细</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  装备名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分类
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  存放位置
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  使用次数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {equipments.map((equipment) => (
                <tr key={equipment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{equipment.name}</div>
                    <div className="text-sm text-gray-500">
                      {equipment.brand} {equipment.model}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{equipment.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{equipment.location}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {equipment.usageCount} 次
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={equipment.status} variant="equipment" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="新建盘点单"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              盘点日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              盘点人 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.checker}
              onChange={(e) => setFormData({ ...formData, checker: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="请输入盘点人姓名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="请输入备注信息"
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
            <Button type="submit">创建盘点单</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="盘点详情"
        size="lg"
      >
        {selectedCheck && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">盘点日期</p>
                <p className="font-medium text-gray-900">
                  {formatDate(selectedCheck.date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">盘点人</p>
                <p className="font-medium text-gray-900">{selectedCheck.checker}</p>
              </div>
            </div>
            {selectedCheck.notes && (
              <div>
                <p className="text-sm text-gray-500">备注</p>
                <p className="text-gray-700">{selectedCheck.notes}</p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <h4 className="font-medium text-gray-900 mb-3">盘点明细</h4>
              {selectedItems.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedItems.map((item) => {
                    const equipment = equipments.find((e) => e.id === item.equipmentId);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="font-medium text-gray-900">
                          {equipment?.name || '未知装备'}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500">
                            预期:{' '}
                            <StatusBadge
                              status={item.expectedStatus}
                              variant="equipment"
                            />
                          </span>
                          <span className="text-sm text-gray-500">
                            实际:{' '}
                            <StatusBadge
                              status={item.actualStatus}
                              variant="equipment"
                            />
                          </span>
                          <span
                            className={`text-sm font-medium ${
                              item.difference === '正常'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {item.difference}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">暂无盘点明细数据</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
