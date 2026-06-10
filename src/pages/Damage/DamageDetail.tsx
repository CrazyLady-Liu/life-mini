import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  Tag,
  Building2,
  UserCheck,
  Package,
  Wrench,
  AlertTriangle,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Plus,
  DollarSign,
  Clock,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import StatusBadge from '@/components/StatusBadge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate } from '@/utils/format';
import type { DamageLevel } from '@/types';

const damageLevelInfo: Record<DamageLevel, { label: string; color: string; bgColor: string }> = {
  minor: { label: '轻微', color: 'text-green-600', bgColor: 'bg-green-100' },
  moderate: { label: '一般', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  severe: { label: '严重', color: 'text-red-600', bgColor: 'bg-red-100' },
  scrapped: { label: '报废', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

export default function DamageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    damageRecords,
    equipments,
    partReplacements,
    updateDamageRecord,
    addPartReplacement,
  } = useAppStore();

  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [partFormData, setPartFormData] = useState({
    partName: '',
    quantity: '',
    unitPrice: '',
  });

  const damageRecord = useMemo(() => {
    return damageRecords.find((d) => d.id === id) || null;
  }, [damageRecords, id]);

  const equipment = useMemo(() => {
    if (!damageRecord) return null;
    return equipments.find((e) => e.id === damageRecord.equipmentId) || null;
  }, [damageRecord, equipments]);

  const parts = useMemo(() => {
    if (!damageRecord) return [];
    return partReplacements.filter((p) => p.damageId === damageRecord.id);
  }, [damageRecord, partReplacements]);

  const partsTotal = useMemo(() => {
    return parts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
  }, [parts]);

  const handleMarkRepaired = () => {
    if (!damageRecord) return;
    if (confirm('确认已修复吗？')) {
      updateDamageRecord(damageRecord.id, { status: 'repaired' });
    }
  };

  const handleAddPart = () => {
    if (!damageRecord) return;
    setPartFormData({
      partName: '',
      quantity: '1',
      unitPrice: '',
    });
    setIsPartModalOpen(true);
  };

  const handlePartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!damageRecord || !equipment) return;
    addPartReplacement({
      damageId: damageRecord.id,
      equipmentId: equipment.id,
      partName: partFormData.partName,
      quantity: Number(partFormData.quantity),
      unitPrice: Number(partFormData.unitPrice),
    });
    setIsPartModalOpen(false);
  };

  if (!damageRecord || !equipment) {
    return (
      <div className="space-y-6">
        <Button
          variant="secondary"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/damage')}
        >
          返回列表
        </Button>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">未找到该损耗记录</p>
        </div>
      </div>
    );
  }

  const levelInfo = damageLevelInfo[damageRecord.level];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/damage')}
        >
          返回列表
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">损耗登记详情</h2>
          <p className="text-gray-500 mt-1">查看设备损耗信息和处理进度</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">设备信息</h3>
              <Link
                to={`/equipment`}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
              >
                查看完整档案
              </Link>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div
                  className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${levelInfo.bgColor}`}
                >
                  <Package className={`w-8 h-8 ${levelInfo.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xl font-semibold text-gray-900">{equipment.name}</h4>
                    <StatusBadge status={equipment.status} variant="equipment" />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{equipment.brand} {equipment.model}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <Tag className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">设备编号</p>
                    <p className="text-sm font-medium text-gray-900">{equipment.equipmentNo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">设备分类</p>
                    <p className="text-sm font-medium text-gray-900">{equipment.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">所属部门</p>
                    <p className="text-sm font-medium text-gray-900">{equipment.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">使用人</p>
                    <p className="text-sm font-medium text-gray-900">{equipment.custodian}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">购置价格</p>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(equipment.purchasePrice)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">使用次数</p>
                    <p className="text-sm font-medium text-gray-900">{equipment.usageCount} 次</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">损耗信息</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${levelInfo.bgColor}`}
                >
                  <AlertTriangle className={`w-6 h-6 ${levelInfo.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={damageRecord.level} variant="damage" />
                    <span
                      className={`text-sm px-2.5 py-0.5 rounded-full ${
                        damageRecord.status === 'reported'
                          ? 'bg-amber-100 text-amber-700'
                          : damageRecord.status === 'repaired'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {damageRecord.status === 'reported'
                        ? '待处理'
                        : damageRecord.status === 'repaired'
                        ? '已修复'
                        : '已报废'}
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">{damageRecord.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(damageRecord.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {damageRecord.reporter}
                    </span>
                  </div>
                </div>
              </div>

              {damageRecord.photoUrls && damageRecord.photoUrls.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" />
                    现场照片 ({damageRecord.photoUrls.length})
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {damageRecord.photoUrls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`现场照片 ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity cursor-pointer"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">配件更换记录</h3>
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleAddPart}
              >
                登记配件更换
              </Button>
            </div>
            <div className="divide-y divide-gray-100">
              {parts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p>暂无配件更换记录</p>
                </div>
              ) : (
                <>
                  {parts.map((part) => (
                    <div key={part.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{part.partName}</p>
                          <p className="text-sm text-gray-500">
                            数量：{part.quantity} × {formatCurrency(part.unitPrice)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-amber-600">
                          {formatCurrency(part.quantity * part.unitPrice)}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(part.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                  <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
                    <span className="text-gray-600 font-medium">配件费用合计</span>
                    <span className="text-lg font-bold text-amber-600">{formatCurrency(partsTotal)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">处理操作</h3>
            </div>
            <div className="p-6 space-y-3">
              {damageRecord.status === 'reported' && (
                <>
                  <Button
                    className="w-full"
                    leftIcon={<CheckCircle className="w-4 h-4" />}
                    onClick={handleMarkRepaired}
                  >
                    标记已修复
                  </Button>
                  <Button
                    className="w-full"
                    variant="secondary"
                    leftIcon={<Wrench className="w-4 h-4" />}
                    onClick={handleAddPart}
                  >
                    登记配件更换
                  </Button>
                </>
              )}
              {damageRecord.status === 'repaired' && (
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">该损耗已修复完成</p>
                  <p className="text-sm text-gray-500 mt-1">如有新的损耗，请重新登记</p>
                </div>
              )}
              {damageRecord.status === 'scrapped' && (
                <div className="text-center py-4">
                  <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-700 font-medium">该设备已报废处理</p>
                  <p className="text-sm text-gray-500 mt-1">设备已从可用列表中移除</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">费用统计</h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">配件费用</span>
                <span className="font-medium text-gray-900">{formatCurrency(partsTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">维修工时费</span>
                <span className="font-medium text-gray-900">{formatCurrency(0)}</span>
              </div>
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-gray-900">合计</span>
                <span className="text-lg font-bold text-emerald-600">{formatCurrency(partsTotal)}</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6">
            <h4 className="font-semibold text-emerald-800 mb-3">💡 操作建议</h4>
            <ul className="space-y-2 text-sm text-emerald-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                修复完成后请及时标记为「已修复」
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                配件更换需如实登记，便于成本核算
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                严重/报废损耗需走正式审批流程
              </li>
            </ul>
          </div>
        </div>
      </div>

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
