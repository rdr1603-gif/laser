"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { db, formatCurrency, formatDate } from "@/lib/db";
import type { Customer } from "@/lib/types";
import { useToast } from "@/stores/auth";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const { addToast } = useToast();

  useEffect(() => {
    loadClientes();
  }, []);

  async function loadClientes() {
    const all = await db.customers.toArray();
    setClientes(all.sort((a, b) => b.createdAt - a.createdAt));
  }

  function openNew() {
    setEditing(null);
    setForm({ name: "", phone: "", email: "", address: "", notes: "" });
    setShowModal(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      notes: c.notes || "",
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
      await db.customers.update(editing.id!, {
        ...form,
        updatedAt: now,
      });
      addToast("Cliente actualizado", "success");
    } else {
      await db.customers.add({
        ...form,
        balance: 0,
        createdAt: now,
        updatedAt: now,
      });
      addToast("Cliente creado", "success");
    }

    setShowModal(false);
    loadClientes();
  }

  async function handleDelete(c: Customer) {
    if (!confirm(`¿Eliminar a ${c.name}?`)) return;
    await db.customers.delete(c.id!);
    addToast("Cliente eliminado", "success");
    loadClientes();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Clientes</h1>
          <p className="text-muted">Gestión de clientes</p>
        </div>
        <Button onClick={openNew}>Nuevo Cliente</Button>
      </div>

      <Card>
        <CardContent>
          {clientes.length === 0 ? (
            <p className="text-center text-muted py-8">No hay clientes registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Nombre</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Teléfono</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Email</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Saldo</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-2 text-sm text-ink">{c.name}</td>
                      <td className="py-3 px-2 text-sm text-muted">{c.phone || "-"}</td>
                      <td className="py-3 px-2 text-sm text-muted">{c.email || "-"}</td>
                      <td className={`py-3 px-2 text-sm text-right font-medium ${c.balance > 0 ? "text-danger" : "text-success"}`}>
                        {formatCurrency(c.balance)}
                      </td>
                      <td className="py-3 px-2 text-sm text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(c)}>
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
        title={editing ? "Editar Cliente" : "Nuevo Cliente"}
      >
        <div className="space-y-4">
          <Input
            label="Nombre *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
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
