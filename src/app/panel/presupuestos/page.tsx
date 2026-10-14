"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { db, formatCurrency, formatDate } from "@/lib/db";
import type { Customer, Quote, QuoteItem } from "@/lib/types";
import { useToast } from "@/stores/auth";

export default function PresupuestosPage() {
  const [presupuestos, setPresupuestos] = useState<Quote[]>([]);
  const [clientes, setClientes] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Quote | null>(null);
  const [form, setForm] = useState({
    customerId: "",
    validUntil: "",
    notes: "",
    items: [] as QuoteItem[],
  });
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [allPresupuestos, allClientes] = await Promise.all([
      db.quotes.toArray(),
      db.customers.toArray(),
    ]);
    setPresupuestos(allPresupuestos.sort((a, b) => b.createdAt - a.createdAt));
    setClientes(allClientes);
  }

  function openNew() {
    setEditing(null);
    setForm({
      customerId: "",
      validUntil: "",
      notes: "",
      items: [{ name: "", quantity: 1, unitPrice: 0, total: 0 }],
    });
    setShowModal(true);
  }

  function openEdit(q: Quote) {
    setEditing(q);
    setForm({
      customerId: q.customerId?.toString() || "",
      validUntil: q.validUntil ? new Date(q.validUntil).toISOString().split("T")[0] : "",
      notes: q.notes || "",
      items: q.items,
    });
    setShowModal(true);
  }

  function addItem() {
    setForm({
      ...form,
      items: [...form.items, { name: "", quantity: 1, unitPrice: 0, total: 0 }],
    });
  }

  function updateItem(index: number, field: keyof QuoteItem, value: string | number) {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    if (field === "quantity" || field === "unitPrice") {
      items[index].total = items[index].quantity * items[index].unitPrice;
    }
    setForm({ ...form, items });
  }

  function removeItem(index: number) {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  }

  async function handleSave() {
    if (form.items.length === 0 || form.items.some((i) => !i.name.trim())) {
      addToast("Agregue al menos un item válido", "error");
      return;
    }

    const subtotal = form.items.reduce((sum, i) => sum + i.total, 0);
    const now = Date.now();
    const customer = clientes.find((c) => c.id === parseInt(form.customerId));

    if (editing) {
      await db.quotes.update(editing.id!, {
        customerId: customer?.id,
        customerName: customer?.name,
        items: form.items,
        subtotal,
        total: subtotal,
        validUntil: form.validUntil ? new Date(form.validUntil).getTime() : undefined,
        notes: form.notes,
        updatedAt: now,
      });
      addToast("Presupuesto actualizado", "success");
    } else {
      const lastQuote = await db.quotes.orderBy("number").last();
      await db.quotes.add({
        number: (lastQuote?.number || 0) + 1,
        customerId: customer?.id,
        customerName: customer?.name,
        items: form.items,
        subtotal,
        discount: 0,
        total: subtotal,
        status: "pendiente",
        validUntil: form.validUntil ? new Date(form.validUntil).getTime() : undefined,
        notes: form.notes,
        createdAt: now,
        updatedAt: now,
      });
      addToast("Presupuesto creado", "success");
    }

    setShowModal(false);
    loadData();
  }

  async function handleDelete(q: Quote) {
    if (!confirm("¿Eliminar este presupuesto?")) return;
    await db.quotes.delete(q.id!);
    addToast("Presupuesto eliminado", "success");
    loadData();
  }

  const statusColors: Record<string, string> = {
    pendiente: "text-warning",
    aprobado: "text-success",
    rechazado: "text-danger",
    convertido: "text-primary",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Presupuestos</h1>
          <p className="text-muted">Cotizaciones de trabajos</p>
        </div>
        <Button onClick={openNew}>Nuevo Presupuesto</Button>
      </div>

      <Card>
        <CardContent>
          {presupuestos.length === 0 ? (
            <p className="text-center text-muted py-8">No hay presupuestos</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">#</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Cliente</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Fecha</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Total</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted">Estado</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {presupuestos.map((q) => (
                    <tr key={q.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-2 text-sm text-ink">#{q.number}</td>
                      <td className="py-3 px-2 text-sm text-ink">{q.customerName || "-"}</td>
                      <td className="py-3 px-2 text-sm text-muted">{formatDate(q.createdAt)}</td>
                      <td className="py-3 px-2 text-sm text-right font-medium text-ink">
                        {formatCurrency(q.total)}
                      </td>
                      <td className={`py-3 px-2 text-sm text-center font-medium ${statusColors[q.status]}`}>
                        {q.status}
                      </td>
                      <td className="py-3 px-2 text-sm text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(q)}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(q)}>
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

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Editar Presupuesto" : "Nuevo Presupuesto"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Cliente</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-ink"
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            >
              <option value="">Seleccionar cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Válido hasta</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-ink"
              value={form.validUntil}
              onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-ink">Items</label>
              <Button variant="secondary" size="sm" onClick={addItem}>
                + Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-surface text-ink text-sm"
                    placeholder="Descripción"
                    value={item.name}
                    onChange={(e) => updateItem(i, "name", e.target.value)}
                  />
                  <input
                    type="number"
                    className="w-20 px-3 py-2 border border-border rounded-lg bg-surface text-ink text-sm"
                    placeholder="Cant"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value) || 0)}
                  />
                  <input
                    type="number"
                    className="w-24 px-3 py-2 border border-border rounded-lg bg-surface text-ink text-sm"
                    placeholder="Precio"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-sm text-muted w-20 text-right">
                    {formatCurrency(item.total)}
                  </span>
                  <button
                    onClick={() => removeItem(i)}
                    className="text-danger text-sm"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>

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
