import { db } from "./db";
import type { AppSettings, PaymentMethod, MoneyDistributionConfig } from "./types";

/* Métodos de pago por defecto */
const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: "efectivo", name: "Efectivo", color: "#16a34a", requiresReference: false, active: true },
  { id: "debito", name: "Débito", color: "#0ea5e9", requiresReference: false, active: true },
  { id: "credito", name: "Crédito", color: "#8b5cf6", requiresReference: false, active: true },
  { id: "transferencia", name: "Transferencia", color: "#0f766e", requiresReference: true, active: true },
  { id: "otro", name: "Otro", color: "#64748b", requiresReference: false, active: true },
];

/* Configuración por defecto del fondo de reinversión */
const DEFAULT_REINVERSION_CONFIG: MoneyDistributionConfig = {
  storeId: "default",
  reinvestmentPercentage: 30,
  defaultFrequency: "mensual",
  minDistributionAmount: 1000,
  maxDiscountPerPartner: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

/* Configuraciones por defecto de la tienda */
export const DEFAULT_SETTINGS: AppSettings = {
  storeId: "default",
  storeName: "ONIX",
  paymentMethods: DEFAULT_PAYMENT_METHODS,
  ticketWidth: 80,
  ticketFooter: "¡Gracias por su compra!",
  maxDiscount: { admin: 100, vendedor: 10, cajero: 5, produccion: 0, consulta: 0 },
  shortcuts: {},
  defaultIva: 21,
  requireCashOpen: false,
  posLineFields: ["unitPrice", "code", "stock", "discount"],
  posShowCatsBelow: true,
  syncEnabled: false,
  syncUrl: "http://127.0.0.1:4188",
  syncMode: "nube",
  syncToken: "",
  moneyDistributionConfig: DEFAULT_REINVERSION_CONFIG,
};

/* Crea la fila de ajustes + tema si no existen. Idempotente: se puede llamar
   en cada arranque. Nunca pisa configuración existente del comercio. */
export async function ensureSeed(): Promise<void> {
  const existing = await db.settings.get("main");
  if (!existing) {
    await db.settings.add({
      key: "main",
      ...DEFAULT_SETTINGS,
    });
  } else {
    const patch: Partial<AppSettings> = {};
    for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof AppSettings)[]) {
      if ((existing as AppSettings)[k] === undefined) (patch as any)[k] = DEFAULT_SETTINGS[k];
    }
    if (Object.keys(patch).length) await db.settings.update("main", patch);
  }
}

/* Guarda configuraciones de la tienda */
export async function saveSettings(patch: Partial<AppSettings>): Promise<void> {
  const cur = await db.settings.get("main");
  if (!cur) {
    await ensureSeed();
  }
  await db.settings.update("main", patch);
}

/* Obtiene configuraciones de la tienda */
export async function getSettings(): Promise<AppSettings | undefined> {
  return db.settings.get("main");
}