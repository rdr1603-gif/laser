"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { db, formatCurrency, formatDate } from "@/lib/db";
import type { Expense } from "@/lib/types";
import { useToast } from "@/stores/auth";

export default function GastosPage() {
  const [gastos, setGastos] = useState<Expense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    category: "operativo",
    description: "",
    amount: 0,
    paid: true,
  });
  const { addToast } = useToast();

  useEffect(() => {
    loadGastos();
  }, []);

  async function loadGastos() {
    const all = await db.expenses.toArray();
    setGastos(all.sort((a, b) => b.date - a.date));
  }

  async function handleSave() {
    if (!form.description.trim() || form.amount <= 0) {
      addToast("Complete todos los campos", "error");
      return;
    }

    await db.expenses.add({
      category: form.category,
      description: form.description,
      amount: form.amount,
      date: Date.now(),
      paid: form.paid,
      createdAt: Date.now(),
    });

    addToast("Gasto registrado", "success");
    setShowModal(false);
    setForm({ category: "operativo", description: "", amount: 0, paid: true });
    loadGastos();
  }

  async function handleDelete(g: Expense) {
    if (!confirm("¿Eliminar este gasto?")) return;
    await db.expenses.delete(g.id!);
    addToast("Gasto eliminado", "success");
    loadGastos();
  }

  const categorias: Record<string, string> = {
    operativo: "Operativo",
    alquiler: "Alquiler",
    servicios: "Servicios",
    impuestos: "Impuestos",
    otros: "Otros",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Gastos</h1>
          <p className="text-muted">Registro de gastos operativos</p>
        </div>
        <Button onClick={() => setShowModal(true)}>Nuevo Gasto</Button>
      </div>

      <Card>
        <CardContent>
          {gastos.length === 0 ? (
            <p className="text-center text-muted py-8">No hay gastos registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Fecha</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Categoría</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Descripción</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Monto</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted">Estado</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {gastos.map((g) => (
                    <tr key={g.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-2 text-sm text-muted">{formatDate(g.date)}</td>
                      <td className="py-3 px-2 text-sm text-ink">
                        {categorias[g.category] || g.category}
                      </td>
                      <td className="py-3 px-2 text-sm text-ink">{g.description}</td>
                      <td className="py-3 px-2 text-sm text-right font-medium text-danger">
                        {formatCurrency(g.amount)}
                      </td>
                      <td className="py-3 px-2 text-sm text-center">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            g.paid
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {g.paid ? "Pagado" : "Pendiente"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(g)}>
                          Eliminar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Gasto">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Categoría</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-ink"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {Object.entries(categorias).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Descripción *"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <Input
            label="Monto *"
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="paid"
              checked={form.paid}
              onChange={(e) => setForm({ ...form, paid: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="paid" className="text-sm text-ink">
              Pagado
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
