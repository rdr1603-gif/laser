/* superadmin = dueño de la plataforma (gestiona comercios, no vende).
   Los roles operativos son los que usan el comercio día a día; cada usuario
   además puede tener permisos individuales que pisan el perfil del rol. */
export type Role = "superadmin" | "admin" | "vendedor" | "cajero" | "produccion" | "consulta";
export type ThemeMode = "light" | "dark";
export type TextSize = "sm" | "md" | "lg";
export type SubscriptionType = "demo" | "subscription";
export type SubscriptionStatus = "active" | "pending" | "expired" | "cancelled";
export type AccountStatus = "active" | "suspended" | "blocked";

export interface User {
  id?: number;
  username: string;
  passwordHash: string;
  name: string;
  lastname: string;
  email: string;
  role: Role;
  permissions: UserPermissions;
  storeId: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
  lastDeviceId?: string;
}

export interface UserPermissions {
  canSell: boolean;
  canViewProducts: boolean;
  canEditProducts: boolean;
  canViewInventory: boolean;
  canAdjustInventory: boolean;
  canViewCustomers: boolean;
  canEditCustomers: boolean;
  canViewJobs: boolean;
  canCreateJobs: boolean;
  canUpdateJobs: boolean;
  canViewCash: boolean;
  canOperateCash: boolean;
  canViewReports: boolean;
  canViewAllSales: boolean;
  canViewOwnSales: boolean;
  canManageUsers: boolean;
  canManageSubscription: boolean;
}

const NO_ACCESS: UserPermissions = {
  canSell: false,
  canViewProducts: false,
  canEditProducts: false,
  canViewInventory: false,
  canAdjustInventory: false,
  canViewCustomers: false,
  canEditCustomers: false,
  canViewJobs: false,
  canCreateJobs: false,
  canUpdateJobs: false,
  canViewCash: false,
  canOperateCash: false,
  canViewReports: false,
  canViewAllSales: false,
  canViewOwnSales: false,
  canManageUsers: false,
  canManageSubscription: false,
};

function perms(p: Partial<UserPermissions>): UserPermissions {
  return { ...NO_ACCESS, ...p };
}

export const DEFAULT_PERMISSIONS: Record<Role, UserPermissions> = {
  /* El SuperAdmin opera la plataforma: administra comercios, planes y pagos.
     No necesita (y no debe tener) acceso al uso operativo del comercio. */
  superadmin: perms({ canManageSubscription: true }),

  /* El administrador del comercio lo tiene todo dentro de su negocio. */
  admin: perms({
    canSell: true,
    canViewProducts: true,
    canEditProducts: true,
    canViewInventory: true,
    canAdjustInventory: true,
    canViewCustomers: true,
    canEditCustomers: true,
    canViewJobs: true,
    canCreateJobs: true,
    canUpdateJobs: true,
    canViewCash: true,
    canOperateCash: true,
    canViewReports: true,
    canViewAllSales: true,
    canViewOwnSales: true,
    canManageUsers: true,
  }),

  /* Vendedor:.point de venta, clientes y carga de trabajos. */
  vendedor: perms({
    canSell: true,
    canViewProducts: true,
    canViewInventory: true,
    canViewCustomers: true,
    canEditCustomers: true,
    canViewJobs: true,
    canCreateJobs: true,
    canViewOwnSales: true,
  }),

  /* Cajero: cobra, maneja caja y ve sus ventas. */
  cajero: perms({
    canSell: true,
    canViewProducts: true,
    canViewCustomers: true,
    canViewCash: true,
    canOperateCash: true,
    canViewOwnSales: true,
  }),

  /* Producción: avanza órdenes de trabajo y ve insumos. */
  produccion: perms({
    canViewProducts: true,
    canViewInventory: true,
    canViewJobs: true,
    canCreateJobs: true,
    canUpdateJobs: true,
  }),

  /* Consulta: solo lectura. */
  consulta: perms({
    canViewProducts: true,
    canViewInventory: true,
    canViewCustomers: true,
    canViewJobs: true,
    canViewCash: true,
    canViewReports: true,
    canViewAllSales: true,
  }),
};

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: "SuperAdmin",
  admin: "Administrador",
  vendedor: "Vendedor",
  cajero: "Cajero",
  produccion: "Producción",
  consulta: "Consulta",
};

export interface Store {
  id?: string;
  name: string;
  slug: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  theme: ThemeMode;
  businessData: BusinessData;
  subscription: StoreSubscription;
  accountStatus: AccountStatus;
  createdAt: number;
  updatedAt: number;
}

export interface BusinessData {
  razonSocial: string;
  cuit: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  whatsapp: string;
  email: string;
  ivaCondition: string;
  receiptFooter: string;
}

export interface StoreSubscription {
  type: SubscriptionType;
  status: SubscriptionStatus;
  planId?: string;
  amount?: number;
  trialEndsAt?: number;
  paidUntil?: number;
  lastPaymentAt?: number;
  notes?: string;
}

export interface AppColors {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  border: string;
}

export interface ThemeSettings {
  id?: string;
  storeId: string;
  mode: ThemeMode;
  light: AppColors;
  dark: AppColors;
  autoApplied: boolean;
  logoSource?: string;
}

export interface Category {
  id?: number;
  storeId: string;
  name: string;
  color?: string;
  image?: string;
  type: "product" | "service" | "material";
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export type ProductUnit = "unidad" | "kilo" | "gramo" | "litro" | "metro" | "caja" | "pack" | "docena" | "resma" | "hoja";

export interface Product {
  id?: number;
  sid?: string;
  storeId: string;
  barcode?: string;
  qrCode?: string;
  sku?: string;
  name: string;
  description?: string;
  brand?: string;
  categoryId?: number;
  subcategory?: string;
  costPrice: number;
  salePrice: number;
  promoPrice?: number | null;
  stock: number;
  minStock: number;
  unit: ProductUnit;
  weighed: boolean;
  supplierId?: number;
  iva: number;
  image?: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
  createdBy: number;
  updatedBy?: number;
}

export interface Service {
  id?: number;
  storeId: string;
  name: string;
  categoryId?: number;
  price: number;
  unit: string;
  estimatedTime: number;
  description?: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
  createdBy: number;
}

export interface PhotocopyConfig {
  id?: number;
  storeId: string;
  name: string;
  copies: number;
  colorMode: "bw" | "color";
  paperSize: "A4" | "A3" | "A5" | "Letter" | "Legal";
  paperType: "común" | "foto" | "brillo" | "mate";
  sides: "single" | "double";
  binding: "none" | "coil" | "comb" | "thermal";
  lamination: "none" | "matte" | "glossy";
  pricePerUnit: number;
  active: boolean;
}

export interface JobType {
  id?: number;
  storeId: string;
  name: string;
  category: "sublimacion" | "estampado" | "diseno" | "personalizado" | "otro";
  description?: string;
  basePrice: number;
  estimatedDays: number;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Customer {
  id?: number;
  storeId: string;
  name: string;
  lastname?: string;
  dni?: string;
  cuit?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  notes?: string;
  creditLimit?: number;
  balance: number;
  createdAt: number;
  updatedAt: number;
  createdBy: number;
}

export interface Supplier {
  id?: number;
  storeId: string;
  company: string;
  contact?: string;
  cuit?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  notes?: string;
  balance: number;
  createdAt: number;
  updatedAt: number;
  createdBy: number;
}

export interface SaleItem {
  id?: number;
  storeId: string;
  saleId?: number;
  productId?: number;
  serviceId?: number;
  jobId?: number;
  name: string;
  barcode?: string;
  qty: number;
  unit: string;
  unitPrice: number;
  cost: number;
  lineDiscount: number;
  subtotal: number;
  total: number;
  type: "product" | "service" | "job";
}

export interface Payment {
  id?: number;
  storeId: string;
  saleId?: number;
  jobId?: number;
  method: string;
  amount: number;
  received?: number;
  change?: number;
  reference?: string;
  createdAt: number;
}

export interface Sale {
  id?: number;
  storeId: string;
  number: number;
  date: number;
  userId: number;
  userName: string;
  customerId?: number;
  customerName?: string;
  customerDni?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  payments: Payment[];
  status: "completada" | "anulada" | "devuelta" | "pendiente";
  notes?: string;
  cashRegisterId?: number;
  createdAt: number;
  updatedAt: number;
  createdBy: number;
}

export type JobStatus =
  | "consulta"
  | "presupuesto_pendiente"
  | "presupuesto_aprobado"
  | "esperando_seña"
  | "pendiente_diseño"
  | "pendiente_materiales"
  | "en_produccion"
  | "en_revision"
  | "listo_entregar"
  | "entregado"
  | "cancelado";

export type LaserWorkType = "grabado" | "corte" | "ambos";

export interface LaserMaterial {
  id?: number;
  storeId: string;
  name: string;
  type: "wood" | "acrylic" | "leather" | "metal" | "other";
  thickness?: number;
  unit: ProductUnit;
  costPrice: number;
  salePrice?: number;
  wastePercentage: number;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LaserJob {
  id?: number;
  storeId: string;
  number: number;
  customerId: number;
  customerName: string;
  userId: number;
  userName: string;
  createdAt: number;
  updatedAt: number;
  estimatedDelivery: number;
  actualDelivery?: number;
  laserWorkType: LaserWorkType;
  description: string;
  quantity: number;
  materialId?: number;
  materialThickness?: number;
  specifications?: Record<string, any>;
  files: JobFile[];
  totalPrice: number;
  deposit: number;
  balance: number;
  status: JobStatus;
  notes?: string;
  priority: "baja" | "normal" | "alta" | "urgente";
  materialCost: number;
  machineTimeMinutes: number;
  prepTimeMinutes: number;
  manualTimeMinutes: number;
  machineRatePerMinute: number;
  operatorId?: number;
  operatorName?: string;
}

export interface LaserJobItem {
  id?: number;
  storeId: string;
  jobId?: number;
  productId?: number;
  serviceId?: number;
  materialId?: number;
  name: string;
  description?: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  type: "product" | "service" | "material";
  specifications?: Record<string, any>;
  wasteQty?: number;
}

export interface Partner {
  id?: number;
  storeId: string;
  name: string;
  role: "active" | "silent" | "retired";
  participationPercentage: number;
  initialContribution?: number;
  additionalContributions?: number;
  loansToBusiness?: number;
  personalExpenses?: number;
  withdrawals?: number;
  distributions?: number;
  capitalBalance: number;
  currentAccountBalance: number;
  active: boolean;
  createdAt: number;
  updatedAt: number;
  createdBy: number;
}

export interface DistributionRecord {
  id?: number;
  storeId: string;
  period: number;
  totalDistributable: number;
  partnerPercentage: number;
  partnerShare: number;
  partnerId: number;
  partnerName: string;
  amount: number;
  date: number;
  confirmed: boolean;
  note?: string;
}

export type CashMovementType =
  | "ingreso"
  | "retiro"
  | "gasto"
  | "venta_efectivo"
  | "seña"
  | "pago_saldo"
  | "cierre"
  | "apertura"
  | "transferencia"
  | "aportereinversion"
  | "aportecapital"
  | "retiro_socio"
  | "ajuste";

export interface CashMovement {
  id?: number;
  storeId: string;
  cashRegisterId: number;
  type: CashMovementType;
  concept: string;
  amount: number;
  userId: number;
  userName: string;
  date: number;
  referenceId?: number;
  referenceType?: "sale" | "job" | "payment" | "manual" | "partner";
  notes?: string;
}

export interface MoneyDistributionConfig {
  id?: string;
  storeId: string;
  reinvestmentPercentage: number;
  defaultFrequency: "mensual" | "trimestral" | "semestral" | "anual";
  minDistributionAmount: number;
  maxDiscountPerPartner: number;
  createdAt: number;
  updatedAt: number;
}

export interface QuoteConversion {
  quoteId: number;
  newJobId: number;
  newSaleId?: number;
  convertedAt: number;
  status: "converted" | "partial" | "failed";
}
  id?: number;
  storeId: string;
  number: number;
  customerId: number;
  customerName: string;
  userId: number;
  userName: string;
  createdAt: number;
  updatedAt: number;
  estimatedDelivery: number;
  actualDelivery?: number;
  items: JobItem[];
  files: JobFile[];
  totalPrice: number;
  deposit: number;
  balance: number;
  status: JobStatus;
  notes?: string;
  priority: "baja" | "normal" | "alta" | "urgente";
}

export interface JobItem {
  id?: number;
  storeId: string;
  jobId?: number;
  productId?: number;
  serviceId?: number;
  materialId?: number;
  name: string;
  description?: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  type: "product" | "service" | "material";
  specifications?: Record<string, any>;
}

export interface JobFile {
  id?: number;
  storeId: string;
  jobId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string;
  uploadedAt: number;
  uploadedBy: number;
  description?: string;
}

export interface Quote {
  id?: number;
  storeId: string;
  number: number;
  date: number;
  validUntil: number;
  customerId?: number;
  customerName?: string;
  userId: number;
  userName: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: "pendiente" | "aprobado" | "rechazado" | "vencido" | "convertido";
  notes?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: number;
  convertedToJobId?: number;
  convertedToSaleId?: number;
}

export interface QuoteItem {
  id?: number;
  storeId: string;
  quoteId?: number;
  productId?: number;
  serviceId?: number;
  jobTypeId?: number;
  name: string;
  description?: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  type: "product" | "service" | "job";
}

export type MovementType =
  | "entrada"
  | "salida"
  | "ajuste"
  | "venta"
  | "anulacion"
  | "devolucion"
  | "consumo_trabajo"
  | "compra"
  | "produccion"
  | "merma";

export interface InventoryMovement {
  id?: number;
  storeId: string;
  productId: number;
  productName: string;
  type: MovementType;
  qty: number;
  before: number;
  after: number;
  reason?: string;
  referenceId?: number;
  referenceType?: "sale" | "job" | "purchase" | "adjustment";
  userId: number;
  userName: string;
  date: number;
  createdAt: number;
}

export interface CashRegister {
  id?: number;
  storeId: string;
  number: number;
  openedAt: number;
  closedAt?: number;
  userId: number;
  userName: string;
  openingAmount: number;
  status: "abierta" | "cerrada";
  expectedTotal?: number;
  closingAmount?: number;
  difference?: number;
  notes?: string;
}

export type CashMovementType =
  | "ingreso"
  | "retiro"
  | "gasto"
  | "venta_efectivo"
  | "seña"
  | "pago_saldo"
  | "cierre"
  | "apertura";

export interface CashMovement {
  id?: number;
  storeId: string;
  cashRegisterId: number;
  type: CashMovementType;
  concept: string;
  amount: number;
  userId: number;
  userName: string;
  date: number;
  referenceId?: number;
  referenceType?: "sale" | "job" | "payment" | "manual";
}

export interface PaymentMethod {
  id: string;
  name: string;
  color: string;
  requiresReference: boolean;
  active: boolean;
}

export interface Device {
  id?: string;
  storeId: string;
  userId: number;
  userName: string;
  deviceName: string;
  platform: string;
  lastSyncAt?: number;
  lastSeenAt: number;
  status: "activo" | "inactivo" | "bloqueado";
  createdAt: number;
}

export interface SyncOperation {
  id?: number;
  storeId: string;
  userId: number;
  deviceId: string;
  operationId: string;
  type: string;
  entity: string;
  entityId: string | number;
  data: any;
  status: "pending" | "syncing" | "synced" | "conflict" | "error";
  createdAt: number;
  syncedAt?: number;
  errorMessage?: string;
}

export interface AuditLog {
  id?: number;
  sid?: string;
  storeId: string;
  userId: number;
  userName: string;
  deviceId: string;
  action: string;
  entity?: string;
  entityId?: string | number;
  oldData?: any;
  newData?: any;
  date: number;
}

export interface SyncQueueEntry {
  id?: number;
  storeId: string;
  entity: string;
  action: string;
  payload: any;
  date: number;
  synced: boolean;
}

export interface SyncMapping {
  id?: number;
  storeId: string;
  device: string;
  table: string;
  lid: number;
  localId: number;
  sid: string;
}

export interface SyncOp {
  table: string;
  lid: number;
  sid: string;
  data: any;
  ts: number;
  deleted?: boolean;
}

export interface SyncOutboxEntry {
  key: string;
  table: string;
  sid: string;
  deleted: boolean;
  data?: any;
  seq: number;
}

export interface AppSettings {
  key?: string;
  sid?: string;
  storeId: string;
  storeName?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  businessData?: BusinessData;
  paymentMethods: PaymentMethod[];
  ticketWidth: number;
  ticketFooter: string;
  maxDiscount: Record<string, number>;
  shortcuts: Record<string, string>;
  defaultIva: number;
  requireCashOpen: boolean;
  posLineFields: string[];
  posShowCatsBelow: boolean;
  syncEnabled: boolean;
  syncUrl: string;
  syncToken: string;
  syncMode: "local" | "nube";
  demoSeeded?: boolean;
}

export const SYNC_TABLES = [
  "categories",
  "products",
  "services",
  "photocopyConfigs",
  "jobTypes",
  "customers",
  "suppliers",
  "sales",
  "saleItems",
  "payments",
  "jobs",
  "jobItems",
  "jobFiles",
  "quotes",
  "quoteItems",
  "inventoryMovements",
  "cashRegisters",
  "cashMovements",
  "users",
  "devices",
  "auditLogs",
  "settings",
  "theme",
  "laserMaterials",
  "laserJobs",
  "laserJobItems",
  "partners",
  "distributionRecords",
  "moneyDistributionConfigs",
  "purchases",
  "purchaseItems",
  "expenseCategories",
  "expenses",
  "inventoryReservations",
] as const;

export const SINGLETON_TABLES = ["settings", "theme"];

export const SINGLETON_SIDS: Record<string, string> = {
  settings: "settings-main",
  theme: "theme-main",
};

export interface PlanInfo {
  id: string;
  name: string;
  monthlyPrice: number;
  currency: string;
  features: string[];
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SubscriptionRequest {
  id: string;
  storeId: string;
  planId: string | null;
  amount: number;
  currency: string;
  months: number;
  status: string;
  notes: string | null;
  requestedAt: number;
  reviewedAt: number | null;
}

export interface SubscriptionPayment {
  id: string;
  storeId: string;
  amount: number;
  currency: string;
  method: string | null;
  plan: string;
  periodStart: number | null;
  periodEnd: number | null;
  status: string;
  notes: string | null;
  operationId: string | null;
  createdBy: string | null;
  createdAt: number;
}

export interface PaymentAccount {
  id: string;
  label: string;
  holder: string;
  bank: string;
  cbu: string;
  alias: string;
  paymentUrl: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AdminStats {
  stores: number;
  demosActive: number;
  demosExpired: number;
  subsActive: number;
  subsExpired: number;
  pendingPayments: number;
  revenue: number;
  revenueDays: number;
  revenueCurrency: string;
}

export interface DeviceStatsMap {
  [storeId: string]: { count: number; lastSync: number | null; lastSeen: number | null };
}

export interface Purchase {
  id?: number;
  storeId: string;
  number: number;
  supplierId?: number;
  supplierName?: string;
  date: number;
  status: "pendiente" | "parcial" | "recibido" | "cancelado";
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  remaining: number;
  paymentMethod?: string;
  notes?: string;
  createdAt: number;
  createdBy: number;
}

export interface PurchaseItem {
  id?: number;
  storeId: string;
  purchaseId?: number;
  productId?: number;
  materialId?: number;
  name: string;
  description?: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  discount: number;
  subtotal: number;
}

export interface ExpenseCategory {
  id?: number;
  storeId: string;
  name: string;
  type: "operating" | "direct" | "general" | "capital" | "partner";
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Expense {
  id?: number;
  storeId: string;
  categoryId: number;
  categoryName: string;
  description: string;
  amount: number;
  paymentMethod?: string;
  date: number;
  userId: number;
  userName: string;
  referenceId?: number;
  referenceType?: "purchase" | "manual";
  notes?: string;
  paid: boolean;
}

export interface InventoryReservation {
  id?: number;
  storeId: string;
  productId: number;
  productName: string;
  jobId?: number;
  qty: number;
  reservedAt: number;
  releasedAt?: number;
  userId: number;
  userName: string;
}