"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { db, formatCurrency, formatDate } from "@/lib/db";
import type { Partner, Distribution } from "@/lib/types";
import { useToast } from "@/stores/auth";

export default function SociosPage() {
  const [socios, setSocios] = useState<Partner[]>([]);
  const [distribuciones, setDistribuciones] = useState<Distribution[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState({
    name: "",
    participationPercentage: 50,
    initialContribution: 0,
    loansToBusiness: 0,
    personalExpenses: 0,
    withdrawals: 0,
  });
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [allSocios, allDistribuciones] = await Promise.all([
      db.partners.toArray(),
      db.distributions.toArray(),
    ]);
    setSocios(allSocios);
    setDistribuciones(allDistribuciones.sort((a, b) => b.date - a.date));
  }

  function openNew() {
    setEditing(null);
    setForm({
      name: "",
      participationPercentage: 50,
      initialContribution: 0,
      loansToBusiness: 0,
      personalExpenses: 0,
      withdrawals: 0,
    });
    setShowModal(true);
  }

  function openEdit(p: Partner) {
    setEditing(p);
    setForm({
      name: p.name,
      participationPercentage: p.participationPercentage,
      initialContribution: p.initialContribution,
      loansToBusiness: p.loansToBusiness,
      personalExpenses: p.personalExpenses,
      withdrawals: p.withdrawals,
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
      await db.partners.update(editing.id!, {
        ...form,
        updatedAt: now,
      });
      addToast("Socio actualizado", "success");
    } else {
      await db.partners.add({
        ...form,
        distributions: 0,
        workPayments: 0,
        capitalBalance: form.initialContribution,
        currentAccountBalance: form.initialContribution,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
      addToast("Socio creado", "success");
    }

    setShowModal(false);
    loadData();
  }

  async function handleDelete(p: Partner) {
    if (!confirm(`¿Eliminar a ${p.name}?`)) return;
    await db.partners.delete(p.id!);
    addToast("Socio eliminado", "success");
    loadData();
  }

  const totalCapital = socios.reduce((sum, s) => sum + s.capitalBalance, 0);
  const totalPrestamos = socios.reduce((sum, s) => sum + s.loansToBusiness, 0);
  const totalRetiros = socios.reduce((sum, s) => sum + s.withdrawals, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Socios</h1>
          <p className="text-muted">Gestión de socios y capital</p>
        </div>
        <Button onClick={openNew}>Nuevo Socio</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted">Capital Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-ink">{formatCurrency(totalCapital)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted">Préstamos al Negocio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalPrestamos)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted">Retiros Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">{formatCurrency(totalRetiros)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Socios</CardTitle>
        </CardHeader>
        <CardContent>
          {socios.length === 0 ? (
            <p className="text-center text-muted py-8">No hay socios registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Nombre</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Participación</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Capital</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Préstamos</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Retiros</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {socios.map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-2 text-sm text-ink">{s.name}</td>
                      <td className="py-3 px-2 text-sm text-right text-ink">
                        {s.participationPercentage}%
                      </td>
                      <td className="py-3 px-2 text-sm text-right text-ink">
                        {formatCurrency(s.capitalBalance)}
                      </td>
                      <td className="py-3 px-2 text-sm text-right text-primary">
                        {formatCurrency(s.loansToBusiness)}
                      </td>
                      <td className="py-3 px-2 text-sm text-right text-warning">
                        {formatCurrency(s.withdrawals)}
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

      <Card>
        <CardHeader>
          <CardTitle>Distribuciones</CardTitle>
        </CardHeader>
        <CardContent>
          {distribuciones.length === 0 ? (
            <p className="text-center text-muted py-8">No hay distribuciones registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Fecha</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Socio</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Período</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Monto</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {distribuciones.map((d) => (
                    <tr key={d.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-2 text-sm text-muted">{formatDate(d.date)}</td>
                      <td className="py-3 px-2 text-sm text-ink">{d.partnerName}</td>
                      <td className="py-3 px-2 text-sm text-muted">{d.period}</td>
                      <td className="py-3 px-2 text-sm text-right font-medium text-ink">
                        {formatCurrency(d.amount)}
                      </td>
                      <td className="py-3 px-2 text-sm text-center">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            d.confirmed
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {d.confirmed ? "Confirmado" : "Pendiente"}
                        </span>
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
        title={editing ? "Editar Socio" : "Nuevo Socio"}
      >
        <div className="space-y-4">
          <Input
            label="Nombre *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Participación (%)"
            type="number"
            value={form.participationPercentage}
            onChange={(e) =>
              setForm({ ...form, participationPercentage: parseFloat(e.target.value) || 0 })
            }
          />
          <Input
            label="Aporte Inicial"
            type="number"
            value={form.initialContribution}
            onChange={(e) =>
              setForm({ ...form, initialContribution: parseFloat(e.target.value) || 0 })
            }
          />
          <Input
            label="Préstamos al Negocio"
            type="number"
            value={form.loansToBusiness}
            onChange={(e) =>
              setForm({ ...form, loansToBusiness: parseFloat(e.target.value) || 0 })
            }
          />
          <Input
            label="Gastos Personales"
            type="number"
            value={form.personalExpenses}
            onChange={(e) =>
              setForm({ ...form, personalExpenses: parseFloat(e.target.value) || 0 })
            }
          />
          <Input
            label="Retiros"
            type="number"
            value={form.withdrawals}
            onChange={(e) => setForm({ ...form, withdrawals: parseFloat(e.target.value) || 0 })}
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
