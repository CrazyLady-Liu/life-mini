import { useState, useMemo } from 'react';
import { Plus, Search, CheckCircle, Calendar, Package, User, Wallet, AlertTriangle, Receipt, ChevronDown, ChevronUp, CreditCard, PieChart, ArrowRightLeft, FileText, Download, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import StatusBadge from '@/components/StatusBadge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate, formatDateTime, depositStatusLabels, transactionTypeLabels, financeCategoryLabels, customerChannelLabels } from '@/utils/format';
import type { CustomerChannel } from '@/types';
import { exportVoucherHTML } from '@/utils/export';
import type { Rental } from '@/types';

export default function RentalsPage() {
  const {
    rentals,
    equipments,
    customers,
    addRental,
    returnRental,
    collectDeposit,
    renewRental,
    offsetDeposit,
    getDepositRecordByRentalId,
    getPenaltyByRentalId,
    getFinanceDetailByRentalId,
    getFundFlowsByRentalId,
    getVouchersByRentalId,
    issueVoucher,
    calculateRentalDeposit: calcDeposit,
    calculateRentalPenalty: calcPenalty,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [expandedRentalId, setExpandedRentalId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'finance' | 'flows' | 'vouchers'>('finance');
  const [formData, setFormData] = useState({
    equipmentId: '',
    customerId: '',
    startDate: '',
    endDate: '',
    price: '',
    channel: 'individual' as CustomerChannel,
    notes: '',
  });

  const [returnFormData, setReturnFormData] = useState({
    penaltyAmount: '',
    damageCompensation: '',
    adjustmentReason: '',
    operator: '管理员',
    packageDiscount: '',
    couponDiscount: '',
    deliveryFee: '',
    cleaningFee: '',
    packingFee: '',
    lossCompensation: '',
    depositOffset: '',
    offsetType: 'rental' as 'rental' | 'damage' | 'penalty',
    damageId: '',
    isFullLoss: false,
  });

  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewFormData, setRenewFormData] = useState({
    endDate: '',
    price: '',
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
      packageDiscount: '0',
      couponDiscount: '0',
      deliveryFee: '0',
      cleaningFee: '0',
      packingFee: '0',
      lossCompensation: '0',
      depositOffset: '0',
      offsetType: 'rental',
      damageId: '',
      isFullLoss: false,
    });
    setIsReturnModalOpen(true);
  };

  const handleRenew = (rental: Rental) => {
    setSelectedRental(rental);
    setRenewFormData({
      endDate: '',
      price: '',
      operator: '管理员',
    });
    setIsRenewModalOpen(true);
  };

  const handleConfirmRenew = () => {
    if (!selectedRental || !renewFormData.endDate || !renewFormData.price) {
      alert('请填写完整的续租信息');
      return;
    }
    renewRental(selectedRental.id, {
      endDate: renewFormData.endDate,
      price: Number(renewFormData.price),
      operator: renewFormData.operator,
    });
    setIsRenewModalOpen(false);
    setSelectedRental(null);
  };

  const handleConfirmReturn = () => {
    if (!selectedRental) return;
    
    returnRental(selectedRental.id, {
      penaltyAmount: Number(returnFormData.penaltyAmount),
      damageCompensation: Number(returnFormData.damageCompensation),
      adjustmentReason: returnFormData.adjustmentReason || undefined,
      operator: returnFormData.operator,
      packageDiscount: Number(returnFormData.packageDiscount) || 0,
      couponDiscount: Number(returnFormData.couponDiscount) || 0,
      deliveryFee: Number(returnFormData.deliveryFee) || 0,
      cleaningFee: Number(returnFormData.cleaningFee) || 0,
      packingFee: Number(returnFormData.packingFee) || 0,
      lossCompensation: Number(returnFormData.lossCompensation) || 0,
      depositOffset: Number(returnFormData.depositOffset) || 0,
      offsetType: returnFormData.offsetType,
      damageId: returnFormData.damageId || undefined,
      isFullLoss: returnFormData.isFullLoss,
    });
    
    setIsReturnModalOpen(false);
    setSelectedRental(null);
  };

  const handleCollectDeposit = (rentalId: string) => {
    if (confirm('确认收取押金吗？')) {
      collectDeposit(rentalId);
    }
  };

  const handleIssueVoucher = (rentalId: string, type: 'receipt' | 'payment') => {
    const result = issueVoucher(rentalId, type, '管理员');
    if (result) {
      alert(`凭证已开具：${result.voucherNo}`);
    } else {
      alert('开具凭证失败，请检查是否有可开票的资金流水');
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
      channel: formData.channel,
      notes: formData.notes,
    });
    setIsModalOpen(false);
  };

  const toggleExpand = (rentalId: string) => {
    setExpandedRentalId(expandedRentalId === rentalId ? null : rentalId);
    if (expandedRentalId !== rentalId) {
      setActiveDetailTab('finance');
    }
  };

  const activeCount = rentals.filter((r) => r.status === 'active').length;
  const totalRevenue = rentals
    .filter((r) => r.status === 'returned')
    .reduce((sum, r) => sum + r.price, 0);

  const totalFundFlows = useAppStore.getState().fundFlowRecords.length;

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
          <p className="text-sm text-gray-500">资金流水记录</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{totalFundFlows} 笔</p>
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
            const financeDetail = getFinanceDetailByRentalId(rental.id);
            const fundFlows = getFundFlowsByRentalId(rental.id);
            const vouchers = getVouchersByRentalId(rental.id);
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
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          rental.channel === 'individual' ? 'bg-blue-100 text-blue-700' :
                          rental.channel === 'group' ? 'bg-purple-100 text-purple-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {customerChannelLabels[rental.channel]}
                        </span>
                        {rental.status === 'active' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            leftIcon={<RefreshCw className="w-4 h-4" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenew(rental);
                            }}
                          >
                            续租
                          </Button>
                        )}
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
                            leftIcon={<CreditCard className="w-4 h-4" />}
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
                    <div className="pt-4">
                      <div className="flex gap-2 mb-4 border-b border-gray-200">
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveDetailTab('finance'); }}
                          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeDetailTab === 'finance'
                              ? 'border-emerald-500 text-emerald-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <PieChart className="w-4 h-4" />
                          财务明细
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveDetailTab('flows'); }}
                          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeDetailTab === 'flows'
                              ? 'border-emerald-500 text-emerald-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                          资金流水
                          <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                            {fundFlows.length}
                          </span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveDetailTab('vouchers'); }}
                          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeDetailTab === 'vouchers'
                              ? 'border-emerald-500 text-emerald-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                          凭证
                          <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                            {vouchers.length}
                          </span>
                        </button>
                      </div>

                      {activeDetailTab === 'finance' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-4 border border-gray-100">
                            <div className="flex items-center gap-2 mb-4">
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
                            <div className="flex items-center gap-2 mb-4">
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

                          <div className="bg-white rounded-lg p-4 border border-gray-100 md:col-span-2">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <PieChart className="w-4 h-4 text-blue-500" />
                                <h4 className="font-semibold text-gray-800">财务明细拆分</h4>
                              </div>
                            </div>
                            {financeDetail ? (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-3 bg-emerald-50 rounded-lg">
                                  <p className="text-xs text-emerald-600">单品租金收入</p>
                                  <p className="text-lg font-bold text-emerald-700 mt-1">{formatCurrency(financeDetail.baseRentalFee)}</p>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-lg">
                                  <p className="text-xs text-amber-600">押金扣款收入</p>
                                  <p className="text-lg font-bold text-amber-700 mt-1">{formatCurrency(financeDetail.depositForfeited)}</p>
                                </div>
                                <div className="p-3 bg-red-50 rounded-lg">
                                  <p className="text-xs text-red-600">逾期罚金</p>
                                  <p className="text-lg font-bold text-red-700 mt-1">{formatCurrency(financeDetail.penaltyAmount)}</p>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-lg">
                                  <p className="text-xs text-purple-600">实际收入合计</p>
                                  <p className="text-lg font-bold text-purple-700 mt-1">{formatCurrency(financeDetail.actualIncome)}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <p className="text-xs text-gray-600">套餐优惠抵扣</p>
                                  <p className="text-lg font-bold text-gray-700 mt-1">-{formatCurrency(financeDetail.packageDiscount)}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <p className="text-xs text-gray-600">优惠券减免</p>
                                  <p className="text-lg font-bold text-gray-700 mt-1">-{formatCurrency(financeDetail.couponDiscount)}</p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-lg">
                                  <p className="text-xs text-blue-600">配送附加费</p>
                                  <p className="text-lg font-bold text-blue-700 mt-1">{formatCurrency(financeDetail.deliveryFee)}</p>
                                </div>
                                <div className="p-3 bg-rose-50 rounded-lg">
                                  <p className="text-xs text-rose-600">损坏赔偿</p>
                                  <p className="text-lg font-bold text-rose-700 mt-1">{formatCurrency(financeDetail.damageCompensation)}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-3 bg-emerald-50 rounded-lg">
                                  <p className="text-xs text-emerald-600">单品租金收入</p>
                                  <p className="text-lg font-bold text-emerald-700 mt-1">{formatCurrency(rental.price)}</p>
                                </div>
                                <div className="p-3 bg-gray-100 rounded-lg">
                                  <p className="text-xs text-gray-500">押金扣款收入</p>
                                  <p className="text-lg font-bold text-gray-400 mt-1">待结算</p>
                                </div>
                                <div className="p-3 bg-gray-100 rounded-lg">
                                  <p className="text-xs text-gray-500">逾期罚金</p>
                                  <p className="text-lg font-bold text-gray-400 mt-1">待结算</p>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-lg">
                                  <p className="text-xs text-purple-600">预计收入</p>
                                  <p className="text-lg font-bold text-purple-700 mt-1">{formatCurrency(rental.price)}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {activeDetailTab === 'flows' && (
                        <div className="bg-white rounded-lg border border-gray-100">
                          <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                                <h4 className="font-semibold text-gray-800">资金流水记录</h4>
                              </div>
                              <span className="text-xs text-gray-500">
                                共 {fundFlows.length} 条流水
                              </span>
                            </div>
                          </div>
                          {fundFlows.length > 0 ? (
                            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                              {fundFlows.map((flow) => (
                                <div key={flow.id} className="p-4 hover:bg-gray-50 transition-colors">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        flow.direction === 'income' ? 'bg-emerald-100' : 'bg-red-100'
                                      }`}>
                                        <ArrowRightLeft className={`w-4 h-4 ${
                                          flow.direction === 'income' ? 'text-emerald-600' : 'text-red-600'
                                        }`} />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium text-gray-800">
                                            {transactionTypeLabels[flow.type] || flow.type}
                                          </p>
                                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                                            flow.voucherStatus === 'issued' 
                                              ? 'bg-blue-100 text-blue-700' 
                                              : 'bg-gray-100 text-gray-600'
                                          }`}>
                                            {flow.voucherStatus === 'issued' ? '已开票' : '待开票'}
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{flow.changeReason}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                          <span>流水号：{flow.flowNo}</span>
                                          <span>操作人：{flow.operator}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                          {formatDateTime(flow.operateTime)}
                                        </p>
                                        {flow.remark && (
                                          <p className="text-xs text-gray-500 mt-1">
                                            备注：{flow.remark}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className={`text-lg font-bold ${
                                        flow.direction === 'income' ? 'text-emerald-600' : 'text-red-500'
                                      }`}>
                                        {flow.direction === 'income' ? '+' : '-'}{formatCurrency(flow.amount)}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-1">
                                        {financeCategoryLabels[flow.financeCategory]}
                                      </p>
                                    </div>
                                  </div>
                                  {flow.voucherNo && (
                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                      <p className="text-xs text-gray-500">
                                        凭证号：<span className="text-blue-600 font-medium">{flow.voucherNo}</span>
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-12 text-center">
                              <p className="text-gray-500 text-sm">暂无资金流水记录</p>
                            </div>
                          )}
                        </div>
                      )}

                      {activeDetailTab === 'vouchers' && (
                        <div className="bg-white rounded-lg border border-gray-100">
                          <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-amber-500" />
                                <h4 className="font-semibold text-gray-800">财务凭证</h4>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  leftIcon={<FileText className="w-4 h-4" />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleIssueVoucher(rental.id, 'receipt');
                                  }}
                                >
                                  开收款凭证
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  leftIcon={<FileText className="w-4 h-4" />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleIssueVoucher(rental.id, 'payment');
                                  }}
                                >
                                  开付款凭证
                                </Button>
                              </div>
                            </div>
                          </div>
                          {vouchers.length > 0 ? (
                            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                              {vouchers.map((voucher) => (
                                <div key={voucher.id} className="p-4 hover:bg-gray-50 transition-colors">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                        voucher.type === 'receipt' ? 'bg-emerald-100' : 'bg-red-100'
                                      }`}>
                                        <Receipt className={`w-4 h-4 ${
                                          voucher.type === 'receipt' ? 'text-emerald-600' : 'text-red-600'
                                        }`} />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium text-gray-800">
                                            {voucher.type === 'receipt' ? '收款凭证' : '付款凭证'}
                                          </p>
                                          <span className="px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                                            {voucher.voucherNo}
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                          包含 {voucher.items.length} 个财务项
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                          <span>操作人：{voucher.operator}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                          {formatDateTime(voucher.issuedAt)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className={`text-lg font-bold ${
                                        voucher.type === 'receipt' ? 'text-emerald-600' : 'text-red-500'
                                      }`}>
                                        {voucher.type === 'receipt' ? '+' : '-'}{formatCurrency(voucher.amount)}
                                      </p>
                                      <Button
                                        size="sm"
                                        variant="text"
                                        leftIcon={<Download className="w-3.5 h-3.5" />}
                                        className="mt-2"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const customer = customers.find((c) => c.id === voucher.customerId);
                                          exportVoucherHTML({
                                            voucherNo: voucher.voucherNo,
                                            type: voucher.type,
                                            customerName: customer?.name || '未知',
                                            rentalId: voucher.rentalId,
                                            operator: voucher.operator,
                                            issuedAt: formatDateTime(voucher.issuedAt),
                                            amount: voucher.amount,
                                            items: voucher.items.map((item) => ({
                                              description: item.name,
                                              amount: item.amount,
                                              remark: '',
                                            })),
                                          });
                                        }}
                                      >
                                        导出
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 mb-2">凭证明细：</p>
                                    <div className="space-y-1">
                                      {voucher.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-xs">
                                          <span className="text-gray-600">{item.name}</span>
                                          <span className="text-gray-800">{formatCurrency(item.amount)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-12 text-center">
                              <p className="text-gray-500 text-sm">暂无凭证记录</p>
                              <p className="text-gray-400 text-xs mt-1">点击上方按钮开具财务凭证</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
                客户渠道 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value as CustomerChannel })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="individual">散客</option>
                <option value="group">团建</option>
                <option value="online">线上渠道</option>
              </select>
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
        size="xl"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  装备丢失赔款（元）
                </label>
                <input
                  type="number"
                  value={returnFormData.lossCompensation}
                  onChange={(e) => setReturnFormData({ ...returnFormData, lossCompensation: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">装备丢失全额赔偿金额</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  配送费（元）
                </label>
                <input
                  type="number"
                  value={returnFormData.deliveryFee}
                  onChange={(e) => setReturnFormData({ ...returnFormData, deliveryFee: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">配送或上门服务费</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  清洁费（元）
                </label>
                <input
                  type="number"
                  value={returnFormData.cleaningFee}
                  onChange={(e) => setReturnFormData({ ...returnFormData, cleaningFee: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">装备清洁服务费</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  装备打包费（元）
                </label>
                <input
                  type="number"
                  value={returnFormData.packingFee}
                  onChange={(e) => setReturnFormData({ ...returnFormData, packingFee: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">装备打包服务费</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  套餐优惠抵扣（元）
                </label>
                <input
                  type="number"
                  value={returnFormData.packageDiscount}
                  onChange={(e) => setReturnFormData({ ...returnFormData, packageDiscount: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">套餐优惠减免金额</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  优惠券减免（元）
                </label>
                <input
                  type="number"
                  value={returnFormData.couponDiscount}
                  onChange={(e) => setReturnFormData({ ...returnFormData, couponDiscount: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">客户使用优惠券抵扣</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  押金抵扣（元）
                </label>
                <input
                  type="number"
                  value={returnFormData.depositOffset}
                  onChange={(e) => setReturnFormData({ ...returnFormData, depositOffset: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">客户押金直接抵扣费用</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  押金抵扣类型
                </label>
                <select
                  value={returnFormData.offsetType}
                  onChange={(e) => setReturnFormData({ ...returnFormData, offsetType: e.target.value as 'rental' | 'damage' | 'penalty' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="rental">抵扣租金</option>
                  <option value="damage">抵扣赔付</option>
                  <option value="penalty">抵扣违约金</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  关联损耗记录ID
                </label>
                <input
                  type="text"
                  value={returnFormData.damageId}
                  onChange={(e) => setReturnFormData({ ...returnFormData, damageId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="可选，关联损耗记录"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={returnFormData.isFullLoss}
                    onChange={(e) => setReturnFormData({ ...returnFormData, isFullLoss: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">全额丢失赔付</span>
                </label>
              </div>
              <div className="md:col-span-3">
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
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  调整原因/备注
                </label>
                <input
                  type="text"
                  value={returnFormData.adjustmentReason}
                  onChange={(e) => setReturnFormData({ ...returnFormData, adjustmentReason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="如有调整请填写原因"
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-purple-600">已收押金</span>
                      <p className="font-medium text-lg">{formatCurrency(deposit.collectedAmount)}</p>
                    </div>
                    <div>
                      <span className="text-purple-600">扣除合计</span>
                      <p className="font-medium text-lg text-red-600">-{formatCurrency(totalDeduction)}</p>
                    </div>
                    <div>
                      <span className="text-purple-700 font-medium">应退押金</span>
                      <p className="font-bold text-lg text-emerald-600">{formatCurrency(refundAmount)}</p>
                    </div>
                    <div>
                      <span className="text-purple-600">没收押金</span>
                      <p className="font-medium text-lg text-amber-600">{formatCurrency(forfeitAmount)}</p>
                    </div>
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

      <Modal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        title="续租确认"
        size="lg"
      >
        {selectedRental && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-800">确认续租？</p>
                  <p className="text-sm text-blue-600">
                    {getEquipmentName(selectedRental.equipmentId)} - {getCustomerName(selectedRental.customerId)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  当前租期结束
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-700">{selectedRental.endDate}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  续租结束日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={renewFormData.endDate}
                  onChange={(e) => setRenewFormData({ ...renewFormData, endDate: e.target.value })}
                  required
                  min={selectedRental.endDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  续租租金 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={renewFormData.price}
                  onChange={(e) => setRenewFormData({ ...renewFormData, price: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="请输入续租租金"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  操作人
                </label>
                <input
                  type="text"
                  value={renewFormData.operator}
                  onChange={(e) => setRenewFormData({ ...renewFormData, operator: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsRenewModalOpen(false)}
              >
                取消
              </Button>
              <Button onClick={handleConfirmRenew}>
                确认续租
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
