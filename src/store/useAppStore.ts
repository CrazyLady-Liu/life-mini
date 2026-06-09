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
import { generateId } from '../utils/format';
import {
  calculateDepositAmount,
  isCustomerExemptFromDeposit,
  calculatePenalty,
  calculateDepositSettlement,
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
  
  addEquipment: (equipment: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => void;
  updateEquipment: (id: string, equipment: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;
  
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'rentalCount'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  
  addRental: (rental: Omit<Rental, 'id' | 'createdAt' | 'status'> & { status?: RentalStatus }) => void;
  updateRental: (id: string, rental: Partial<Rental>) => void;
  returnRental: (id: string, options?: { penaltyAmount?: number; damageCompensation?: number; adjustmentReason?: string; operator?: string }) => void;
  
  addDamageRecord: (record: Omit<DamageRecord, 'id' | 'createdAt' | 'status'>) => void;
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
      
      addEquipment: (equipment) => {
        const now = new Date().toISOString();
        const newEquipment: Equipment = {
          ...equipment,
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
        const { penaltyAmount, damageCompensation = 0, adjustmentReason, operator = '系统' } = options;
        
        set((state) => {
          const rental = state.rentals.find((r) => r.id === id);
          if (!rental) return state;
          
          const equipment = state.equipments.find((e) => e.id === rental.equipmentId);
          const depositRecord = state.depositRecords.find((d) => d.rentalId === id);
          
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
          
          if (equipment && depositRecord && !depositRecord.isExempt) {
            const calculatedPenalty = calculatePenalty(rental, equipment, state.penaltyRules);
            const finalPenaltyAmount = penaltyAmount !== undefined ? penaltyAmount : (calculatedPenalty?.totalPenalty || 0);
            
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
            
            const settlement = calculateDepositSettlement(depositRecord, finalPenaltyAmount, damageCompensation);
            
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
            }
            
            if (settlement.forfeitAmount > 0) {
              newTransactions.push({
                id: generateId(),
                rentalId: id,
                customerId: rental.customerId,
                type: 'deposit_forfeit',
                amount: settlement.forfeitAmount,
                direction: 'income',
                description: `扣除押金（违约金: ${finalPenaltyAmount.toFixed(2)}${damageCompensation > 0 ? `, 损坏赔偿: ${damageCompensation.toFixed(2)}` : ''}）`,
                operator,
                createdAt: now,
              });
            }
          } else if (depositRecord?.isExempt) {
            updatedDepositRecords = state.depositRecords.map((d) =>
              d.rentalId === id
                ? { ...d, status: 'refunded_full' as DepositStatus, updatedAt: now }
                : d
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
          };
        });
      },
      
      addDamageRecord: (record) => {
        const now = new Date().toISOString();
        const newRecord: DamageRecord = {
          ...record,
          id: generateId(),
          status: 'reported',
          createdAt: now,
        };
        
        set((state) => {
          let newStatus: EquipmentStatus = 'damaged';
          if (record.level === 'minor') {
            newStatus = 'available';
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
          
          return {
            depositRecords: state.depositRecords.map((d) =>
              d.id === depositRecord.id ? updatedRecord : d
            ),
            financialTransactions: [...state.financialTransactions, transaction],
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
    }),
    {
      name: 'camping-ledger-storage',
    }
  )
);
