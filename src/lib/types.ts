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
  | "consulta"
  | "presupuesto_pendiente"
  | "aprobado"
  | "esperando_seña"
  | "pendiente_materiales"
  | "en_produccion"
  | "en_revision"
  | "listo_entregar"
  | "entregado"
  | "cancelado";

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  consulta: "Consulta",
  presupuesto_pendiente: "Presupuesto pendiente",
  aprobado: "Aprobado",
  esperando_seña: "Esperando seña",
  pendiente_materiales: "Pendiente de materiales",
  en_produccion: "En producción",
  en_revision: "En revisión",
  listo_entregar: "Listo para entregar",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

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
  prepTimeMinutes: number;
  materialCost: number;
  laborCost: number;
  otherCosts: number;
  notes?: string;
  wasteQty?: number;
  isRepeat?: boolean;
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
  costEstimate?: number;
  suggestedPrice?: number;
  finalPrice?: number;
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
  | "pago_proveedor"
  | "gasto"
  | "aporte_socio"
  | "retiro_socio"
  | "prestamo_recibido"
  | "prestamo_pagado"
  | "transferencia_interna"
  | "apertura_caja"
  | "cierre_caja"
  | "seña"
  | "venta_efectivo"
  | "venta_transferencia"
  | "ajuste";

export const CASH_MOVEMENT_LABELS: Record<CashMovementType, string> = {
  ingreso: "Ingreso",
  egreso: "Egreso",
  cobro: "Cobro",
  pago_proveedor: "Pago a proveedor",
  gasto: "Gasto",
  aporte_socio: "Aporte socio",
  retiro_socio: "Retiro socio",
  prestamo_recibido: "Préstamo recibido",
  prestamo_pagado: "Préstamo pagado",
  transferencia_interna: "Transferencia interna",
  apertura_caja: "Apertura de caja",
  cierre_caja: "Cierre de caja",
  seña: "Seña",
  venta_efectivo: "Venta efectivo",
  venta_transferencia: "Venta transferencia",
  ajuste: "Ajuste",
};

export interface CashMovement {
  id?: number;
  type: CashMovementType;
  concept: string;
  amount: number;
  date: number;
  reference?: string;
  notes?: string;
  paymentMethod: string;
  responsible: string;
  createdAt: number;
}

export interface CashRegister {
  id?: number;
  name: string;
  openedAt: number;
  closedAt?: number;
  openingAmount: number;
  closingAmount?: number;
  theoreticalBalance?: number;
  countedAmount?: number;
  difference?: number;
  status: "abierta" | "cerrada";
  responsible: string;
  notes?: string;
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
  workPayments: number;
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
  paid: boolean;
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
  machineRatePerMinute: number;
  engravingRatePerMinute: number;
  cuttingRatePerMinute: number;
  prepTimeMinutes: number;
  electricityCostPerHour: number;
  maintenanceCostPerHour: number;
  wearReservePercentage: number;
  laborPercentage: number;
  packagingCost: number;
  transportCost: number;
  otherDirectCosts: number;
  priceMarkupPercentage: number;
  targetMarginPercentage: number;
  minimumJobPrice: number;
  roundingRule: "nearest_10" | "nearest_50" | "nearest_100" | "none";
  includeMaintenanceInRate: boolean;
  includeElectricityInRate: boolean;
  includeWearInRate: boolean;
  manualRateEnabled: boolean;
  pendingEstimates: string[];
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

export interface Liquidacion {
  id?: number;
  period: string;
  startDate: number;
  endDate: number;
  totalRevenue: number;
  totalCosts: number;
  totalExpenses: number;
  netResult: number;
  reinvestmentAmount: number;
  reinvestmentPercentage: number;
  distributableProfit: number;
  partner1Amount: number;
  partner2Amount: number;
  partner1Percentage: number;
  partner2Percentage: number;
  otherReserves: number;
  status: "borrador" | "provisional" | "pendiente_aprobacion" | "aprobada" | "parcialmente_pagada" | "pagada" | "anulada";
  createdAt: number;
  approvedAt?: number;
  paidAt?: number;
  responsible: string;
  notes?: string;
}

export interface ReinvestmentFund {
  id?: number;
  calculated: number;
  approved: number;
  reserved: number;
  used: number;
  balance: number;
  objectives: string;
}

export interface PartnerTransaction {
  id?: number;
  partnerId: number;
  partnerName: string;
  type: "aporte" | "prestamo" | "retiro" | "distribucion" | "pago_trabajo" | "reembolso";
  amount: number;
  date: number;
  description: string;
  reference?: string;
  balance: number;
}
