export type EquipmentStatus = 'available' | 'rented' | 'maintenance' | 'damaged' | 'scrapped' | 'decommissioned';

export type RentalStatus = 'pending' | 'active' | 'returned' | 'overdue' | 'cancelled';

export type DamageLevel = 'minor' | 'moderate' | 'severe' | 'scrapped';

export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type InventoryCheckStatus = 'pending' | 'in_progress' | 'completed';

export type DepositStatus = 'pending' | 'collected' | 'refunded_full' | 'refunded_partial' | 'forfeited';

export type DepositRuleType = 'category' | 'equipment' | 'package';

export type TransactionType = 
  | 'deposit_collect' 
  | 'deposit_refund' 
  | 'deposit_forfeit' 
  | 'penalty' 
  | 'rental_fee' 
  | 'damage_compensation'
  | 'package_discount'
  | 'coupon_discount'
  | 'delivery_fee'
  | 'refund_rental';

export type FinanceCategory = 
  | 'rental_income'
  | 'deposit_income'
  | 'deposit_refund'
  | 'penalty_income'
  | 'damage_compensation'
  | 'discount'
  | 'delivery_fee'
  | 'other';

export type VoucherStatus = 'pending' | 'issued' | 'cancelled';

export type EquipmentValueLevel = 'normal' | 'high';

export interface Equipment {
  id: string;
  equipmentNo: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  purchasePrice: number;
  purchaseDate: string;
  status: EquipmentStatus;
  location: string;
  department: string;
  custodian: string;
  usageCount: number;
  supplierId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  idCard: string;
  address?: string;
  rentalCount: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address?: string;
  createdAt: string;
}

export interface Rental {
  id: string;
  equipmentId: string;
  customerId: string;
  startDate: string;
  endDate: string;
  price: number;
  status: RentalStatus;
  notes?: string;
  createdAt: string;
}

export interface DamageRecord {
  id: string;
  equipmentId: string;
  date: string;
  level: DamageLevel;
  description: string;
  reporter: string;
  status: 'reported' | 'repaired' | 'scrapped';
  createdAt: string;
}

export interface PartReplacement {
  id: string;
  damageId: string;
  equipmentId: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  createdAt: string;
}

export interface Maintenance {
  id: string;
  equipmentId: string;
  date: string;
  type: string;
  description: string;
  cost: number;
  technician: string;
  status: MaintenanceStatus;
  damageId?: string;
  createdAt: string;
}

export interface InventoryCheck {
  id: string;
  date: string;
  checker: string;
  status: InventoryCheckStatus;
  notes?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  checkId: string;
  equipmentId: string;
  expectedStatus: EquipmentStatus;
  actualStatus: EquipmentStatus;
  difference: string;
  createdAt: string;
}

export interface DashboardStats {
  totalEquipment: number;
  availableEquipment: number;
  rentedEquipment: number;
  maintenanceEquipment: number;
  totalCustomers: number;
  activeRentals: number;
  monthlyRevenue: number;
  monthlyMaintenanceCost: number;
  totalDamageRecords: number;
  pendingMaintenance: number;
}

export type NotificationType = 'rental' | 'maintenance' | 'damage' | 'inventory' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  read: boolean;
  createdAt: string;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface EquipmentHealth {
  equipmentId: string;
  healthScore: number;
  wearRate: number;
  damageScore: number;
  maintenanceScore: number;
  ageScore: number;
  riskLevel: RiskLevel;
  estimatedScrapDate: string;
  remainingLifespanDays: number;
  totalDamageCount: number;
  totalMaintenanceCount: number;
  totalMaintenanceCost: number;
  maintenanceCostRatio: number;
  monthlyUsageRate: number;
  details: {
    usageCount: number;
    expectedLifespanUses: number;
    ageDays: number;
    expectedLifespanDays: number;
    severeDamageCount: number;
    moderateDamageCount: number;
    minorDamageCount: number;
    scrappedDamageCount: number;
  };
}

export interface DepositRule {
  id: string;
  name: string;
  type: DepositRuleType;
  category?: string;
  equipmentId?: string;
  packageId?: string;
  depositAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PenaltyRule {
  id: string;
  name: string;
  valueLevel: EquipmentValueLevel;
  dailyRateMultiplier: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepositRecord {
  id: string;
  rentalId: string;
  customerId: string;
  equipmentId: string;
  totalDepositAmount: number;
  collectedAmount: number;
  refundedAmount: number;
  forfeitedAmount: number;
  status: DepositStatus;
  isExempt: boolean;
  exemptReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialTransaction {
  id: string;
  rentalId: string;
  customerId: string;
  type: TransactionType;
  amount: number;
  direction: 'income' | 'expense';
  description: string;
  operator: string;
  createdAt: string;
}

export interface RentalPenalty {
  id: string;
  rentalId: string;
  overdueDays: number;
  dailyRate: number;
  multiplier: number;
  totalPenalty: number;
  adjustedAmount: number;
  adjustmentReason?: string;
  isAdjusted: boolean;
  operator?: string;
  createdAt: string;
}

export interface DepositExemptCustomer {
  id: string;
  customerId: string;
  reason: string;
  minRentalCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentWithDeposit extends Equipment {
  depositAmount: number;
  valueLevel: EquipmentValueLevel;
}

export interface RentalFinanceDetail {
  id: string;
  rentalId: string;
  customerId: string;
  
  baseRentalFee: number;
  packageDiscount: number;
  couponDiscount: number;
  deliveryFee: number;
  penaltyAmount: number;
  damageCompensation: number;
  depositForfeited: number;
  
  actualIncome: number;
  totalDiscount: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface FundFlowRecord {
  id: string;
  flowNo: string;
  rentalId: string;
  customerId: string;
  relatedDepositId?: string;
  relatedPenaltyId?: string;
  
  type: TransactionType;
  financeCategory: FinanceCategory;
  amount: number;
  direction: 'income' | 'expense';
  
  operator: string;
  operateTime: string;
  changeReason: string;
  remark?: string;
  
  voucherStatus: VoucherStatus;
  voucherNo?: string;
  
  createdAt: string;
}

export interface FinanceVoucher {
  id: string;
  voucherNo: string;
  rentalId: string;
  customerId: string;
  
  type: 'receipt' | 'payment';
  amount: number;
  
  items: Array<{
    name: string;
    amount: number;
    category: FinanceCategory;
  }>;
  
  operator: string;
  issuedAt: string;
  remark?: string;
  
  createdAt: string;
}

export interface CustomerCoupon {
  id: string;
  customerId: string;
  name: string;
  code: string;
  type: 'fixed' | 'percentage';
  value: number;
  minAmount?: number;
  isUsed: boolean;
  usedRentalId?: string;
  expireDate: string;
  createdAt: string;
}
