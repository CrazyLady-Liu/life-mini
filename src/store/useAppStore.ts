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
} from '../utils/mock';
import { generateId } from '../utils/format';

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
  returnRental: (id: string) => void;
  
  addDamageRecord: (record: Omit<DamageRecord, 'id' | 'createdAt' | 'status'>) => void;
  updateDamageRecord: (id: string, record: Partial<DamageRecord>) => void;
  
  addPartReplacement: (part: Omit<PartReplacement, 'id' | 'createdAt'>) => void;
  
  addMaintenance: (maintenance: Omit<Maintenance, 'id' | 'createdAt' | 'status'> & { status?: MaintenanceStatus }) => void;
  updateMaintenance: (id: string, maintenance: Partial<Maintenance>) => void;
  
  addInventoryCheck: (check: Omit<InventoryCheck, 'id' | 'createdAt' | 'status'> & { status?: InventoryCheckStatus }) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'createdAt'>) => void;
  completeInventoryCheck: (checkId: string) => void;
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
        const newRental: Rental = {
          ...rental,
          id: generateId(),
          status: rental.status || 'active',
          createdAt: now,
        };
        
        set((state) => {
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
          
          return {
            rentals: [...state.rentals, newRental],
            equipments: updatedEquipments,
            customers: updatedCustomers,
          };
        });
      },
      
      updateRental: (id, rental) => {
        set((state) => ({
          rentals: state.rentals.map((r) =>
            r.id === id ? { ...r, ...rental } : r
          ),
        }));
      },
      
      returnRental: (id) => {
        const now = new Date().toISOString();
        set((state) => {
          const rental = state.rentals.find((r) => r.id === id);
          if (!rental) return state;
          
          const updatedEquipments = state.equipments.map((eq) =>
            eq.id === rental.equipmentId
              ? { ...eq, status: 'available' as EquipmentStatus, updatedAt: now }
              : eq
          );
          
          return {
            rentals: state.rentals.map((r) =>
              r.id === id ? { ...r, status: 'returned' as RentalStatus } : r
            ),
            equipments: updatedEquipments,
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
    }),
    {
      name: 'camping-ledger-storage',
    }
  )
);
