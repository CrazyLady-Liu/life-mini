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
} from '../types';
import { highValueThreshold } from './format';

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
