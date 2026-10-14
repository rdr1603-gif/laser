"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { db, formatCurrency, getSettings, saveSettings } from "@/lib/db";
import type { AppSettings, Material } from "@/lib/types";
import { useToast } from "@/stores/auth";

const DEFAULT_SETTINGS: Partial<AppSettings> = {
  machineRatePerMinute: 100,
  engravingRatePerMinute: 120,
  cuttingRatePerMinute: 80,
  prepTimeMinutes: 15,
  electricityCostPerHour: 500,
  maintenanceCostPerHour: 300,
  wearReservePercentage: 5,
  laborPercentage: 30,
  packagingCost: 200,
  transportCost: 0,
  otherDirectCosts: 0,
  priceMarkupPercentage: 50,
  targetMarginPercentage: 40,
  minimumJobPrice: 1000,
  roundingRule: "nearest_100",
  includeMaintenanceInRate: true,
  includeElectricityInRate: true,
  includeWearInRate: true,
  manualRateEnabled: false,
  pendingEstimates: [],
};

interface PresupuestoForm {
  workType: "grabado" | "corte" | "ambos";
  materialId: string;
  quantity: number;
  machineTimeMinutes: number;
  prepTimeMinutes: number;
  materialCostPerUnit: number;
  wastePercentage: number;
  packagingCost: number;
  transportCost: number;
  otherDirectCosts: number;
  markupPercentage: number;
  targetMarginPercentage: number;
  manualPrice: string;
}

export default function PresupuestadorPage() {
  const [settings, setSettings] = useState<AppSettings | undefined>();
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [form, setForm] = useState<PresupuestoForm>({
    workType: "grabado",
    materialId: "",
    quantity: 1,
    machineTimeMinutes: 30,
    prepTimeMinutes: 15,
    materialCostPerUnit: 0,
    wastePercentage: 10,
    packagingCost: 200,
    transportCost: 0,
    otherDirectCosts: 0,
    markupPercentage: 50,
    targetMarginPercentage: 40,
    manualPrice: "",
  });
  const [settingsForm, setSettingsForm] = useState<Partial<AppSettings>>({});
  const [result, setResult] = useState<{
    machineCost: number;
    materialCost: number;
    directCost: number;
    laborCost: number;
    estimatedCost: number;
    suggestedPrice: number;
    finalPrice: number;
    margin: number;
    warning: string;
  } | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [s, mats] = await Promise.all([getSettings(), db.materials.toArray()]);
    setSettings(s);
    setMateriales(mats);
    if (s) {
      setSettingsForm(s);
      setForm((f) => ({
        ...f,
        prepTimeMinutes: s.prepTimeMinutes,
        packagingCost: s.packagingCost,
        transportCost: s.transportCost,
        otherDirectCosts: s.otherDirectCosts,
        markupPercentage: s.priceMarkupPercentage,
        targetMarginPercentage: s.targetMarginPercentage,
      }));
    }
  }

  function calculateRate(): number {
    if (!settings) return 100;
    if (settings.manualRateEnabled) return settings.machineRatePerMinute;

    let rate = settings.machineRatePerMinute;

    if (!settings.includeMaintenanceInRate && settings.maintenanceCostPerHour > 0) {
      rate += settings.maintenanceCostPerHour / 60;
    }
    if (!settings.includeElectricityInRate && settings.electricityCostPerHour > 0) {
      rate += settings.electricityCostPerHour / 60;
    }
    if (settings.includeWearInRate && settings.wearReservePercentage > 0) {
      rate *= 1 + settings.wearReservePercentage / 100;
    }

    return rate;
  }

  function roundPrice(price: number, rule: string): number {
    switch (rule) {
      case "nearest_10": return Math.ceil(price / 10) * 10;
      case "nearest_50": return Math.ceil(price / 50) * 50;
      case "nearest_100": return Math.ceil(price / 100) * 100;
      default: return price;
    }
  }

  function calculate() {
    if (!settings) return;

    const rate = calculateRate();
    const machineCost = form.machineTimeMinutes * rate;
    const prepCost = (form.prepTimeMinutes / 60) * (settings.laborRatePerHour || 2000);
    const materialCost =
      form.materialCostPerUnit * form.quantity * (1 + form.wastePercentage / 100);

    const directCost =
      machineCost + materialCost + prepCost + form.packagingCost + form.transportCost + form.otherDirectCosts;

    const laborCost = (directCost * (settings.laborPercentage || 30)) / 100;
    const estimatedCost = directCost + laborCost;

    const suggestedPrice = estimatedCost * (1 + form.markupPercentage / 100);

    let finalPrice: number;
    if (form.manualPrice && parseFloat(form.manualPrice) > 0) {
      finalPrice = parseFloat(form.manualPrice);
    } else {
      finalPrice = roundPrice(suggestedPrice, settings.roundingRule);
    }

    if (finalPrice < (settings.minimumJobPrice || 1000)) {
      finalPrice = settings.minimumJobPrice || 1000;
    }

    const margin = ((finalPrice - estimatedCost) / finalPrice) * 100;

    const warnings: string[] = [];
    if (finalPrice < estimatedCost) {
      warnings.push("El precio final no cubre los costos estimados");
    }
    if (margin < form.targetMarginPercentage) {
      warnings.push(`El margen (${margin.toFixed(1)}%) está por debajo del objetivo (${form.targetMarginPercentage}%)`);
    }

    setResult({
      machineCost,
      materialCost,
      directCost,
      laborCost,
      estimatedCost,
      suggestedPrice,
      finalPrice,
      margin,
      warning: warnings.join(". "),
    });
  }

  async function handleSaveSettings() {
    await saveSettings(settingsForm);
    addToast("Configuración guardada", "success");
    setShowSettings(false);
    loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Presupuestador</h1>
          <p className="text-muted">Calculadora de precios de grabado y corte láser</p>
        </div>
        <Button variant="secondary" onClick={() => setShowSettings(true)}>
          Configurar tarifas
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos del trabajo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Tipo de trabajo</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-ink"
                value={form.workType}
                onChange={(e) => setForm({ ...form, workType: e.target.value as "grabado" | "corte" | "ambos" })}
              >
                <option value="grabado">Grabado</option>
                <option value="corte">Corte</option>
                <option value="ambos">Grabado + Corte</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">Material</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-ink"
                value={form.materialId}
                onChange={(e) => {
                  const mat = materiales.find((m) => m.id === parseInt(e.target.value));
                  setForm({
                    ...form,
                    materialId: e.target.value,
                    materialCostPerUnit: mat?.costPrice || 0,
                  });
                }}
              >
                <option value="">Seleccionar material</option>
                {materiales.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({formatCurrency(m.costPrice)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Cantidad"
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
              />
              <Input
                label="Tiempo máquina (min)"
                type="number"
                value={form.machineTimeMinutes}
                onChange={(e) =>
                  setForm({ ...form, machineTimeMinutes: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Preparación (min)"
                type="number"
                value={form.prepTimeMinutes}
                onChange={(e) =>
                  setForm({ ...form, prepTimeMinutes: parseInt(e.target.value) || 0 })
                }
              />
              <Input
                label="Desperdicio (%)"
                type="number"
                value={form.wastePercentage}
                onChange={(e) =>
                  setForm({ ...form, wastePercentage: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Costo material/unidad"
                type="number"
                value={form.materialCostPerUnit}
                onChange={(e) =>
                  setForm({ ...form, materialCostPerUnit: parseFloat(e.target.value) || 0 })
                }
              />
              <Input
                label="Embalaje"
                type="number"
                value={form.packagingCost}
                onChange={(e) =>
                  setForm({ ...form, packagingCost: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Transporte"
                type="number"
                value={form.transportCost}
                onChange={(e) =>
                  setForm({ ...form, transportCost: parseFloat(e.target.value) || 0 })
                }
              />
              <Input
                label="Otros costos"
                type="number"
                value={form.otherDirectCosts}
                onChange={(e) =>
                  setForm({ ...form, otherDirectCosts: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Recargo (%)"
                type="number"
                value={form.markupPercentage}
                onChange={(e) =>
                  setForm({ ...form, markupPercentage: parseFloat(e.target.value) || 0 })
                }
              />
              <Input
                label="Margen objetivo (%)"
                type="number"
                value={form.targetMarginPercentage}
                onChange={(e) =>
                  setForm({ ...form, targetMarginPercentage: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <Input
              label="Precio final manual (opcional)"
              type="number"
              value={form.manualPrice}
              onChange={(e) => setForm({ ...form, manualPrice: e.target.value })}
            />

            <Button className="w-full" onClick={calculate}>
              Calcular precio
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {result && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Resultado del cálculo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted">Costo máquina</span>
                    <span className="text-sm font-medium">{formatCurrency(result.machineCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted">Costo materiales</span>
                    <span className="text-sm font-medium">{formatCurrency(result.materialCost)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium">Costo directo</span>
                    <span className="text-sm font-bold">{formatCurrency(result.directCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted">Mano de obra</span>
                    <span className="text-sm font-medium">{formatCurrency(result.laborCost)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium">Costo estimado</span>
                    <span className="text-sm font-bold text-warning">{formatCurrency(result.estimatedCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted">Precio sugerido</span>
                    <span className="text-sm font-medium">{formatCurrency(result.suggestedPrice)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium">Precio final</span>
                    <span className="text-lg font-bold text-success">{formatCurrency(result.finalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted">Margen estimado</span>
                    <span className={`text-sm font-bold ${result.margin >= 0 ? "text-success" : "text-danger"}`}>
                      {result.margin.toFixed(1)}%
                    </span>
                  </div>

                  {result.warning && (
                    <div className="mt-3 p-3 rounded-lg bg-warning/10 text-warning text-sm">
                      {result.warning}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-[#d4af37]/30">
                <CardContent className="text-center py-6">
                  <p className="text-[#d4af37] text-sm uppercase tracking-wider mb-1">Precio al cliente</p>
                  <p className="text-4xl font-bold text-white">{formatCurrency(result.finalPrice)}</p>
                </CardContent>
              </Card>
            </>
          )}

          {!result && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted">Complete los datos y presione "Calcular precio"</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Configuración de tarifas">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tarifa máquina ($/min)"
              type="number"
              value={settingsForm.machineRatePerMinute || 0}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, machineRatePerMinute: parseFloat(e.target.value) || 0 })
              }
            />
            <Input
              label="Tarifa grabado ($/min)"
              type="number"
              value={settingsForm.engravingRatePerMinute || 0}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, engravingRatePerMinute: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tarifa corte ($/min)"
              type="number"
              value={settingsForm.cuttingRatePerMinute || 0}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, cuttingRatePerMinute: parseFloat(e.target.value) || 0 })
              }
            />
            <Input
              label="Tiempo prep. (min)"
              type="number"
              value={settingsForm.prepTimeMinutes || 0}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, prepTimeMinutes: parseInt(e.target.value) || 0 })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Electricidad ($/hora)"
              type="number"
              value={settingsForm.electricityCostPerHour || 0}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, electricityCostPerHour: parseFloat(e.target.value) || 0 })
              }
            />
            <Input
              label="Mantenimiento ($/hora)"
              type="number"
              value={settingsForm.maintenanceCostPerHour || 0}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, maintenanceCostPerHour: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Desgaste/reserva (%)"
              type="number"
              value={settingsForm.wearReservePercentage || 0}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, wearReservePercentage: parseFloat(e.target.value) || 0 })
              }
            />
            <Input
              label="Mano de obra (%)"
              type="number"
              value={settingsForm.laborPercentage || 0}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, laborPercentage: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Recargo (%)"
              type="number"
              value={settingsForm.priceMarkupPercentage || 0}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, priceMarkupPercentage: parseFloat(e.target.value) || 0 })
              }
            />
            <Input
              label="Margen objetivo (%)"
              type="number"
              value={settingsForm.targetMarginPercentage || 0}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, targetMarginPercentage: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Precio mínimo"
              type="number"
              value={settingsForm.minimumJobPrice || 0}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, minimumJobPrice: parseFloat(e.target.value) || 0 })
              }
            />
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Redondeo</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-ink"
                value={settingsForm.roundingRule || "nearest_100"}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, roundingRule: e.target.value as AppSettings["roundingRule"] })
                }
              >
                <option value="nearest_10">A decena</option>
                <option value="nearest_50">A cincuenta</option>
                <option value="nearest_100">A centena</option>
                <option value="none">Sin redondeo</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settingsForm.includeMaintenanceInRate ?? true}
                onChange={(e) => setSettingsForm({ ...settingsForm, includeMaintenanceInRate: e.target.checked })}
              />
              <span className="text-sm">Incluir mantenimiento en tarifa</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settingsForm.includeElectricityInRate ?? true}
                onChange={(e) => setSettingsForm({ ...settingsForm, includeElectricityInRate: e.target.checked })}
              />
              <span className="text-sm">Incluir electricidad en tarifa</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settingsForm.includeWearInRate ?? true}
                onChange={(e) => setSettingsForm({ ...settingsForm, includeWearInRate: e.target.checked })}
              />
              <span className="text-sm">Incluir desgaste en tarifa</span>
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowSettings(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSettings}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
