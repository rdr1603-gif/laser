"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { db, formatCurrency, formatDate } from "@/lib/db";
import type { Purchase, PurchaseItem, Supplier } from "@/lib/types";
import { useToast } from "@/stores/auth";

export default function ComprasPage() {
  const [compras, setCompras] = useState<Purchase[]>([]);
  const [proveedores, setProveedores] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [form, setForm] = useState({
    supplierId: "",
    items: [] as PurchaseItem[],
    paid: 0,
    notes: "",
  });
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [allCompras, allProveedores] = await Promise.all([
      db.purchases.toArray(),
      db.suppliers.toArray(),
    ]);
    setCompras(allCompras.sort((a, b) => b.date - a.date));
    setProveedores(allProveedores);
  }

  function openNew() {
    setEditing(null);
    setForm({
      supplierId: "",
      items: [{ name: "", quantity: 1, unitPrice: 0, total: 0 }],
      paid: 0,
      notes: "",
    });
    setShowModal(true);
  }

  function openEdit(p: Purchase) {
    setEditing(p);
    setForm({
      supplierId: p.supplierId?.toString() || "",
      items: p.items,
      paid: p.paid,
      notes: p.notes || "",
    });
    setShowModal(true);
  }

  function addItem() {
    setForm({
      ...form,
      items: [...form.items, { name: "", quantity: 1, unitPrice: 0, total: 0 }],
    });
  }

  function updateItem(index: number, field: keyof PurchaseItem, value: string | number) {
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

    const total = form.items.reduce((sum, i) => sum + i.total, 0);
    const supplier = proveedores.find((s) => s.id === parseInt(form.supplierId));
    const now = Date.now();

    if (editing) {
      await db.purchases.update(editing.id!, {
        supplierId: supplier?.id,
        supplierName: supplier?.name,
        items: form.items,
        total,
        paid: form.paid,
        remaining: total - form.paid,
        status: form.paid >= total ? "pagado" : form.paid > 0 ? "parcial" : "pendiente",
        notes: form.notes,
      });
      addToast("Compra actualizada", "success");
    } else {
      const lastPurchase = await db.purchases.orderBy("id").last();
      await db.purchases.add({
        supplierId: supplier?.id,
        supplierName: supplier?.name,
        items: form.items,
        total,
        paid: form.paid,
        remaining: total - form.paid,
        status: form.paid >= total ? "pagado" : form.paid > 0 ? "parcial" : "pendiente",
        date: now,
        createdAt: now,
        notes: form.notes,
      });
      addToast("Compra creada", "success");
    }

    setShowModal(false);
    loadData();
  }

  async function handleDelete(p: Purchase) {
    if (!confirm("¿Eliminar esta compra?")) return;
    await db.purchases.delete(p.id!);
    addToast("Compra eliminada", "success");
    loadData();
  }

  const statusColors: Record<string, string> = {
    pendiente: "text-warning",
    parcial: "text-primary",
    pagado: "text-success",
    cancelado: "text-danger",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Compras</h1>
          <p className="text-muted">Gestión de compras a proveedores</p>
        </div>
        <Button onClick={openNew}>Nueva Compra</Button>
      </div>

      <Card>
        <CardContent>
          {compras.length === 0 ? (
            <p className="text-center text-muted py-8">No hay compras</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Fecha</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Proveedor</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Total</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Pagado</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Pendiente</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted">Estado</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {compras.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-2 text-sm text-muted">{formatDate(p.date)}</td>
                      <td className="py-3 px-2 text-sm text-ink">{p.supplierName || "-"}</td>
                      <td className="py-3 px-2 text-sm text-right font-medium text-ink">
                        {formatCurrency(p.total)}
                      </td>
                      <td className="py-3 px-2 text-sm text-right text-success">
                        {formatCurrency(p.paid)}
                      </td>
                      <td className="py-3 px-2 text-sm text-right text-danger">
                        {formatCurrency(p.remaining)}
                      </td>
                      <td className={`py-3 px-2 text-sm text-center font-medium ${statusColors[p.status]}`}>
                        {p.status}
                      </td>
                      <td className="py-3 px-2 text-sm text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p)}>
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
        title={editing ? "Editar Compra" : "Nueva Compra"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Proveedor</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-ink"
              value={form.supplierId}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
            >
              <option value="">Seleccionar proveedor</option>
              {proveedores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
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
                  <button onClick={() => removeItem(i)} className="text-danger text-sm">
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Input
            label="Pagado"
            type="number"
            value={form.paid}
            onChange={(e) => setForm({ ...form, paid: parseFloat(e.target.value) || 0 })}
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
