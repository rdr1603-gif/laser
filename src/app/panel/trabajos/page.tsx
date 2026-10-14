"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { db, formatCurrency, formatDate } from "@/lib/db";
import type { Customer, Job, JobStatus, Material } from "@/lib/types";
import { useToast } from "@/stores/auth";

const STATUS_LABELS: Record<JobStatus, string> = {
  pendiente: "Pendiente",
  presupuestado: "Presupuestado",
  aprobado: "Aprobado",
  en_produccion: "En Producción",
  terminado: "Terminado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const STATUS_COLORS: Record<JobStatus, string> = {
  pendiente: "bg-gray-100 text-gray-700",
  presupuestado: "bg-blue-100 text-blue-700",
  aprobado: "bg-indigo-100 text-indigo-700",
  en_produccion: "bg-yellow-100 text-yellow-700",
  terminado: "bg-green-100 text-green-700",
  entregado: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-700",
};

export default function TrabajosPage() {
  const [trabajos, setTrabajos] = useState<Job[]>([]);
  const [clientes, setClientes] = useState<Customer[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [form, setForm] = useState({
    customerId: "",
    description: "",
    quantity: 1,
    materialId: "",
    status: "pendiente" as JobStatus,
    totalPrice: 0,
    deposit: 0,
    estimatedDelivery: "",
    machineTimeMinutes: 0,
    materialCost: 0,
    notes: "",
  });
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [allTrabajos, allClientes, allMateriales] = await Promise.all([
      db.jobs.toArray(),
      db.customers.toArray(),
      db.materials.toArray(),
    ]);
    setTrabajos(allTrabajos.sort((a, b) => b.createdAt - a.createdAt));
    setClientes(allClientes);
    setMateriales(allMateriales);
  }

  function openNew() {
    setEditing(null);
    setForm({
      customerId: "",
      description: "",
      quantity: 1,
      materialId: "",
      status: "pendiente",
      totalPrice: 0,
      deposit: 0,
      estimatedDelivery: "",
      machineTimeMinutes: 0,
      materialCost: 0,
      notes: "",
    });
    setShowModal(true);
  }

  function openEdit(j: Job) {
    setEditing(j);
    setForm({
      customerId: j.customerId?.toString() || "",
      description: j.description,
      quantity: j.quantity,
      materialId: j.materialId?.toString() || "",
      status: j.status,
      totalPrice: j.totalPrice,
      deposit: j.deposit,
      estimatedDelivery: j.estimatedDelivery
        ? new Date(j.estimatedDelivery).toISOString().split("T")[0]
        : "",
      machineTimeMinutes: j.machineTimeMinutes,
      materialCost: j.materialCost,
      notes: j.notes || "",
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.description.trim()) {
      addToast("La descripción es obligatoria", "error");
      return;
    }

    const now = Date.now();
    const customer = clientes.find((c) => c.id === parseInt(form.customerId));
    const material = materiales.find((m) => m.id === parseInt(form.materialId));

    if (editing) {
      await db.jobs.update(editing.id!, {
        customerId: customer?.id,
        customerName: customer?.name,
        description: form.description,
        quantity: form.quantity,
        materialId: material?.id,
        materialName: material?.name,
        status: form.status,
        totalPrice: form.totalPrice,
        deposit: form.deposit,
        balance: form.totalPrice - form.deposit,
        estimatedDelivery: form.estimatedDelivery
          ? new Date(form.estimatedDelivery).getTime()
          : undefined,
        machineTimeMinutes: form.machineTimeMinutes,
        materialCost: form.materialCost,
        notes: form.notes,
        updatedAt: now,
      });
      addToast("Trabajo actualizado", "success");
    } else {
      const lastJob = await db.jobs.orderBy("number").last();
      await db.jobs.add({
        number: (lastJob?.number || 0) + 1,
        customerId: customer?.id,
        customerName: customer?.name,
        description: form.description,
        quantity: form.quantity,
        materialId: material?.id,
        materialName: material?.name,
        status: form.status,
        totalPrice: form.totalPrice,
        deposit: form.deposit,
        balance: form.totalPrice - form.deposit,
        estimatedDelivery: form.estimatedDelivery
          ? new Date(form.estimatedDelivery).getTime()
          : undefined,
        machineTimeMinutes: form.machineTimeMinutes,
        materialCost: form.materialCost,
        notes: form.notes,
        createdAt: now,
        updatedAt: now,
      });
      addToast("Trabajo creado", "success");
    }

    setShowModal(false);
    loadData();
  }

  async function handleStatusChange(job: Job, newStatus: JobStatus) {
    await db.jobs.update(job.id!, { status: newStatus, updatedAt: Date.now() });
    addToast("Estado actualizado", "success");
    loadData();
  }

  async function handleDelete(j: Job) {
    if (!confirm("¿Eliminar este trabajo?")) return;
    await db.jobs.delete(j.id!);
    addToast("Trabajo eliminado", "success");
    loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Trabajos</h1>
          <p className="text-muted">Órdenes de trabajo</p>
        </div>
        <Button onClick={openNew}>Nuevo Trabajo</Button>
      </div>

      <Card>
        <CardContent>
          {trabajos.length === 0 ? (
            <p className="text-center text-muted py-8">No hay trabajos</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">#</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Cliente</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Descripción</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Estado</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Total</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Saldo</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {trabajos.map((j) => (
                    <tr key={j.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-2 text-sm text-ink">#{j.number}</td>
                      <td className="py-3 px-2 text-sm text-ink">{j.customerName || "-"}</td>
                      <td className="py-3 px-2 text-sm text-muted max-w-[200px] truncate">
                        {j.description}
                      </td>
                      <td className="py-3 px-2">
                        <select
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${STATUS_COLORS[j.status]}`}
                          value={j.status}
                          onChange={(e) => handleStatusChange(j, e.target.value as JobStatus)}
                        >
                          {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-2 text-sm text-right font-medium text-ink">
                        {formatCurrency(j.totalPrice)}
                      </td>
                      <td className={`py-3 px-2 text-sm text-right font-medium ${j.balance > 0 ? "text-danger" : "text-success"}`}>
                        {formatCurrency(j.balance)}
                      </td>
                      <td className="py-3 px-2 text-sm text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(j)}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(j)}>
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
        title={editing ? "Editar Trabajo" : "Nuevo Trabajo"}
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

          <Input
            label="Descripción *"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cantidad"
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
            />
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Estado</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-ink"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as JobStatus })}
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
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
                  materialCost: mat?.costPrice || 0,
                });
              }}
            >
              <option value="">Seleccionar material</option>
              {materiales.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Precio Total"
              type="number"
              value={form.totalPrice}
              onChange={(e) => setForm({ ...form, totalPrice: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Seña"
              type="number"
              value={form.deposit}
              onChange={(e) => setForm({ ...form, deposit: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tiempo Máquina (min)"
              type="number"
              value={form.machineTimeMinutes}
              onChange={(e) =>
                setForm({ ...form, machineTimeMinutes: parseInt(e.target.value) || 0 })
              }
            />
            <Input
              label="Fecha Entrega"
              type="date"
              value={form.estimatedDelivery}
              onChange={(e) => setForm({ ...form, estimatedDelivery: e.target.value })}
            />
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
