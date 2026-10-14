import Dexie, { type Table } from "dexie";
import type {
  User,
  Customer,
  Supplier,
  Material,
  Job,
  Quote,
  QuoteItem,
  CashMovement,
  Purchase,
  PurchaseItem,
  Partner,
  Distribution,
  Expense,
  AppSettings,
  AuditLog,
} from "./types";

class OnixLaserDB extends Dexie {
  users!: Table<User, number>;
  customers!: Table<Customer, number>;
  suppliers!: Table<Supplier, number>;
  materials!: Table<Material, number>;
  jobs!: Table<Job, number>;
  quotes!: Table<Quote, number>;
  quoteItems!: Table<QuoteItem, number>;
  cashMovements!: Table<CashMovement, number>;
  purchases!: Table<Purchase, number>;
  purchaseItems!: Table<PurchaseItem, number>;
  partners!: Table<Partner, number>;
  distributions!: Table<Distribution, number>;
  expenses!: Table<Expense, number>;
  settings!: Table<AppSettings, number>;
  auditLogs!: Table<AuditLog, number>;

  constructor() {
    super("onix-laser-gestion");
    this.version(1).stores({
      users: "++id, username, email, role, active",
      customers: "++id, name, phone, email, createdAt",
      suppliers: "++id, name, phone, email, createdAt",
      materials: "++id, name, type, active, updatedAt",
      jobs: "++id, number, customerId, status, createdAt, estimatedDelivery",
      quotes: "++id, number, customerId, status, createdAt",
      quoteItems: "++id, quoteId",
      cashMovements: "++id, type, date, createdAt",
      purchases: "++id, supplierId, status, date, createdAt",
      purchaseItems: "++id, purchaseId",
      partners: "++id, name, active, createdAt",
      distributions: "++id, period, partnerId, date",
      expenses: "++id, category, date, paid, createdAt",
      settings: "++id, updatedAt",
      auditLogs: "++id, action, entity, entityId, timestamp",
    });
  }
}

export const db = new OnixLaserDB();

export async function isDatabaseReady(): Promise<boolean> {
  try {
    await db.open();
    return true;
  } catch {
    return false;
  }
}

export async function getSettings(): Promise<AppSettings | undefined> {
  return db.settings.toCollection().first();
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<void> {
  const existing = await getSettings();
  if (existing && existing.id) {
    await db.settings.update(existing.id, { ...patch, updatedAt: Date.now() });
  } else {
    await db.settings.add({ ...patch, updatedAt: Date.now() } as AppSettings);
  }
}

export async function addAuditLog(
  action: string,
  entity: string,
  entityId: number | undefined,
  details: string,
  userId?: number,
  userName?: string
): Promise<void> {
  await db.auditLogs.add({
    action,
    entity,
    entityId,
    details,
    userId,
    userName,
    timestamp: Date.now(),
  });
}

export function formatCurrency(amount: number, currency = "ARS"): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
