"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { db, formatCurrency, formatDate, CASH_MOVEMENT_LABELS } from "@/lib/db";
import type { CashRegister, CashMovement, CashMovementType } from "@/lib/types";
import { useToast } from "@/stores/auth";

export default function CajaCompletaPage() {
  const [cajas, setCajas] = useState<CashRegister[]>([]);
  const [movimientos, setMovimientos] = useState<CashMovement[]>([]);
  const [showApertura, setShowApertura] = useState(false);
  const [showMovimiento, setShowMovimiento] = useState(false);
  const [showCierre, setShowCierre] = useState(false);
  const [cajaActual, setCajaActual] = useState<CashRegister | null>(null);
  const [movForm, setMovForm] = useState({
    type: "ingreso" as CashMovementType,
    concept: "",
    amount: 0,
    paymentMethod: "Efectivo",
    reference: "",
    notes: "",
  });
  const [aperturaForm, setAperturaForm] = useState({
    name: "Caja Principal",
    openingAmount: 0,
    responsible: "",
    notes: "",
  });
  const [cierreForm, setCierreForm] = useState({
    countedAmount: 0,
    notes: "",
    responsible: "",
  });
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [allCajas, allMovimientos] = await Promise.all([
      db.cashRegisters.toArray(),
      db.cashMovements.toArray(),
    ]);
    setCajas(allCajas.sort((a, b) => b.openedAt - a.openedAt));
    setMovimientos(allMovimientos.sort((a, b) => b.date - a.date));

    const abierta = allCajas.find((c) => c.status === "abierta");
    setCajaActual(abierta || null);
  }

  async function handleApertura() {
    if (cajaActual) {
      addToast("Ya hay una caja abierta", "error");
      return;
    }

    const nueva: CashRegister = {
      name: aperturaForm.name,
      openedAt: Date.now(),
      openingAmount: aperturaForm.openingAmount,
      status: "abierta",
      responsible: aperturaForm.responsible,
      notes: aperturaForm.notes,
    };

    const id = await db.cashRegisters.add(nueva);
    addToast("Caja abierta correctamente", "success");
    setShowApertura(false);
    setAperturaForm({ name: "Caja Principal", openingAmount: 0, responsible: "", notes: "" });

    await db.cashMovements.add({
      type: "apertura_caja",
      concept: `Apertura de caja: ${aperturaForm.name}`,
      amount: aperturaForm.openingAmount,
      date: Date.now(),
      paymentMethod: "Efectivo",
      responsible: aperturaForm.responsible,
      notes: aperturaForm.notes,
      createdAt: Date.now(),
    });

    loadData();
  }

  async function handleMovimiento() {
    if (!cajaActual) {
      addToast("No hay caja abierta", "error");
      return;
    }
    if (!movForm.concept.trim() || movForm.amount <= 0) {
      addToast("Complete todos los campos", "error");
      return;
    }

    const esIngreso = ["ingreso", "cobro", "seña", "aporte_socio", "prestamo_recibido", "venta_efectivo", "venta_transferencia"].includes(movForm.type);

    await db.cashMovements.add({
      type: movForm.type,
      concept: movForm.concept,
      amount: movForm.amount,
      date: Date.now(),
      paymentMethod: movForm.paymentMethod,
      reference: movForm.reference,
      notes: movForm.notes,
      responsible: "Usuario",
      createdAt: Date.now(),
    });

    addToast("Movimiento registrado", "success");
    setShowMovimiento(false);
    setMovForm({ type: "ingreso", concept: "", amount: 0, paymentMethod: "Efectivo", reference: "", notes: "" });
    loadData();
  }

  async function handleCierre() {
    if (!cajaActual) return;

    const ingresos = movimientos
      .filter((m) => ["ingreso", "cobro", "seña", "aporte_socio", "prestamo_recibido", "venta_efectivo", "venta_transferencia"].includes(m.type))
      .reduce((sum, m) => sum + m.amount, 0);

    const egresos = movimientos
      .filter((m) => ["egreso", "pago_proveedor", "gasto", "retiro_socio", "prestamo_pagado"].includes(m.type))
      .reduce((sum, m) => sum + m.amount, 0);

    const theoreticalBalance = cajaActual.openingAmount + ingresos - egresos;
    const countedAmount = cierreForm.countedAmount;
    const difference = countedAmount - theoreticalBalance;

    await db.cashRegisters.update(cajaActual.id!, {
      closedAt: Date.now(),
      status: "cerrada",
      theoreticalBalance,
      countedAmount,
      difference,
      notes: cierreForm.notes,
      responsible: cierreForm.responsible,
    });

    await db.cashMovements.add({
      type: "cierre_caja",
      concept: `Cierre de caja: ${cajaActual.name}`,
      amount: theoreticalBalance,
      date: Date.now(),
      paymentMethod: "Efectivo",
      responsible: cierreForm.responsible,
      notes: cierreForm.notes,
      createdAt: Date.now(),
    });

    addToast("Caja cerrada correctamente", "success");
    setShowCierre(false);
    setCierreForm({ countedAmount: 0, notes: "", responsible: "" });
    loadData();
  }

  const calculateBalance = (caja: CashRegister): number => {
    const movs = movimientos.filter((m) => m.date >= caja.openedAt && m.date <= (caja.closedAt || Date.now()));
    const ingresos = movs
      .filter((m) => ["ingreso", "cobro", "seña", "aporte_socio", "prestamo_recibido", "venta_efectivo", "venta_transferencia"].includes(m.type))
      .reduce((sum, m) => sum + m.amount, 0);
    const egresos = movs
      .filter((m) => ["egreso", "pago_proveedor", "gasto", "retiro_socio", "prestamo_pagado"].includes(m.type))
      .reduce((sum, m) => sum + m.amount, 0);
    return caja.openingAmount + ingresos - egresos;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Caja</h1>
          <p className="text-muted">Apertura, movimientos y cierre</p>
        </div>
        <div className="flex gap-2">
          {!cajaActual ? (
            <Button onClick={() => setShowApertura(true)}>Abrir caja</Button>
          ) : (
            <>
              <Button onClick={() => setShowMovimiento(true)}>Nuevo movimiento</Button>
              <Button variant="danger" onClick={() => setShowCierre(true)}>Cerrar caja</Button>
            </>
          )}
        </div>
      </div>

      {cajaActual && (
        <Card className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-[#d4af37]/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#d4af37] text-sm uppercase tracking-wider">Caja abierta</p>
                <p className="text-white font-bold text-lg">{cajaActual.name}</p>
                <p className="text-white/60 text-sm">Abierta: {formatDate(cajaActual.openedAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-[#d4af37] text-sm uppercase tracking-wider">Saldo actual</p>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(calculateBalance(cajaActual))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted">Saldo inicial</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-ink">
              {cajaActual ? formatCurrency(cajaActual.openingAmount) : "-"}
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
                  .filter((m) => cajaActual && m.date >= cajaActual.openedAt && ["ingreso", "cobro", "seña", "aporte_socio", "prestamo_recibido", "venta_efectivo", "venta_transferencia"].includes(m.type))
                  .reduce((sum, m) => sum + m.amount, 0)
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
                  .filter((m) => cajaActual && m.date >= cajaActual.openedAt && ["egreso", "pago_proveedor", "gasto", "retiro_socio", "prestamo_pagado"].includes(m.type))
                  .reduce((sum, m) => sum + m.amount, 0)
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de cajas</CardTitle>
        </CardHeader>
        <CardContent>
          {cajas.length === 0 ? (
            <p className="text-center text-muted py-8">No hay cajas registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Caja</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Apertura</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Cierre</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Saldo inicial</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Saldo final</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Diferencia</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cajas.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-2 text-sm text-ink">{c.name}</td>
                      <td className="py-3 px-2 text-sm text-muted">{formatDate(c.openedAt)}</td>
                      <td className="py-3 px-2 text-sm text-muted">{c.closedAt ? formatDate(c.closedAt) : "-"}</td>
                      <td className="py-3 px-2 text-sm text-right">{formatCurrency(c.openingAmount)}</td>
                      <td className="py-3 px-2 text-sm text-right font-medium">
                        {formatCurrency(c.closingAmount ?? calculateBalance(c))}
                      </td>
                      <td className={`py-3 px-2 text-sm text-right font-medium ${(c.difference ?? 0) === 0 ? "text-success" : "text-danger"}`}>
                        {c.difference !== undefined ? formatCurrency(c.difference) : "-"}
                      </td>
                      <td className="py-3 px-2 text-sm text-center">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.status === "abierta" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                          {c.status === "abierta" ? "Abierta" : "Cerrada"}
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

      <Card>
        <CardHeader>
          <CardTitle>Movimientos de caja</CardTitle>
        </CardHeader>
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
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Medio</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.slice(0, 50).map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-2 text-sm text-muted">{formatDate(m.date)}</td>
                      <td className="py-3 px-2 text-sm text-ink">{CASH_MOVEMENT_LABELS[m.type]}</td>
                      <td className="py-3 px-2 text-sm text-ink">{m.concept}</td>
                      <td className="py-3 px-2 text-sm text-muted">{m.paymentMethod}</td>
                      <td className={`py-3 px-2 text-sm text-right font-medium ${["ingreso", "cobro", "seña", "aporte_socio", "prestamo_recibido", "venta_efectivo", "venta_transferencia"].includes(m.type) ? "text-success" : "text-danger"}`}>
                        {["ingreso", "cobro", "seña", "aporte_socio", "prestamo_recibido", "venta_efectivo", "venta_transferencia"].includes(m.type) ? "+" : "-"}
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

      <Modal isOpen={showApertura} onClose={() => setShowApertura(false)} title="Apertura de caja">
        <div className="space-y-4">
          <Input
            label="Nombre de caja"
            value={aperturaForm.name}
            onChange={(e) => setAperturaForm({ ...aperturaForm, name: e.target.value })}
          />
          <Input
            label="Saldo inicial"
            type="number"
            value={aperturaForm.openingAmount}
            onChange={(e) =>
              setAperturaForm({ ...aperturaForm, openingAmount: parseFloat(e.target.value) || 0 })
            }
          />
          <Input
            label="Responsable"
            value={aperturaForm.responsible}
            onChange={(e) => setAperturaForm({ ...aperturaForm, responsible: e.target.value })}
          />
          <Input
            label="Observaciones"
            value={aperturaForm.notes}
            onChange={(e) => setAperturaForm({ ...aperturaForm, notes: e.target.value })}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowApertura(false)}>Cancelar</Button>
            <Button onClick={handleApertura}>Abrir caja</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showMovimiento} onClose={() => setShowMovimiento(false)} title="Nuevo movimiento">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Tipo</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-ink"
              value={movForm.type}
              onChange={(e) => setMovForm({ ...movForm, type: e.target.value as CashMovementType })}
            >
              {Object.entries(CASH_MOVEMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label as React.ReactNode}</option>
              ))}
            </select>
          </div>
          <Input
            label="Concepto *"
            value={movForm.concept}
            onChange={(e) => setMovForm({ ...movForm, concept: e.target.value })}
          />
          <Input
            label="Monto *"
            type="number"
            value={movForm.amount}
            onChange={(e) => setMovForm({ ...movForm, amount: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Medio de pago"
            value={movForm.paymentMethod}
            onChange={(e) => setMovForm({ ...movForm, paymentMethod: e.target.value })}
          />
          <Input
            label="Referencia"
            value={movForm.reference}
            onChange={(e) => setMovForm({ ...movForm, reference: e.target.value })}
          />
          <Input
            label="Notas"
            value={movForm.notes}
            onChange={(e) => setMovForm({ ...movForm, notes: e.target.value })}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowMovimiento(false)}>Cancelar</Button>
            <Button onClick={handleMovimiento}>Registrar</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCierre} onClose={() => setShowCierre(false)} title="Cierre de caja">
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-[#1a1a2e] text-white">
            <p className="text-[#d4af37] text-sm uppercase tracking-wider mb-1">Saldo teórico</p>
            <p className="text-2xl font-bold">{formatCurrency(cajaActual ? calculateBalance(cajaActual) : 0)}</p>
          </div>
          <Input
            label="Efectivo contado *"
            type="number"
            value={cierreForm.countedAmount}
            onChange={(e) =>
              setCierreForm({ ...cierreForm, countedAmount: parseFloat(e.target.value) || 0 })
            }
          />
          <Input
            label="Responsable"
            value={cierreForm.responsible}
            onChange={(e) => setCierreForm({ ...cierreForm, responsible: e.target.value })}
          />
          <Input
            label="Observaciones"
            value={cierreForm.notes}
            onChange={(e) => setCierreForm({ ...cierreForm, notes: e.target.value })}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowCierre(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleCierre}>Confirmar cierre</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
