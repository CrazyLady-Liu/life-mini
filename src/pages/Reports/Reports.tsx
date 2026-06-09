import { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  FileJson,
  Package,
  Users,
  ClipboardList,
  AlertTriangle,
  Wrench,
  Warehouse,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  ArrowRightLeft,
  Receipt,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import Button from '@/components/Button';
import {
  formatCurrency,
  equipmentStatusLabels,
  rentalStatusLabels,
  damageLevelLabels,
  maintenanceStatusLabels,
  financeCategoryLabels,
} from '@/utils/format';
import { exportToCSV, exportToJSON } from '@/utils/export';

export default function ReportsPage() {
  const {
    equipments,
    customers,
    rentals,
    damageRecords,
    partReplacements,
    maintenances,
    inventoryChecks,
    suppliers,
    fundFlowRecords,
    rentalFinanceDetails,
    financeVouchers,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [exportType, setExportType] = useState<'csv' | 'json'>('csv');

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  const stats = useMemo(() => {
    const totalEquipment = equipments.length;
    const totalCustomers = customers.length;
    const totalRentals = rentals.length;
    const totalDamage = damageRecords.length;
    const totalMaintenance = maintenances.length;
    const totalInventory = inventoryChecks.length;
    
    const totalRevenue = rentals
      .filter((r) => r.status === 'returned')
      .reduce((sum, r) => sum + r.price, 0);
    
    const totalMaintenanceCost = maintenances
      .filter((m) => m.status === 'completed')
      .reduce((sum, m) => sum + m.cost, 0);
    
    const totalPartsCost = partReplacements.reduce(
      (sum, p) => sum + p.quantity * p.unitPrice,
      0
    );
    
    const avgRentalPrice = totalRentals > 0
      ? rentals.reduce((sum, r) => sum + r.price, 0) / totalRentals
      : 0;
    
    const avgUsageCount = totalEquipment > 0
      ? equipments.reduce((sum, e) => sum + e.usageCount, 0) / totalEquipment
      : 0;
    
    const totalFundIncome = fundFlowRecords
      .filter((f) => f.direction === 'income')
      .reduce((sum, f) => sum + f.amount, 0);
    
    const totalFundExpense = fundFlowRecords
      .filter((f) => f.direction === 'expense')
      .reduce((sum, f) => sum + f.amount, 0);
    
    const netFundIncome = totalFundIncome - totalFundExpense;
    
    const totalPenalty = rentalFinanceDetails.reduce(
      (sum, d) => sum + d.penaltyAmount, 0
    );
    
    const totalDepositForfeited = rentalFinanceDetails.reduce(
      (sum, d) => sum + d.depositForfeited, 0
    );
    
    const totalDiscount = rentalFinanceDetails.reduce(
      (sum, d) => sum + d.totalDiscount, 0
    );
    
    const totalDeliveryFee = rentalFinanceDetails.reduce(
      (sum, d) => sum + d.deliveryFee, 0
    );
    
    return {
      totalEquipment,
      totalCustomers,
      totalRentals,
      totalDamage,
      totalMaintenance,
      totalInventory,
      totalRevenue,
      totalMaintenanceCost,
      totalPartsCost,
      avgRentalPrice,
      avgUsageCount,
      totalFundIncome,
      totalFundExpense,
      netFundIncome,
      totalPenalty,
      totalDepositForfeited,
      totalDiscount,
      totalDeliveryFee,
      fundFlowCount: fundFlowRecords.length,
      voucherCount: financeVouchers.length,
    };
  }, [
    equipments,
    customers,
    rentals,
    damageRecords,
    partReplacements,
    maintenances,
    inventoryChecks,
    fundFlowRecords,
    rentalFinanceDetails,
    financeVouchers,
  ]);

  const monthlyData = useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const now = new Date();
    const data = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIndex = date.getMonth();
      
      const monthRentals = rentals.filter((r) => {
        const rDate = new Date(r.createdAt);
        return rDate.getMonth() === monthIndex && rDate.getFullYear() === date.getFullYear();
      });
      
      const monthMaintenances = maintenances.filter((m) => {
        const mDate = new Date(m.date);
        return mDate.getMonth() === monthIndex && mDate.getFullYear() === date.getFullYear();
      });
      
      const revenue = monthRentals.reduce((sum, r) => sum + r.price, 0);
      const maintenanceCost = monthMaintenances.reduce((sum, m) => sum + m.cost, 0);
      
      data.push({
        name: months[monthIndex],
        租赁收入: revenue,
        维护成本: maintenanceCost,
        租赁次数: monthRentals.length,
        净利润: revenue - maintenanceCost,
      });
    }
    
    return data;
  }, [rentals, maintenances]);

  const equipmentByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();
    equipments.forEach((e) => {
      categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + 1);
    });
    return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
  }, [equipments]);

  const topEquipmentsByUsage = useMemo(() => {
    return [...equipments]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
      .map((e) => ({
        name: e.name,
        使用次数: e.usageCount,
      }));
  }, [equipments]);

  const financeCategoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    fundFlowRecords
      .filter((f) => f.direction === 'income')
      .forEach((f) => {
        const label = financeCategoryLabels[f.financeCategory] || f.financeCategory;
        categoryMap.set(label, (categoryMap.get(label) || 0) + f.amount);
      });
    return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
  }, [fundFlowRecords]);

  const monthlyFinanceData = useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const now = new Date();
    const data = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIndex = date.getMonth();
      
      const monthFlows = fundFlowRecords.filter((f) => {
        const fDate = new Date(f.createdAt);
        return fDate.getMonth() === monthIndex && fDate.getFullYear() === date.getFullYear();
      });
      
      const income = monthFlows
        .filter((f) => f.direction === 'income')
        .reduce((sum, f) => sum + f.amount, 0);
      
      const expense = monthFlows
        .filter((f) => f.direction === 'expense')
        .reduce((sum, f) => sum + f.amount, 0);
      
      data.push({
        name: months[monthIndex],
        收入: income,
        支出: expense,
        净流入: income - expense,
      });
    }
    
    return data;
  }, [fundFlowRecords]);

  const handleExportEquipment = () => {
    const columns = [
      { key: 'name', label: '装备名称' },
      { key: 'category', label: '分类' },
      { key: 'brand', label: '品牌' },
      { key: 'model', label: '型号' },
      { key: 'purchasePrice', label: '采购价格' },
      { key: 'purchaseDate', label: '采购日期' },
      { key: 'status', label: '状态' },
      { key: 'location', label: '存放位置' },
      { key: 'usageCount', label: '使用次数' },
      { key: 'supplierId', label: '供应商ID' },
      { key: 'notes', label: '备注' },
      { key: 'createdAt', label: '创建时间' },
    ];
    
    const data = equipments.map((eq) => ({
      ...eq,
      status: equipmentStatusLabels[eq.status] || eq.status,
    }));
    
    if (exportType === 'csv') {
      exportToCSV(data, '装备列表', columns);
    } else {
      exportToJSON(data, '装备列表');
    }
  };

  const handleExportRentals = () => {
    const columns = [
      { key: 'equipmentName', label: '装备名称' },
      { key: 'customerName', label: '客户姓名' },
      { key: 'startDate', label: '开始日期' },
      { key: 'endDate', label: '结束日期' },
      { key: 'price', label: '租赁费用' },
      { key: 'status', label: '状态' },
      { key: 'notes', label: '备注' },
      { key: 'createdAt', label: '创建时间' },
    ];
    
    const data = rentals.map((r) => {
      const equipment = equipments.find((e) => e.id === r.equipmentId);
      const customer = customers.find((c) => c.id === r.customerId);
      return {
        ...r,
        equipmentName: equipment?.name || '未知',
        customerName: customer?.name || '未知',
        status: rentalStatusLabels[r.status] || r.status,
      };
    });
    
    if (exportType === 'csv') {
      exportToCSV(data, '租赁记录', columns);
    } else {
      exportToJSON(data, '租赁记录');
    }
  };

  const handleExportDamage = () => {
    const columns = [
      { key: 'equipmentName', label: '装备名称' },
      { key: 'date', label: '损耗日期' },
      { key: 'level', label: '损耗程度' },
      { key: 'description', label: '损耗描述' },
      { key: 'reporter', label: '登记人' },
      { key: 'status', label: '状态' },
      { key: 'createdAt', label: '创建时间' },
    ];
    
    const data = damageRecords.map((d) => {
      const equipment = equipments.find((e) => e.id === d.equipmentId);
      return {
        ...d,
        equipmentName: equipment?.name || '未知',
        level: damageLevelLabels[d.level] || d.level,
      };
    });
    
    if (exportType === 'csv') {
      exportToCSV(data, '损耗记录', columns);
    } else {
      exportToJSON(data, '损耗记录');
    }
  };

  const handleExportMaintenance = () => {
    const columns = [
      { key: 'equipmentName', label: '装备名称' },
      { key: 'date', label: '维护日期' },
      { key: 'type', label: '维护类型' },
      { key: 'description', label: '维护描述' },
      { key: 'cost', label: '维护费用' },
      { key: 'technician', label: '维护人员' },
      { key: 'status', label: '状态' },
      { key: 'createdAt', label: '创建时间' },
    ];
    
    const data = maintenances.map((m) => {
      const equipment = equipments.find((e) => e.id === m.equipmentId);
      return {
        ...m,
        equipmentName: equipment?.name || '未知',
        status: maintenanceStatusLabels[m.status] || m.status,
      };
    });
    
    if (exportType === 'csv') {
      exportToCSV(data, '维护记录', columns);
    } else {
      exportToJSON(data, '维护记录');
    }
  };

  const tabs = [
    { id: 'overview', label: '综合概览', icon: FileText },
    { id: 'finance', label: '财务分析', icon: PieChart },
    { id: 'export', label: '数据导出', icon: Download },
  ];

  const exportItems = [
    {
      title: '装备数据',
      description: '导出所有装备的基础信息',
      icon: Package,
      onExport: handleExportEquipment,
      count: stats.totalEquipment,
    },
    {
      title: '客户数据',
      description: '导出所有客户信息',
      icon: Users,
      onExport: () => {
        const columns = [
          { key: 'name', label: '客户姓名' },
          { key: 'phone', label: '联系电话' },
          { key: 'idCard', label: '身份证号' },
          { key: 'address', label: '联系地址' },
          { key: 'rentalCount', label: '租赁次数' },
          { key: 'createdAt', label: '注册时间' },
        ];
        if (exportType === 'csv') {
          exportToCSV(customers, '客户列表', columns);
        } else {
          exportToJSON(customers, '客户列表');
        }
      },
      count: stats.totalCustomers,
    },
    {
      title: '租赁记录',
      description: '导出所有租赁订单数据',
      icon: ClipboardList,
      onExport: handleExportRentals,
      count: stats.totalRentals,
    },
    {
      title: '损耗记录',
      description: '导出所有装备损耗记录',
      icon: AlertTriangle,
      onExport: handleExportDamage,
      count: stats.totalDamage,
    },
    {
      title: '维护记录',
      description: '导出所有维护费用记录',
      icon: Wrench,
      onExport: handleExportMaintenance,
      count: stats.totalMaintenance,
    },
    {
      title: '供应商数据',
      description: '导出所有供应商信息',
      icon: Warehouse,
      onExport: () => {
        const columns = [
          { key: 'name', label: '供应商名称' },
          { key: 'contact', label: '联系人' },
          { key: 'phone', label: '联系电话' },
          { key: 'address', label: '联系地址' },
          { key: 'createdAt', label: '创建时间' },
        ];
        if (exportType === 'csv') {
          exportToCSV(suppliers, '供应商列表', columns);
        } else {
          exportToJSON(suppliers, '供应商列表');
        }
      },
      count: suppliers.length,
    },
    {
      title: '资金流水',
      description: '导出所有资金流水记录',
      icon: ArrowRightLeft,
      onExport: () => {
        const columns = [
          { key: 'flowNo', label: '流水号' },
          { key: 'type', label: '交易类型' },
          { key: 'financeCategory', label: '财务分类' },
          { key: 'amount', label: '金额' },
          { key: 'direction', label: '方向' },
          { key: 'customerId', label: '客户ID' },
          { key: 'rentalId', label: '租赁单ID' },
          { key: 'operator', label: '操作人' },
          { key: 'operateTime', label: '操作时间' },
          { key: 'changeReason', label: '变更原因' },
          { key: 'voucherStatus', label: '凭证状态' },
          { key: 'voucherNo', label: '凭证号' },
          { key: 'createdAt', label: '创建时间' },
        ];
        if (exportType === 'csv') {
          exportToCSV(fundFlowRecords, '资金流水', columns);
        } else {
          exportToJSON(fundFlowRecords, '资金流水');
        }
      },
      count: stats.fundFlowCount,
    },
    {
      title: '财务明细',
      description: '导出租赁财务明细数据',
      icon: Receipt,
      onExport: () => {
        const columns = [
          { key: 'rentalId', label: '租赁单ID' },
          { key: 'customerId', label: '客户ID' },
          { key: 'baseRentalFee', label: '基础租金' },
          { key: 'packageDiscount', label: '套餐优惠' },
          { key: 'couponDiscount', label: '优惠券减免' },
          { key: 'deliveryFee', label: '配送费' },
          { key: 'penaltyAmount', label: '逾期罚金' },
          { key: 'damageCompensation', label: '损坏赔偿' },
          { key: 'depositForfeited', label: '押金扣款' },
          { key: 'totalDiscount', label: '优惠合计' },
          { key: 'actualIncome', label: '实际收入' },
          { key: 'createdAt', label: '创建时间' },
        ];
        if (exportType === 'csv') {
          exportToCSV(rentalFinanceDetails, '财务明细', columns);
        } else {
          exportToJSON(rentalFinanceDetails, '财务明细');
        }
      },
      count: rentalFinanceDetails.length,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">数据报表</h2>
          <p className="text-gray-500 mt-1">多维度数据统计和报表导出</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-100">
          <nav className="flex gap-1 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-emerald-600">累计收入</p>
                      <p className="text-xl font-bold text-emerald-700">
                        {formatCurrency(stats.totalRevenue)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-red-600">维护成本</p>
                      <p className="text-xl font-bold text-red-700">
                        {formatCurrency(stats.totalMaintenanceCost)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-600">平均租金</p>
                      <p className="text-xl font-bold text-blue-700">
                        {formatCurrency(stats.avgRentalPrice)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-purple-600">平均使用</p>
                      <p className="text-xl font-bold text-purple-700">
                        {stats.avgUsageCount.toFixed(1)} 次
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">月度收支趋势</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="租赁收入" stroke="#10b981" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="维护成本" stroke="#ef4444" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="净利润" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">装备分类占比</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={equipmentByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {equipmentByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">装备使用次数排名</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topEquipmentsByUsage} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Bar dataKey="使用次数" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {exportItems.slice(0, 6).map((item) => (
                  <div
                    key={item.title}
                    className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                      <item.icon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="font-semibold text-gray-900">{item.count}</p>
                    <p className="text-sm text-gray-500">{item.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-emerald-600">总收入</p>
                      <p className="text-xl font-bold text-emerald-700">
                        {formatCurrency(stats.totalFundIncome)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-red-600">总支出</p>
                      <p className="text-xl font-bold text-red-700">
                        {formatCurrency(stats.totalFundExpense)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-600">净收入</p>
                      <p className={`text-xl font-bold ${
                        stats.netFundIncome >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {stats.netFundIncome >= 0 ? '+' : ''}{formatCurrency(stats.netFundIncome)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                      <ArrowRightLeft className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-amber-600">流水笔数</p>
                      <p className="text-xl font-bold text-amber-700">
                        {stats.fundFlowCount} 笔
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">租金收入</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">逾期罚金</p>
                  <p className="text-lg font-bold text-amber-600">{formatCurrency(stats.totalPenalty)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">押金扣款</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(stats.totalDepositForfeited)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">配送费收入</p>
                  <p className="text-lg font-bold text-purple-600">{formatCurrency(stats.totalDeliveryFee)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">月度收支趋势</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyFinanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="收入" stroke="#10b981" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="支出" stroke="#ef4444" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="净流入" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">收入分类占比</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={financeCategoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {financeCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">财务关键指标</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">优惠总额</p>
                    <p className="text-xl font-bold text-red-500 mt-1">-{formatCurrency(stats.totalDiscount)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">已开凭证</p>
                    <p className="text-xl font-bold text-blue-600 mt-1">{stats.voucherCount} 张</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">维护成本</p>
                    <p className="text-xl font-bold text-orange-500 mt-1">{formatCurrency(stats.totalMaintenanceCost)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">零部件成本</p>
                    <p className="text-xl font-bold text-purple-500 mt-1">{formatCurrency(stats.totalPartsCost)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-700">导出格式：</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExportType('csv')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      exportType === 'csv'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    CSV 格式
                  </button>
                  <button
                    onClick={() => setExportType('json')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      exportType === 'json'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <FileJson className="w-4 h-4" />
                    JSON 格式
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exportItems.map((item) => (
                  <div
                    key={item.title}
                    className="bg-white rounded-xl p-5 border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          共 {item.count} 条记录
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      leftIcon={<Download className="w-4 h-4" />}
                      className="w-full mt-4"
                      onClick={item.onExport}
                    >
                      导出数据
                    </Button>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">导出说明</h4>
                    <ul className="mt-2 text-sm text-amber-700 space-y-1">
                      <li>• CSV 格式可用 Excel 或其他表格软件打开</li>
                      <li>• JSON 格式适合程序导入和数据备份</li>
                      <li>• 所有数据使用 UTF-8 编码</li>
                      <li>• 导出的数据为当前系统中的全部数据</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
