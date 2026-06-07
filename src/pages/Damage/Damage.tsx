import { useState, useMemo } from 'react';
import { Plus, Search, AlertTriangle, Wrench, Package, Calendar, User } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import StatusBadge from '@/components/StatusBadge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate } from '@/utils/format';
import type { DamageLevel } from '../types';

export default function DamagePage() {
  const {
    damageRecords,
    equipments,
    partReplacements,
    addDamageRecord,
    updateDamageRecord,
    addPartReplacement,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [selectedDamageId, setSelectedDamageId] = useState('');
  const [formData, setFormData] = useState({
    equipmentId: '',
    date: '',
    level: 'minor' as DamageLevel,
    description: '',
    reporter: '',
  });
  const [partFormData, setPartFormData] = useState({
    partName: '',
    quantity: '',
    unitPrice: '',
  });

  const filteredDamageRecords = useMemo(() => {
    return damageRecords
      .filter((record) => {
        const equipment = equipments.find((e) => e.id === record.equipmentId);
        const matchesSearch =
          equipment?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = !levelFilter || record.level === levelFilter;
        return matchesSearch && matchesLevel;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [damageRecords, equipments, searchTerm, levelFilter]);

  const getEquipmentName = (id: string) => equipments.find((e) => e.id === id)?.name || '未知';
  const getPartsForDamage = (damageId: string) =>
    partReplacements.filter((p) => p.damageId === damageId);

  const handleAdd = () => {
    setFormData({
      equipmentId: '',
      date: new Date().toISOString().split('T')[0],
      level: 'minor',
      description: '',
      reporter: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDamageRecord(formData);
    setIsModalOpen(false);
  };

  const handleAddPart = (damageId: string, equipmentId: string) => {
    setSelectedDamageId(damageId);
    setPartFormData({
      partName: '',
      quantity: '1',
      unitPrice: '',
    });
    setIsPartModalOpen(true);
  };

  const handlePartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const damage = damageRecords.find((d) => d.id === selectedDamageId);
    if (damage) {
      addPartReplacement({
        damageId: selectedDamageId,
        equipmentId: damage.equipmentId,
        partName: partFormData.partName,
        quantity: Number(partFormData.quantity),
        unitPrice: Number(partFormData.unitPrice),
      });
    }
    setIsPartModalOpen(false);
  };

  const handleMarkRepaired = (id: string) => {
    if (confirm('确认已修复吗？')) {
      updateDamageRecord(id, { status: 'repaired' });
    }
  };

  const stats = useMemo(() => {
    const total = damageRecords.length;
    const minor = damageRecords.filter((d) => d.level === 'minor').length;
    const moderate = damageRecords.filter((d) => d.level === 'moderate').length;
    const severe = damageRecords.filter((d) => d.level === 'severe').length;
    const totalPartsCost = partReplacements.reduce(
      (sum, p) => sum + p.quantity * p.unitPrice,
      0
    );
    return { total, minor, moderate, severe, totalPartsCost };
  }, [damageRecords, partReplacements]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">损耗登记</h2>
          <p className="text-gray-500 mt-1">记录装备损耗情况和配件更换</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleAdd}>
          新增损耗登记
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">累计损耗</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total} 次</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">轻微损耗</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.minor} 次</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">中等损耗</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.moderate} 次</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">严重损耗</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.severe} 次</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">配件费用</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {formatCurrency(stats.totalPartsCost)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索装备名称、损耗描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">全部程度</option>
              <option value="minor">轻微</option>
              <option value="moderate">中等</option>
              <option value="severe">严重</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredDamageRecords.map((record) => {
            const parts = getPartsForDamage(record.id);
            const partsTotal = parts.reduce(
              (sum, p) => sum + p.quantity * p.unitPrice,
              0
            );

            return (
              <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        record.level === 'severe'
                          ? 'bg-red-100'
                          : record.level === 'moderate'
                          ? 'bg-amber-100'
                          : 'bg-green-100'
                      }`}
                    >
                      <AlertTriangle
                        className={`w-6 h-6 ${
                          record.level === 'severe'
                            ? 'text-red-600'
                            : record.level === 'moderate'
                            ? 'text-amber-600'
                            : 'text-green-600'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        {getEquipmentName(record.equipmentId)}
                        <StatusBadge status={record.level} variant="damage" />
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{record.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(record.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {record.reporter}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm px-2.5 py-1 rounded-full ${
                          record.status === 'reported'
                            ? 'bg-amber-100 text-amber-700'
                            : record.status === 'repaired'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {record.status === 'reported'
                          ? '待处理'
                          : record.status === 'repaired'
                          ? '已修复'
                          : '已报废'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<Wrench className="w-3.5 h-3.5" />}
                        onClick={() => handleAddPart(record.id, record.equipmentId)}
                      >
                        配件更换
                      </Button>
                      {record.status === 'reported' && (
                        <Button size="sm" onClick={() => handleMarkRepaired(record.id)}>
                          标记修复
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {parts.length > 0 && (
                  <div className="mt-4 ml-16 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      更换配件记录
                    </p>
                    <div className="space-y-2">
                      {parts.map((part) => (
                        <div
                          key={part.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-700">{part.partName}</span>
                            <span className="text-gray-500">x{part.quantity}</span>
                          </div>
                          <span className="text-amber-600 font-medium">
                            {formatCurrency(part.quantity * part.unitPrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between">
                      <span className="text-sm text-gray-500">配件小计</span>
                      <span className="text-sm font-semibold text-amber-600">
                        {formatCurrency(partsTotal)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredDamageRecords.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500">暂无损耗记录</p>
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-500">
            共 {filteredDamageRecords.length} 条损耗记录
          </p>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="新增损耗登记"
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
                登记日期 <span className="text-red-500">*</span>
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
                损耗程度 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.level}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    level: e.target.value as DamageLevel,
                  })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="minor">轻微</option>
                <option value="moderate">中等</option>
                <option value="severe">严重</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                登记人 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.reporter}
                onChange={(e) =>
                  setFormData({ ...formData, reporter: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="请输入登记人姓名"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              损耗描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="请详细描述损耗情况"
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
            <Button type="submit">确认登记</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isPartModalOpen}
        onClose={() => setIsPartModalOpen(false)}
        title="登记配件更换"
        size="md"
      >
        <form onSubmit={handlePartSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              配件名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={partFormData.partName}
              onChange={(e) =>
                setPartFormData({ ...partFormData, partName: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="请输入配件名称"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                数量 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={partFormData.quantity}
                onChange={(e) =>
                  setPartFormData({ ...partFormData, quantity: e.target.value })
                }
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                单价 (元) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={partFormData.unitPrice}
                onChange={(e) =>
                  setPartFormData({ ...partFormData, unitPrice: e.target.value })
                }
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPartModalOpen(false)}
            >
              取消
            </Button>
            <Button type="submit">确认登记</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
