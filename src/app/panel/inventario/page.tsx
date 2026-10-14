"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { db, formatCurrency } from "@/lib/db";
import type { Material } from "@/lib/types";
import { useToast } from "@/stores/auth";

export default function InventarioPage() {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "",
    thickness: 0,
    unit: "unidad",
    costPrice: 0,
    stock: 0,
    minStock: 0,
  });
  const { addToast } = useToast();

  useEffect(() => {
    loadMateriales();
  }, []);

  async function loadMateriales() {
    const all = await db.materials.toArray();
    setMateriales(all.sort((a, b) => a.name.localeCompare(b.name)));
  }

  function openNew() {
    setEditing(null);
    setForm({ name: "", type: "", thickness: 0, unit: "unidad", costPrice: 0, stock: 0, minStock: 0 });
    setShowModal(true);
  }

  function openEdit(m: Material) {
    setEditing(m);
    setForm({
      name: m.name,
      type: m.type,
      thickness: m.thickness || 0,
      unit: m.unit,
      costPrice: m.costPrice,
      stock: m.stock,
      minStock: m.minStock,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      addToast("El nombre es obligatorio", "error");
      return;
    }

    const now = Date.now();
    if (editing) {
      await db.materials.update(editing.id!, { ...form, updatedAt: now });
      addToast("Material actualizado", "success");
    } else {
      await db.materials.add({
        ...form,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
      addToast("Material creado", "success");
    }

    setShowModal(false);
    loadMateriales();
  }

  async function handleDelete(m: Material) {
    if (!confirm(`¿Eliminar ${m.name}?`)) return;
    await db.materials.delete(m.id!);
    addToast("Material eliminado", "success");
    loadMateriales();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Inventario</h1>
          <p className="text-muted">Materiales y stock</p>
        </div>
        <Button onClick={openNew}>Nuevo Material</Button>
      </div>

      <Card>
        <CardContent>
          {materiales.length === 0 ? (
            <p className="text-center text-muted py-8">No hay materiales</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Nombre</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Tipo</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Costo</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Stock</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Mínimo</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {materiales.map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-2 text-sm text-ink">{m.name}</td>
                      <td className="py-3 px-2 text-sm text-muted">{m.type || "-"}</td>
                      <td className="py-3 px-2 text-sm text-right text-ink">
                        {formatCurrency(m.costPrice)}
                      </td>
                      <td className={`py-3 px-2 text-sm text-right font-medium ${m.stock <= m.minStock ? "text-danger" : "text-success"}`}>
                        {m.stock}
                      </td>
                      <td className="py-3 px-2 text-sm text-right text-muted">{m.minStock}</td>
                      <td className="py-3 px-2 text-sm text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(m)}>
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
        title={editing ? "Editar Material" : "Nuevo Material"}
      >
        <div className="space-y-4">
          <Input
            label="Nombre *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tipo"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            />
            <Input
              label="Unidad"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Espesor (mm)"
              type="number"
              value={form.thickness}
              onChange={(e) => setForm({ ...form, thickness: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Precio Costo"
              type="number"
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Stock"
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Stock Mínimo"
              type="number"
              value={form.minStock}
              onChange={(e) => setForm({ ...form, minStock: parseFloat(e.target.value) || 0 })}
            />
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
