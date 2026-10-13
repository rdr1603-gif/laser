"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/stores/ui";
import { db } from "@/lib/db";
import { ExpenseCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { useToast } from "@/stores/ui";
import { useNavigate } from "next/navigation";

export default function GastosPage() {
  const { user } = useAuth();
  const [gastos, setGastos] = useState<Array<{
    id: number;
    category: string;
    description: string;
    amount: number;
    date: number;
    paid: boolean;
    reference?: string;
  }>>([]);
  [gastoForm, setGastoForm] = useState({
    category: "operating",
    description: "",
    amount: 0,
    date: Date.now(),
    reference: "",
  });
  const [showNew, setShowNew] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Cargar categorías de gastos
  useEffect(() => {
    cargarGastos();
  }, []);

  async function cargarGastos() {
    const all = await db.expenses.where("storeId").equals(user?.storeId || "default").toArray();
    setGastos(all);
  }

  async function handleSave() {
    try {
      const now = Date.now();
      const newGasto: any = {
        storeId: user?.storeId || "default",
        category: gastoForm.category,
        categoryName: getCategoryLabel(gastoForm.category),
        description: gastoForm.description,
        amount: gastoForm.amount,
        date: now,
        referenceId: gastoForm.reference || undefined,
        referenceType: gastoForm.reference ? "manual" : undefined,
        paid: gastoForm.paid,
        notes: "",
        createdAt: now,
        createdBy: user?.id || 1,
      };

      await db.expenses.add(newGasto);
      setShowNew(false);
      setGastoForm({
        category: "operating",
        description: "",
        amount: 0,
        date: Date.now(),
        reference: "",
      });
      toast({ title: "Gasto registrado", type: "ok" });
      await cargarGastos();
    } catch (error: any) {
      toast({ title: "Error", type: "err", message: error.message || "Error al registrar gasto" });
    }
  }

  function getCategoryLabel(type: string): string {
    const labels: Record<string, string> = {
      operating: "Gasto Operativo",
      direct: "Costo Directo",
      general: "Gasto General",
      capital: "Inversión Capital",
      partner: "Socio",
    };
    return labels[type] || "Otros";
  }

  const categoryOptions = [
    { value: "operating", label: "Gasto Operativo" },
    { value: "direct", label: "Costo Directo" },
    { value: "general", label: "Gasto General" },
    { value: "capital", label: "Inversión Capital" },
    { value: "partner", label: "Distribución Socio" },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gastos y Control Contable</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulario Nuevo Gasto */}
        <div className="border rounded p-4 bg-surface/50">
          <h3 className="font-medium mb-4">Registrar Nuevo Gasto</h3>

          <Select onValueChange={(val) => setGastoForm((prev) => ({ ...prev, category: val }))} value={gastoForm.category}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar categoría..." />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <Input
              placeholder="Descripción"
              value={gastoForm.description}
              onChange={(e) =>
                setGastoForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            <Input
              type="number"
              min={0}
              step={0.01}
              placeholder="Importe"
              value={gastoForm.amount}
              onChange={(e) =>
                setGastoForm((prev) => ({ ...prev, amount: Number(e.target.value) }))
              }
            />
          </div>

          <Input
            placeholder="Referencia (opcional)"
            value={gastoForm.reference || ""}
            onChange={(e) =>
              setGastoForm((prev) => ({ ...prev, reference: e.target.value }))
            }
          />

          <div className="mt-4">
            <Button onClick={handleSave} disabled={gastoForm.amount <= 0}>
              Registrar Gasto
            </Button>
          </div>

          <p className="text-sm text-muted/60 mt-2">
            Las categorías diferenciados: <span className="font-medium">Operating</span> (gastos operativos),
            <span className="font-medium">Direct</span> (costos directos de producción),
            <span className="font-medium">General</span> (alquiler, servicios),
            <span className="font-medium">Capital</span> (activos duraderos),
            <span className="font-medium">Partner</span> (distribuciones y aportes)
          </p>
        </div>

        {/* Lista de Gastos Existentes */}
        <div>
          <h3 className="font-medium mb-3">Historial de Gastos</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableRow>
                  <TableCategory>Categoría</TableCategory>
                  <TableCategory>Descripción</TableCategory>
                  <TableCategory>Importe</TableCategory>
                  <TableCategory>Fecha</TableCategory>
                  <TableCategory>Pagado</TableCategory>
                  <TableCategory>Acciones</TableCategory>
                </TableRow>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gastos.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        g.category === "partner"
                          ? "bg-blue-100 text-blue-800"
                        : g.category === "capital"
                          ? "bg-purple-100 text-purple-800"
                        : g.category === "direct"
                          ? "bg-orange-100 text-orange-800"
                        : "bg-green-100 text-green-800"
                      }`}
                    >
                      {getCategoryLabel(g.category)}
                    </span>
                  </TableCell>
                  <TableCell>{g.description || "-"}</TableCell>
                  <TableCell>${g.amount > 0 ? `$${g.amount}` : "$0"}</TableCell>
                  <TableCell>{new Date(g.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        g.paid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {g.paid ? "Pagado" : "Pendiente"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/panel/gastos/${g.id}`)}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}