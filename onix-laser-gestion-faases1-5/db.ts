import Dexie, { type Table } from "dexie";
import type {
  AppSettings,
  AuditLog,
  CashMovement,
  CashRegister,
  Category,
  Customer,
  Device,
  InventoryMovement,
  Job,
  JobFile,
  JobItem,
  LaserJob,
  LaserJobItem,
  LaserMaterial,
  MoneyDistributionConfig,
  Payment,
  Product,
  Quote,
  QuoteItem,
  Sale,
  SaleItem,
  Service,
  Supplier,
  SyncMapping,
  SyncOutboxEntry,
  SyncQueueEntry,
  ThemeSettings,
  Partner,
  DistributionRecord,
  Purchase,
  PurchaseItem,
  ExpenseCategory,
  Expense,
  InventoryReservation,
  User,
  PhotocopyConfig,
  JobType,
} from "./types";

class OnixDB extends Dexie {
  users!: Table<User, number>;
  categories!: Table<Category, number>;
  products!: Table<Product, number>;
  services!: Table<Service, number>;
  photocopyConfigs!: Table<PhotocopyConfig, number>;
  jobTypes!: Table<JobType, number>;
  customers!: Table<Customer, number>;
  suppliers!: Table<Supplier, number>;
  sales!: Table<Sale, number>;
  saleItems!: Table<SaleItem, number>;
  payments!: Table<Payment, number>;
  jobs!: Table<Job, number>;
  jobItems!: Table<JobItem, number>;
  jobFiles!: Table<JobFile, number>;
  quotes!: Table<Quote, number>;
  quoteItems!: Table<QuoteItem, number>;
  inventoryMovements!: Table<InventoryMovement, number>;
  cashRegisters!: Table<CashRegister, number>;
  cashMovements!: Table<CashMovement, number>;
  devices!: Table<Device, string>;
  auditLogs!: Table<AuditLog, number>;
  syncQueue!: Table<SyncQueueEntry, number>;
  syncMappings!: Table<SyncMapping, number>;
  syncOutbox!: Table<SyncOutboxEntry, string>;
  settings!: Table<AppSettings, string>;
  theme!: Table<ThemeSettings, string>;
  laserMaterials!: Table<LaserMaterial, number>;
  laserJobs!: Table<LaserJob, number>;
  laserJobItems!: Table<LaserJobItem, number>;
  partners!: Table<Partner, number>;
  distributionRecords!: Table<DistributionRecord, number>;
  moneyDistributionConfigs!: Table<MoneyDistributionConfig, string>;
  purchases!: Table<Purchase, number>;
  purchaseItems!: Table<PurchaseItem, number>;
  expenseCategories!: Table<ExpenseCategory, number>;
  expenses!: Table<Expense, number>;
  inventoryReservations!: Table<InventoryReservation, number>;

  constructor() {
    super("onix-pos");
    // `sid` es el identificador estable de sincronización y debe estar
    // indexado en TODAS las tablas sincronizadas: el outbox y la aplicación
    // de operaciones remotas lo busca con where("sid").
    this.version(1).stores({
      users: "++id, sid, username, email, storeId, active, role, createdAt",
      categories: "++id, sid, storeId, name, type, active",
      products: "++id, sid, storeId, name, barcode, sku, categoryId, active, updatedAt, brand, stock",
      services: "++id, sid, storeId, name, categoryId, active, updatedAt",
      photocopyConfigs: "++id, sid, storeId, name, active",
      jobTypes: "++id, sid, storeId, name, category, active",
      customers: "++id, sid, storeId, name, dni, phone, whatsapp, email, createdAt",
      suppliers: "++id, sid, storeId, company, phone, whatsapp, email, createdAt",
      sales: "++id, sid, storeId, number, date, status, userId, customerId, createdAt",
      saleItems: "++id, sid, storeId, saleId, productId, serviceId, jobId, type",
      payments: "++id, sid, storeId, saleId, jobId, method, createdAt",
      jobs: "++id, sid, storeId, number, customerId, userId, status, createdAt, estimatedDelivery",
      jobItems: "++id, sid, storeId, jobId, productId, serviceId, materialId, type",
      jobFiles: "++id, sid, storeId, jobId, uploadedAt",
      quotes: "++id, sid, storeId, number, date, status, customerId, userId, createdAt",
      quoteItems: "++id, sid, storeId, quoteId, productId, serviceId, jobTypeId, type",
      inventoryMovements: "++id, sid, storeId, productId, date, type, userId",
      cashRegisters: "++id, sid, storeId, status, openedAt, userId",
      cashMovements: "++id, sid, storeId, cashRegisterId, date, type, userId",
      devices: "id, sid, storeId, userId, status, lastSeenAt",
      auditLogs: "++id, sid, storeId, date, userId, action, entity, entityId",
      syncQueue: "++id, storeId, synced, date",
      syncMappings: "++id, storeId, device, table, lid, [storeId+device+table+lid]",
      settings: "key, sid, storeId",
      theme: "key, sid, storeId",
      syncOutbox: "key",
      // Nuevas tablas para ONIX LASER GESTIÓN
      laserMaterials: "++id, sid, storeId, name, type, active, updatedAt",
      laserJobs: "++id, sid, storeId, number, customerId, userId, status, createdAt, estimatedDelivery",
      laserJobItems: "++id, sid, storeId, jobId, productId, serviceId, materialId, type",
      partners: "++id, sid, storeId, name, role, participationPercentage, active, createdAt",
      distributionRecords: "++id, sid, storeId, period, partnerId, partnerName, amount, date, confirmed",
      moneyDistributionConfigs: "key, sid, storeId",
      purchases: "++id, sid, storeId, number, supplierId, date, status, userId",
      purchaseItems: "++id, sid, storeId, purchaseId, productId, materialId, name, qty, unit, unitPrice, total, discount, subtotal",
      expenseCategories: "++id, sid, storeId, name, type, active, createdAt",
      expenses: "++id, sid, storeId, categoryId, date, amount, userId, paid, createdAt",
      inventoryReservations: "++id, sid, storeId, productId, qty, reservedAt, releasedAt, userId",
    });
  }
}
}

export const db = new OnixDB();

let localIdCtr = 0;
export function genLocalId(): number {
  localIdCtr = (localIdCtr + 1) % 1000;
  return Date.now() * 1000 + localIdCtr;
}

export function withLocalId<T extends object>(obj: T): T & { id: number } {
  const o = obj as Record<string, unknown>;
  const id = o.id;
  const valid = typeof id === "number" && Number.isFinite(id);
  return { ...o, id: valid ? (id as number) : genLocalId() } as T & { id: number };
}

export async function isDatabaseReady(): Promise<boolean> {
  try {
    await db.open();
    return true;
  } catch {
    return false;
  }
}

export async function getStoreId(): Promise<string> {
  const settings = await db.settings.get("main");
  return settings?.storeId || "default";
}

export async function setStoreId(storeId: string): Promise<void> {
  const existing = await db.settings.get("main");
  if (existing) {
    await db.settings.update("main", { storeId });
  } else {
    await db.settings.add({ key: "main", storeId } as any);
  }
}

/* Validación: Verifica que un material no esté ya consumido o resrvado
   antes de registrar un nuevo movimiento de inventario. Retorna true si es
   seguro descontar la cantidad solicitada. */
export async function canDeductMaterial(storeId: string, productId: number, qty: number): Promise<boolean> {
  const inventoryMovements = await db.inventoryMovements
    .where("storeId")
    .equals(storeId)
    .and(productId: productId)
    .filter((m) => m.type === "consumo_trabajo" || m.type === "merma")
    .toArray();

  const reservations = await db.inventoryReservations
    .where("storeId")
    .equals(storeId)
    .and(productId: productId)
    .filter((r) => r.releasedAt == null)
    .toArray();

  // Sumar cantidades consumidas y resrvadas activas
  let consumed = 0;
  consumed += inventoryMovements.reduce((sum, m) => sum + (m.after - m.before), 0);
  consumed += reservations.reduce((sum, r) => sum + r.qty, 0);

  // Obstock actual (último movimiento de entrada)
  let currentStock = 0;
  const entradas = await db.inventoryMovements
    .where("storeId")
    .equals(storeId)
    .and(productId: productId)
    .filter((m) => m.type === "entrada" || m.type === "compra")
    .order("date")
    .last();

  if (entradas) {
    currentStock = entradas.after;
  }

  const available = currentStock - consumed;
  return available >= qty;
}

/* Registra un movimiento de inventario con validación automática.
   Lanza error si no hay suficiente stock disponible. */
export async function safeInventoryMovement(
  movement: Partial<InventoryMovement>,
  requestedQty: number
): Promise<number> {
  const canDeduct = await canDeductMaterial(movement.storeId, movement.productId, requestedQty);
  if (!canDeduct) {
    throw new Error(`Stock insuficiente para producto ${movement.productId}. Solicitado: ${requestedQty}, Disponible: ${await getAvailableStock(movement.storeId, movement.productId)}`);
  }

  // Registrar movimiento
  const id = await db.inventoryMovements.add({
    ...movement,
    date: Date.now(),
    createdAt: Date.now(),
  });

  // Actualizar stock calculado
  await db.inventoryMovements.update(id, { after: /* calcular nuevo after */ });

  return id;
}

/* Obtiene stock disponible actual para un producto */
export async function getAvailableStock(storeId: string, productId: number): Promise<number> {
  const movimientos = await db.inventoryMovements
    .where("storeId")
    .equals(storeId)
    .and(productId: productId)
    .filter((m) => m.type !== "consumo_trabajo" && m.type !== "merma")
    .sortBy("date");

  let stock = 0;
  for (const m of movimientos) {
    if (m.type === "entrada" || m.type === "compra" || m.type === "merma" === "salida") {
      stock += m.after - m.before; // This needs proper logic
    }
  }
  return stock;
}