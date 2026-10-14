"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Modal } from "@/components/Modal";
import { db, formatCurrency, formatDate, getSettings } from "@/lib/db";
import type { Job, CashMovement, Customer, Purchase, Expense, Partner, Liquidacion, AppSettings } from "@/lib/types";
import { useToast } from "@/stores/auth";

type Periodo = "dia" | "semana" | "mes" | "trimestre" | "aano" | "personalizado";

export default function EstadisticasSociosPage() {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [showSimulador, setShowSimulador] = useState(false);
  const [showLiquidacion, setShowLiquidacion] = useState(false);
  const [settings, setSettings] = useState<AppSettings | undefined>();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
  const [simForm, setSimForm] = useState({
    venta: 15000,
    costos: 5000,
    gastos: 0,
    reinvestmentPct: 30,
    socio1Pct: 50,
    socio2Pct: 50,
    otrasReservas: 0,
  });
  const [simResult, setSimResult] = useState<{
    resultado: number;
    reinversion: number;
    utilidad: number;
    socio1: number;
    socio2: number;
  } | null>(null);
  const { addToast } = useToast();

  const [data, setData] = useState({
    ventasRegistradas: 0,
    ventasCobradas: 0,
    cuentasPorCobrar: 0,
    costosDirectos: 0,
    gastosGenerales: 0,
    resultadoNeto: 0,
    reinvestmentAmount: 0,
    utilidadDistribuible: 0,
    dineroDisponible: 0,
    obligacionesPendientes: 0,
    totalJobs: 0,
    jobsEntregados: 0,
    jobsPendientes: 0,
  });

  useEffect(() => {
    loadData();
  }, [periodo, fechaInicio, fechaFin]);

  async function loadData() {
    const now = new Date();
    let start: number;
    let end: number;

    switch (periodo) {
      case "dia":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        end = now.getTime();
        break;
      case "semana":
        start = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        end = now.getTime();
        break;
      case "mes":
        start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        end = now.getTime();
        break;
      case "trimestre":
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1).getTime();
        end = now.getTime();
        break;
      case "aano":
        start = new Date(now.getFullYear(), 0, 1).getTime();
        end = now.getTime();
        break;
      case "personalizado":
        start = fechaInicio ? new Date(fechaInicio).getTime() : 0;
        end = fechaFin ? new Date(fechaFin).getTime() : now.getTime();
        break;
    }

    const [jobs, movements, customers, purchases, expenses, settingsData, partnersData, liquidacionesData] =
      await Promise.all([
        db.jobs.toArray(),
        db.cashMovements.toArray(),
        db.customers.toArray(),
        db.purchases.toArray(),
        db.expenses.toArray(),
        getSettings(),
        db.partners.toArray(),
        db.liquidaciones.toArray(),
      ]);

    setSettings(settingsData);
    setPartners(partnersData.filter((p) => p.active));
    setLiquidaciones(liquidacionesData.sort((a, b) => b.createdAt - a.createdAt));

    const jobsPeriodo = jobs.filter((j) => j.createdAt >= start && j.createdAt <= end);
    const movementsPeriodo = movements.filter((m) => m.date >= start && m.date <= end);
    const expensesPeriodo = expenses.filter((e) => e.date >= start && e.date <= end);
    const purchasesPeriodo = purchases.filter((p) => p.date >= start && p.date <= end);

    const ventasRegistradas = jobsPeriodo
      .filter((j) => j.status !== "cancelado")
      .reduce((sum, j) => sum + j.totalPrice, 0);

    const ventasCobradas = movementsPeriodo
      .filter((m) => ["cobro", "venta_efectivo", "venta_transferencia", "seña"].includes(m.type))
      .reduce((sum, m) => sum + m.amount, 0);

    const cuentasPorCobrar = customers.reduce((sum, c) => sum + c.balance, 0);

    const costosDirectos = jobsPeriodo
      .filter((j) => j.status !== "cancelado")
      .reduce((sum, j) => sum + j.materialCost + j.laborCost + j.otherCosts, 0);

    const gastosGenerales = expensesPeriodo.reduce((sum, e) => sum + e.amount, 0);

    const comprasPendientes = purchasesPeriodo
      .filter((p) => p.status !== "pagado" && p.status !== "cancelado")
      .reduce((sum, p) => sum + p.remaining, 0);

    const resultadoNeto = ventasCobradas - costosDirectos - gastosGenerales;

    const reinvestmentPct = settingsData?.reinvestmentPercentage ?? 30;
    const reinvestmentAmount = Math.max(0, resultadoNeto * reinvestmentPct / 100);

    const utilidadDistribuible = Math.max(0, resultadoNeto - reinvestmentAmount);

    const dineroDisponible = movementsPeriodo
      .filter((m) => ["ingreso", "cobro", "seña", "aporte_socio", "prestamo_recibido", "venta_efectivo", "venta_transferencia"].includes(m.type))
      .reduce((sum, m) => sum + m.amount, 0) -
      movementsPeriodo
        .filter((m) => ["egreso", "pago_proveedor", "gasto", "retiro_socio", "prestamo_pagado"].includes(m.type))
        .reduce((sum, m) => sum + m.amount, 0);

    const obligacionesPendientes = comprasPendientes + cuentasPorCobrar * 0;

    setData({
      ventasRegistradas,
      ventasCobradas,
      cuentasPorCobrar,
      costosDirectos,
      gastosGenerales,
      resultadoNeto,
      reinvestmentAmount,
      utilidadDistribuible,
      dineroDisponible,
      obligacionesPendientes,
      totalJobs: jobsPeriodo.length,
      jobsEntregados: jobsPeriodo.filter((j) => j.status === "entregado").length,
      jobsPendientes: jobsPeriodo.filter((j) => j.status !== "entregado" && j.status !== "cancelado").length,
    });
  }

  function simulate() {
    const resultado = simForm.venta - simForm.costos - simForm.gastos;
    const reinversion = resultado * (simForm.reinvestmentPct / 100);
    const utilidad = resultado - reinversion - simForm.otrasReservas;
    const socio1 = utilidad * (simForm.socio1Pct / 100);
    const socio2 = utilidad * (simForm.socio2Pct / 100);

    setSimResult({
      resultado,
      reinversion,
      utilidad: Math.max(0, utilidad),
      socio1: Math.max(0, socio1),
      socio2: Math.max(0, socio2),
    });
  }

  async function crearLiquidacion() {
    if (!settings) return;

    const now = new Date();
    let start: number;
    let end: number;

    switch (periodo) {
      case "mes":
        start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        end = now.getTime();
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        end = now.getTime();
    }

    const reinvestmentPct = settings.reinvestmentPercentage;
    const reinversion = data.resultadoNeto * (reinvestmentPct / 100);
    const utilidad = Math.max(0, data.resultadoNeto - reinversion);

    const nueva: Liquidacion = {
      period: `${new Date(start).toLocaleDateString("es-AR")} - ${new Date(end).toLocaleDateString("es-AR")}`,
      startDate: start,
      endDate: end,
      totalRevenue: data.ventasRegistradas,
      totalCosts: data.costosDirectos,
      totalExpenses: data.gastosGenerales,
      netResult: data.resultadoNeto,
      reinvestmentAmount: reinversion,
      reinvestmentPercentage: reinvestmentPct,
      distributableProfit: utilidad,
      partner1Amount: utilidad * (settings.partner1Percentage / 100),
      partner2Amount: utilidad * (settings.partner2Percentage / 100),
      partner1Percentage: settings.partner1Percentage,
      partner2Percentage: settings.partner2Percentage,
      otherReserves: 0,
      status: "borrador",
      createdAt: Date.now(),
      responsible: "Sistema",
    };

    await db.liquidaciones.add(nueva);
    addToast("Liquidación creada como borrador", "success");
    setShowLiquidacion(false);
    loadData();
  }

  const periodoLabel: Record<Periodo, string> = {
    dia: "Hoy",
    semana: "Última semana",
    mes: "Este mes",
    trimestre: "Este trimestre",
    aano: "Este año",
    personalizado: "Personalizado",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#d4af37]">Estadísticas de socios / Retribución de socios</h1>
          <p className="text-muted">Resultados del negocio y participación económica</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowSimulador(true)}>Simulador</Button>
          <Button onClick={() => setShowLiquidacion(true)}>Nueva liquidación</Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["dia", "semana", "mes", "trimestre", "aano", "personalizado"] as Periodo[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              periodo === p
                ? "bg-[#d4af37] text-[#1a1a2e]"
                : "bg-surface text-ink border border-border hover:bg-[#d4af37]/10"
            }`}
          >
            {periodoLabel[p]}
          </button>
        ))}
      </div>

      {periodo === "personalizado" && (
        <div className="flex gap-4">
          <Input label="Desde" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          <Input label="Hasta" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-[#d4af37]/30">
          <CardHeader><CardTitle className="text-sm text-[#d4af37]">Ventas registradas</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-white">{formatCurrency(data.ventasRegistradas)}</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-[#d4af37]/30">
          <CardHeader><CardTitle className="text-sm text-[#d4af37]">Ventas cobradas</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-white">{formatCurrency(data.ventasCobradas)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted">Cuentas por cobrar</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-warning">{formatCurrency(data.cuentasPorCobrar)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted">Dinero disponible</CardTitle></CardHeader>
          <CardContent><p className={`text-2xl font-bold ${data.dineroDisponible >= 0 ? "text-success" : "text-danger"}`}>{formatCurrency(data.dineroDisponible)}</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted">Costos directos</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-danger">{formatCurrency(data.costosDirectos)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted">Gastos generales</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-danger">{formatCurrency(data.gastosGenerales)}</p></CardContent>
        </Card>
        <Card className="border-[#d4af37]/50">
          <CardHeader><CardTitle className="text-sm text-[#d4af37]">Resultado neto</CardTitle></CardHeader>
          <CardContent><p className={`text-2xl font-bold ${data.resultadoNeto >= 0 ? "text-[#d4af37]" : "text-danger"}`}>{formatCurrency(data.resultadoNeto)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted">Obligaciones pendientes</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-warning">{formatCurrency(data.obligacionesPendientes)}</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#d4af37]/30">
          <CardHeader><CardTitle className="text-sm text-[#d4af37]">Reinversión ({settings?.reinvestmentPercentage ?? 30}%)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#d4af37]">{formatCurrency(data.reinvestmentAmount)}</p>
          </CardContent>
        </Card>
        <Card className="border-[#d4af37]/30">
          <CardHeader><CardTitle className="text-sm text-[#d4af37]">Utilidad distribuible</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#d4af37]">{formatCurrency(data.utilidadDistribuible)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted">Trabajos</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-ink">{data.totalJobs}</p>
            <p className="text-sm text-muted">{data.jobsEntregados} entregados / {data.jobsPendientes} pendientes</p>
          </CardContent>
        </Card>
      </div>

      {partners.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Participación de socios</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {partners.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a2e] border border-[#d4af37]/20">
                  <div>
                    <p className="font-bold text-white text-lg">{p.name}</p>
                    <p className="text-[#d4af37] text-sm">Participación: {p.participationPercentage}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#d4af37] text-sm uppercase tracking-wider">Participación estimada</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(data.utilidadDistribuible * p.participationPercentage / 100)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Liquidaciones</CardTitle></CardHeader>
        <CardContent>
          {liquidaciones.length === 0 ? (
            <p className="text-center text-muted py-8">No hay liquidaciones registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted">Período</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Resultado</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Reinv.</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted">Distribuible</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {liquidaciones.map((l) => (
                    <tr key={l.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-2 text-sm text-ink">{l.period}</td>
                      <td className="py-3 px-2 text-sm text-right">{formatCurrency(l.netResult)}</td>
                      <td className="py-3 px-2 text-sm text-right text-[#d4af37]">{formatCurrency(l.reinvestmentAmount)}</td>
                      <td className="py-3 px-2 text-sm text-right font-medium">{formatCurrency(l.distributableProfit)}</td>
                      <td className="py-3 px-2 text-sm text-center">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          l.status === "pagada" ? "bg-green-100 text-green-700" :
                          l.status === "aprobada" ? "bg-blue-100 text-blue-700" :
                          l.status === "borrador" ? "bg-gray-100 text-gray-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {l.status.replace(/_/g, " ")}
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

      <Modal isOpen={showSimulador} onClose={() => setShowSimulador(false)} title="Simulador de retribución">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Importe de venta" type="number" value={simForm.venta} onChange={(e) => setSimForm({ ...simForm, venta: parseFloat(e.target.value) || 0 })} />
            <Input label="Costos directos" type="number" value={simForm.costos} onChange={(e) => setSimForm({ ...simForm, costos: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Gastos imputables" type="number" value={simForm.gastos} onChange={(e) => setSimForm({ ...simForm, gastos: parseFloat(e.target.value) || 0 })} />
            <Input label="Reinversión (%)" type="number" value={simForm.reinvestmentPct} onChange={(e) => setSimForm({ ...simForm, reinvestmentPct: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Socio 1 (%)" type="number" value={simForm.socio1Pct} onChange={(e) => setSimForm({ ...simForm, socio1Pct: parseFloat(e.target.value) || 0 })} />
            <Input label="Socio 2 (%)" type="number" value={simForm.socio2Pct} onChange={(e) => setSimForm({ ...simForm, socio2Pct: parseFloat(e.target.value) || 0 })} />
          </div>
          <Input label="Otras reservas" type="number" value={simForm.otrasReservas} onChange={(e) => setSimForm({ ...simForm, otrasReservas: parseFloat(e.target.value) || 0 })} />

          <Button className="w-full" onClick={simulate}>Simular</Button>

          {simResult && (
            <div className="mt-4 p-4 rounded-lg bg-[#1a1a2e] border border-[#d4af37]/30 space-y-2">
              <div className="flex justify-between">
                <span className="text-white/70 text-sm">Resultado estimado</span>
                <span className="text-white font-bold">{formatCurrency(simResult.resultado)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#d4af37] text-sm">Reinversión ({simForm.reinvestmentPct}%)</span>
                <span className="text-[#d4af37] font-bold">{formatCurrency(simResult.reinversion)}</span>
              </div>
              <div className="flex justify-between border-t border-[#d4af37]/20 pt-2">
                <span className="text-white font-medium">Utilidad restante</span>
                <span className="text-white font-bold">{formatCurrency(simResult.utilidad)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70 text-sm">Socio 1 ({simForm.socio1Pct}%)</span>
                <span className="text-[#d4af37] font-bold">{formatCurrency(simResult.socio1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70 text-sm">Socio 2 ({simForm.socio2Pct}%)</span>
                <span className="text-[#d4af37] font-bold">{formatCurrency(simResult.socio2)}</span>
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30">
            <p className="text-[#d4af37] text-xs">
              <strong>Ejemplo:</strong> Venta $15.000, Costos $5.000 → Resultado $10.000 → Reinversión 30% = $3.000 → Utilidad $7.000 → Cada socio (50%) = $3.500
            </p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showLiquidacion} onClose={() => setShowLiquidacion(false)} title="Nueva liquidación">
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-[#1a1a2e] text-white space-y-2">
            <div className="flex justify-between">
              <span className="text-white/70 text-sm">Resultado neto</span>
              <span className="font-bold">{formatCurrency(data.resultadoNeto)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#d4af37] text-sm">Reinversión ({settings?.reinvestmentPercentage ?? 30}%)</span>
              <span className="text-[#d4af37] font-bold">{formatCurrency(data.reinvestmentAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-[#d4af37]/20 pt-2">
              <span className="font-medium">Utilidad distribuible</span>
              <span className="font-bold text-[#d4af37]">{formatCurrency(data.utilidadDistribuible)}</span>
            </div>
          </div>
          <p className="text-sm text-muted">
            Se creará una liquidación en estado &quot;borrador&quot; con los datos del período seleccionado.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowLiquidacion(false)}>Cancelar</Button>
            <Button onClick={crearLiquidacion}>Crear liquidación</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
