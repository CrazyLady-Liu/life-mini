import { useState, useMemo } from 'react';
import { Plus, Search, CheckCircle, Calendar, Package, User } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import StatusBadge from '@/components/StatusBadge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Rental } from '../types';

export default function RentalsPage() {
  const { rentals, equipments, customers, addRental, returnRental, updateRental } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    equipmentId: '',
    customerId: '',
    startDate: '',
    endDate: '',
    price: '',
    notes: '',
  });

  const availableEquipments = useMemo(() => {
    return equipments.filter((e) => e.status === 'available');
  }, [equipments]);

  const filteredRentals = useMemo(() => {
    return rentals
      .filter((rental) => {
        const equipment = equipments.find((e) => e.id === rental.equipmentId);
        const customer = customers.find((c) => c.id === rental.customerId);
        const matchesSearch =
          equipment?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || rental.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rentals, equipments, customers, searchTerm, statusFilter]);

  const getEquipmentName = (id: string) => equipments.find((e) => e.id === id)?.name || '未知';
  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name || '未知';

  const handleAdd = () => {
    setFormData({
      equipmentId: '',
      customerId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      price: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleReturn = (id: string) => {
    if (confirm('确认装备已归还吗？')) {
      returnRental(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addRental({
      equipmentId: formData.equipmentId,
      customerId: formData.customerId,
      startDate: formData.startDate,
      endDate: formData.endDate,
      price: Number(formData.price),
      notes: formData.notes,
    });
    setIsModalOpen(false);
  };

  const activeCount = rentals.filter((r) => r.status === 'active').length;
  const totalRevenue = rentals
    .filter((r) => r.status === 'returned')
    .reduce((sum, r) => sum + r.price, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">租赁记录</h2>
          <p className="text-gray-500 mt-1">管理所有装备租赁订单</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleAdd}>
          新增租赁
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">进行中租赁</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount} 单</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">累计租赁订单</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{rentals.length} 单</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">累计租赁收入</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索装备名称、客户姓名..."
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
              <option value="active">租赁中</option>
              <option value="pending">待取货</option>
              <option value="returned">已归还</option>
              <option value="overdue">已逾期</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredRentals.map((rental) => (
            <div
              key={rental.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {getEquipmentName(rental.equipmentId)}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {getCustomerName(rental.customerId)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center sm:text-left">
                    <p className="text-xs text-gray-500">租期</p>
                    <div className="flex items-center gap-1 text-sm text-gray-700 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{formatDate(rental.startDate)} ~ {formatDate(rental.endDate)}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">费用</p>
                    <p className="text-lg font-bold text-amber-600">
                      {formatCurrency(rental.price)}
                    </p>
                  </div>
                  <StatusBadge status={rental.status} variant="rental" />
                  
                  {rental.status === 'active' && (
                    <Button
                      size="sm"
                      leftIcon={<CheckCircle className="w-4 h-4" />}
                      onClick={() => handleReturn(rental.id)}
                    >
                      归还
                    </Button>
                  )}
                </div>
              </div>
              {rental.notes && (
                <p className="mt-3 text-sm text-gray-500 pl-16">
                  备注：{rental.notes}
                </p>
              )}
            </div>
          ))}
        </div>

        {filteredRentals.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500">暂无租赁记录</p>
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-500">
            共 {filteredRentals.length} 条记录
          </p>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="新增租赁订单"
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
                onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">请选择装备</option>
                {availableEquipments.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} ({eq.brand} {eq.model})
                  </option>
                ))}
              </select>
              {availableEquipments.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">当前没有可租赁的装备</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择客户 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">请选择客户</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                开始日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                结束日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                租赁费用 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="请输入租赁费用"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
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
            <Button type="submit" disabled={availableEquipments.length === 0}>
              确认租赁
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
