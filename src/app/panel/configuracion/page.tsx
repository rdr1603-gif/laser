"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { db, getSettings, saveSettings } from "@/lib/db";
import type { AppSettings } from "@/lib/types";
import { useToast } from "@/stores/auth";

export default function ConfiguracionPage() {
  const [form, setForm] = useState<AppSettings>({
    businessName: "ONIX LASER",
    currency: "ARS",
    reinvestmentPercentage: 30,
    partner1Percentage: 50,
    partner2Percentage: 50,
    machineRatePerHour: 5000,
    laborRatePerHour: 2000,
    taxRate: 21,
    updatedAt: Date.now(),
  });
  const { addToast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const settings = await getSettings();
    if (settings) {
      setForm(settings);
    }
  }

  async function handleSave() {
    await saveSettings(form);
    addToast("Configuración guardada", "success");
  }

  async function handleExportData() {
    const data = {
      customers: await db.customers.toArray(),
      suppliers: await db.suppliers.toArray(),
      materials: await db.materials.toArray(),
      jobs: await db.jobs.toArray(),
      quotes: await db.quotes.toArray(),
      cashMovements: await db.cashMovements.toArray(),
      purchases: await db.purchases.toArray(),
      partners: await db.partners.toArray(),
      distributions: await db.distributions.toArray(),
      expenses: await db.expenses.toArray(),
      settings: await getSettings(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `onix-laser-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    addToast("Copia de seguridad exportada", "success");
  }

  async function handleImportData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.customers) await db.customers.bulkPut(data.customers);
      if (data.suppliers) await db.suppliers.bulkPut(data.suppliers);
      if (data.materials) await db.materials.bulkPut(data.materials);
      if (data.jobs) await db.jobs.bulkPut(data.jobs);
      if (data.quotes) await db.quotes.bulkPut(data.quotes);
      if (data.cashMovements) await db.cashMovements.bulkPut(data.cashMovements);
      if (data.purchases) await db.purchases.bulkPut(data.purchases);
      if (data.partners) await db.partners.bulkPut(data.partners);
      if (data.distributions) await db.distributions.bulkPut(data.distributions);
      if (data.expenses) await db.expenses.bulkPut(data.expenses);
      if (data.settings) await db.settings.put(data.settings);

      addToast("Datos importados correctamente", "success");
    } catch {
      addToast("Error al importar datos", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Configuración</h1>
        <p className="text-muted">Ajustes del sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Negocio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nombre del Negocio"
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Moneda"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            />
            <Input
              label="Tasa de Impuesto (%)"
              type="number"
              value={form.taxRate}
              onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Socios y Participación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Socio 1 (%)"
              type="number"
              value={form.partner1Percentage}
              onChange={(e) =>
                setForm({ ...form, partner1Percentage: parseFloat(e.target.value) || 0 })
              }
            />
            <Input
              label="Socio 2 (%)"
              type="number"
              value={form.partner2Percentage}
              onChange={(e) =>
                setForm({ ...form, partner2Percentage: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <Input
            label="Porcentaje de Reinversión (%)"
            type="number"
            value={form.reinvestmentPercentage}
            onChange={(e) =>
              setForm({ ...form, reinvestmentPercentage: parseFloat(e.target.value) || 0 })
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tarifas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tarifa Máquina ($/hora)"
              type="number"
              value={form.machineRatePerHour}
              onChange={(e) =>
                setForm({ ...form, machineRatePerHour: parseFloat(e.target.value) || 0 })
              }
            />
            <Input
              label="Tarifa Mano de Obra ($/hora)"
              type="number"
              value={form.laborRatePerHour}
              onChange={(e) =>
                setForm({ ...form, laborRatePerHour: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSave}>Guardar Configuración</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Copia de Seguridad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted">
            Exporta todos los datos en formato JSON para respaldo o importa una copia anterior.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExportData}>
              Exportar Datos
            </Button>
            <label className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-ink bg-surface border border-border rounded-lg cursor-pointer hover:bg-bg transition">
              Importar Datos
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportData}
              />
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
