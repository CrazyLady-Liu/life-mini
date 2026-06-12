import { useState, useMemo } from 'react';
import { Search, Wallet, ArrowDownCircle, ArrowUpCircle, SplitSquareHorizontal, ShieldCheck, AlertCircle, Info, Download, BookOpen } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import Button from '@/components/Button';
import { formatCurrency, formatDate, formatDateTime, depositFlowTypeLabels, depositFlowTypeColors, depositStatusLabels } from '@/utils/format';
import type { DepositFlowType } from '@/types';

export default function DepositLedger() {
  const {
    depositFundFlows,
    depositRecords,
    rentals,
    customers,
    equipments,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<DepositFlowType | ''>('');
  const [directionFilter, setDirectionFilter] = useState<'income' | 'expense' | ''>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name || '未知';
  const getEquipmentName = (id: string) => equipments.find((e) => e.id === id)?.name || '未知';

  const filteredFlows = useMemo(() => {
    return depositFundFlows
      .filter((flow) => {
        const customer = customers.find((c) => c.id === flow.customerId);
        const equipment = equipments.find((e) => e.id === flow.equipmentId);
        const matchesSearch =
          flow.flowNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          equipment?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          flow.changeReason.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !typeFilter || flow.type === typeFilter;
        const matchesDirection = !directionFilter || flow.direction === directionFilter;
        const flowDate = new Date(flow.createdAt);
        const matchesStartDate = !dateRange.start || flowDate >= new Date(dateRange.start);
        const matchesEndDate = !dateRange.end || flowDate <= new Date(dateRange.end + 'T23:59:59');
        return matchesSearch && matchesType && matchesDirection && matchesStartDate && matchesEndDate;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [depositFundFlows, customers, equipments, searchTerm, typeFilter, directionFilter, dateRange]);

  const stats = useMemo(() => {
    const totalCollected = depositFundFlows
      .filter((f) => f.type === 'deposit_collect')
      .reduce((sum, f) => sum + f.amount, 0);
    const totalRefundFull = depositFundFlows
      .filter((f) => f.type === 'deposit_refund_full')
      .reduce((sum, f) => sum + f.amount, 0);
    const totalRefundPartial = depositFundFlows
      .filter((f) => f.type === 'deposit_refund_partial')
      .reduce((sum, f) => sum + f.amount, 0);
    const totalOffset = depositFundFlows
      .filter((f) => f.type === 'deposit_offset')
      .reduce((sum, f) => sum + f.amount, 0);
    const totalIncome = depositFundFlows
      .filter((f) => f.direction === 'income')
      .reduce((sum, f) => sum + f.amount, 0);
    const totalExpense = depositFundFlows
      .filter((f) => f.direction === 'expense')
      .reduce((sum, f) => sum + f.amount, 0);
    const currentBalance = totalIncome - totalExpense;
    return { totalCollected, totalRefundFull, totalRefundPartial, totalOffset, totalIncome, totalExpense, currentBalance };
  }, [depositFundFlows]);

  const collectCount = depositFundFlows.filter((f) => f.type === 'deposit_collect').length;
  const refundFullCount = depositFundFlows.filter((f) => f.type === 'deposit_refund_full').length;
  const refundPartialCount = depositFundFlows.filter((f) => f.type === 'deposit_refund_partial').length;
  const offsetCount = depositFundFlows.filter((f) => f.type === 'deposit_offset').length;

  const handleExportCSV = () => {
    const headers = ['流水号', '流水类型', '金额', '方向', '客户', '装备', '关联押金ID', '抵扣金额', '退还金额', '操作人', '操作时间', '变更原因', '备注'];
    const rows = filteredFlows.map((flow) => [
      flow.flowNo,
      depositFlowTypeLabels[flow.type] || flow.type,
      flow.amount.toString(),
      flow.direction === 'income' ? '收入（往来款）' : '支出（往来款）',
      getCustomerName(flow.customerId),
      getEquipmentName(flow.equipmentId),
      flow.depositId,
      flow.offsetAmount?.toString() || '',
      flow.refundAmount?.toString() || '',
      flow.operator,
      formatDateTime(flow.operateTime),
      flow.changeReason,
      flow.remark || '',
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `押金资金台账_${formatDate(new Date().toISOString())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">押金资金台账</h2>
          <p className="text-gray-500 mt-1">独立押金往来款流水管理，不计入经营利润，避免营收虚高</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCSV}
          >
            导出台账
          </Button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-amber-800">往来款说明</h4>
          <p className="text-sm text-amber-700 mt-1">
            所有押金流水均为「往来款」：押金预收不计入营收，退还/抵扣不计入成本。
            <br />
            <strong>重要</strong>：押金抵扣金额（赔付/违约金等）对应的<strong>经营性收入</strong>已在<strong>财务对账→经营收入</strong>中独立记录并参与利润核算，此处仅展示押金资金本身的收支运动，确保营收不虚高。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">押金预收</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">+{formatCurrency(stats.totalCollected)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{collectCount} 笔</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <ArrowUpCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">全额退还</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">-{formatCurrency(stats.totalRefundFull)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{refundFullCount} 笔</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
              <SplitSquareHorizontal className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">抵扣（已转经营收入）</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">-{formatCurrency(stats.totalOffset)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{offsetCount} 笔抵扣 / {refundPartialCount} 笔退还</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">往来款余额</p>
              <p className={`text-2xl font-bold mt-1 ${stats.currentBalance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                {stats.currentBalance >= 0 ? '+' : ''}{formatCurrency(stats.currentBalance)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">预收 - 退还/抵扣</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">筛选条件</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
              onChange={(e) => setTypeFilter(e.target.value as DepositFlowType | '')}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            >
              <option value="">全部流水类型</option>
              {Object.entries(depositFlowTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value as 'income' | 'expense' | '')}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            >
              <option value="">全部方向</option>
              <option value="income">收入（往来款收取）</option>
              <option value="expense">支出（往来款退还）</option>
            </select>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredFlows.map((flow) => {
            const colorInfo = depositFlowTypeColors[flow.type] || { bg: 'bg-gray-100', text: 'text-gray-700' };
            const rental = rentals.find((r) => r.id === flow.rentalId);

            return (
              <div key={flow.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      flow.type === 'deposit_collect' ? 'bg-amber-100' :
                      flow.type === 'deposit_refund_full' ? 'bg-emerald-100' :
                      flow.type === 'deposit_refund_partial' ? 'bg-blue-100' :
                      'bg-rose-100'
                    }`}>
                      {flow.type === 'deposit_collect' ? <Wallet className="w-6 h-6 text-amber-600" /> :
                       flow.type === 'deposit_refund_full' ? <ArrowUpCircle className="w-6 h-6 text-emerald-600" /> :
                       flow.type === 'deposit_refund_partial' ? <ArrowDownCircle className="w-6 h-6 text-blue-600" /> :
                       <SplitSquareHorizontal className="w-6 h-6 text-rose-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {depositFlowTypeLabels[flow.type]}
                        </h3>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colorInfo.bg} ${colorInfo.text}`}>
                          往来款
                        </span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          flow.direction === 'income' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {flow.direction === 'income' ? '收取' : '退还'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{flow.changeReason}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>客户：{getCustomerName(flow.customerId)}</span>
                        <span>装备：{getEquipmentName(flow.equipmentId)}</span>
                        {rental && (
                          <span>租期：{formatDate(rental.startDate)} ~ {formatDate(rental.endDate)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span>流水号：{flow.flowNo}</span>
                        <span>操作人：{flow.operator}</span>
                        <span>{formatDateTime(flow.operateTime)}</span>
                      </div>
                      {flow.remark && (
                        <div className="mt-2 flex items-start gap-1">
                          <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-500">{flow.remark}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xl font-bold ${
                      flow.direction === 'income' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {flow.direction === 'income' ? '+' : '-'}{formatCurrency(flow.amount)}
                    </p>
                    {flow.type === 'deposit_offset' && flow.offsetAmount !== undefined && (
                      <div className="mt-1 text-xs text-gray-500">
                        <p>抵扣：{formatCurrency(flow.offsetAmount)}</p>
                        {flow.refundAmount !== undefined && flow.refundAmount > 0 && (
                          <p>退还：{formatCurrency(flow.refundAmount)}</p>
                        )}
                      </div>
                    )}
                    {flow.type === 'deposit_refund_partial' && flow.offsetAmount !== undefined && (
                      <div className="mt-1 text-xs text-gray-500">
                        <p>原抵扣：{formatCurrency(flow.offsetAmount)}</p>
                        <p>退还：{formatCurrency(flow.refundAmount || 0)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredFlows.length === 0 && (
          <div className="py-12 text-center">
            <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无押金资金流水记录</p>
            <p className="text-gray-400 text-sm mt-1">租赁记录中收取押金或归还装备时将自动生成押金流水</p>
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              共 {filteredFlows.length} 条押金流水记录
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">
                往来款收取：<span className="font-semibold text-amber-600">{formatCurrency(stats.totalIncome)}</span>
              </span>
              <span className="text-gray-500">
                往来款退还/抵扣：<span className="font-semibold text-emerald-600">{formatCurrency(stats.totalExpense)}</span>
              </span>
              <span className="text-gray-500">
                余额：<span className={`font-semibold ${stats.currentBalance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                  {formatCurrency(stats.currentBalance)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900">押金台账说明</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-amber-600" />
              <h4 className="font-medium text-amber-800">押金预收流水</h4>
            </div>
            <p className="text-sm text-amber-700">
              客户租赁下单时缴纳押金，记为往来款收入，<strong>不作为经营性收入</strong>计入利润。
            </p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
              <h4 className="font-medium text-emerald-800">押金全额退还流水</h4>
            </div>
            <p className="text-sm text-emerald-700">
              装备完好归还时，原路全额退还押金，记为往来款支出，<strong>不影响经营成本</strong>。
            </p>
          </div>
          <div className="p-4 bg-rose-50 rounded-lg border border-rose-100">
            <div className="flex items-center gap-2 mb-2">
              <SplitSquareHorizontal className="w-5 h-5 text-rose-600" />
              <h4 className="font-medium text-rose-800">押金部分抵扣流水</h4>
            </div>
            <p className="text-sm text-rose-700">
              出现损耗时：抵扣部分（赔付/违约金）<strong>对应的经营性收入已在财务对账独立记录并参与利润核算</strong>，此处仅记录往来款余额减少；剩余退还部分记为往来款支出。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
