"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { db, formatCurrency, formatDate } from "@/lib/db";
import type { CashMovement, CashMovementType } from "@/lib/types";
import { useToast } from "@/stores/auth";

const TYPE_LABELS: Record<CashMovementType, string> = {
  ingreso: "Ingreso",
  egreso: "Egreso",
  cobro: "Cobro",
  pago: "Pago",
  aporte_socio: "Aporte Socio",
  retiro_socio: "Retiro Socio",
  prestamo: "Préstamo",
  transferencia: "Transferencia",
};

const TYPE_COLORS: Record<CashMovementType, string> = {
  ingreso: "text-success",
  egreso: "text-danger",
  cobro: "text-success",
  pago: "text-danger",
  aporte_socio: "text-primary",
  retiro_socio: "text-warning",
  prestamo: "text-indigo-600",
  transferencia: "text-muted",
};

export default function CajaPage() {
  const [movimientos, setMovimientos] = useState<CashMovement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    type: "ingreso" as CashMovementType,
    concept: "",
    amount: 0,
    reference: "",
    notes: "",
  });
  const { addToast } = useToast();

  useEffect(() => {
    loadMovimientos();
  }, []);

  async function loadMovimientos() {
    const all = await db.cashMovements.toArray();
    setMovimientos(all.sort((a, b) => b.date - a.date));
  }

  async function handleSave() {
    if (!form.concept.trim() || form.amount <= 0) {
      addToast("Complete todos los campos", "error");
      return;
    }

    await db.cashMovements.add({
      ...form,
      date: Date.now(),
      createdAt: Date.now(),
    });

    addToast("Movimiento registrado", "success");
    setShowModal(false);
    setForm({ type: "ingreso", concept: "", amount: 0, reference: "", notes: "" });
    loadMovimientos();
  }

  const balance = movimientos.reduce((sum, m) => {
    if (m.type === "ingreso" || m.type === "cobro" || m.type === "aporte_socio" || m.type === "prestamo") {
      return sum + m.amount;
    }
    return sum - m.amount;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Caja</h1>
          <p className="text-muted">Movimientos de caja</p>
        </div>
        <Button onClick={() => setShowModal(true)}>Nuevo Movimiento</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${balance >= 0 ? "text-success" : "text-danger"}`}>
              {formatCurrency(balance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted">Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">
              {formatCurrency(
                movimientos
                  .filter((m) => m.type === "ingreso" || m.type === "cobro")
                  .reduce((s, m) => s + m.amount, 0)
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted">Egresos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-danger">
              {formatCurrency(
                movimientos
                  .filter((m) => m.type === "egreso" || m.type === "pago")
                  .reduce((s, m) => s + m.amount, 0)
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          {movimientos.length === 0 ? (
            <p className="text-center text-muted py-8">No hay movimientos</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Fecha</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Tipo</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Concepto</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-2 text-sm text-muted">{formatDate(m.date)}</td>
                      <td className={`py-3 px-2 text-sm font-medium ${TYPE_COLORS[m.type]}`}>
                        {TYPE_LABELS[m.type]}
                      </td>
                      <td className="py-3 px-2 text-sm text-ink">{m.concept}</td>
                      <td className={`py-3 px-2 text-sm text-right font-medium ${TYPE_COLORS[m.type]}`}>
                        {m.type === "egreso" || m.type === "pago" || m.type === "retiro_socio"
                          ? "-"
                          : "+"}
                        {formatCurrency(m.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Movimiento">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Tipo</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-ink"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as CashMovementType })}
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Concepto *"
            value={form.concept}
            onChange={(e) => setForm({ ...form, concept: e.target.value })}
          />

          <Input
            label="Monto *"
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
          />

          <Input
            label="Referencia"
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
          />

          <Input
            label="Notas"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

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
