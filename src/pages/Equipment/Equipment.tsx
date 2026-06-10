import { useState, useMemo, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Heart } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import StatusBadge from '@/components/StatusBadge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import CategoryNameInput from '@/components/CategoryNameInput';
import { formatCurrency, formatDate, equipmentCategories } from '@/utils/format';
import { calculateEquipmentHealth, getHealthScoreColor, getRiskLevelLabel, getRiskLevelColor } from '@/utils/health';
import { EQUIPMENT_NAME_CONFIG } from '@/config/nameInputConfig';
import type { Equipment } from '@/types';
import type { CategoryNameInputRef } from '@/components/CategoryNameInput';

export default function EquipmentPage() {
  const { equipments, suppliers, damageRecords, maintenances, addEquipment, updateEquipment, deleteEquipment } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [healthFilter, setHealthFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    model: '',
    purchasePrice: '',
    purchaseDate: '',
    status: 'available' as Equipment['status'],
    location: '',
    department: '',
    custodian: '',
    supplierId: '',
    notes: '',
  });
  const nameInputRef = useRef<CategoryNameInputRef>(null);

  const equipmentHealthMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateEquipmentHealth>>();
    equipments.forEach((eq) => {
      const health = calculateEquipmentHealth(eq, damageRecords, maintenances);
      map.set(eq.id, health);
    });
    return map;
  }, [equipments, damageRecords, maintenances]);

  const filteredEquipments = useMemo(() => {
    return equipments.filter((eq) => {
      const matchesSearch =
        eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.model.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || eq.status === statusFilter;
      const matchesCategory = !categoryFilter || eq.category === categoryFilter;
      
      const health = equipmentHealthMap.get(eq.id);
      let matchesHealth = true;
      if (healthFilter && health) {
        if (healthFilter === 'high') {
          matchesHealth = health.riskLevel === 'high';
        } else if (healthFilter === 'medium') {
          matchesHealth = health.riskLevel === 'medium';
        } else if (healthFilter === 'low') {
          matchesHealth = health.riskLevel === 'low';
        }
      }
      
      return matchesSearch && matchesStatus && matchesCategory && matchesHealth;
    });
  }, [equipments, searchTerm, statusFilter, categoryFilter, healthFilter, equipmentHealthMap]);

  const sameCategoryNames = useMemo(() => {
    if (!formData.category) return [];
    const sameCategoryEquipments = equipments.filter(
      (eq) => eq.category === formData.category
    );
    return Array.from(new Set(sameCategoryEquipments.map((eq) => eq.name)));
  }, [formData.category, equipments]);

  const handleAdd = () => {
    setEditingEquipment(null);
    setFormData({
      name: '',
      category: '',
      brand: '',
      model: '',
      purchasePrice: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      status: 'available',
      location: '',
      department: '',
      custodian: '',
      supplierId: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setFormData({
      name: equipment.name,
      category: equipment.category,
      brand: equipment.brand,
      model: equipment.model,
      purchasePrice: String(equipment.purchasePrice),
      purchaseDate: equipment.purchaseDate,
      status: equipment.status,
      location: equipment.location,
      department: equipment.department,
      custodian: equipment.custodian,
      supplierId: equipment.supplierId,
      notes: equipment.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这件装备吗？')) {
      deleteEquipment(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category) {
      return;
    }

    const isNameValid = nameInputRef.current?.validate() ?? true;
    if (!isNameValid) {
      nameInputRef.current?.focus();
      return;
    }

    if (editingEquipment) {
      updateEquipment(editingEquipment.id, {
        ...formData,
        purchasePrice: Number(formData.purchasePrice),
      });
    } else {
      addEquipment({
        ...formData,
        purchasePrice: Number(formData.purchasePrice),
      });
    }
    setIsModalOpen(false);
  };

  const getSupplierName = (id: string) => suppliers.find((s) => s.id === id)?.name || '未知';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">装备管理</h2>
          <p className="text-gray-500 mt-1">管理所有露营装备的基础信息</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleAdd}>
          新增装备
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索装备名称、品牌、型号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">全部分类</option>
                {equipmentCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">全部状态</option>
                <option value="available">在库可用</option>
                <option value="rented">已租出</option>
                <option value="maintenance">维护中</option>
                <option value="damaged">损坏待修</option>
                <option value="scrapped">已报废</option>
                <option value="decommissioned">已停用</option>
              </select>
              <select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">全部健康度</option>
                <option value="high">高风险</option>
                <option value="medium">中风险</option>
                <option value="low">低风险</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  装备信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分类
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  采购信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  使用次数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  健康度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  风险等级
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEquipments.map((equipment) => (
                <tr key={equipment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">🏕️</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{equipment.name}</p>
                        <p className="text-sm text-gray-500">
                          {equipment.brand} {equipment.model}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{equipment.category}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(equipment.purchasePrice)}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(equipment.purchaseDate)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {equipment.usageCount}
                    </span>
                    <span className="text-xs text-gray-500"> 次</span>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const health = equipmentHealthMap.get(equipment.id);
                      if (!health) return <span className="text-gray-400">-</span>;
                      return (
                        <div className="flex items-center gap-2">
                          <Heart
                            className="w-4 h-4"
                            style={{ color: getHealthScoreColor(health.healthScore) }}
                          />
                          <div className="flex-1 min-w-16">
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full"
                                style={{
                                  width: `${health.healthScore}%`,
                                  backgroundColor: getHealthScoreColor(health.healthScore),
                                }}
                              ></div>
                            </div>
                          </div>
                          <span
                            className="text-sm font-bold"
                            style={{ color: getHealthScoreColor(health.healthScore) }}
                          >
                            {health.healthScore}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const health = equipmentHealthMap.get(equipment.id);
                      if (!health) return <span className="text-gray-400">-</span>;
                      return (
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: `${getRiskLevelColor(health.riskLevel)}20`,
                            color: getRiskLevelColor(health.riskLevel),
                          }}
                        >
                          {getRiskLevelLabel(health.riskLevel)}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={equipment.status} variant="equipment" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(equipment)}
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(equipment.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEquipments.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500">暂无装备数据</p>
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-500">
            共 {filteredEquipments.length} 件装备
          </p>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEquipment ? '编辑装备' : '新增装备'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CategoryNameInput
              ref={nameInputRef}
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              categoryId={formData.category}
              existingNames={sameCategoryNames}
              config={EQUIPMENT_NAME_CONFIG}
              excludeName={editingEquipment?.name}
              label="装备名称"
              required
              placeholder="请输入装备名称"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分类 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">请选择分类</option>
                {equipmentCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">品牌</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="请输入品牌"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">型号</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="请输入型号"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                采购价格 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.purchasePrice}
                onChange={(e) =>
                  setFormData({ ...formData, purchasePrice: e.target.value })
                }
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="请输入采购价格"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                采购日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) =>
                  setFormData({ ...formData, purchaseDate: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">供应商</label>
              <select
                value={formData.supplierId}
                onChange={(e) =>
                  setFormData({ ...formData, supplierId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">请选择供应商</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">存放位置</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="如：A区-01货架"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所属部门</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="请输入所属部门"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">使用人</label>
              <input
                type="text"
                value={formData.custodian}
                onChange={(e) => setFormData({ ...formData, custodian: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="请输入使用人姓名"
              />
            </div>
            {editingEquipment && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as Equipment['status'],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="available">在库可用</option>
                  <option value="rented">已租出</option>
                  <option value="maintenance">维护中</option>
                  <option value="damaged">损坏待修</option>
                  <option value="scrapped">已报废</option>
                  <option value="decommissioned">已停用</option>
                </select>
              </div>
            )}
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
            <Button type="submit">
              {editingEquipment ? '保存修改' : '确认添加'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
