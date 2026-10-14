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
  CashRegister,
  Purchase,
  PurchaseItem,
  Partner,
  Distribution,
  Expense,
  AppSettings,
  AuditLog,
  Liquidacion,
  ReinvestmentFund,
  PartnerTransaction,
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
  cashRegisters!: Table<CashRegister, number>;
  purchases!: Table<Purchase, number>;
  purchaseItems!: Table<PurchaseItem, number>;
  partners!: Table<Partner, number>;
  distributions!: Table<Distribution, number>;
  expenses!: Table<Expense, number>;
  settings!: Table<AppSettings, number>;
  auditLogs!: Table<AuditLog, number>;
  liquidaciones!: Table<Liquidacion, number>;
  reinvestmentFunds!: Table<ReinvestmentFund, number>;
  partnerTransactions!: Table<PartnerTransaction, number>;

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
      cashRegisters: "++id, status, openedAt",
      purchases: "++id, supplierId, status, date, createdAt",
      purchaseItems: "++id, purchaseId",
      partners: "++id, name, active, createdAt",
      distributions: "++id, period, partnerId, date",
      expenses: "++id, category, date, paid, createdAt",
      settings: "++id, updatedAt",
      auditLogs: "++id, action, entity, entityId, timestamp",
      liquidaciones: "++id, period, status, createdAt",
      reinvestmentFunds: "++id",
      partnerTransactions: "++id, partnerId, type, date",
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

const MATERIALES_SEED = [
  { name: "Acrílico 2mm", type: "Acrílico", thickness: 2, unit: "hoja", costPrice: 1500, stock: 0, minStock: 5 },
  { name: "Acrílico 3mm", type: "Acrílico", thickness: 3, unit: "hoja", costPrice: 2200, stock: 0, minStock: 5 },
  { name: "Acrílico 5mm", type: "Acrílico", thickness: 5, unit: "hoja", costPrice: 3500, stock: 0, minStock: 3 },
  { name: "Acrílico 8mm", type: "Acrílico", thickness: 8, unit: "hoja", costPrice: 5000, stock: 0, minStock: 2 },
  { name: "Acrílico 10mm", type: "Acrílico", thickness: 10, unit: "hoja", costPrice: 6500, stock: 0, minStock: 2 },
  { name: "Acrílico transparente 3mm", type: "Acrílico", thickness: 3, unit: "hoja", costPrice: 2800, stock: 0, minStock: 3 },
  { name: "Acrílico espejo 3mm", type: "Acrílico", thickness: 3, unit: "hoja", costPrice: 4000, stock: 0, minStock: 2 },
  { name: "MDF 3mm", type: "MDF", thickness: 3, unit: "hoja", costPrice: 800, stock: 0, minStock: 10 },
  { name: "MDF 6mm", type: "MDF", thickness: 6, unit: "hoja", costPrice: 1200, stock: 0, minStock: 5 },
  { name: "MDF 9mm", type: "MDF", thickness: 9, unit: "hoja", costPrice: 1800, stock: 0, minStock: 3 },
  { name: "MDF 12mm", type: "MDF", thickness: 12, unit: "hoja", costPrice: 2400, stock: 0, minStock: 2 },
  { name: "MDF 18mm", type: "MDF", thickness: 18, unit: "hoja", costPrice: 3200, stock: 0, minStock: 2 },
  { name: "Fenólico 3mm", type: "Fenólico", thickness: 3, unit: "hoja", costPrice: 1000, stock: 0, minStock: 5 },
  { name: "Fenólico 6mm", type: "Fenólico", thickness: 6, unit: "hoja", costPrice: 1600, stock: 0, minStock: 3 },
  { name: "Pino 3mm", type: "Madera", thickness: 3, unit: "hoja", costPrice: 900, stock: 0, minStock: 5 },
  { name: "Pino 6mm", type: "Madera", thickness: 6, unit: "hoja", costPrice: 1400, stock: 0, minStock: 3 },
  { name: "Pino 9mm", type: "Madera", thickness: 9, unit: "hoja", costPrice: 2000, stock: 0, minStock: 2 },
  { name: "Pino 12mm", type: "Madera", thickness: 12, unit: "hoja", costPrice: 2800, stock: 0, minStock: 2 },
  { name: "Pino 18mm", type: "Madera", thickness: 18, unit: "hoja", costPrice: 3800, stock: 0, minStock: 1 },
  { name: "Oregon 18mm", type: "Madera", thickness: 18, unit: "hoja", costPrice: 3500, stock: 0, minStock: 1 },
  { name: "Algarrobo 18mm", type: "Madera", thickness: 18, unit: "hoja", costPrice: 4500, stock: 0, minStock: 1 },
  { name: "Cedro 18mm", type: "Madera", thickness: 18, unit: "hoja", costPrice: 4000, stock: 0, minStock: 1 },
  { name: "Paraiso 18mm", type: "Madera", thickness: 18, unit: "hoja", costPrice: 3800, stock: 0, minStock: 1 },
  { name: "Macho 18mm", type: "Madera", thickness: 18, unit: "hoja", costPrice: 4200, stock: 0, minStock: 1 },
  { name: "Fresno 18mm", type: "Madera", thickness: 18, unit: "hoja", costPrice: 4800, stock: 0, minStock: 1 },
  { name: "Petiribí 18mm", type: "Madera", thickness: 18, unit: "hoja", costPrice: 5000, stock: 0, minStock: 1 },
  { name: "Ratán sintético", type: "Sintético", thickness: 2, unit: "rollo", costPrice: 3000, stock: 0, minStock: 2 },
  { name: "Vidrio 3mm", type: "Vidrio", thickness: 3, unit: "hoja", costPrice: 2500, stock: 0, minStock: 2 },
  { name: "Vidrio 5mm", type: "Vidrio", thickness: 5, unit: "hoja", costPrice: 3200, stock: 0, minStock: 2 },
  { name: "Vidrio espejo 3mm", type: "Vidrio", thickness: 3, unit: "hoja", costPrice: 3500, stock: 0, minStock: 2 },
  { name: "Mármol 5mm", type: "Mármol", thickness: 5, unit: "hoja", costPrice: 8000, stock: 0, minStock: 1 },
  { name: "Mármol 10mm", type: "Mármol", thickness: 10, unit: "hoja", costPrice: 12000, stock: 0, minStock: 1 },
  { name: "Granito 10mm", type: "Granito", thickness: 10, unit: "hoja", costPrice: 15000, stock: 0, minStock: 1 },
  { name: "Travertino 10mm", type: "Piedra", thickness: 10, unit: "hoja", costPrice: 10000, stock: 0, minStock: 1 },
  { name: "Calcáreo 10mm", type: "Piedra", thickness: 10, unit: "hoja", costPrice: 9000, stock: 0, minStock: 1 },
  { name: "Pizarra 5mm", type: "Piedra", thickness: 5, unit: "hoja", costPrice: 6000, stock: 0, minStock: 1 },
  { name: "Cerámica 8mm", type: "Cerámica", thickness: 8, unit: "unidad", costPrice: 1500, stock: 0, minStock: 3 },
  { name: "Porcelanato 10mm", type: "Cerámica", thickness: 10, unit: "unidad", costPrice: 2000, stock: 0, minStock: 2 },
  { name: "Gres 8mm", type: "Cerámica", thickness: 8, unit: "unidad", costPrice: 1800, stock: 0, minStock: 2 },
  { name: "Melamina 16mm", type: "Melamina", thickness: 16, unit: "hoja", costPrice: 2200, stock: 0, minStock: 2 },
  { name: "Melamina 18mm", type: "Melamina", thickness: 18, unit: "hoja", costPrice: 2500, stock: 0, minStock: 2 },
  { name: "Placa (HDF) 3mm", type: "HDF", thickness: 3, unit: "hoja", costPrice: 700, stock: 0, minStock: 5 },
  { name: "Contraenchapado 3mm", type: "Contraenchapado", thickness: 3, unit: "hoja", costPrice: 900, stock: 0, minStock: 5 },
  { name: "Contraenchapado 6mm", type: "Contraenchapado", thickness: 6, unit: "hoja", costPrice: 1300, stock: 0, minStock: 3 },
  { name: "Contraenchapado 9mm", type: "Contraenchapado", thickness: 9, unit: "hoja", costPrice: 1700, stock: 0, minStock: 2 },
  { name: "Cuero vacuno", type: "Cuero", thickness: 2, unit: "unidad", costPrice: 2000, stock: 0, minStock: 2 },
  { name: "Cuero ecológico", type: "Cuero sintético", thickness: 1, unit: "unidad", costPrice: 800, stock: 0, minStock: 3 },
  { name: "Sintético (similar cuero)", type: "Cuero sintético", thickness: 1, unit: "unidad", costPrice: 600, stock: 0, minStock: 3 },
  { name: "Poliuretano (TPU)", type: "Sintético", thickness: 1, unit: "unidad", costPrice: 500, stock: 0, minStock: 3 },
  { name: "Papel tapiz vinílico", type: "Vinílico", thickness: 1, unit: "rollo", costPrice: 1200, stock: 0, minStock: 2 },
  { name: "Vinilo textil", type: "Vinílico", thickness: 0.5, unit: "rollo", costPrice: 800, stock: 0, minStock: 2 },
  { name: "Lona", type: "Textil", thickness: 0.5, unit: "rollo", costPrice: 600, stock: 0, minStock: 2 },
  { name: "Fibra de carbono", type: "Compuesto", thickness: 1, unit: "hoja", costPrice: 15000, stock: 0, minStock: 1 },
  { name: "Fibra de vidrio", type: "Compuesto", thickness: 2, unit: "hoja", costPrice: 5000, stock: 0, minStock: 1 },
  { name: "Alio (acero inoxidable)", type: "Metal", thickness: 1, unit: "hoja", costPrice: 8000, stock: 0, minStock: 1 },
  { name: "Alio (acero común)", type: "Metal", thickness: 1, unit: "hoja", costPrice: 4000, stock: 0, minStock: 1 },
  { name: "Aluminio 1mm", type: "Metal", thickness: 1, unit: "hoja", costPrice: 3000, stock: 0, minStock: 1 },
  { name: "Aluminio 2mm", type: "Metal", thickness: 2, unit: "hoja", costPrice: 4000, stock: 0, minStock: 1 },
  { name: "Aluminio anodizado 1mm", type: "Metal", thickness: 1, unit: "hoja", costPrice: 3500, stock: 0, minStock: 1 },
  { name: "Aluminio anodizado 2mm", type: "Metal", thickness: 2, unit: "hoja", costPrice: 4500, stock: 0, minStock: 1 },
  { name: "Cobre 1mm", type: "Metal", thickness: 1, unit: "hoja", costPrice: 6000, stock: 0, minStock: 1 },
  { name: "Latón 1mm", type: "Metal", thickness: 1, unit: "hoja", costPrice: 5500, stock: 0, minStock: 1 },
  { name: "Zinc 1mm", type: "Metal", thickness: 1, unit: "hoja", costPrice: 5000, stock: 0, minStock: 1 },
  { name: "Policarbonato alveolar 6mm", type: "Policarbonato", thickness: 6, unit: "hoja", costPrice: 4000, stock: 0, minStock: 2 },
  { name: "Policarbonato alveolar 10mm", type: "Policarbonato", thickness: 10, unit: "hoja", costPrice: 5500, stock: 0, minStock: 1 },
  { name: "Policarbonato compacto 2mm", type: "Policarbonato", thickness: 2, unit: "hoja", costPrice: 3500, stock: 0, minStock: 2 },
  { name: "Policarbonato compacto 5mm", type: "Policarbonato", thickness: 5, unit: "hoja", costPrice: 6000, stock: 0, minStock: 1 },
  { name: "Plexiglás 3mm", type: "Policarbonato", thickness: 3, unit: "hoja", costPrice: 3000, stock: 0, minStock: 2 },
  { name: "Plexiglás 5mm", type: "Policarbonato", thickness: 5, unit: "hoja", costPrice: 4500, stock: 0, minStock: 1 },
  { name: "Coroplast 4mm", type: "Plástico", thickness: 4, unit: "hoja", costPrice: 800, stock: 0, minStock: 3 },
  { name: "PVC expandido 3mm", type: "PVC", thickness: 3, unit: "hoja", costPrice: 1000, stock: 0, minStock: 3 },
  { name: "PVC expandido 5mm", type: "PVC", thickness: 5, unit: "hoja", costPrice: 1400, stock: 0, minStock: 2 },
  { name: "PVC espumado 10mm", type: "PVC", thickness: 10, unit: "hoja", costPrice: 2000, stock: 0, minStock: 2 },
  { name: "Goma EVA 2mm", type: "Goma", thickness: 2, unit: "unidad", costPrice: 300, stock: 0, minStock: 5 },
  { name: "Goma EVA 5mm", type: "Goma", thickness: 5, unit: "unidad", costPrice: 600, stock: 0, minStock: 3 },
  { name: "Goma eva brillo 2mm", type: "Goma", thickness: 2, unit: "unidad", costPrice: 400, stock: 0, minStock: 3 },
  { name: "Fieltro 3mm", type: "Textil", thickness: 3, unit: "unidad", costPrice: 200, stock: 0, minStock: 5 },
  { name: "Fieltro 5mm", type: "Textil", thickness: 5, unit: "unidad", costPrice: 300, stock: 0, minStock: 3 },
  { name: "Cartón grueso 3mm", type: "Cartón", thickness: 3, unit: "unidad", costPrice: 150, stock: 0, minStock: 5 },
  { name: "Cartulina 1mm", type: "Cartón", thickness: 1, unit: "unidad", costPrice: 50, stock: 0, minStock: 10 },
  { name: "Afiche 0.2mm", type: "Papel", thickness: 0.2, unit: "unidad", costPrice: 80, stock: 0, minStock: 10 },
  { name: "Autoadhesivo 0.1mm", type: "Vinílico", thickness: 0.1, unit: "rollo", costPrice: 500, stock: 0, minStock: 3 },
  { name: "Papel fotográfico", type: "Papel", thickness: 0.2, unit: "unidad", costPrice: 100, stock: 0, minStock: 5 },
  { name: "Transfer 0.1mm", type: "Vinílico", thickness: 0.1, unit: "rollo", costPrice: 700, stock: 0, minStock: 2 },
  { name: "Chapa de acero inoxidable 0.5mm", type: "Metal", thickness: 0.5, unit: "hoja", costPrice: 10000, stock: 0, minStock: 1 },
  { name: "Chapa galvanizada 1mm", type: "Metal", thickness: 1, unit: "hoja", costPrice: 3000, stock: 0, minStock: 1 },
  { name: "Espejo acrilico 1mm", type: "Acrílico", thickness: 1, unit: "hoja", costPrice: 2000, stock: 0, minStock: 2 },
  { name: "Fibra de bambú 3mm", type: "Madera", thickness: 3, unit: "hoja", costPrice: 1200, stock: 0, minStock: 2 },
  { name: "Fibra de coco 3mm", type: "Natural", thickness: 3, unit: "hoja", costPrice: 1500, stock: 0, minStock: 1 },
  { name: "Bambú laminado 3mm", type: "Madera", thickness: 3, unit: "hoja", costPrice: 1800, stock: 0, minStock: 2 },
  { name: "Bambú laminado 6mm", type: "Madera", thickness: 6, unit: "hoja", costPrice: 2500, stock: 0, minStock: 1 },
  { name: "Corcho 1mm", type: "Natural", thickness: 1, unit: "unidad", costPrice: 200, stock: 0, minStock: 3 },
  { name: "Corcho 3mm", type: "Natural", thickness: 3, unit: "unidad", costPrice: 400, stock: 0, minStock: 2 },
  { name: "Cartón pluma 5mm", type: "Cartón", thickness: 5, unit: "unidad", costPrice: 250, stock: 0, minStock: 3 },
  { name: "Goma espuma 10mm", type: "Goma", thickness: 10, unit: "unidad", costPrice: 500, stock: 0, minStock: 2 },
  { name: "Goma espuma 20mm", type: "Goma", thickness: 20, unit: "unidad", costPrice: 800, stock: 0, minStock: 1 },
  { name: "Tergopor 5mm", type: "Plástico", thickness: 5, unit: "unidad", costPrice: 100, stock: 0, minStock: 3 },
  { name: "Tergopor 10mm", type: "Plástico", thickness: 10, unit: "unidad", costPrice: 180, stock: 0, minStock: 2 },
  { name: "Tergopor 20mm", type: "Plástico", thickness: 20, unit: "unidad", costPrice: 300, stock: 0, minStock: 2 },
  { name: "Poliuretano expandido 10mm", type: "Plástico", thickness: 10, unit: "unidad", costPrice: 350, stock: 0, minStock: 2 },
  { name: "Poliuretano expandido 20mm", type: "Plástico", thickness: 20, unit: "unidad", costPrice: 500, stock: 0, minStock: 1 },
  { name: "Cuero de grabado 2mm", type: "Cuero", thickness: 2, unit: "unidad", costPrice: 2500, stock: 0, minStock: 2 },
  { name: "Cuero de grabado 3mm", type: "Cuero", thickness: 3, unit: "unidad", costPrice: 3000, stock: 0, minStock: 1 },
  { name: "Cuero de grabado 4mm", type: "Cuero", thickness: 4, unit: "unidad", costPrice: 3500, stock: 0, minStock: 1 },
  { name: "Cuero de grabado 5mm", type: "Cuero", thickness: 5, unit: "unidad", costPrice: 4000, stock: 0, minStock: 1 },
  { name: "Cuero de grabado 6mm", type: "Cuero", thickness: 6, unit: "unidad", costPrice: 4500, stock: 0, minStock: 1 },
  { name: "Cuero de grabado 8mm", type: "Cuero", thickness: 8, unit: "unidad", costPrice: 5500, stock: 0, minStock: 1 },
  { name: "Cuero de grabado 10mm", type: "Cuero", thickness: 10, unit: "unidad", costPrice: 6500, stock: 0, minStock: 1 },
  { name: "Piel de grabado 2mm", type: "Cuero", thickness: 2, unit: "unidad", costPrice: 3000, stock: 0, minStock: 1 },
  { name: "Piel de grabado 3mm", type: "Cuero", thickness: 3, unit: "unidad", costPrice: 3500, stock: 0, minStock: 1 },
  { name: "Piel de grabado 4mm", type: "Cuero", thickness: 4, unit: "unidad", costPrice: 4000, stock: 0, minStock: 1 },
  { name: "Piel de grabado 5mm", type: "Cuero", thickness: 5, unit: "unidad", costPrice: 4500, stock: 0, minStock: 1 },
  { name: "Piel de grabado 6mm", type: "Cuero", thickness: 6, unit: "unidad", costPrice: 5000, stock: 0, minStock: 1 },
  { name: "Piel de grabado 8mm", type: "Cuero", thickness: 8, unit: "unidad", costPrice: 6000, stock: 0, minStock: 1 },
  { name: "Piel de grabado 10mm", type: "Cuero", thickness: 10, unit: "unidad", costPrice: 7000, stock: 0, minStock: 1 },
  { name: "Madera de grabado 3mm", type: "Madera", thickness: 3, unit: "hoja", costPrice: 1000, stock: 0, minStock: 3 },
  { name: "Madera de grabado 5mm", type: "Madera", thickness: 5, unit: "hoja", costPrice: 1500, stock: 0, minStock: 2 },
  { name: "Madera de grabado 6mm", type: "Madera", thickness: 6, unit: "hoja", costPrice: 1800, stock: 0, minStock: 2 },
  { name: "Madera de grabado 8mm", type: "Madera", thickness: 8, unit: "hoja", costPrice: 2200, stock: 0, minStock: 1 },
  { name: "Madera de grabado 10mm", type: "Madera", thickness: 10, unit: "hoja", costPrice: 2600, stock: 0, minStock: 1 },
  { name: "Madera de grabado 12mm", type: "Madera", thickness: 12, unit: "hoja", costPrice: 3000, stock: 0, minStock: 1 },
  { name: "Madera de grabado 15mm", type: "Madera", thickness: 15, unit: "hoja", costPrice: 3500, stock: 0, minStock: 1 },
  { name: "Madera de grabado 18mm", type: "Madera", thickness: 18, unit: "hoja", costPrice: 4000, stock: 0, minStock: 1 },
  { name: "Madera de grabado 20mm", type: "Madera", thickness: 20, unit: "hoja", costPrice: 4500, stock: 0, minStock: 1 },
  { name: "Madera de grabado 25mm", type: "Madera", thickness: 25, unit: "hoja", costPrice: 5000, stock: 0, minStock: 1 },
  { name: "Madera de grabado 30mm", type: "Madera", thickness: 30, unit: "hoja", costPrice: 6000, stock: 0, minStock: 1 },
  { name: "Madera de grabado 35mm", type: "Madera", thickness: 35, unit: "hoja", costPrice: 7000, stock: 0, minStock: 1 },
  { name: "Madera de grabado 40mm", type: "Madera", thickness: 40, unit: "hoja", costPrice: 8000, stock: 0, minStock: 1 },
  { name: "Madera de grabado 45mm", type: "Madera", thickness: 45, unit: "hoja", costPrice: 9000, stock: 0, minStock: 1 },
  { name: "Madera de grabado 50mm", type: "Madera", thickness: 50, unit: "hoja", costPrice: 10000, stock: 0, minStock: 1 },
  { name: "Madera de grabado 60mm", type: "Madera", thickness: 60, unit: "hoja", costPrice: 12000, stock: 0, minStock: 1 },
  { name: "Madera de grabado 70mm", type: "Madera", thickness: 70, unit: "hoja", costPrice: 14000, stock: 0, minStock: 1 },
  { name: "Madera de grabado 80mm", type: "Madera", thickness: 80, unit: "hoja", costPrice: 16000, stock: 0, minStock: 1 },
  { name: "Madera de grabado 90mm", type: "Madera", thickness: 90, unit: "hoja", costPrice: 18000, stock: 0, minStock: 1 },
  { name: "Madera de grabado 100mm", type: "Madera", thickness: 100, unit: "hoja", costPrice: 20000, stock: 0, minStock: 1 },
];

export async function seedMateriales(): Promise<void> {
  const count = await db.materials.count();
  if (count > 0) return;

  const now = Date.now();
  const materiales = MATERIALES_SEED.map((m) => ({
    ...m,
    active: true,
    createdAt: now,
    updatedAt: now,
  }));

  await db.materials.bulkAdd(materiales);
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

export { CASH_MOVEMENT_LABELS } from "./types";
