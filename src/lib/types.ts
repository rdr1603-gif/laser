export type Role = "admin" | "socio" | "operador" | "consulta";

export interface User {
  id?: number;
  username: string;
  passwordHash: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  socio: "Socio",
  operador: "Operador",
  consulta: "Consulta",
};

export interface Customer {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  balance: number;
  createdAt: number;
  updatedAt: number;
}

export interface Supplier {
  id?: number;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  balance: number;
  createdAt: number;
  updatedAt: number;
}

export interface Material {
  id?: number;
  name: string;
  type: string;
  thickness?: number;
  unit: string;
  costPrice: number;
  stock: number;
  minStock: number;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export type JobStatus =
  | "pendiente"
  | "presupuestado"
  | "aprobado"
  | "en_produccion"
  | "terminado"
  | "entregado"
  | "cancelado";

export interface Job {
  id?: number;
  number: number;
  customerId?: number;
  customerName?: string;
  description: string;
  quantity: number;
  materialId?: number;
  materialName?: string;
  status: JobStatus;
  totalPrice: number;
  deposit: number;
  balance: number;
  createdAt: number;
  updatedAt: number;
  estimatedDelivery?: number;
  machineTimeMinutes: number;
  materialCost: number;
  notes?: string;
}

export interface Quote {
  id?: number;
  number: number;
  customerId?: number;
  customerName?: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: "pendiente" | "aprobado" | "rechazado" | "convertido";
  createdAt: number;
  updatedAt: number;
  validUntil?: number;
  notes?: string;
}

export interface QuoteItem {
  id?: number;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type CashMovementType =
  | "ingreso"
  | "egreso"
  | "cobro"
  | "pago"
  | "aporte_socio"
  | "retiro_socio"
  | "prestamo"
  | "transferencia";

export interface CashMovement {
  id?: number;
  type: CashMovementType;
  concept: string;
  amount: number;
  date: number;
  reference?: string;
  notes?: string;
  createdAt: number;
}

export interface Purchase {
  id?: number;
  supplierId?: number;
  supplierName?: string;
  items: PurchaseItem[];
  total: number;
  paid: number;
  remaining: number;
  status: "pendiente" | "parcial" | "pagado" | "cancelado";
  date: number;
  createdAt: number;
  notes?: string;
}

export interface PurchaseItem {
  id?: number;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Partner {
  id?: number;
  name: string;
  participationPercentage: number;
  initialContribution: number;
  loansToBusiness: number;
  personalExpenses: number;
  withdrawals: number;
  distributions: number;
  capitalBalance: number;
  currentAccountBalance: number;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Distribution {
  id?: number;
  period: string;
  totalAmount: number;
  partnerId: number;
  partnerName: string;
  amount: number;
  date: number;
  confirmed: boolean;
  notes?: string;
}

export interface Expense {
  id?: number;
  category: string;
  description: string;
  amount: number;
  date: number;
  paid: boolean;
  reference?: string;
  notes?: string;
  createdAt: number;
}

export interface AppSettings {
  id?: number;
  businessName: string;
  currency: string;
  reinvestmentPercentage: number;
  partner1Percentage: number;
  partner2Percentage: number;
  machineRatePerHour: number;
  laborRatePerHour: number;
  taxRate: number;
  updatedAt: number;
}

export interface AuditLog {
  id?: number;
  action: string;
  entity: string;
  entityId?: number;
  details: string;
  userId?: number;
  userName?: string;
  timestamp: number;
}
