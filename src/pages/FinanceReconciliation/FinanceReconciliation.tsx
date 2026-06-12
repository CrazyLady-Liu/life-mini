import { useState, useMemo } from 'react';
import { Search, ArrowRightLeft, Download, FileText, Filter, PieChart, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import Button from '@/components/Button';
import { formatCurrency, formatDate, formatDateTime, transactionTypeLabels, financeCategoryLabels, voucherStatusLabels, customerChannelLabels } from '@/utils/format';
import { exportVoucherHTML } from '@/utils/export';
import type { TransactionType, FinanceCategory, CustomerChannel } from '@/types';

export default function FinanceReconciliation() {
  const {
    fundFlowRecords,
    rentals,
    customers,
    equipments,
    rentalFinanceDetails,
    issueVoucher,
    getVouchersByRentalId,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<FinanceCategory | ''>('');
  const [directionFilter, setDirectionFilter] = useState<'income' | 'expense' | ''>('');
  const [channelFilter, setChannelFilter] = useState<CustomerChannel | ''>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const filteredFlows = useMemo(() => {
    return fundFlowRecords
      .filter((flow) => {
        const rental = rentals.find((r) => r.id === flow.rentalId);
        const customer = customers.find((c) => c.id === flow.customerId);
        const equipment = equipments.find((e) => e.id === rental?.equipmentId);
        
        const matchesSearch = 
          flow.flowNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          equipment?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          flow.changeReason.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = !typeFilter || flow.type === typeFilter;
        const matchesCategory = !categoryFilter || flow.financeCategory === categoryFilter;
        const matchesDirection = !directionFilter || flow.direction === directionFilter;
        const matchesChannel = !channelFilter || flow.channel === channelFilter;
        
        const flowDate = new Date(flow.createdAt);
        const matchesStartDate = !dateRange.start || flowDate >= new Date(dateRange.start);
        const matchesEndDate = !dateRange.end || flowDate <= new Date(dateRange.end + 'T23:59:59');
        
        return matchesSearch && matchesType && matchesCategory && matchesDirection && matchesChannel && matchesStartDate && matchesEndDate;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [fundFlowRecords, rentals, customers, equipments, searchTerm, typeFilter, categoryFilter, directionFilter, channelFilter, dateRange]);

  const totalIncome = useMemo(() => {
    return filteredFlows
      .filter((f) => f.direction === 'income')
      .reduce((sum, f) => sum + f.amount, 0);
  }, [filteredFlows]);

  const totalExpense = useMemo(() => {
    return filteredFlows
      .filter((f) => f.direction === 'expense')
      .reduce((sum, f) => sum + f.amount, 0);
  }, [filteredFlows]);

  const netIncome = totalIncome - totalExpense;

  const totalReceivable = useMemo(() => {
    return rentalFinanceDetails.reduce((sum, d) => sum + d.totalReceivable, 0);
  }, [rentalFinanceDetails]);

  const totalDeduction = useMemo(() => {
    return rentalFinanceDetails.reduce((sum, d) => sum + d.totalDeduction, 0);
  }, [rentalFinanceDetails]);

  const totalActualIncome = useMemo(() => {
    return rentalFinanceDetails.reduce((sum, d) => sum + d.actualIncome, 0);
  }, [rentalFinanceDetails]);

  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name || '未知';
  const getEquipmentName = (rentalId: string) => {
    const rental = rentals.find((r) => r.id === rentalId);
    return equipments.find((e) => e.id === rental?.equipmentId)?.name || '未知';
  };

  const handleIssueVoucher = (rentalId: string, type: 'receipt' | 'payment') => {
    const result = issueVoucher(rentalId, type, '管理员');
    if (result) {
      alert(`凭证已开具：${result.voucherNo}`);
    } else {
      alert('开具凭证失败，请检查是否有可开票的资金流水');
    }
  };

  const handleExportCSV = () => {
    const headers = ['流水号', '交易类型', '财务分类', '金额', '方向', '渠道', '客户', '装备', '操作人', '操作时间', '变更原因', '凭证状态', '凭证号'];
    const rows = filteredFlows.map((flow) => [
      flow.flowNo,
      transactionTypeLabels[flow.type] || flow.type,
      financeCategoryLabels[flow.financeCategory] || flow.financeCategory,
      flow.amount.toString(),
      flow.direction === 'income' ? '收入' : '支出',
      flow.channel ? customerChannelLabels[flow.channel] : '-',
      getCustomerName(flow.customerId),
      getEquipmentName(flow.rentalId),
      flow.operator,
      formatDateTime(flow.operateTime),
      flow.changeReason,
      voucherStatusLabels[flow.voucherStatus],
      flow.voucherNo || '',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `财务流水_${formatDate(new Date().toISOString())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFinanceDetail = () => {
    const headers = ['租赁单号', '客户', '装备', '单品租金收入', '配送费', '清洁费', '打包费', '逾期罚金', '损坏赔偿', '丢失赔款', '总应收金额', '套餐优惠抵扣', '优惠券减免', '押金抵扣', '总抵扣金额', '押金扣款收入', '优惠合计', '实际收入', '结算状态'];
    const rows = rentalFinanceDetails.map((detail) => {
      const rental = rentals.find((r) => r.id === detail.rentalId);
      return [
        detail.rentalId,
        getCustomerName(detail.customerId),
        getEquipmentName(detail.rentalId),
        detail.baseRentalFee.toString(),
        detail.deliveryFee.toString(),
        detail.cleaningFee.toString(),
        detail.packingFee.toString(),
        detail.penaltyAmount.toString(),
        detail.damageCompensation.toString(),
        detail.lossCompensation.toString(),
        detail.totalReceivable.toString(),
        detail.packageDiscount.toString(),
        detail.couponDiscount.toString(),
        detail.depositOffset.toString(),
        detail.totalDeduction.toString(),
        detail.depositForfeited.toString(),
        detail.totalDiscount.toString(),
        detail.actualIncome.toString(),
        rental?.status === 'returned' ? '已结算' : '进行中',
      ];
    });

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `财务明细_${formatDate(new Date().toISOString())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">财务对账</h2>
          <p className="text-gray-500 mt-1">多维度财务流水查询、对账和凭证管理</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            leftIcon={<FileText className="w-4 h-4" />}
            onClick={handleExportFinanceDetail}
          >
            导出财务明细
          </Button>
          <Button
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCSV}
          >
            导出流水
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总收入</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总支出</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <ArrowRightLeft className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总应收</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalReceivable)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总抵扣</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{formatCurrency(totalDeduction)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <PieChart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">实际收入合计</p>
              <p className={`text-2xl font-bold mt-1 ${totalActualIncome >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {totalActualIncome >= 0 ? '+' : ''}{formatCurrency(totalActualIncome)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">筛选条件</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索流水号、客户、装备、原因..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TransactionType | '')}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            >
              <option value="">全部交易类型</option>
              {Object.entries(transactionTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as CustomerChannel | '')}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            >
              <option value="">全部渠道</option>
              <option value="individual">散客</option>
              <option value="group">团建</option>
              <option value="online">线上渠道</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as FinanceCategory | '')}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            >
              <option value="">全部财务分类</option>
              {Object.entries(financeCategoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value as 'income' | 'expense' | '')}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            >
              <option value="">全部收支</option>
              <option value="income">收入</option>
              <option value="expense">支出</option>
            </select>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              placeholder="开始日期"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              placeholder="结束日期"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">流水号</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">交易类型</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">财务分类</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">渠道</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">金额</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">客户</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">装备</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">操作人</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">操作时间</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">凭证状态</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFlows.map((flow) => (
                <tr key={flow.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm text-blue-600">{flow.flowNo}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-800">
                      {transactionTypeLabels[flow.type] || flow.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {financeCategoryLabels[flow.financeCategory] || flow.financeCategory}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {flow.channel ? (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        flow.channel === 'individual' ? 'bg-blue-100 text-blue-700' :
                        flow.channel === 'group' ? 'bg-purple-100 text-purple-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {customerChannelLabels[flow.channel]}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`text-sm font-semibold ${
                      flow.direction === 'income' ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {flow.direction === 'income' ? '+' : '-'}{formatCurrency(flow.amount)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-700">{getCustomerName(flow.customerId)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-700">{getEquipmentName(flow.rentalId)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{flow.operator}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-500">{formatDateTime(flow.operateTime)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      flow.voucherStatus === 'issued' 
                        ? 'bg-blue-100 text-blue-700' 
                        : flow.voucherStatus === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      {voucherStatusLabels[flow.voucherStatus]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      {flow.voucherStatus === 'pending' && (
                        <Button
                          size="sm"
                          variant="text"
                          leftIcon={<FileText className="w-3.5 h-3.5" />}
                          onClick={() => handleIssueVoucher(flow.rentalId, flow.direction === 'income' ? 'receipt' : 'payment')}
                        >
                          开票
                        </Button>
                      )}
                      {flow.voucherStatus === 'issued' && flow.voucherNo && (
                        <Button
                          size="sm"
                          variant="text"
                          leftIcon={<Download className="w-3.5 h-3.5" />}
                          onClick={() => {
                            const vouchers = getVouchersByRentalId(flow.rentalId);
                            const voucher = vouchers.find((v) => v.voucherNo === flow.voucherNo);
                            if (voucher) {
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
                            }
                          }}
                        >
                          导出
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFlows.length === 0 && (
          <div className="py-12 text-center">
            <ArrowRightLeft className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无资金流水记录</p>
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              共 {filteredFlows.length} 条流水记录
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">
                收入合计：<span className="font-semibold text-emerald-600">{formatCurrency(totalIncome)}</span>
              </span>
              <span className="text-gray-500">
                支出合计：<span className="font-semibold text-red-500">{formatCurrency(totalExpense)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
