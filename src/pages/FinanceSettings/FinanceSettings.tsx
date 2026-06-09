import { useState } from 'react';
import { Plus, Wallet, AlertTriangle, Users, Trash2, Edit2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { formatCurrency, depositRuleTypeLabels, equipmentValueLevelLabels, equipmentCategories } from '@/utils/format';
import type { DepositRuleType, EquipmentValueLevel } from '@/types';

type TabType = 'deposit' | 'penalty' | 'exempt';

export default function FinanceSettings() {
  const {
    depositRules,
    penaltyRules,
    depositExemptCustomers,
    equipments,
    customers,
    addDepositRule,
    updateDepositRule,
    deleteDepositRule,
    addPenaltyRule,
    updatePenaltyRule,
    deletePenaltyRule,
    addDepositExemptCustomer,
    updateDepositExemptCustomer,
    deleteDepositExemptCustomer,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('deposit');
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);
  const [isExemptModalOpen, setIsExemptModalOpen] = useState(false);
  const [editingDepositRule, setEditingDepositRule] = useState<string | null>(null);
  const [editingPenaltyRule, setEditingPenaltyRule] = useState<string | null>(null);
  const [editingExempt, setEditingExempt] = useState<string | null>(null);

  const [depositForm, setDepositForm] = useState({
    name: '',
    type: 'category' as DepositRuleType,
    category: '',
    equipmentId: '',
    depositAmount: '',
    isActive: true,
  });

  const [penaltyForm, setPenaltyForm] = useState({
    name: '',
    valueLevel: 'normal' as EquipmentValueLevel,
    dailyRateMultiplier: '',
    isActive: true,
  });

  const [exemptForm, setExemptForm] = useState({
    customerId: '',
    reason: '',
    minRentalCount: '',
    isActive: true,
  });

  const handleAddDepositRule = () => {
    setEditingDepositRule(null);
    setDepositForm({
      name: '',
      type: 'category',
      category: '',
      equipmentId: '',
      depositAmount: '',
      isActive: true,
    });
    setIsDepositModalOpen(true);
  };

  const handleEditDepositRule = (rule: typeof depositRules[0]) => {
    setEditingDepositRule(rule.id);
    setDepositForm({
      name: rule.name,
      type: rule.type,
      category: rule.category || '',
      equipmentId: rule.equipmentId || '',
      depositAmount: rule.depositAmount.toString(),
      isActive: rule.isActive,
    });
    setIsDepositModalOpen(true);
  };

  const handleSaveDepositRule = () => {
    if (editingDepositRule) {
      updateDepositRule(editingDepositRule, {
        name: depositForm.name,
        type: depositForm.type,
        category: depositForm.type === 'category' ? depositForm.category : undefined,
        equipmentId: depositForm.type === 'equipment' ? depositForm.equipmentId : undefined,
        depositAmount: Number(depositForm.depositAmount),
        isActive: depositForm.isActive,
      });
    } else {
      addDepositRule({
        name: depositForm.name,
        type: depositForm.type,
        category: depositForm.type === 'category' ? depositForm.category : undefined,
        equipmentId: depositForm.type === 'equipment' ? depositForm.equipmentId : undefined,
        depositAmount: Number(depositForm.depositAmount),
        isActive: depositForm.isActive,
      });
    }
    setIsDepositModalOpen(false);
  };

  const handleDeleteDepositRule = (id: string) => {
    if (confirm('确认删除该押金规则吗？')) {
      deleteDepositRule(id);
    }
  };

  const handleAddPenaltyRule = () => {
    setEditingPenaltyRule(null);
    setPenaltyForm({
      name: '',
      valueLevel: 'normal',
      dailyRateMultiplier: '',
      isActive: true,
    });
    setIsPenaltyModalOpen(true);
  };

  const handleEditPenaltyRule = (rule: typeof penaltyRules[0]) => {
    setEditingPenaltyRule(rule.id);
    setPenaltyForm({
      name: rule.name,
      valueLevel: rule.valueLevel,
      dailyRateMultiplier: rule.dailyRateMultiplier.toString(),
      isActive: rule.isActive,
    });
    setIsPenaltyModalOpen(true);
  };

  const handleSavePenaltyRule = () => {
    if (editingPenaltyRule) {
      updatePenaltyRule(editingPenaltyRule, {
        name: penaltyForm.name,
        valueLevel: penaltyForm.valueLevel,
        dailyRateMultiplier: Number(penaltyForm.dailyRateMultiplier),
        isActive: penaltyForm.isActive,
      });
    } else {
      addPenaltyRule({
        name: penaltyForm.name,
        valueLevel: penaltyForm.valueLevel,
        dailyRateMultiplier: Number(penaltyForm.dailyRateMultiplier),
        isActive: penaltyForm.isActive,
      });
    }
    setIsPenaltyModalOpen(false);
  };

  const handleDeletePenaltyRule = (id: string) => {
    if (confirm('确认删除该违约金规则吗？')) {
      deletePenaltyRule(id);
    }
  };

  const handleAddExempt = () => {
    setEditingExempt(null);
    setExemptForm({
      customerId: '',
      reason: '',
      minRentalCount: '',
      isActive: true,
    });
    setIsExemptModalOpen(true);
  };

  const handleEditExempt = (exempt: typeof depositExemptCustomers[0]) => {
    setEditingExempt(exempt.id);
    setExemptForm({
      customerId: exempt.customerId,
      reason: exempt.reason,
      minRentalCount: exempt.minRentalCount.toString(),
      isActive: exempt.isActive,
    });
    setIsExemptModalOpen(true);
  };

  const handleSaveExempt = () => {
    if (editingExempt) {
      updateDepositExemptCustomer(editingExempt, {
        customerId: exemptForm.customerId,
        reason: exemptForm.reason,
        minRentalCount: Number(exemptForm.minRentalCount),
        isActive: exemptForm.isActive,
      });
    } else {
      addDepositExemptCustomer({
        customerId: exemptForm.customerId,
        reason: exemptForm.reason,
        minRentalCount: Number(exemptForm.minRentalCount),
        isActive: exemptForm.isActive,
      });
    }
    setIsExemptModalOpen(false);
  };

  const handleDeleteExempt = (id: string) => {
    if (confirm('确认删除该免押客户吗？')) {
      deleteDepositExemptCustomer(id);
    }
  };

  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name || '未知';
  const getEquipmentName = (id: string) => equipments.find((e) => e.id === id)?.name || '未知';

  const tabs = [
    { key: 'deposit' as TabType, label: '押金规则', icon: Wallet },
    { key: 'penalty' as TabType, label: '违约金规则', icon: AlertTriangle },
    { key: 'exempt' as TabType, label: '免押客户白名单', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">财务设置</h2>
          <p className="text-gray-500 mt-1">配置押金规则、违约金规则和免押客户白名单</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-100">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'deposit' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">押金规则配置</h3>
                <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleAddDepositRule}>
                  新增规则
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">规则名称</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">类型</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">适用范围</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">押金金额</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {depositRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-800">{rule.name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">
                            {depositRuleTypeLabels[rule.type]}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">
                            {rule.type === 'category' && rule.category}
                            {rule.type === 'equipment' && getEquipmentName(rule.equipmentId || '')}
                            {rule.type === 'package' && '套餐'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold text-emerald-600">
                            {formatCurrency(rule.depositAmount)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            rule.isActive
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {rule.isActive ? '启用' : '停用'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditDepositRule(rule)}
                              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDepositRule(rule.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

              {depositRules.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-gray-500">暂无押金规则</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'penalty' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">违约金规则配置</h3>
                <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleAddPenaltyRule}>
                  新增规则
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">规则名称</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">装备价值等级</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">日租金倍率</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {penaltyRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-800">{rule.name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            rule.valueLevel === 'high'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {equipmentValueLevelLabels[rule.valueLevel]}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold text-amber-600">
                            {rule.dailyRateMultiplier}x
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            rule.isActive
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {rule.isActive ? '启用' : '停用'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditPenaltyRule(rule)}
                              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePenaltyRule(rule.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

              {penaltyRules.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-gray-500">暂无违约金规则</p>
                </div>
              )}

              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="font-medium text-amber-800 mb-2">违约金计算公式说明</h4>
                <p className="text-sm text-amber-700">
                  逾期违约金 = 超期天数 × 单品单日租金 × 违约金倍率
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  系统根据装备价值等级自动匹配对应的违约金倍率进行计算
                </p>
              </div>
            </div>
          )}

          {activeTab === 'exempt' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">免押客户白名单</h3>
                <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleAddExempt}>
                  新增免押客户
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">客户姓名</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">免押原因</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">最低租赁次数</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {depositExemptCustomers.map((exempt) => (
                      <tr key={exempt.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-800">
                            {getCustomerName(exempt.customerId)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">{exempt.reason}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm text-gray-600">{exempt.minRentalCount} 次</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            exempt.isActive
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {exempt.isActive ? '有效' : '无效'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditExempt(exempt)}
                              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteExempt(exempt.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

              {depositExemptCustomers.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-gray-500">暂无免押客户</p>
                </div>
              )}

              <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <h4 className="font-medium text-emerald-800 mb-2">免押规则说明</h4>
                <ul className="text-sm text-emerald-700 space-y-1">
                  <li>• 客户直接加入白名单后，所有租赁订单均免押金</li>
                  <li>• 设置最低租赁次数后，客户租赁次数达到该数值即可自动免押</li>
                  <li>• 高复购客户可享受免押特权，提升客户粘性</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        title={editingDepositRule ? '编辑押金规则' : '新增押金规则'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              规则名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={depositForm.name}
              onChange={(e) => setDepositForm({ ...depositForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="请输入规则名称"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              规则类型 <span className="text-red-500">*</span>
            </label>
            <select
              value={depositForm.type}
              onChange={(e) => setDepositForm({ ...depositForm, type: e.target.value as DepositRuleType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="category">分类押金</option>
              <option value="equipment">单件装备押金</option>
              <option value="package">套餐押金</option>
            </select>
          </div>

          {depositForm.type === 'category' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                装备分类 <span className="text-red-500">*</span>
              </label>
              <select
                value={depositForm.category}
                onChange={(e) => setDepositForm({ ...depositForm, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">请选择分类</option>
                {equipmentCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {depositForm.type === 'equipment' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择装备 <span className="text-red-500">*</span>
              </label>
              <select
                value={depositForm.equipmentId}
                onChange={(e) => setDepositForm({ ...depositForm, equipmentId: e.target.value })}
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
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              押金金额（元） <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={depositForm.depositAmount}
              onChange={(e) => setDepositForm({ ...depositForm, depositAmount: e.target.value })}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="请输入押金金额"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="deposit-active"
              checked={depositForm.isActive}
              onChange={(e) => setDepositForm({ ...depositForm, isActive: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <label htmlFor="deposit-active" className="text-sm text-gray-700">
              启用该规则
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDepositModalOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleSaveDepositRule}>
              保存
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPenaltyModalOpen}
        onClose={() => setIsPenaltyModalOpen(false)}
        title={editingPenaltyRule ? '编辑违约金规则' : '新增违约金规则'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              规则名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={penaltyForm.name}
              onChange={(e) => setPenaltyForm({ ...penaltyForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="请输入规则名称"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              装备价值等级 <span className="text-red-500">*</span>
            </label>
            <select
              value={penaltyForm.valueLevel}
              onChange={(e) => setPenaltyForm({ ...penaltyForm, valueLevel: e.target.value as EquipmentValueLevel })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="normal">普通装备</option>
              <option value="high">高价值装备</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日租金倍率 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={penaltyForm.dailyRateMultiplier}
                onChange={(e) => setPenaltyForm({ ...penaltyForm, dailyRateMultiplier: e.target.value })}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="请输入倍率"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">x</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              例如：1.5 表示按日租金的 1.5 倍计算违约金
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="penalty-active"
              checked={penaltyForm.isActive}
              onChange={(e) => setPenaltyForm({ ...penaltyForm, isActive: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <label htmlFor="penalty-active" className="text-sm text-gray-700">
              启用该规则
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPenaltyModalOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleSavePenaltyRule}>
              保存
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isExemptModalOpen}
        onClose={() => setIsExemptModalOpen(false)}
        title={editingExempt ? '编辑免押客户' : '新增免押客户'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              选择客户 <span className="text-red-500">*</span>
            </label>
            <select
              value={exemptForm.customerId}
              onChange={(e) => setExemptForm({ ...exemptForm, customerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">请选择客户</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) - 已租赁{c.rentalCount}次
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              免押原因 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={exemptForm.reason}
              onChange={(e) => setExemptForm({ ...exemptForm, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="例如：VIP会员、高复购客户等"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最低租赁次数
            </label>
            <input
              type="number"
              value={exemptForm.minRentalCount}
              onChange={(e) => setExemptForm({ ...exemptForm, minRentalCount: e.target.value })}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="设置自动免押的最低租赁次数"
            />
            <p className="text-xs text-gray-500 mt-1">
              客户累计租赁次数达到该数值后自动免押（设为0表示不限制）
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="exempt-active"
              checked={exemptForm.isActive}
              onChange={(e) => setExemptForm({ ...exemptForm, isActive: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <label htmlFor="exempt-active" className="text-sm text-gray-700">
              启用该免押资格
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsExemptModalOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleSaveExempt}>
              保存
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
