export type EquipmentStatus = 'available' | 'rented' | 'maintenance' | 'damaged' | 'scrapped';

export type RentalStatus = 'pending' | 'active' | 'returned' | 'overdue' | 'cancelled';

export type DamageLevel = 'minor' | 'moderate' | 'severe';

export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type InventoryCheckStatus = 'pending' | 'in_progress' | 'completed';

export interface Equipment {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  purchasePrice: number;
  purchaseDate: string;
  status: EquipmentStatus;
  location: string;
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
  };
}
