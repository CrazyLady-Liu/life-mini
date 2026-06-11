import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, AlertTriangle, Wrench, Package, Calendar, User, Info, CheckCircle, XCircle, Tag, Building2, UserCheck, Camera, X, Image as ImageIcon, ChevronRight, DollarSign, PackageX } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import StatusBadge from '@/components/StatusBadge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import Toast, { type ToastType } from '@/components/Toast';
import GroupedSelect, { type GroupedSelectGroup, type GroupedSelectOption } from '@/components/GroupedSelect';
import { formatCurrency, formatDate } from '@/utils/format';
import type { DamageLevel, Equipment } from '@/types';

const DAMAGE_UNAVAILABLE_STATUSES = ['scrapped', 'decommissioned'];

const damageLevelInfo: Record<DamageLevel, { label: string; color: string; bgColor: string }> = {
  minor: { label: '轻微', color: 'text-green-600', bgColor: 'bg-green-100' },
  moderate: { label: '一般', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  severe: { label: '严重', color: 'text-red-600', bgColor: 'bg-red-100' },
  scrapped: { label: '报废', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

export default function DamagePage() {
  const {
    damageRecords,
    equipments,
    partReplacements,
    rentals,
    addDamageRecord,
    updateDamageRecord,
    addPartReplacement,
    confirmDamageCompensation,
    confirmEquipmentLoss,
  } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedDamageId, setSelectedDamageId] = useState('');
  const [formData, setFormData] = useState({
    equipmentId: '',
    date: '',
    level: 'minor' as DamageLevel,
    description: '',
    reporter: '',
    photoUrls: [] as string[],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [partFormData, setPartFormData] = useState({
    partName: '',
    quantity: '',
    unitPrice: '',
  });
  const [statusWarning, setStatusWarning] = useState('');
  const [damageTipType, setDamageTipType] = useState<'none' | 'photo' | 'confirm'>('none');
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
    isOpen: false,
    message: '',
    type: 'warning',
  });

  const [isCompensationModalOpen, setIsCompensationModalOpen] = useState(false);
  const [isLossModalOpen, setIsLossModalOpen] = useState(false);
  const [selectedDamageForCompensation, setSelectedDamageForCompensation] = useState<DamageRecord | null>(null);
  const [compensationFormData, setCompensationFormData] = useState({
    amount: '',
    operator: '管理员',
  });

  const showToast = (message: string, type: ToastType = 'warning') => {
    setToast({ isOpen: true, message, type });
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirmCompensation = (record: DamageRecord) => {
    if (record.compensationConfirmed) {
      showToast('该损耗记录已确认赔付', 'warning');
      return;
    }
    setSelectedDamageForCompensation(record);
    const equipment = equipments.find((e) => e.id === record.equipmentId);
    const suggestedAmount = equipment?.price ? equipment.price * 0.3 : 0;
    setCompensationFormData({
      amount: suggestedAmount.toFixed(2),
      operator: '管理员',
    });
    setIsCompensationModalOpen(true);
  };

  const handleSubmitCompensation = () => {
    if (!selectedDamageForCompensation) return;
    const amount = Number(compensationFormData.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast('请输入有效的赔付金额', 'error');
      return;
    }
    confirmDamageCompensation(selectedDamageForCompensation.id, amount, compensationFormData.operator);
    setIsCompensationModalOpen(false);
    setSelectedDamageForCompensation(null);
    showToast('赔付确认成功，已生成赔付收入流水', 'success');
  };

  const handleConfirmLoss = (record: DamageRecord) => {
    if (record.compensationConfirmed) {
      showToast('该损耗记录已处理', 'warning');
      return;
    }
    setSelectedDamageForCompensation(record);
    const equipment = equipments.find((e) => e.id === record.equipmentId);
    setCompensationFormData({
      amount: equipment?.price?.toFixed(2) || '0',
      operator: '管理员',
    });
    setIsLossModalOpen(true);
  };

  const handleSubmitLoss = () => {
    if (!selectedDamageForCompensation) return;
    const amount = Number(compensationFormData.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast('请输入有效的丢失赔款金额', 'error');
      return;
    }
    confirmEquipmentLoss(selectedDamageForCompensation.id, amount, compensationFormData.operator);
    setIsLossModalOpen(false);
    setSelectedDamageForCompensation(null);
    showToast('装备丢失确认成功，已生成全额赔款收入流水', 'success');
  };

  const handleDisabledEquipmentClick = (option: GroupedSelectOption) => {
    const reason = option.disabledReason || '该设备无法登记损耗';
    showToast(reason, 'warning');
  };

  const selectedEquipment = useMemo(() => {
    if (!formData.equipmentId) return null;
    return equipments.find((e) => e.id === formData.equipmentId) || null;
  }, [formData.equipmentId, equipments]);

  const availableEquipments = useMemo(() => {
    return equipments.filter((eq) => !DAMAGE_UNAVAILABLE_STATUSES.includes(eq.status));
  }, [equipments]);

  const unavailableEquipments = useMemo(() => {
    return equipments.filter((eq) => DAMAGE_UNAVAILABLE_STATUSES.includes(eq.status));
  }, [equipments]);

  const equipmentSelectGroups = useMemo<GroupedSelectGroup[]>(() => {
    return [
      {
        label: '可登记损耗的设备',
        icon: '✅',
        options: availableEquipments.map((eq) => ({
          value: eq.id,
          label: `${eq.name} (${eq.brand} ${eq.model})`,
        })),
      },
      {
        label: '不可登记（已报废/停用）',
        icon: '🚫',
        options: unavailableEquipments.map((eq) => ({
          value: eq.id,
          label: `${eq.name} - ${eq.status === 'scrapped' ? '已报废' : '已停用'}`,
          disabled: true,
          disabledReason: `该设备已${eq.status === 'scrapped' ? '报废' : '停用'}，无法登记损耗`,
        })),
      },
    ];
  }, [availableEquipments, unavailableEquipments]);

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
      photoUrls: [],
    });
    setStatusWarning('');
    setDamageTipType('none');
    setIsModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({
            ...prev,
            photoUrls: [...prev.photoUrls, event.target!.result as string],
          }));
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photoUrls: prev.photoUrls.filter((_, i) => i !== index),
    }));
  };

  const handleEquipmentChange = (equipmentId: string) => {
    const equipment = equipments.find((e) => e.id === equipmentId);
    
    if (!equipment) {
      setFormData({ ...formData, equipmentId: '' });
      setStatusWarning('');
      return;
    }

    if (DAMAGE_UNAVAILABLE_STATUSES.includes(equipment.status)) {
      setStatusWarning(`该设备当前状态为「${equipment.status === 'scrapped' ? '已报废' : '已停用'}」，无法登记损耗`);
      setFormData({ ...formData, equipmentId: '' });
      return;
    }

    setStatusWarning('');
    setFormData({ ...formData, equipmentId });
  };

  const handleLevelChange = (level: DamageLevel) => {
    setFormData({ ...formData, level });
    
    if (level === 'severe' || level === 'scrapped') {
      setDamageTipType('confirm');
    } else if (level === 'minor' || level === 'moderate') {
      setDamageTipType('photo');
    } else {
      setDamageTipType('none');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.level === 'severe' || formData.level === 'scrapped') {
      setIsConfirmModalOpen(true);
    } else {
      submitDamageRecord();
    }
  };

  const submitDamageRecord = () => {
    addDamageRecord(formData);
    setIsModalOpen(false);
    setIsConfirmModalOpen(false);
    setDamageTipType('none');
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
    const scrapped = damageRecords.filter((d) => d.level === 'scrapped').length;
    const totalPartsCost = partReplacements.reduce(
      (sum, p) => sum + p.quantity * p.unitPrice,
      0
    );
    return { total, minor, moderate, severe, scrapped, totalPartsCost };
  }, [damageRecords, partReplacements]);

  const renderEquipmentInfoCard = () => {
    if (!selectedEquipment) return null;

    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span className="font-medium text-emerald-800">设备信息已自动回填</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-500" />
            <span className="text-gray-500">设备编号：</span>
            <span className="text-gray-900 font-medium">{selectedEquipment.equipmentNo}</span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-500" />
            <span className="text-gray-500">设备型号：</span>
            <span className="text-gray-900 font-medium">{selectedEquipment.brand} {selectedEquipment.model}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-500" />
            <span className="text-gray-500">所属部门：</span>
            <span className="text-gray-900 font-medium">{selectedEquipment.department}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-gray-500">使用人：</span>
            <span className="text-gray-900 font-medium">{selectedEquipment.custodian}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderDamageTip = () => {
    if (damageTipType === 'photo') {
      return (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 flex-1">
              <p className="font-medium">温馨提示</p>
              <p className="mt-0.5">建议上传现场照片辅助记录，便于后续维修参考</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              现场照片 <span className="text-gray-400 font-normal">（可选）</span>
            </label>
            
            {formData.photoUrls.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {formData.photoUrls.map((url, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img
                      src={url}
                      alt={`现场照片 ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              <Camera className="w-5 h-5" />
              <span className="text-sm">点击上传现场照片</span>
              <span className="text-xs text-gray-400">支持 JPG、PNG 格式，可多选</span>
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderStatusWarning = () => {
    if (!statusWarning) return null;
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-red-800">
          <p className="font-medium">无法选择</p>
          <p className="mt-0.5">{statusWarning}</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
        duration={2000}
      />
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

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">累计损耗</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total} 次</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">轻微损耗</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.minor} 次</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">一般损耗</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.moderate} 次</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">严重损耗</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.severe} 次</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">报废处理</p>
          <p className="text-2xl font-bold text-gray-600 mt-1">{stats.scrapped} 次</p>
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
              <option value="moderate">一般</option>
              <option value="severe">严重</option>
              <option value="scrapped">报废</option>
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
            const levelInfo = damageLevelInfo[record.level];

            return (
              <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div
                    className="flex items-start gap-4 flex-1 cursor-pointer group"
                    onClick={() => navigate(`/damage/${record.id}`)}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${levelInfo.bgColor}`}
                    >
                      <AlertTriangle
                        className={`w-6 h-6 ${levelInfo.color}`}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        {getEquipmentName(record.equipmentId)}
                        <StatusBadge status={record.level} variant="damage" />
                        <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-emerald-500 transition-all ml-auto" />
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
                        {record.photoUrls && record.photoUrls.length > 0 && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <ImageIcon className="w-3.5 h-3.5" />
                            {record.photoUrls.length} 张照片
                          </span>
                        )}
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
                            : record.status === 'compensated'
                            ? 'bg-blue-100 text-blue-700'
                            : record.status === 'lost'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {record.status === 'reported'
                          ? '待处理'
                          : record.status === 'repaired'
                          ? '已修复'
                          : record.status === 'compensated'
                          ? '已赔付'
                          : record.status === 'lost'
                          ? '已丢失'
                          : '已报废'}
                      </span>
                      {record.compensationConfirmed && record.compensationAmount !== undefined && (
                        <span className="text-sm font-medium text-emerald-600">
                          已赔付: {formatCurrency(record.compensationAmount)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
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
                      {record.status === 'reported' && !record.compensationConfirmed && (
                        <Button
                          size="sm"
                          variant="secondary"
                          leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmCompensation(record);
                          }}
                        >
                          确认赔付
                        </Button>
                      )}
                      {record.status === 'reported' && !record.compensationConfirmed && (
                        <Button
                          size="sm"
                          variant="danger"
                          leftIcon={<PackageX className="w-3.5 h-3.5" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmLoss(record);
                          }}
                        >
                          丢失确认
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              选择设备 <span className="text-red-500">*</span>
            </label>
            <GroupedSelect
              groups={equipmentSelectGroups}
              value={formData.equipmentId}
              onChange={handleEquipmentChange}
              onDisabledClick={handleDisabledEquipmentClick}
              placeholder="请选择设备"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              提示：仅「在库、租出、维护中、损坏待修」状态的设备可登记损耗，点击已报废/停用设备查看提示
            </p>
          </div>

          {statusWarning && renderStatusWarning()}

          {selectedEquipment && renderEquipmentInfoCard()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  handleLevelChange(e.target.value as DamageLevel)
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="minor">轻微</option>
                <option value="moderate">一般</option>
                <option value="severe">严重</option>
                <option value="scrapped">报废</option>
              </select>
            </div>
          </div>

          {damageTipType !== 'none' && renderDamageTip()}

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
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="提交确认"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-800">重要提示</h4>
              <p className="text-sm text-red-700 mt-1">
                该损耗程度为「{damageLevelInfo[formData.level].label}」将触发设备维修/报废流程，请确认是否继续提交？
              </p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <p className="text-gray-600">
              <span className="font-medium text-gray-700">设备名称：</span>
              {selectedEquipment?.name || '未知'}
            </p>
            <p className="text-gray-600 mt-2">
              <span className="font-medium text-gray-700">损耗程度：</span>
              {damageLevelInfo[formData.level].label}
            </p>
            <p className="text-gray-600 mt-2">
              <span className="font-medium text-gray-700">登记人：</span>
              {formData.reporter || '未填写'}
            </p>
            {formData.photoUrls.length > 0 && (
              <p className="text-gray-600 mt-2">
                <span className="font-medium text-gray-700">现场照片：</span>
                <span className="text-emerald-600">{formData.photoUrls.length} 张</span>
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              返回修改
            </Button>
            <Button onClick={submitDamageRecord}>确认提交</Button>
          </div>
        </div>
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

      <Modal
        isOpen={isCompensationModalOpen}
        onClose={() => setIsCompensationModalOpen(false)}
        title="损耗赔付确认"
        size="lg"
      >
        {selectedDamageForCompensation && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-emerald-600" />
                <div>
                  <p className="font-semibold text-emerald-800">确认损耗赔付</p>
                  <p className="text-sm text-emerald-600">
                    {getEquipmentName(selectedDamageForCompensation.equipmentId)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">损耗信息</h4>
              <p className="text-sm text-gray-600">{selectedDamageForCompensation.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>损耗程度：{damageLevelInfo[selectedDamageForCompensation.level].label}</span>
                <span>登记日期：{formatDate(selectedDamageForCompensation.date)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  赔付金额（元） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={compensationFormData.amount}
                  onChange={(e) => setCompensationFormData({ ...compensationFormData, amount: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="请输入赔付金额"
                />
                <p className="text-xs text-gray-500 mt-1">系统建议按设备价值的30%赔付</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  操作人
                </label>
                <input
                  type="text"
                  value={compensationFormData.operator}
                  onChange={(e) => setCompensationFormData({ ...compensationFormData, operator: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-700">
                <strong>提示：</strong>确认赔付后将自动生成"损耗赔付收入"流水记录，并可在财务对账模块中查看。
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsCompensationModalOpen(false)}
              >
                取消
              </Button>
              <Button onClick={handleSubmitCompensation}>
                确认赔付
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isLossModalOpen}
        onClose={() => setIsLossModalOpen(false)}
        title="装备丢失确认"
        size="lg"
      >
        {selectedDamageForCompensation && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <PackageX className="w-6 h-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-800">确认装备丢失</p>
                  <p className="text-sm text-red-600">
                    {getEquipmentName(selectedDamageForCompensation.equipmentId)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">设备信息</h4>
              <p className="text-sm text-gray-600">{selectedDamageForCompensation.description}</p>
              {(() => {
                const equipment = equipments.find((e) => e.id === selectedDamageForCompensation.equipmentId);
                return equipment ? (
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>设备编号：{equipment.equipmentNo}</span>
                    <span>购置价值：{formatCurrency(equipment.price)}</span>
                  </div>
                ) : null;
              })()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  丢失赔款金额（元） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={compensationFormData.amount}
                  onChange={(e) => setCompensationFormData({ ...compensationFormData, amount: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="请输入全额赔款金额"
                />
                <p className="text-xs text-gray-500 mt-1">默认按设备购置价值全额赔偿</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  操作人
                </label>
                <input
                  type="text"
                  value={compensationFormData.operator}
                  onChange={(e) => setCompensationFormData({ ...compensationFormData, operator: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-700">
                <strong>重要提示：</strong>确认丢失后：
              </p>
              <ul className="text-sm text-amber-700 mt-1 list-disc list-inside">
                <li>设备状态将更新为"已报废"</li>
                <li>将自动生成"装备丢失全额赔款"收入流水</li>
                <li>相关记录可在财务对账模块中查看</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsLossModalOpen(false)}
              >
                取消
              </Button>
              <Button variant="danger" onClick={handleSubmitLoss}>
                确认丢失
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
    </>
  );
}
