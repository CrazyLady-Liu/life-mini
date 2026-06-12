import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Equipment,
  Customer,
  Supplier,
  Rental,
  DamageRecord,
  PartReplacement,
  Maintenance,
  InventoryCheck,
  InventoryItem,
  EquipmentStatus,
  RentalStatus,
  DamageLevel,
  MaintenanceStatus,
  InventoryCheckStatus,
  DepositRule,
  PenaltyRule,
  DepositRecord,
  FinancialTransaction,
  RentalPenalty,
  DepositExemptCustomer,
  DepositStatus,
  TransactionType,
  RentalFinanceDetail,
  FundFlowRecord,
  FinanceCategory,
  CustomerCoupon,
  FinanceVoucher,
  VoucherStatus,
  CustomerChannel,
  FundFlowIdempotencyKey,
  FundFlowOperationType,
  AddEquipmentInput,
  AddDamageRecordInput,
  DepositFundFlow,
  DepositFlowType,
} from '../types';
import {
  mockEquipments,
  mockCustomers,
  mockSuppliers,
  mockRentals,
  mockDamageRecords,
  mockPartReplacements,
  mockMaintenances,
  mockInventoryChecks,
  mockInventoryItems,
  mockDepositRules,
  mockPenaltyRules,
  mockDepositRecords,
  mockFinancialTransactions,
  mockRentalPenalties,
  mockDepositExemptCustomers,
} from '../utils/mock';
import { generateId, transactionTypeLabels, customerChannelLabels } from '../utils/format';
import {
  calculateDepositAmount,
  isCustomerExemptFromDeposit,
  calculatePenalty,
  calculateDepositSettlement,
  splitRentalFinance,
  createFundFlowRecord,
  generateRentalIncomeFlows,
  generateDamageCompensationFlows,
  generatePenaltyFlows,
  generateDepositOffsetFlows,
  generateValueAddedServiceFlows,
  generateAllIncomeFlows,
  generateIdempotencyKey,
  createIdempotencyRecord,
  checkIdempotency,
  generateDepositCollectFlow,
  generateDepositRefundFullFlow,
  generateDepositRefundPartialFlow,
  isOperatingIncome,
  isDepositRelated,
} from '../utils/finance';

interface AppState {
  equipments: Equipment[];
  customers: Customer[];
  suppliers: Supplier[];
  rentals: Rental[];
  damageRecords: DamageRecord[];
  partReplacements: PartReplacement[];
  maintenances: Maintenance[];
  inventoryChecks: InventoryCheck[];
  inventoryItems: InventoryItem[];
  depositRules: DepositRule[];
  penaltyRules: PenaltyRule[];
  depositRecords: DepositRecord[];
  financialTransactions: FinancialTransaction[];
  rentalPenalties: RentalPenalty[];
  depositExemptCustomers: DepositExemptCustomer[];
  rentalFinanceDetails: RentalFinanceDetail[];
  fundFlowRecords: FundFlowRecord[];
  depositFundFlows: DepositFundFlow[];
  customerCoupons: CustomerCoupon[];
  financeVouchers: FinanceVoucher[];
  
  addEquipment: (equipment: AddEquipmentInput) => void;
  updateEquipment: (id: string, equipment: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;
  
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'rentalCount'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  
  addRental: (rental: Omit<Rental, 'id' | 'createdAt' | 'status' | 'channel'> & { status?: RentalStatus; channel?: CustomerChannel }) => void;
  updateRental: (id: string, rental: Partial<Rental>) => void;
  returnRental: (id: string, options?: { 
    penaltyAmount?: number; 
    damageCompensation?: number; 
    adjustmentReason?: string; 
    operator?: string; 
    packageDiscount?: number; 
    couponDiscount?: number; 
    deliveryFee?: number; 
    cleaningFee?: number;
    packingFee?: number;
    lossCompensation?: number;
    depositOffset?: number;
    offsetType?: 'rental' | 'damage' | 'penalty';
    damageId?: string;
    isFullLoss?: boolean;
    couponId?: string;
  }) => void;
  renewRental: (originalRentalId: string, options: { endDate: string; price: number; operator?: string }) => void;
  splitPackageRental: (packageRentalId: string, splitItems: Array<{ equipmentId: string; equipmentName: string; amount: number }>, operator?: string) => void;
  confirmDamageCompensation: (damageId: string, amount: number, operator?: string) => void;
  confirmEquipmentLoss: (damageId: string, amount: number, operator?: string) => void;
  offsetDeposit: (rentalId: string, amount: number, offsetType: 'rental' | 'damage' | 'penalty', operator?: string) => void;
  
  addDamageRecord: (record: AddDamageRecordInput) => void;
  updateDamageRecord: (id: string, record: Partial<DamageRecord>) => void;
  
  addPartReplacement: (part: Omit<PartReplacement, 'id' | 'createdAt'>) => void;
  
  addMaintenance: (maintenance: Omit<Maintenance, 'id' | 'createdAt' | 'status'> & { status?: MaintenanceStatus }) => void;
  updateMaintenance: (id: string, maintenance: Partial<Maintenance>) => void;
  
  addInventoryCheck: (check: Omit<InventoryCheck, 'id' | 'createdAt' | 'status'> & { status?: InventoryCheckStatus }) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'createdAt'>) => void;
  completeInventoryCheck: (checkId: string) => void;
  
  addDepositRule: (rule: Omit<DepositRule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDepositRule: (id: string, rule: Partial<DepositRule>) => void;
  deleteDepositRule: (id: string) => void;
  
  addPenaltyRule: (rule: Omit<PenaltyRule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePenaltyRule: (id: string, rule: Partial<PenaltyRule>) => void;
  deletePenaltyRule: (id: string) => void;
  
  collectDeposit: (rentalId: string, amount?: number, operator?: string) => void;
  refundDeposit: (rentalId: string, amount?: number, operator?: string) => void;
  forfeitDeposit: (rentalId: string, amount?: number, reason?: string, operator?: string) => void;
  
  addDepositExemptCustomer: (exempt: Omit<DepositExemptCustomer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDepositExemptCustomer: (id: string, exempt: Partial<DepositExemptCustomer>) => void;
  deleteDepositExemptCustomer: (id: string) => void;
  
  getDepositRecordByRentalId: (rentalId: string) => DepositRecord | undefined;
  getPenaltyByRentalId: (rentalId: string) => RentalPenalty | undefined;
  getTransactionsByRentalId: (rentalId: string) => FinancialTransaction[];
  
  calculateRentalDeposit: (equipmentId: string, customerId: string) => { amount: number; isExempt: boolean; exemptReason?: string };
  calculateRentalPenalty: (rentalId: string, returnDate?: string) => RentalPenalty | null;
  
  getFinanceDetailByRentalId: (rentalId: string) => RentalFinanceDetail | undefined;
  getFundFlowsByRentalId: (rentalId: string) => FundFlowRecord[];
  getFundFlowsByType: (type: TransactionType) => FundFlowRecord[];
  getFundFlowsByCategory: (category: FinanceCategory) => FundFlowRecord[];
  
  addFundFlowRecord: (record: Omit<FundFlowRecord, 'id' | 'flowNo' | 'operateTime' | 'createdAt' | 'voucherStatus'> & { voucherStatus?: VoucherStatus }) => void;
  
  issueVoucher: (rentalId: string, type: 'receipt' | 'payment', operator: string) => FinanceVoucher | null;
  getVouchersByRentalId: (rentalId: string) => FinanceVoucher[];
  
  getCustomerCoupons: (customerId: string) => CustomerCoupon[];
  useCoupon: (couponId: string, rentalId: string) => boolean;
  addCoupon: (coupon: Omit<CustomerCoupon, 'id' | 'createdAt' | 'isUsed'>) => void;
  
  fundFlowIdempotencyKeys: FundFlowIdempotencyKey[];
  checkFundFlowIdempotency: (rentalId: string, operationType: FundFlowOperationType) => { isDuplicate: boolean; record?: FundFlowIdempotencyKey };
  addFundFlowIdempotencyKey: (rentalId: string, operationType: FundFlowOperationType, flowIds: string[], operator: string) => void;
  
  getDepositFundFlowsByRentalId: (rentalId: string) => DepositFundFlow[];
  getDepositFundFlowsByType: (type: DepositFlowType) => DepositFundFlow[];
  addDepositFundFlows: (flows: DepositFundFlow[]) => void;
  getOperatingFlows: () => FundFlowRecord[];
  getDepositFlows: () => FundFlowRecord[];
  calculateOperatingProfit: () => { operatingIncome: number; operatingExpense: number; operatingProfit: number };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      equipments: mockEquipments,
      customers: mockCustomers,
      suppliers: mockSuppliers,
      rentals: mockRentals,
      damageRecords: mockDamageRecords,
      partReplacements: mockPartReplacements,
      maintenances: mockMaintenances,
      inventoryChecks: mockInventoryChecks,
      inventoryItems: mockInventoryItems,
      depositRules: mockDepositRules,
      penaltyRules: mockPenaltyRules,
      depositRecords: mockDepositRecords,
      financialTransactions: mockFinancialTransactions,
      rentalPenalties: mockRentalPenalties,
      depositExemptCustomers: mockDepositExemptCustomers,
      rentalFinanceDetails: [],
      fundFlowRecords: [],
      depositFundFlows: [],
      customerCoupons: [],
      financeVouchers: [],
      fundFlowIdempotencyKeys: [],
      
      addEquipment: (equipment) => {
        const now = new Date().toISOString();
        const year = new Date().getFullYear();
        const equipmentNo = equipment.equipmentNo || `EQ-${year}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        const newEquipment: Equipment = {
          ...equipment,
          equipmentNo,
          id: generateId(),
          usageCount: 0,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          equipments: [...state.equipments, newEquipment],
        }));
      },
      
      updateEquipment: (id, equipment) => {
        const now = new Date().toISOString();
        set((state) => ({
          equipments: state.equipments.map((eq) =>
            eq.id === id ? { ...eq, ...equipment, updatedAt: now } : eq
          ),
        }));
      },
      
      deleteEquipment: (id) => {
        set((state) => ({
          equipments: state.equipments.filter((eq) => eq.id !== id),
        }));
      },
      
      addCustomer: (customer) => {
        const now = new Date().toISOString();
        const newCustomer: Customer = {
          ...customer,
          id: generateId(),
          rentalCount: 0,
          createdAt: now,
        };
        set((state) => ({
          customers: [...state.customers, newCustomer],
        }));
      },
      
      updateCustomer: (id, customer) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...customer } : c
          ),
        }));
      },
      
      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        }));
      },
      
      addSupplier: (supplier) => {
        const now = new Date().toISOString();
        const newSupplier: Supplier = {
          ...supplier,
          id: generateId(),
          createdAt: now,
        };
        set((state) => ({
          suppliers: [...state.suppliers, newSupplier],
        }));
      },
      
      updateSupplier: (id, supplier) => {
        set((state) => ({
          suppliers: state.suppliers.map((s) =>
            s.id === id ? { ...s, ...supplier } : s
          ),
        }));
      },
      
      deleteSupplier: (id) => {
        set((state) => ({
          suppliers: state.suppliers.filter((s) => s.id !== id),
        }));
      },
      
      addRental: (rental) => {
        const now = new Date().toISOString();
        const newRentalId = generateId();
        const newRental: Rental = {
          ...rental,
          id: newRentalId,
          status: rental.status || 'active',
          channel: rental.channel || 'individual',
          createdAt: now,
        };
        
        set((state) => {
          const equipment = state.equipments.find((e) => e.id === rental.equipmentId);
          const customer = state.customers.find((c) => c.id === rental.customerId);
          
          const updatedEquipments = state.equipments.map((eq) =>
            eq.id === rental.equipmentId
              ? { ...eq, status: 'rented' as EquipmentStatus, usageCount: eq.usageCount + 1, updatedAt: now }
              : eq
          );
          
          const updatedCustomers = state.customers.map((c) =>
            c.id === rental.customerId
              ? { ...c, rentalCount: c.rentalCount + 1 }
              : c
          );
          
          let depositRecord: DepositRecord | null = null;
          let transactions: FinancialTransaction[] = [];
          let financeDetail: RentalFinanceDetail | null = null;
          let fundFlows: FundFlowRecord[] = [];
          let newIdempotencyKeys: FundFlowIdempotencyKey[] = [];
          
          if (equipment && customer) {
            const depositAmount = calculateDepositAmount(equipment, state.depositRules);
            const exemptResult = isCustomerExemptFromDeposit(customer, state.depositExemptCustomers);
            
            depositRecord = {
              id: generateId(),
              rentalId: newRentalId,
              customerId: rental.customerId,
              equipmentId: rental.equipmentId,
              totalDepositAmount: depositAmount,
              collectedAmount: 0,
              refundedAmount: 0,
              forfeitedAmount: 0,
              status: exemptResult.isExempt ? 'refunded_full' : 'pending',
              isExempt: exemptResult.isExempt,
              exemptReason: exemptResult.reason,
              createdAt: now,
              updatedAt: now,
            };
            
            financeDetail = splitRentalFinance(newRental, {
              packageDiscount: 0,
              couponDiscount: 0,
              deliveryFee: 0,
              cleaningFee: 0,
              packingFee: 0,
              penaltyAmount: 0,
              damageCompensation: 0,
              lossCompensation: 0,
              depositForfeited: 0,
              depositOffset: 0,
            });
            
            const idempotencyCheck = checkIdempotency(state.fundFlowIdempotencyKeys, newRentalId, 'new_rental');
            if (!idempotencyCheck.isDuplicate) {
              const rentalIncomeFlows = generateRentalIncomeFlows(newRental, '系统', {
                channel: newRental.channel,
                isPackage: newRental.isPackage,
                packageId: newRental.packageId,
                baseRentalFee: newRental.price,
                sceneType: 'new',
              });
              fundFlows.push(...rentalIncomeFlows);
              
              const idempotencyRecord = createIdempotencyRecord(
                newRentalId,
                'new_rental',
                rentalIncomeFlows.map((f) => f.id),
                '系统'
              );
              newIdempotencyKeys.push(idempotencyRecord);
            } else {
              console.log(`[幂等控制] 订单 ${newRentalId} 新建流水已生成，跳过重复生成`);
            }
          }
          
          const newState: any = {
            rentals: [...state.rentals, newRental],
            equipments: updatedEquipments,
            customers: updatedCustomers,
          };
          
          if (depositRecord) {
            newState.depositRecords = [...state.depositRecords, depositRecord];
          }
          
          if (transactions.length > 0) {
            newState.financialTransactions = [...state.financialTransactions, ...transactions];
          }
          
          if (financeDetail) {
            newState.rentalFinanceDetails = [...state.rentalFinanceDetails, financeDetail];
          }
          
          if (fundFlows.length > 0) {
            newState.fundFlowRecords = [...state.fundFlowRecords, ...fundFlows];
          }
          
          if (newIdempotencyKeys.length > 0) {
            newState.fundFlowIdempotencyKeys = [...state.fundFlowIdempotencyKeys, ...newIdempotencyKeys];
          }
          
          return newState;
        });
      },
      
      updateRental: (id, rental) => {
        set((state) => ({
          rentals: state.rentals.map((r) =>
            r.id === id ? { ...r, ...rental } : r
          ),
        }));
      },
      
      returnRental: (id, options = {}) => {
        const now = new Date().toISOString();
        const { 
          penaltyAmount, 
          damageCompensation = 0, 
          adjustmentReason, 
          operator = '系统',
          packageDiscount = 0,
          couponDiscount = 0,
          deliveryFee = 0,
          cleaningFee = 0,
          packingFee = 0,
          lossCompensation = 0,
          depositOffset = 0,
          offsetType = 'rental',
          damageId,
          isFullLoss = false,
          couponId,
        } = options;
        
        set((state) => {
          const rental = state.rentals.find((r) => r.id === id);
          if (!rental) return state;
          
          const equipment = state.equipments.find((e) => e.id === rental.equipmentId);
          const depositRecord = state.depositRecords.find((d) => d.rentalId === id);
          const existingFinanceDetail = state.rentalFinanceDetails.find((d) => d.rentalId === id);
          
          const updatedEquipments = state.equipments.map((eq) =>
            eq.id === rental.equipmentId
              ? { ...eq, status: 'available' as EquipmentStatus, updatedAt: now }
              : eq
          );
          
          const updatedRentals = state.rentals.map((r) =>
            r.id === id ? { ...r, status: 'returned' as RentalStatus } : r
          );
          
          let newPenalty: RentalPenalty | null = null;
          let updatedDepositRecords = state.depositRecords;
          let newTransactions: FinancialTransaction[] = [];
          let newFundFlows: FundFlowRecord[] = [];
          let updatedFinanceDetail: RentalFinanceDetail | null = null;
          let newIdempotencyKeys: FundFlowIdempotencyKey[] = [];
          let finalPenaltyAmount = penaltyAmount || 0;
          
          if (equipment && depositRecord && !depositRecord.isExempt) {
            const calculatedPenalty = calculatePenalty(rental, equipment, state.penaltyRules);
            finalPenaltyAmount = penaltyAmount !== undefined ? penaltyAmount : (calculatedPenalty?.totalPenalty || 0);
            
            if (calculatedPenalty && finalPenaltyAmount > 0) {
              const isAdjusted = penaltyAmount !== undefined && penaltyAmount !== calculatedPenalty.totalPenalty;
              newPenalty = {
                ...calculatedPenalty,
                id: generateId(),
                rentalId: id,
                adjustedAmount: finalPenaltyAmount,
                isAdjusted,
                adjustmentReason: isAdjusted ? adjustmentReason : undefined,
                operator,
                createdAt: now,
              };
              
              newTransactions.push({
                id: generateId(),
                rentalId: id,
                customerId: rental.customerId,
                type: 'penalty',
                amount: finalPenaltyAmount,
                direction: 'income',
                description: isAdjusted 
                  ? `逾期违约金（${calculatedPenalty.overdueDays}天，已调整）${adjustmentReason ? ` - ${adjustmentReason}` : ''}`
                  : `逾期违约金（${calculatedPenalty.overdueDays}天）`,
                operator,
                createdAt: now,
              });
            }
            
            const totalDeduction = finalPenaltyAmount + damageCompensation + lossCompensation;
            const settlement = calculateDepositSettlement(depositRecord, finalPenaltyAmount, damageCompensation + lossCompensation);
            
            const updatedDeposit = {
              ...depositRecord,
              collectedAmount: depositRecord.collectedAmount || depositRecord.totalDepositAmount,
              refundedAmount: settlement.refundAmount,
              forfeitedAmount: settlement.forfeitAmount,
              status: settlement.newStatus as DepositStatus,
              updatedAt: now,
            };
            
            updatedDepositRecords = state.depositRecords.map((d) =>
              d.id === depositRecord.id ? updatedDeposit : d
            );
            
            if (settlement.refundAmount > 0) {
              newTransactions.push({
                id: generateId(),
                rentalId: id,
                customerId: rental.customerId,
                type: 'deposit_refund',
                amount: settlement.refundAmount,
                direction: 'expense',
                description: `退还押金${settlement.newStatus === 'refunded_full' ? '（全额）' : '（部分）'}`,
                operator,
                createdAt: now,
              });
              
              newFundFlows.push(createFundFlowRecord({
                rentalId: id,
                customerId: rental.customerId,
                type: 'deposit_refund',
                amount: settlement.refundAmount,
                direction: 'expense',
                operator,
                changeReason: `装备归还，${settlement.newStatus === 'refunded_full' ? '全额退还押金' : '部分退还押金'}`,
                relatedDepositId: depositRecord.id,
              }));
            }
            
            if (settlement.forfeitAmount > 0) {
              newTransactions.push({
                id: generateId(),
                rentalId: id,
                customerId: rental.customerId,
                type: 'deposit_forfeit',
                amount: settlement.forfeitAmount,
                direction: 'expense',
                description: `押金抵扣（违约金: ${finalPenaltyAmount.toFixed(2)}${damageCompensation > 0 ? `, 损坏赔偿: ${damageCompensation.toFixed(2)}` : ''}${lossCompensation > 0 ? `, 丢失赔款: ${lossCompensation.toFixed(2)}` : ''}）- 对应经营性收入已独立记账`,
                operator,
                createdAt: now,
              });
              
              newFundFlows.push(createFundFlowRecord({
                rentalId: id,
                customerId: rental.customerId,
                type: 'deposit_forfeit',
                amount: settlement.forfeitAmount,
                direction: 'expense',
                operator,
                changeReason: `押金预收抵扣费用（违约金${finalPenaltyAmount.toFixed(2)}${damageCompensation > 0 ? `+损坏赔偿${damageCompensation.toFixed(2)}` : ''}${lossCompensation > 0 ? `+丢失赔款${lossCompensation.toFixed(2)}` : ''}），对应经营性收入已独立记录参与利润核算`,
                relatedDepositId: depositRecord.id,
                remark: '往来款内部调整：押金预收减少，不计入经营利润，经营性收入已在 damage_compensation/penalty/loss_compensation 流水中独立记录',
              }));
            }
            
            const settlementIdempotency = checkIdempotency(state.fundFlowIdempotencyKeys, id, 'settlement');
            if (!settlementIdempotency.isDuplicate) {
              const allIncomeFlows = generateAllIncomeFlows(rental, {
                penalty: newPenalty || undefined,
                damageCompensation: damageId ? { damageId, amount: damageCompensation, isFullLoss } : undefined,
                depositOffset: depositOffset > 0 ? { depositId: depositRecord.id, amount: depositOffset, offsetType } : undefined,
                valueAddedServices: { deliveryFee, cleaningFee, packingFee },
                rentalIncomeOptions: {
                  channel: rental.channel,
                  isPackage: rental.isPackage,
                  packageId: rental.packageId,
                  baseRentalFee: rental.price - packageDiscount - couponDiscount,
                  sceneType: 'settlement',
                },
                operator,
                onSuccess: (flows) => {
                  console.log(`[财务对账] 租赁订单 ${id} 结算成功，生成 ${flows.length} 条收入流水`);
                  flows.forEach((flow) => {
                    console.log(`  - 流水号: ${flow.flowNo}, 类型: ${transactionTypeLabels[flow.type]}, 金额: ${flow.amount}, 渠道: ${flow.channel ? customerChannelLabels[flow.channel] : '未标记'}`);
                  });
                },
              });
              newFundFlows.push(...allIncomeFlows);
              
              if (lossCompensation > 0 && damageId) {
                const lossFlows = generateDamageCompensationFlows(
                  id,
                  rental.customerId,
                  damageId,
                  lossCompensation,
                  true,
                  operator
                );
                newFundFlows.push(...lossFlows);
                allIncomeFlows.push(...lossFlows);
              }
              
              if (packageDiscount > 0) {
                newFundFlows.push(createFundFlowRecord({
                  rentalId: id,
                  customerId: rental.customerId,
                  type: 'package_discount',
                  amount: packageDiscount,
                  direction: 'expense',
                  operator,
                  changeReason: '套餐优惠抵扣',
                }));
              }
              
              if (couponDiscount > 0) {
                newFundFlows.push(createFundFlowRecord({
                  rentalId: id,
                  customerId: rental.customerId,
                  type: 'coupon_discount',
                  amount: couponDiscount,
                  direction: 'expense',
                  operator,
                  changeReason: '客户优惠券抵扣',
                }));
              }
              
              const settlementIdempotencyRecord = createIdempotencyRecord(
                id,
                'settlement',
                allIncomeFlows.map((f) => f.id),
                operator
              );
              newIdempotencyKeys.push(settlementIdempotencyRecord);
            } else {
              console.log(`[幂等控制] 订单 ${id} 结算流水已生成，跳过重复生成`);
            }
            
            if (existingFinanceDetail) {
              const totalReceivable = finalPenaltyAmount + damageCompensation + lossCompensation + deliveryFee + cleaningFee + packingFee + rental.price;
              const totalDeduction = packageDiscount + couponDiscount + depositOffset;
              updatedFinanceDetail = {
                ...existingFinanceDetail,
                penaltyAmount: finalPenaltyAmount,
                damageCompensation,
                lossCompensation,
                packageDiscount,
                couponDiscount,
                deliveryFee,
                cleaningFee,
                packingFee,
                depositForfeited: settlement.forfeitAmount,
                depositOffset,
                totalDiscount: packageDiscount + couponDiscount,
                totalReceivable,
                totalDeduction,
                actualIncome: totalReceivable - totalDeduction,
                updatedAt: now,
              };
            }
          } else if (depositRecord?.isExempt) {
            updatedDepositRecords = state.depositRecords.map((d) =>
              d.rentalId === id
                ? { ...d, status: 'refunded_full' as DepositStatus, updatedAt: now }
                : d
            );
          }
          
          let newDepositFundFlows: DepositFundFlow[] = [];
          if (depositRecord && !depositRecord.isExempt && depositRecord.collectedAmount > 0) {
            const collected = depositRecord.collectedAmount || depositRecord.totalDepositAmount;
            const totalDeductionAmount = finalPenaltyAmount + damageCompensation + lossCompensation;
            if (totalDeductionAmount <= 0) {
              newDepositFundFlows.push(generateDepositRefundFullFlow(
                id,
                rental.customerId,
                rental.equipmentId,
                depositRecord.id,
                collected,
                operator
              ));
            } else {
              const offsetAmt = Math.min(totalDeductionAmount, collected);
              const refundAmt = collected - offsetAmt;
              newDepositFundFlows.push(...generateDepositRefundPartialFlow(
                id,
                rental.customerId,
                rental.equipmentId,
                depositRecord.id,
                collected,
                offsetAmt,
                refundAmt,
                damageId || undefined,
                operator
              ));
            }
          }
          
          let updatedCoupons = state.customerCoupons;
          if (couponId) {
            updatedCoupons = state.customerCoupons.map((c) =>
              c.id === couponId ? { ...c, isUsed: true, usedRentalId: id } : c
            );
          }
          
          return {
            rentals: updatedRentals,
            equipments: updatedEquipments,
            depositRecords: updatedDepositRecords,
            financialTransactions: [...state.financialTransactions, ...newTransactions],
            rentalPenalties: newPenalty 
              ? [...state.rentalPenalties, newPenalty]
              : state.rentalPenalties,
            fundFlowRecords: [...state.fundFlowRecords, ...newFundFlows],
            fundFlowIdempotencyKeys: [...state.fundFlowIdempotencyKeys, ...newIdempotencyKeys],
            depositFundFlows: [...state.depositFundFlows, ...newDepositFundFlows],
            rentalFinanceDetails: updatedFinanceDetail
              ? state.rentalFinanceDetails.map((d) => d.id === updatedFinanceDetail!.id ? updatedFinanceDetail! : d)
              : state.rentalFinanceDetails,
            customerCoupons: updatedCoupons,
          };
        });
      },
      
      renewRental: (originalRentalId, options) => {
        const now = new Date().toISOString();
        const { endDate, price, operator = '系统' } = options;
        
        set((state) => {
          const originalRental = state.rentals.find((r) => r.id === originalRentalId);
          if (!originalRental || originalRental.status !== 'active') {
            return state;
          }
          
          const newRentalId = generateId();
          const channel = originalRental.channel;
          const isPackage = originalRental.isPackage || false;
          const packageId = originalRental.packageId;
          
          const newRental: Rental = {
            ...originalRental,
            id: newRentalId,
            startDate: originalRental.endDate,
            endDate,
            price,
            status: 'active',
            channel,
            isPackage,
            packageId,
            originalRentalId,
            createdAt: now,
          };
          
          const updatedOriginalRental = {
            ...originalRental,
            status: 'returned' as RentalStatus,
          };
          
          const updatedRentals = state.rentals.map((r) =>
            r.id === originalRentalId ? updatedOriginalRental : r
          );
          updatedRentals.push(newRental);
          
          let newFundFlows: FundFlowRecord[] = [];
          let newFinanceDetail: RentalFinanceDetail | null = null;
          let newIdempotencyKeys: FundFlowIdempotencyKey[] = [];
          
          const renewalIdempotency = checkIdempotency(state.fundFlowIdempotencyKeys, newRentalId, 'renewal');
          if (!renewalIdempotency.isDuplicate) {
            const rentalIncomeFlows = generateRentalIncomeFlows(newRental, operator, {
              channel,
              isPackage,
              packageId,
              baseRentalFee: price,
              sceneType: 'renewal',
            });
            newFundFlows.push(...rentalIncomeFlows);
            
            const idempotencyRecord = createIdempotencyRecord(
              newRentalId,
              'renewal',
              rentalIncomeFlows.map((f) => f.id),
              operator
            );
            newIdempotencyKeys.push(idempotencyRecord);
            
            console.log(`[财务对账] 续租成功，生成 ${rentalIncomeFlows.length} 条收入流水，订单: ${newRentalId}`);
          } else {
            console.log(`[幂等控制] 续租订单 ${newRentalId} 流水已生成，跳过重复生成`);
          }
          
          newFinanceDetail = splitRentalFinance(newRental, {
            packageDiscount: 0,
            couponDiscount: 0,
            deliveryFee: 0,
            cleaningFee: 0,
            packingFee: 0,
            penaltyAmount: 0,
            damageCompensation: 0,
            lossCompensation: 0,
            depositForfeited: 0,
            depositOffset: 0,
          });
          
          return {
            rentals: updatedRentals,
            fundFlowRecords: [...state.fundFlowRecords, ...newFundFlows],
            fundFlowIdempotencyKeys: [...state.fundFlowIdempotencyKeys, ...newIdempotencyKeys],
            rentalFinanceDetails: newFinanceDetail
              ? [...state.rentalFinanceDetails, newFinanceDetail]
              : state.rentalFinanceDetails,
          };
        });
      },
      
      splitPackageRental: (packageRentalId, splitItems, operator = '系统') => {
        const now = new Date().toISOString();
        
        set((state) => {
          const packageRental = state.rentals.find((r) => r.id === packageRentalId);
          if (!packageRental || !packageRental.isPackage) {
            return state;
          }
          
          const packageSplitIdempotency = checkIdempotency(state.fundFlowIdempotencyKeys, packageRentalId, 'package_split');
          if (packageSplitIdempotency.isDuplicate) {
            console.log(`[幂等控制] 套餐订单 ${packageRentalId} 拆分流水已生成，跳过重复生成`);
            return state;
          }
          
          const totalSplitAmount = splitItems.reduce((sum, item) => sum + item.amount, 0);
          if (Math.abs(totalSplitAmount - packageRental.price) > 0.01) {
            console.warn(`[财务对账] 套餐拆分金额 ${totalSplitAmount} 与套餐总价 ${packageRental.price} 不一致`);
          }
          
          const packageSplitFlows = generateRentalIncomeFlows(packageRental, operator, {
            channel: packageRental.channel,
            isPackage: true,
            packageId: packageRental.packageId,
            baseRentalFee: packageRental.price,
            packageSplitItems: splitItems,
            sceneType: 'package_split',
          });
          
          console.log(`[财务对账] 套餐租赁拆分成功，生成 ${packageSplitFlows.length} 条单品收入流水`);
          packageSplitFlows.forEach((flow) => {
            console.log(`  - 流水号: ${flow.flowNo}, 类型: ${transactionTypeLabels[flow.type]}, 金额: ${flow.amount}, 渠道: ${flow.channel ? customerChannelLabels[flow.channel] : '未标记'}`);
          });
          
          const idempotencyRecord = createIdempotencyRecord(
            packageRentalId,
            'package_split',
            packageSplitFlows.map((f) => f.id),
            operator
          );
          
          const existingFinanceDetail = state.rentalFinanceDetails.find(
            (d) => d.rentalId === packageRentalId
          );
          let updatedFinanceDetail = state.rentalFinanceDetails;
          
          if (existingFinanceDetail) {
            updatedFinanceDetail = state.rentalFinanceDetails.map((d) =>
              d.id === existingFinanceDetail.id
                ? {
                    ...d,
                    baseRentalFee: packageRental.price,
                    actualIncome: d.actualIncome,
                    updatedAt: now,
                  }
                : d
            );
          }
          
          return {
            fundFlowRecords: [...state.fundFlowRecords, ...packageSplitFlows],
            fundFlowIdempotencyKeys: [...state.fundFlowIdempotencyKeys, idempotencyRecord],
            rentalFinanceDetails: updatedFinanceDetail,
          };
        });
      },
      
      confirmDamageCompensation: (damageId, amount, operator = '系统') => {
        const now = new Date().toISOString();
        
        set((state) => {
          const damageRecord = state.damageRecords.find((d) => d.id === damageId);
          if (!damageRecord || damageRecord.compensationConfirmed) {
            return state;
          }
          
          const activeRental = state.rentals.find(
            (r) => r.equipmentId === damageRecord.equipmentId && r.status === 'active'
          );
          const rentalId = activeRental?.id || 'N/A';
          const customerId = activeRental?.customerId || 'N/A';
          
          const updatedDamageRecord = {
            ...damageRecord,
            status: 'compensated' as const,
            compensationAmount: amount,
            compensationConfirmed: true,
            compensationOperator: operator,
            compensationDate: now,
          };
          
          const newFlows = generateDamageCompensationFlows(
            rentalId,
            customerId,
            damageId,
            amount,
            false,
            operator
          );
          
          let updatedFinanceDetail = state.rentalFinanceDetails;
          if (rentalId !== 'N/A') {
            const existingFinanceDetail = state.rentalFinanceDetails.find(
              (d) => d.rentalId === rentalId
            );
            if (existingFinanceDetail) {
              const newDamageCompensation = existingFinanceDetail.damageCompensation + amount;
              const newTotalReceivable = existingFinanceDetail.totalReceivable + amount;
              updatedFinanceDetail = state.rentalFinanceDetails.map((d) =>
                d.id === existingFinanceDetail.id
                  ? {
                      ...d,
                      damageCompensation: newDamageCompensation,
                      totalReceivable: newTotalReceivable,
                      actualIncome: newTotalReceivable - d.totalDeduction,
                      updatedAt: now,
                    }
                  : d
              );
            }
          }
          
          return {
            damageRecords: state.damageRecords.map((d) =>
              d.id === damageId ? updatedDamageRecord : d
            ),
            fundFlowRecords: [...state.fundFlowRecords, ...newFlows],
            rentalFinanceDetails: updatedFinanceDetail,
          };
        });
      },
      
      confirmEquipmentLoss: (damageId, amount, operator = '系统') => {
        const now = new Date().toISOString();
        
        set((state) => {
          const damageRecord = state.damageRecords.find((d) => d.id === damageId);
          if (!damageRecord) {
            return state;
          }
          
          const activeRental = state.rentals.find(
            (r) => r.equipmentId === damageRecord.equipmentId && r.status === 'active'
          );
          const rentalId = activeRental?.id || 'N/A';
          const customerId = activeRental?.customerId || 'N/A';
          
          const updatedDamageRecord = {
            ...damageRecord,
            status: 'lost' as const,
            compensationAmount: amount,
            compensationConfirmed: true,
            compensationOperator: operator,
            compensationDate: now,
            isFullLoss: true,
          };
          
          const updatedEquipments = state.equipments.map((e) =>
            e.id === damageRecord.equipmentId
              ? { ...e, status: 'scrapped' as EquipmentStatus, updatedAt: now }
              : e
          );
          
          const newFlows = generateDamageCompensationFlows(
            rentalId,
            customerId,
            damageId,
            amount,
            true,
            operator
          );
          
          let updatedFinanceDetail = state.rentalFinanceDetails;
          if (rentalId !== 'N/A') {
            const existingFinanceDetail = state.rentalFinanceDetails.find(
              (d) => d.rentalId === rentalId
            );
            if (existingFinanceDetail) {
              const newLossCompensation = existingFinanceDetail.lossCompensation + amount;
              const newTotalReceivable = existingFinanceDetail.totalReceivable + amount;
              updatedFinanceDetail = state.rentalFinanceDetails.map((d) =>
                d.id === existingFinanceDetail.id
                  ? {
                      ...d,
                      lossCompensation: newLossCompensation,
                      totalReceivable: newTotalReceivable,
                      actualIncome: newTotalReceivable - d.totalDeduction,
                      updatedAt: now,
                    }
                  : d
              );
            }
          }
          
          return {
            damageRecords: state.damageRecords.map((d) =>
              d.id === damageId ? updatedDamageRecord : d
            ),
            equipments: updatedEquipments,
            fundFlowRecords: [...state.fundFlowRecords, ...newFlows],
            rentalFinanceDetails: updatedFinanceDetail,
          };
        });
      },
      
      offsetDeposit: (rentalId, amount, offsetType, operator = '系统') => {
        const now = new Date().toISOString();
        
        set((state) => {
          const depositRecord = state.depositRecords.find((d) => d.rentalId === rentalId);
          const rental = state.rentals.find((r) => r.id === rentalId);
          
          if (!depositRecord || !rental) {
            return state;
          }
          
          const newOffsetAmount = (depositRecord.forfeitedAmount || 0) + amount;
          const updatedDeposit = {
            ...depositRecord,
            forfeitedAmount: newOffsetAmount,
            status: newOffsetAmount >= depositRecord.collectedAmount
              ? 'forfeited' as DepositStatus
              : depositRecord.status,
            updatedAt: now,
          };
          
          const newFlows = generateDepositOffsetFlows(
            rentalId,
            rental.customerId,
            depositRecord.id,
            amount,
            offsetType,
            operator
          );
          
          const existingFinanceDetail = state.rentalFinanceDetails.find(
            (d) => d.rentalId === rentalId
          );
          let updatedFinanceDetail = state.rentalFinanceDetails;
          
          if (existingFinanceDetail) {
            updatedFinanceDetail = state.rentalFinanceDetails.map((d) =>
              d.id === existingFinanceDetail.id
                ? {
                    ...d,
                    depositOffset: d.depositOffset + amount,
                    totalDeduction: d.totalDeduction + amount,
                    actualIncome: d.totalReceivable - (d.totalDeduction + amount),
                    updatedAt: now,
                  }
                : d
            );
          }
          
          return {
            depositRecords: state.depositRecords.map((d) =>
              d.id === depositRecord.id ? updatedDeposit : d
            ),
            fundFlowRecords: [...state.fundFlowRecords, ...newFlows],
            rentalFinanceDetails: updatedFinanceDetail,
          };
        });
      },
      
      addDamageRecord: (record) => {
        const now = new Date().toISOString();
        const newRecord: DamageRecord = {
          ...record,
          id: generateId(),
          status: 'reported',
          photoUrls: record.photoUrls || [],
          createdAt: now,
        };
        
        set((state) => {
          let newStatus: EquipmentStatus = 'damaged';
          if (record.level === 'minor') {
            newStatus = 'available';
          } else if (record.level === 'scrapped') {
            newStatus = 'scrapped';
          }
          
          const equipment = state.equipments.find((eq) => eq.id === record.equipmentId);
          if (equipment && equipment.status === 'rented') {
            return {
              damageRecords: [...state.damageRecords, newRecord],
            };
          }
          
          return {
            damageRecords: [...state.damageRecords, newRecord],
            equipments: state.equipments.map((eq) =>
              eq.id === record.equipmentId
                ? { ...eq, status: newStatus, updatedAt: now }
                : eq
            ),
          };
        });
      },
      
      updateDamageRecord: (id, record) => {
        set((state) => ({
          damageRecords: state.damageRecords.map((d) =>
            d.id === id ? { ...d, ...record } : d
          ),
        }));
      },
      
      addPartReplacement: (part) => {
        const now = new Date().toISOString();
        const newPart: PartReplacement = {
          ...part,
          id: generateId(),
          createdAt: now,
        };
        set((state) => ({
          partReplacements: [...state.partReplacements, newPart],
        }));
      },
      
      addMaintenance: (maintenance) => {
        const now = new Date().toISOString();
        const newMaintenance: Maintenance = {
          ...maintenance,
          id: generateId(),
          status: maintenance.status || 'pending',
          createdAt: now,
        };
        
        set((state) => {
          const equipment = state.equipments.find((eq) => eq.id === maintenance.equipmentId);
          if (!equipment || equipment.status === 'maintenance') {
            return {
              maintenances: [...state.maintenances, newMaintenance],
            };
          }
          
          return {
            maintenances: [...state.maintenances, newMaintenance],
            equipments: state.equipments.map((eq) =>
              eq.id === maintenance.equipmentId
                ? { ...eq, status: 'maintenance' as EquipmentStatus, updatedAt: now }
                : eq
            ),
          };
        });
      },
      
      updateMaintenance: (id, maintenance) => {
        const now = new Date().toISOString();
        set((state) => {
          const existing = state.maintenances.find((m) => m.id === id);
          if (!existing) return state;
          
          let updatedEquipments = state.equipments;
          
          if (maintenance.status === 'completed' && existing.status !== 'completed') {
            updatedEquipments = state.equipments.map((eq) =>
              eq.id === existing.equipmentId
                ? { ...eq, status: 'available' as EquipmentStatus, updatedAt: now }
                : eq
            );
          }
          
          return {
            maintenances: state.maintenances.map((m) =>
              m.id === id ? { ...m, ...maintenance } : m
            ),
            equipments: updatedEquipments,
          };
        });
      },
      
      addInventoryCheck: (check) => {
        const now = new Date().toISOString();
        const newCheck: InventoryCheck = {
          ...check,
          id: generateId(),
          status: check.status || 'pending',
          createdAt: now,
        };
        set((state) => ({
          inventoryChecks: [...state.inventoryChecks, newCheck],
        }));
      },
      
      addInventoryItem: (item) => {
        const now = new Date().toISOString();
        const newItem: InventoryItem = {
          ...item,
          id: generateId(),
          createdAt: now,
        };
        set((state) => ({
          inventoryItems: [...state.inventoryItems, newItem],
        }));
      },
      
      completeInventoryCheck: (checkId) => {
        set((state) => ({
          inventoryChecks: state.inventoryChecks.map((check) =>
            check.id === checkId ? { ...check, status: 'completed' as InventoryCheckStatus } : check
          ),
        }));
      },
      
      addDepositRule: (rule) => {
        const now = new Date().toISOString();
        const newRule: DepositRule = {
          ...rule,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          depositRules: [...state.depositRules, newRule],
        }));
      },
      
      updateDepositRule: (id, rule) => {
        const now = new Date().toISOString();
        set((state) => ({
          depositRules: state.depositRules.map((r) =>
            r.id === id ? { ...r, ...rule, updatedAt: now } : r
          ),
        }));
      },
      
      deleteDepositRule: (id) => {
        set((state) => ({
          depositRules: state.depositRules.filter((r) => r.id !== id),
        }));
      },
      
      addPenaltyRule: (rule) => {
        const now = new Date().toISOString();
        const newRule: PenaltyRule = {
          ...rule,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          penaltyRules: [...state.penaltyRules, newRule],
        }));
      },
      
      updatePenaltyRule: (id, rule) => {
        const now = new Date().toISOString();
        set((state) => ({
          penaltyRules: state.penaltyRules.map((r) =>
            r.id === id ? { ...r, ...rule, updatedAt: now } : r
          ),
        }));
      },
      
      deletePenaltyRule: (id) => {
        set((state) => ({
          penaltyRules: state.penaltyRules.filter((r) => r.id !== id),
        }));
      },
      
      collectDeposit: (rentalId, amount, operator = '管理员') => {
        const now = new Date().toISOString();
        set((state) => {
          const depositRecord = state.depositRecords.find((d) => d.rentalId === rentalId);
          if (!depositRecord) return state;
          
          const collectAmount = amount ?? depositRecord.totalDepositAmount;
          const newCollected = depositRecord.collectedAmount + collectAmount;
          
          const updatedRecord = {
            ...depositRecord,
            collectedAmount: newCollected,
            status: 'collected' as DepositStatus,
            updatedAt: now,
          };
          
          const transaction: FinancialTransaction = {
            id: generateId(),
            rentalId,
            customerId: depositRecord.customerId,
            type: 'deposit_collect' as TransactionType,
            amount: collectAmount,
            direction: 'income' as const,
            description: '收取押金',
            operator,
            createdAt: now,
          };

          const rental = state.rentals.find((r) => r.id === rentalId);
          const depositCollectFlow = generateDepositCollectFlow(
            rentalId,
            depositRecord.customerId,
            depositRecord.equipmentId,
            depositRecord.id,
            collectAmount,
            operator
          );
          
          return {
            depositRecords: state.depositRecords.map((d) =>
              d.id === depositRecord.id ? updatedRecord : d
            ),
            financialTransactions: [...state.financialTransactions, transaction],
            depositFundFlows: [...state.depositFundFlows, depositCollectFlow],
          };
        });
      },
      
      refundDeposit: (rentalId, amount, operator = '管理员') => {
        const now = new Date().toISOString();
        set((state) => {
          const depositRecord = state.depositRecords.find((d) => d.rentalId === rentalId);
          if (!depositRecord) return state;
          
          const refundAmount = amount ?? depositRecord.collectedAmount;
          const newRefunded = depositRecord.refundedAmount + refundAmount;
          const remaining = depositRecord.collectedAmount - newRefunded;
          
          let newStatus: DepositStatus = depositRecord.status;
          if (remaining <= 0) {
            newStatus = 'refunded_full';
          } else if (newRefunded > 0) {
            newStatus = 'refunded_partial';
          }
          
          const updatedRecord = {
            ...depositRecord,
            refundedAmount: newRefunded,
            status: newStatus,
            updatedAt: now,
          };
          
          const transaction: FinancialTransaction = {
            id: generateId(),
            rentalId,
            customerId: depositRecord.customerId,
            type: 'deposit_refund' as TransactionType,
            amount: refundAmount,
            direction: 'expense' as const,
            description: '退还押金',
            operator,
            createdAt: now,
          };
          
          return {
            depositRecords: state.depositRecords.map((d) =>
              d.id === depositRecord.id ? updatedRecord : d
            ),
            financialTransactions: [...state.financialTransactions, transaction],
          };
        });
      },
      
      forfeitDeposit: (rentalId, amount, reason = '', operator = '管理员') => {
        const now = new Date().toISOString();
        set((state) => {
          const depositRecord = state.depositRecords.find((d) => d.rentalId === rentalId);
          if (!depositRecord) return state;
          
          const forfeitAmount = amount ?? depositRecord.collectedAmount;
          const newForfeited = depositRecord.forfeitedAmount + forfeitAmount;
          
          let newStatus: DepositStatus = depositRecord.status;
          if (newForfeited >= depositRecord.collectedAmount) {
            newStatus = 'forfeited';
          } else if (newForfeited > 0) {
            newStatus = 'refunded_partial';
          }
          
          const updatedRecord = {
            ...depositRecord,
            forfeitedAmount: newForfeited,
            status: newStatus,
            updatedAt: now,
          };
          
          const transaction: FinancialTransaction = {
            id: generateId(),
            rentalId,
            customerId: depositRecord.customerId,
            type: 'deposit_forfeit' as TransactionType,
            amount: forfeitAmount,
            direction: 'income' as const,
            description: `没收押金${reason ? ` - ${reason}` : ''}`,
            operator,
            createdAt: now,
          };
          
          return {
            depositRecords: state.depositRecords.map((d) =>
              d.id === depositRecord.id ? updatedRecord : d
            ),
            financialTransactions: [...state.financialTransactions, transaction],
          };
        });
      },
      
      addDepositExemptCustomer: (exempt) => {
        const now = new Date().toISOString();
        const newExempt: DepositExemptCustomer = {
          ...exempt,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          depositExemptCustomers: [...state.depositExemptCustomers, newExempt],
        }));
      },
      
      updateDepositExemptCustomer: (id, exempt) => {
        const now = new Date().toISOString();
        set((state) => ({
          depositExemptCustomers: state.depositExemptCustomers.map((e) =>
            e.id === id ? { ...e, ...exempt, updatedAt: now } : e
          ),
        }));
      },
      
      deleteDepositExemptCustomer: (id) => {
        set((state) => ({
          depositExemptCustomers: state.depositExemptCustomers.filter((e) => e.id !== id),
        }));
      },
      
      getDepositRecordByRentalId: (rentalId) => {
        return get().depositRecords.find((d) => d.rentalId === rentalId);
      },
      
      getPenaltyByRentalId: (rentalId) => {
        return get().rentalPenalties.find((p) => p.rentalId === rentalId);
      },
      
      getTransactionsByRentalId: (rentalId) => {
        return get().financialTransactions.filter((t) => t.rentalId === rentalId);
      },
      
      calculateRentalDeposit: (equipmentId, customerId) => {
        const state = get();
        const equipment = state.equipments.find((e) => e.id === equipmentId);
        const customer = state.customers.find((c) => c.id === customerId);
        
        if (!equipment || !customer) {
          return { amount: 0, isExempt: false };
        }
        
        const amount = calculateDepositAmount(equipment, state.depositRules);
        const exemptResult = isCustomerExemptFromDeposit(customer, state.depositExemptCustomers);
        
        return {
          amount,
          isExempt: exemptResult.isExempt,
          exemptReason: exemptResult.reason,
        };
      },
      
      calculateRentalPenalty: (rentalId, returnDate) => {
        const state = get();
        const rental = state.rentals.find((r) => r.id === rentalId);
        const equipment = state.equipments.find((e) => e.id === rental?.equipmentId);
        
        if (!rental || !equipment) return null;
        
        return calculatePenalty(rental, equipment, state.penaltyRules, returnDate);
      },
      
      getFinanceDetailByRentalId: (rentalId) => {
        return get().rentalFinanceDetails.find((d) => d.rentalId === rentalId);
      },
      
      getFundFlowsByRentalId: (rentalId) => {
        return get().fundFlowRecords.filter((f) => f.rentalId === rentalId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      
      getFundFlowsByType: (type) => {
        return get().fundFlowRecords.filter((f) => f.type === type);
      },
      
      getFundFlowsByCategory: (category) => {
        return get().fundFlowRecords.filter((f) => f.financeCategory === category);
      },
      
      addFundFlowRecord: (record) => {
        const flow = createFundFlowRecord(record as any);
        set((state) => ({
          fundFlowRecords: [...state.fundFlowRecords, flow],
        }));
      },
      
      issueVoucher: (rentalId, type, operator) => {
        const now = new Date().toISOString();
        const state = get();
        const rental = state.rentals.find((r) => r.id === rentalId);
        const fundFlows = state.fundFlowRecords.filter((f) => f.rentalId === rentalId && f.direction === (type === 'receipt' ? 'income' : 'expense'));
        
        if (!rental || fundFlows.length === 0) return null;
        
        const totalAmount = fundFlows.reduce((sum, f) => sum + f.amount, 0);
        
        const voucher: FinanceVoucher = {
          id: generateId(),
          voucherNo: `VCH${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          rentalId,
          customerId: rental.customerId,
          type,
          amount: totalAmount,
          items: fundFlows.map((f) => ({
            name: f.changeReason,
            amount: f.amount,
            category: f.financeCategory,
          })),
          operator,
          issuedAt: now,
          createdAt: now,
        };
        
        set((s) => ({
          financeVouchers: [...s.financeVouchers, voucher],
          fundFlowRecords: s.fundFlowRecords.map((f) =>
            f.rentalId === rentalId && f.direction === (type === 'receipt' ? 'income' : 'expense')
              ? { ...f, voucherStatus: 'issued' as VoucherStatus, voucherNo: voucher.voucherNo }
              : f
          ),
        }));
        
        return voucher;
      },
      
      getVouchersByRentalId: (rentalId) => {
        return get().financeVouchers.filter((v) => v.rentalId === rentalId);
      },
      
      getCustomerCoupons: (customerId) => {
        const now = new Date();
        return get().customerCoupons.filter((c) => 
          c.customerId === customerId && !c.isUsed && new Date(c.expireDate) > now
        );
      },
      
      useCoupon: (couponId, rentalId) => {
        const state = get();
        const coupon = state.customerCoupons.find((c) => c.id === couponId);
        
        if (!coupon || coupon.isUsed) return false;
        
        set((s) => ({
          customerCoupons: s.customerCoupons.map((c) =>
            c.id === couponId ? { ...c, isUsed: true, usedRentalId: rentalId } : c
          ),
        }));
        
        return true;
      },
      
      addCoupon: (coupon) => {
        const now = new Date().toISOString();
        const newCoupon: CustomerCoupon = {
          ...coupon,
          id: generateId(),
          isUsed: false,
          createdAt: now,
        };
        set((state) => ({
          customerCoupons: [...state.customerCoupons, newCoupon],
        }));
      },
      
      checkFundFlowIdempotency: (rentalId, operationType) => {
        const state = get();
        return checkIdempotency(state.fundFlowIdempotencyKeys, rentalId, operationType);
      },
      
      addFundFlowIdempotencyKey: (rentalId, operationType, flowIds, operator) => {
        const now = new Date().toISOString();
        const idempotencyRecord = createIdempotencyRecord(rentalId, operationType, flowIds, operator);
        set((state) => ({
          fundFlowIdempotencyKeys: [...state.fundFlowIdempotencyKeys, idempotencyRecord],
        }));
      },
      
      getDepositFundFlowsByRentalId: (rentalId) => {
        return get().depositFundFlows.filter((f) => f.rentalId === rentalId);
      },
      
      getDepositFundFlowsByType: (type) => {
        return get().depositFundFlows.filter((f) => f.type === type);
      },
      
      addDepositFundFlows: (flows) => {
        set((state) => ({
          depositFundFlows: [...state.depositFundFlows, ...flows],
        }));
      },

      getOperatingFlows: () => {
        return get().fundFlowRecords.filter((f) => f.isOperating);
      },

      getDepositFlows: () => {
        return get().fundFlowRecords.filter((f) => isDepositRelated(f.type));
      },

      calculateOperatingProfit: () => {
        const flows = get().fundFlowRecords;
        let operatingIncome = 0;
        let operatingExpense = 0;
        flows.forEach((f) => {
          if (f.isOperating) {
            if (f.direction === 'income') {
              operatingIncome += f.amount;
            } else {
              operatingExpense += f.amount;
            }
          }
        });
        return {
          operatingIncome,
          operatingExpense,
          operatingProfit: operatingIncome - operatingExpense,
        };
      },
    }),
    {
      name: 'camping-ledger-storage',
    }
  )
);
