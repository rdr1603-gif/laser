"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { db, formatCurrency } from "@/lib/db";
import type { Supplier } from "@/lib/types";
import { useToast } from "@/stores/auth";

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const { addToast } = useToast();

  useEffect(() => {
    loadProveedores();
  }, []);

  async function loadProveedores() {
    const all = await db.suppliers.toArray();
    setProveedores(all.sort((a, b) => a.name.localeCompare(b.name)));
  }

  function openNew() {
    setEditing(null);
    setForm({ name: "", contact: "", phone: "", email: "", address: "", notes: "" });
    setShowModal(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({
      name: s.name,
      contact: s.contact || "",
      phone: s.phone || "",
      email: s.email || "",
      address: s.address || "",
      notes: s.notes || "",
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
      await db.suppliers.update(editing.id!, { ...form, updatedAt: now });
      addToast("Proveedor actualizado", "success");
    } else {
      await db.suppliers.add({
        ...form,
        balance: 0,
        createdAt: now,
        updatedAt: now,
      });
      addToast("Proveedor creado", "success");
    }

    setShowModal(false);
    loadProveedores();
  }

  async function handleDelete(s: Supplier) {
    if (!confirm(`¿Eliminar a ${s.name}?`)) return;
    await db.suppliers.delete(s.id!);
    addToast("Proveedor eliminado", "success");
    loadProveedores();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Proveedores</h1>
          <p className="text-muted">Gestión de proveedores</p>
        </div>
        <Button onClick={openNew}>Nuevo Proveedor</Button>
      </div>

      <Card>
        <CardContent>
          {proveedores.length === 0 ? (
            <p className="text-center text-muted py-8">No hay proveedores</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Nombre</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Contacto</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Teléfono</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Email</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Saldo</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {proveedores.map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-2 text-sm text-ink">{s.name}</td>
                      <td className="py-3 px-2 text-sm text-muted">{s.contact || "-"}</td>
                      <td className="py-3 px-2 text-sm text-muted">{s.phone || "-"}</td>
                      <td className="py-3 px-2 text-sm text-muted">{s.email || "-"}</td>
                      <td className={`py-3 px-2 text-sm text-right font-medium ${s.balance > 0 ? "text-danger" : "text-success"}`}>
                        {formatCurrency(s.balance)}
                      </td>
                      <td className="py-3 px-2 text-sm text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(s)}>
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
        title={editing ? "Editar Proveedor" : "Nuevo Proveedor"}
      >
        <div className="space-y-4">
          <Input
            label="Nombre *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Contacto"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
          />
          <Input
            label="Teléfono"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Dirección"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
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
