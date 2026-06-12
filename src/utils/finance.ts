import type {
  Equipment,
  Customer,
  Rental,
  DepositRule,
  PenaltyRule,
  DepositExemptCustomer,
  DepositRecord,
  RentalPenalty,
  EquipmentValueLevel,
  RentalFinanceDetail,
  FundFlowRecord,
  FinanceCategory,
  TransactionType,
  CustomerCoupon,
  CustomerChannel,
  FundFlowOperationType,
  FundFlowIdempotencyKey,
} from '../types';
import { highValueThreshold, generateId } from './format';

export const getEquipmentValueLevel = (equipment: Equipment): EquipmentValueLevel => {
  return equipment.purchasePrice >= highValueThreshold ? 'high' : 'normal';
};

export const calculateDepositAmount = (
  equipment: Equipment,
  depositRules: DepositRule[]
): number => {
  const equipmentRule = depositRules.find(
    (r) => r.type === 'equipment' && r.equipmentId === equipment.id && r.isActive
  );
  if (equipmentRule) {
    return equipmentRule.depositAmount;
  }

  const categoryRule = depositRules.find(
    (r) => r.type === 'category' && r.category === equipment.category && r.isActive
  );
  if (categoryRule) {
    return categoryRule.depositAmount;
  }

  return Math.round(equipment.purchasePrice * 0.3);
};

export const isCustomerExemptFromDeposit = (
  customer: Customer,
  exemptCustomers: DepositExemptCustomer[]
): { isExempt: boolean; reason?: string } => {
  const exempt = exemptCustomers.find(
    (e) => e.customerId === customer.id && e.isActive
  );
  
  if (exempt) {
    return { isExempt: true, reason: exempt.reason };
  }
  
  const minRentalCount = Math.min(
    ...exemptCustomers.filter((e) => e.isActive).map((e) => e.minRentalCount),
    Infinity
  );
  
  if (customer.rentalCount >= minRentalCount && minRentalCount !== Infinity) {
    const rule = exemptCustomers.find(
      (e) => e.isActive && customer.rentalCount >= e.minRentalCount
    );
    if (rule) {
      return { isExempt: true, reason: `高复购客户（累计${customer.rentalCount}次租赁）` };
    }
  }
  
  return { isExempt: false };
};

export const calculateOverdueDays = (rental: Rental, returnDate?: string): number => {
  const endDate = new Date(rental.endDate);
  const actualReturnDate = returnDate ? new Date(returnDate) : new Date();
  const diffTime = actualReturnDate.getTime() - endDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export const getDailyRentalRate = (rental: Rental): number => {
  const startDate = new Date(rental.startDate);
  const endDate = new Date(rental.endDate);
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  return rental.price / diffDays;
};

export const calculatePenalty = (
  rental: Rental,
  equipment: Equipment,
  penaltyRules: PenaltyRule[],
  returnDate?: string
): RentalPenalty | null => {
  const overdueDays = calculateOverdueDays(rental, returnDate);
  if (overdueDays <= 0) return null;

  const valueLevel = getEquipmentValueLevel(equipment);
  const rule = penaltyRules.find((r) => r.valueLevel === valueLevel && r.isActive);
  const multiplier = rule?.dailyRateMultiplier ?? 1.5;
  const dailyRate = getDailyRentalRate(rental);
  const totalPenalty = Math.round(overdueDays * dailyRate * multiplier * 100) / 100;

  return {
    id: '',
    rentalId: rental.id,
    overdueDays,
    dailyRate,
    multiplier,
    totalPenalty,
    adjustedAmount: totalPenalty,
    isAdjusted: false,
    createdAt: new Date().toISOString(),
  };
};

export const calculateDepositSettlement = (
  depositRecord: DepositRecord,
  penaltyAmount: number,
  damageCompensation: number = 0
): {
  refundAmount: number;
  forfeitAmount: number;
  totalDeduction: number;
  newStatus: 'refunded_full' | 'refunded_partial' | 'forfeited';
} => {
  const totalDeduction = penaltyAmount + damageCompensation;
  const collectedAmount = depositRecord.collectedAmount;

  if (totalDeduction <= 0) {
    return {
      refundAmount: collectedAmount,
      forfeitAmount: 0,
      totalDeduction: 0,
      newStatus: 'refunded_full',
    };
  }

  if (totalDeduction >= collectedAmount) {
    return {
      refundAmount: 0,
      forfeitAmount: collectedAmount,
      totalDeduction,
      newStatus: 'forfeited',
    };
  }

  return {
    refundAmount: collectedAmount - totalDeduction,
    forfeitAmount: totalDeduction,
    totalDeduction,
    newStatus: 'refunded_partial',
  };
};

export const generateFlowNo = (type: string): string => {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const randomStr = Math.random().toString(36).substr(2, 6).toUpperCase();
  const typePrefix = type.toUpperCase().substring(0, 3);
  return `${typePrefix}${dateStr}${randomStr}`;
};

export const getFinanceCategory = (type: TransactionType): FinanceCategory => {
  const categoryMap: Record<TransactionType, FinanceCategory> = {
    deposit_collect: 'deposit_income',
    deposit_refund: 'deposit_refund',
    deposit_forfeit: 'deposit_income',
    deposit_offset: 'deposit_offset_income',
    penalty: 'penalty_income',
    rental_fee: 'rental_income',
    rental_renewal_fee: 'rental_income',
    damage_compensation: 'damage_compensation',
    loss_compensation: 'loss_compensation',
    package_discount: 'discount',
    coupon_discount: 'discount',
    delivery_fee: 'delivery_fee',
    cleaning_fee: 'cleaning_fee',
    packing_fee: 'packing_fee',
    refund_rental: 'rental_income',
  };
  return categoryMap[type] || 'other';
};

export const createFundFlowRecord = (params: {
  rentalId: string;
  customerId: string;
  type: TransactionType;
  amount: number;
  direction: 'income' | 'expense';
  operator: string;
  changeReason: string;
  relatedDepositId?: string;
  relatedPenaltyId?: string;
  relatedDamageId?: string;
  channel?: CustomerChannel;
  remark?: string;
}): FundFlowRecord => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    flowNo: generateFlowNo(params.type),
    rentalId: params.rentalId,
    customerId: params.customerId,
    relatedDepositId: params.relatedDepositId,
    relatedPenaltyId: params.relatedPenaltyId,
    relatedDamageId: params.relatedDamageId,
    type: params.type,
    financeCategory: getFinanceCategory(params.type),
    amount: params.amount,
    direction: params.direction,
    channel: params.channel,
    operator: params.operator,
    operateTime: now,
    changeReason: params.changeReason,
    remark: params.remark,
    voucherStatus: 'pending',
    createdAt: now,
  };
};

export const splitRentalFinance = (
  rental: Rental,
  options: {
    packageDiscount?: number;
    couponDiscount?: number;
    deliveryFee?: number;
    cleaningFee?: number;
    packingFee?: number;
    penaltyAmount?: number;
    damageCompensation?: number;
    lossCompensation?: number;
    depositForfeited?: number;
    depositOffset?: number;
  } = {}
): RentalFinanceDetail => {
  const now = new Date().toISOString();
  const {
    packageDiscount = 0,
    couponDiscount = 0,
    deliveryFee = 0,
    cleaningFee = 0,
    packingFee = 0,
    penaltyAmount = 0,
    damageCompensation = 0,
    lossCompensation = 0,
    depositForfeited = 0,
    depositOffset = 0,
  } = options;

  const baseRentalFee = rental.price;
  const totalDiscount = packageDiscount + couponDiscount;
  const actualIncome = baseRentalFee - totalDiscount + deliveryFee + cleaningFee + packingFee + penaltyAmount + damageCompensation + lossCompensation + depositForfeited + depositOffset;

  return {
    id: generateId(),
    rentalId: rental.id,
    customerId: rental.customerId,
    baseRentalFee,
    packageDiscount,
    couponDiscount,
    deliveryFee,
    cleaningFee,
    packingFee,
    penaltyAmount,
    damageCompensation,
    lossCompensation,
    depositForfeited,
    depositOffset,
    actualIncome,
    totalDiscount,
    createdAt: now,
    updatedAt: now,
  };
};

export const calculateCouponDiscount = (
  rentalAmount: number,
  coupon: CustomerCoupon
): number => {
  if (!coupon || coupon.isUsed) return 0;
  if (coupon.minAmount && rentalAmount < coupon.minAmount) return 0;

  if (coupon.type === 'fixed') {
    return Math.min(coupon.value, rentalAmount);
  }

  if (coupon.type === 'percentage') {
    return Math.round(rentalAmount * coupon.value / 100 * 100) / 100;
  }

  return 0;
};

export const getDirectionByType = (type: TransactionType): 'income' | 'expense' => {
  const expenseTypes: TransactionType[] = ['deposit_refund', 'refund_rental', 'package_discount', 'coupon_discount'];
  return expenseTypes.includes(type) ? 'expense' : 'income';
};

export const generateRentalIncomeFlows = (
  rental: Rental,
  operator: string = '系统',
  options?: {
    channel?: CustomerChannel;
    isPackage?: boolean;
    packageId?: string;
    baseRentalFee?: number;
    packageSplitItems?: Array<{ equipmentId: string; equipmentName: string; amount: number }>;
    sceneType?: 'new' | 'renewal' | 'settlement' | 'package_split';
  }
): FundFlowRecord[] => {
  const flows: FundFlowRecord[] = [];
  const channel = options?.channel || rental.channel || 'individual';
  const isPackage = options?.isPackage ?? rental.isPackage ?? false;
  const channelLabel = channel === 'individual' ? '散客' : channel === 'group' ? '团建' : '线上渠道';
  const sceneType = options?.sceneType || (rental.originalRentalId ? 'renewal' : 'new');
  
  const getSceneDescription = (): string => {
    switch (sceneType) {
      case 'renewal':
        return `${channelLabel}续租收入 - 租期延长`;
      case 'settlement':
        return isPackage 
          ? `${channelLabel}套餐租赁收入 - 订单结算` 
          : `${channelLabel}租赁收入 - 订单结算`;
      case 'package_split':
        return `${channelLabel}套餐租赁拆分 - 单品收入`;
      case 'new':
      default:
        return isPackage 
          ? `${channelLabel}套餐租赁收入 - 创建订单` 
          : `${channelLabel}租赁收入 - 创建订单`;
    }
  };
  
  const getTransactionType = (): TransactionType => {
    return sceneType === 'renewal' ? 'rental_renewal_fee' : 'rental_fee';
  };
  
  if (options?.packageSplitItems && options.packageSplitItems.length > 0) {
    options.packageSplitItems.forEach((item, index) => {
      flows.push(createFundFlowRecord({
        rentalId: rental.id,
        customerId: rental.customerId,
        type: 'rental_fee',
        amount: item.amount,
        direction: 'income',
        operator,
        changeReason: `${channelLabel}套餐租赁拆分 - ${item.equipmentName}（第${index + 1}项）`,
        channel,
        remark: `套餐ID: ${options?.packageId || rental.packageId || 'N/A'}`,
      }));
    });
  } else {
    const amount = options?.baseRentalFee ?? rental.price;
    flows.push(createFundFlowRecord({
      rentalId: rental.id,
      customerId: rental.customerId,
      type: getTransactionType(),
      amount,
      direction: 'income',
      operator,
      changeReason: getSceneDescription(),
      channel,
      remark: isPackage ? `套餐ID: ${options?.packageId || rental.packageId || 'N/A'}` : undefined,
    }));
  }
  
  return flows;
};

export const generateDamageCompensationFlows = (
  rentalId: string,
  customerId: string,
  damageId: string,
  amount: number,
  isFullLoss: boolean = false,
  operator: string = '系统'
): FundFlowRecord[] => {
  const flows: FundFlowRecord[] = [];
  
  if (isFullLoss) {
    flows.push(createFundFlowRecord({
      rentalId,
      customerId,
      type: 'loss_compensation',
      amount,
      direction: 'income',
      operator,
      changeReason: '装备丢失全额赔款',
      relatedDamageId: damageId,
    }));
  } else {
    flows.push(createFundFlowRecord({
      rentalId,
      customerId,
      type: 'damage_compensation',
      amount,
      direction: 'income',
      operator,
      changeReason: '损耗登记确认赔付',
      relatedDamageId: damageId,
    }));
  }
  
  return flows;
};

export const generatePenaltyFlows = (
  rental: Rental,
  penalty: RentalPenalty,
  operator: string = '系统'
): FundFlowRecord[] => {
  const flows: FundFlowRecord[] = [];
  const channelLabel = rental.channel === 'individual' ? '散客' : rental.channel === 'group' ? '团建' : '线上渠道';
  
  flows.push(createFundFlowRecord({
    rentalId: rental.id,
    customerId: rental.customerId,
    type: 'penalty',
    amount: penalty.adjustedAmount,
    direction: 'income',
    operator,
    changeReason: `${channelLabel}租赁超期结算 - 逾期${penalty.overdueDays}天产生罚金`,
    relatedPenaltyId: penalty.id,
    channel: rental.channel,
  }));
  
  return flows;
};

export const generateDepositOffsetFlows = (
  rentalId: string,
  customerId: string,
  depositId: string,
  amount: number,
  offsetType: 'rental' | 'damage' | 'penalty',
  operator: string = '系统'
): FundFlowRecord[] => {
  const flows: FundFlowRecord[] = [];
  
  const reasonMap = {
    rental: '客户押金抵扣租金',
    damage: '客户押金抵扣损坏赔偿',
    penalty: '客户押金抵扣逾期违约金',
  };
  
  flows.push(createFundFlowRecord({
    rentalId,
    customerId,
    type: 'deposit_offset',
    amount,
    direction: 'income',
    operator,
    changeReason: `${reasonMap[offsetType]} - 往来冲抵流水`,
    relatedDepositId: depositId,
  }));
  
  return flows;
};

export const generateValueAddedServiceFlows = (
  rental: Rental,
  options: {
    deliveryFee?: number;
    cleaningFee?: number;
    packingFee?: number;
  },
  operator: string = '系统'
): FundFlowRecord[] => {
  const flows: FundFlowRecord[] = [];
  const { deliveryFee = 0, cleaningFee = 0, packingFee = 0 } = options;
  
  if (deliveryFee > 0) {
    flows.push(createFundFlowRecord({
      rentalId: rental.id,
      customerId: rental.customerId,
      type: 'delivery_fee',
      amount: deliveryFee,
      direction: 'income',
      operator,
      changeReason: '增值服务费 - 配送费',
      channel: rental.channel,
    }));
  }
  
  if (cleaningFee > 0) {
    flows.push(createFundFlowRecord({
      rentalId: rental.id,
      customerId: rental.customerId,
      type: 'cleaning_fee',
      amount: cleaningFee,
      direction: 'income',
      operator,
      changeReason: '增值服务费 - 清洁费',
      channel: rental.channel,
    }));
  }
  
  if (packingFee > 0) {
    flows.push(createFundFlowRecord({
      rentalId: rental.id,
      customerId: rental.customerId,
      type: 'packing_fee',
      amount: packingFee,
      direction: 'income',
      operator,
      changeReason: '增值服务费 - 装备打包服务费',
      channel: rental.channel,
    }));
  }
  
  return flows;
};

export const generateAllIncomeFlows = (
  rental: Rental,
  options: {
    penalty?: RentalPenalty;
    damageCompensation?: { damageId: string; amount: number; isFullLoss: boolean };
    depositOffset?: { depositId: string; amount: number; offsetType: 'rental' | 'damage' | 'penalty' };
    valueAddedServices?: { deliveryFee?: number; cleaningFee?: number; packingFee?: number };
    rentalIncomeOptions?: {
      channel?: CustomerChannel;
      isPackage?: boolean;
      packageId?: string;
      baseRentalFee?: number;
      packageSplitItems?: Array<{ equipmentId: string; equipmentName: string; amount: number }>;
      sceneType?: 'new' | 'renewal' | 'settlement' | 'package_split';
    };
    operator?: string;
    onSuccess?: (flows: FundFlowRecord[]) => void;
  } = {}
): FundFlowRecord[] => {
  const flows: FundFlowRecord[] = [];
  const { penalty, damageCompensation, depositOffset, valueAddedServices, rentalIncomeOptions, operator = '系统', onSuccess } = options;
  
  flows.push(...generateRentalIncomeFlows(rental, operator, {
    ...rentalIncomeOptions,
    sceneType: rentalIncomeOptions?.sceneType || 'settlement',
  }));
  
  if (penalty && penalty.adjustedAmount > 0) {
    flows.push(...generatePenaltyFlows(rental, penalty, operator));
  }
  
  if (damageCompensation && damageCompensation.amount > 0) {
    flows.push(...generateDamageCompensationFlows(
      rental.id,
      rental.customerId,
      damageCompensation.damageId,
      damageCompensation.amount,
      damageCompensation.isFullLoss,
      operator
    ));
  }
  
  if (depositOffset && depositOffset.amount > 0) {
    flows.push(...generateDepositOffsetFlows(
      rental.id,
      rental.customerId,
      depositOffset.depositId,
      depositOffset.amount,
      depositOffset.offsetType,
      operator
    ));
  }
  
  if (valueAddedServices) {
    flows.push(...generateValueAddedServiceFlows(rental, valueAddedServices, operator));
  }
  
  if (onSuccess) {
    onSuccess(flows);
  }
  
  return flows;
};

export const generateIdempotencyKey = (rentalId: string, operationType: FundFlowOperationType): string => {
  return `${rentalId}_${operationType}`;
};

export const createIdempotencyRecord = (
  rentalId: string,
  operationType: FundFlowOperationType,
  flowIds: string[],
  operator: string
): FundFlowIdempotencyKey => {
  const now = new Date().toISOString();
  return {
    id: generateIdempotencyKey(rentalId, operationType),
    rentalId,
    operationType,
    flowIds,
    operator,
    createdAt: now,
  };
};

export const checkIdempotency = (
  idempotencyKeys: FundFlowIdempotencyKey[],
  rentalId: string,
  operationType: FundFlowOperationType
): { isDuplicate: boolean; record?: FundFlowIdempotencyKey } => {
  const key = generateIdempotencyKey(rentalId, operationType);
  const record = idempotencyKeys.find((k) => k.id === key);
  return {
    isDuplicate: !!record,
    record,
  };
};
