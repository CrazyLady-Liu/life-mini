import { useState, useMemo } from 'react';
import { Plus, Search, CheckCircle, Calendar, Package, User, Wallet, AlertTriangle, Receipt, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import StatusBadge from '@/components/StatusBadge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate, depositStatusLabels } from '@/utils/format';
import { calculateRentalDeposit, calculateRentalPenalty } from '@/utils/finance';
import type { Rental, DepositRecord, RentalPenalty, FinancialTransaction } from '@/types';

export default function RentalsPage() {
  const {
    rentals,
    equipments,
    customers,
    addRental,
    returnRental,
    updateRental,
    collectDeposit,
    getDepositRecordByRentalId,
    getPenaltyByRentalId,
    getTransactionsByRentalId,
    calculateRentalDeposit: calcDeposit,
    calculateRentalPenalty: calcPenalty,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [expandedRentalId, setExpandedRentalId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    equipmentId: '',
    customerId: '',
    startDate: '',
    endDate: '',
    price: '',
    notes: '',
  });

  const [returnFormData, setReturnFormData] = useState({
    penaltyAmount: '',
    damageCompensation: '',
    adjustmentReason: '',
    operator: '管理员',
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

  const depositInfo = useMemo(() => {
    if (!formData.equipmentId || !formData.customerId) {
      return { amount: 0, isExempt: false };
    }
    return calcDeposit(formData.equipmentId, formData.customerId);
  }, [formData.equipmentId, formData.customerId, calcDeposit]);

  const penaltyPreview = useMemo(() => {
    if (!selectedRental) return null;
    return calcPenalty(selectedRental.id);
  }, [selectedRental, calcPenalty]);

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

  const handleReturn = (rental: Rental) => {
    setSelectedRental(rental);
    const penalty = calcPenalty(rental.id);
    setReturnFormData({
      penaltyAmount: penalty?.totalPenalty?.toString() || '0',
      damageCompensation: '0',
      adjustmentReason: '',
      operator: '管理员',
    });
    setIsReturnModalOpen(true);
  };

  const handleConfirmReturn = () => {
    if (!selectedRental) return;
    
    returnRental(selectedRental.id, {
      penaltyAmount: Number(returnFormData.penaltyAmount),
      damageCompensation: Number(returnFormData.damageCompensation),
      adjustmentReason: returnFormData.adjustmentReason || undefined,
      operator: returnFormData.operator,
    });
    
    setIsReturnModalOpen(false);
    setSelectedRental(null);
  };

  const handleCollectDeposit = (rentalId: string) => {
    if (confirm('确认收取押金吗？')) {
      collectDeposit(rentalId);
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

  const toggleExpand = (rentalId: string) => {
    setExpandedRentalId(expandedRentalId === rentalId ? null : rentalId);
  };

  const activeCount = rentals.filter((r) => r.status === 'active').length;
  const totalRevenue = rentals
    .filter((r) => r.status === 'returned')
    .reduce((sum, r) => sum + r.price, 0);

  const totalDeposits = useAppStore.getState().depositRecords
    .filter((d) => d.status === 'collected')
    .reduce((sum, d) => sum + d.collectedAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">租赁记录</h2>
          <p className="text-gray-500 mt-1">管理所有装备租赁订单及财务结算</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={handleAdd}>
          新增租赁
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">在押押金总额</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{formatCurrency(totalDeposits)}</p>
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
          {filteredRentals.map((rental) => {
            const depositRecord = getDepositRecordByRentalId(rental.id);
            const penaltyRecord = getPenaltyByRentalId(rental.id);
            const transactions = getTransactionsByRentalId(rental.id);
            const isExpanded = expandedRentalId === rental.id;
            const depositAmount = depositRecord?.totalDepositAmount || 0;

            return (
              <div key={rental.id}>
                <div
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => toggleExpand(rental.id)}
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
                      <div className="text-center">
                        <p className="text-xs text-gray-500">押金</p>
                        <div className="flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5 text-purple-500" />
                          <span className={`text-sm font-medium ${depositRecord?.isExempt ? 'text-emerald-600' : 'text-gray-700'}`}>
                            {depositRecord?.isExempt ? '免押' : formatCurrency(depositAmount)}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={rental.status} variant="rental" />
                      
                      <div className="flex items-center gap-2">
                        {rental.status === 'active' && (
                          <Button
                            size="sm"
                            leftIcon={<CheckCircle className="w-4 h-4" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReturn(rental);
                            }}
                          >
                            归还
                          </Button>
                        )}
                        {rental.status === 'active' && depositRecord?.status === 'pending' && !depositRecord.isExempt && (
                          <Button
                            size="sm"
                            variant="secondary"
                            leftIcon={<DollarSign className="w-4 h-4" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCollectDeposit(rental.id);
                            }}
                          >
                            收押金
                          </Button>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  {rental.notes && (
                    <p className="mt-3 text-sm text-gray-500 pl-16">
                      备注：{rental.notes}
                    </p>
                  )}
                </div>

                {isExpanded && (
                  <div className="bg-gray-50 px-4 pb-4 pl-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                          <Wallet className="w-4 h-4 text-purple-500" />
                          <h4 className="font-semibold text-gray-800">押金信息</h4>
                        </div>
                        {depositRecord ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">押金金额</span>
                              <span className="font-medium">{formatCurrency(depositRecord.totalDepositAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">已收取</span>
                              <span className="font-medium text-emerald-600">{formatCurrency(depositRecord.collectedAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">已退还</span>
                              <span className="font-medium text-blue-600">{formatCurrency(depositRecord.refundedAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">已没收</span>
                              <span className="font-medium text-red-600">{formatCurrency(depositRecord.forfeitedAmount)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-100">
                              <span className="text-gray-500">状态</span>
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                depositRecord.status === 'collected' ? 'bg-amber-100 text-amber-700' :
                                depositRecord.status === 'refunded_full' ? 'bg-emerald-100 text-emerald-700' :
                                depositRecord.status === 'refunded_partial' ? 'bg-blue-100 text-blue-700' :
                                depositRecord.status === 'forfeited' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {depositStatusLabels[depositRecord.status]}
                              </span>
                            </div>
                            {depositRecord.isExempt && (
                              <div className="mt-2 p-2 bg-emerald-50 rounded-lg">
                                <p className="text-xs text-emerald-700">
                                  <span className="font-medium">免押原因：</span>
                                  {depositRecord.exemptReason}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">暂无押金记录</p>
                        )}
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <h4 className="font-semibold text-gray-800">违约金信息</h4>
                        </div>
                        {penaltyRecord ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">逾期天数</span>
                              <span className="font-medium">{penaltyRecord.overdueDays} 天</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">日租金</span>
                              <span className="font-medium">{formatCurrency(penaltyRecord.dailyRate)}/天</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">违约金倍率</span>
                              <span className="font-medium">{penaltyRecord.multiplier}x</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">计算金额</span>
                              <span className="font-medium">{formatCurrency(penaltyRecord.totalPenalty)}</span>
                            </div>
                            {penaltyRecord.isAdjusted && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">调整后金额</span>
                                <span className="font-medium text-amber-600">{formatCurrency(penaltyRecord.adjustedAmount)}</span>
                              </div>
                            )}
                            {penaltyRecord.adjustmentReason && (
                              <div className="mt-2 p-2 bg-amber-50 rounded-lg">
                                <p className="text-xs text-amber-700">
                                  <span className="font-medium">调整原因：</span>
                                  {penaltyRecord.adjustmentReason}
                                </p>
                              </div>
                            )}
                            {penaltyRecord.operator && (
                              <div className="flex justify-between pt-2 border-t border-gray-100">
                                <span className="text-gray-500">操作人</span>
                                <span className="font-medium">{penaltyRecord.operator}</span>
                              </div>
                            )}
                          </div>
                        ) : rental.status === 'active' || rental.status === 'overdue' ? (
                          <div className="space-y-2 text-sm">
                            <p className="text-gray-500">当前无逾期记录</p>
                            {(() => {
                              const penalty = calcPenalty(rental.id);
                              if (penalty && penalty.overdueDays > 0) {
                                return (
                                  <div className="p-2 bg-amber-50 rounded-lg">
                                    <p className="text-xs text-amber-700">
                                      <span className="font-medium">预计逾期：</span>
                                      {penalty.overdueDays}天，约 {formatCurrency(penalty.totalPenalty)}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">无违约金记录</p>
                        )}
                      </div>
                    </div>

                    {transactions.length > 0 && (
                      <div className="mt-4 bg-white rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                          <Receipt className="w-4 h-4 text-blue-500" />
                          <h4 className="font-semibold text-gray-800">财务流水</h4>
                        </div>
                        <div className="space-y-2">
                          {transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                              <div>
                                <p className="text-sm font-medium text-gray-700">{tx.description}</p>
                                <p className="text-xs text-gray-400">
                                  {formatDate(tx.createdAt)} · {tx.operator}
                                </p>
                              </div>
                              <span className={`text-sm font-semibold ${
                                tx.direction === 'income' ? 'text-emerald-600' : 'text-red-500'
                              }`}>
                                {tx.direction === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                押金信息
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                {depositInfo.isExempt ? (
                  <div>
                    <p className="text-sm font-medium text-emerald-600">免押金</p>
                    <p className="text-xs text-gray-500 mt-0.5">{depositInfo.exemptReason}</p>
                  </div>
                ) : depositInfo.amount > 0 ? (
                  <div>
                    <p className="text-sm font-medium text-gray-700">{formatCurrency(depositInfo.amount)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">根据押金规则自动计算</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">请选择装备和客户以计算押金</p>
                )}
              </div>
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

      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="归还确认 & 财务结算"
        size="lg"
      >
        {selectedRental && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                <div>
                  <p className="font-semibold text-emerald-800">确认装备已归还？</p>
                  <p className="text-sm text-emerald-600">
                    {getEquipmentName(selectedRental.equipmentId)} - {getCustomerName(selectedRental.customerId)}
                  </p>
                </div>
              </div>
            </div>

            {penaltyPreview && penaltyPreview.overdueDays > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-800">逾期提醒</p>
                    <p className="text-sm text-amber-600 mt-1">
                      该订单已逾期 {penaltyPreview.overdueDays} 天，
                      日租金 {formatCurrency(penaltyPreview.dailyRate)}，
                      违约金倍率 {penaltyPreview.multiplier}x
                    </p>
                    <p className="text-lg font-bold text-amber-700 mt-2">
                      应扣违约金：{formatCurrency(penaltyPreview.totalPenalty)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  违约金金额（元）
                </label>
                <input
                  type="number"
                  value={returnFormData.penaltyAmount}
                  onChange={(e) => setReturnFormData({ ...returnFormData, penaltyAmount: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">系统自动计算，可手动调整</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  损坏赔偿（元）
                </label>
                <input
                  type="number"
                  value={returnFormData.damageCompensation}
                  onChange={(e) => setReturnFormData({ ...returnFormData, damageCompensation: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">如有损坏需额外赔偿请填写</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  调整原因
                </label>
                <input
                  type="text"
                  value={returnFormData.adjustmentReason}
                  onChange={(e) => setReturnFormData({ ...returnFormData, adjustmentReason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="如有调整请填写原因"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  操作人
                </label>
                <input
                  type="text"
                  value={returnFormData.operator}
                  onChange={(e) => setReturnFormData({ ...returnFormData, operator: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {(() => {
              const deposit = getDepositRecordByRentalId(selectedRental.id);
              const penalty = Number(returnFormData.penaltyAmount) || 0;
              const damage = Number(returnFormData.damageCompensation) || 0;
              const totalDeduction = penalty + damage;
              const refundAmount = deposit ? Math.max(0, deposit.collectedAmount - totalDeduction) : 0;
              const forfeitAmount = deposit ? Math.min(deposit.collectedAmount, totalDeduction) : 0;

              if (!deposit || deposit.isExempt) return null;

              return (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 mb-3">押金结算预览</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-purple-600">已收押金</span>
                      <span className="font-medium">{formatCurrency(deposit.collectedAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-600">扣除合计（违约金+赔偿）</span>
                      <span className="font-medium text-red-600">-{formatCurrency(totalDeduction)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-purple-200">
                      <span className="text-purple-700 font-medium">应退押金</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(refundAmount)}</span>
                    </div>
                    {forfeitAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-purple-600">没收押金</span>
                        <span className="font-medium text-amber-600">{formatCurrency(forfeitAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsReturnModalOpen(false)}
              >
                取消
              </Button>
              <Button onClick={handleConfirmReturn}>
                确认归还
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
