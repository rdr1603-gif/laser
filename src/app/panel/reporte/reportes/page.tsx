"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { db, formatCurrency, formatDate } from "@/lib/db";
import type { Job, CashMovement, Customer, Purchase, Expense } from "@/lib/types";

export default function ReportesPage() {
  const [period, setPeriod] = useState("mes");
  const [data, setData] = useState({
    totalVentas: 0,
    totalCobros: 0,
    totalGastos: 0,
    totalCompras: 0,
    gananciaNeta: 0,
    trabajosEntregados: 0,
    trabajosPendientes: 0,
    clientesNuevos: 0,
  });

  useEffect(() => {
    loadData();
  }, [period]);

  async function loadData() {
    const now = new Date();
    let startDate: number;

    if (period === "mes") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    } else if (period === "trimestre") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1).getTime();
    } else {
      startDate = new Date(now.getFullYear(), 0, 1).getTime();
    }

    const [trabajos, movimientos, clientes, compras, gastos] = await Promise.all([
      db.jobs.toArray(),
      db.cashMovements.toArray(),
      db.customers.toArray(),
      db.purchases.toArray(),
      db.expenses.toArray(),
    ]);

    const ventas = trabajos
      .filter((j) => j.createdAt >= startDate)
      .reduce((sum, j) => sum + j.totalPrice, 0);

    const cobros = movimientos
      .filter((m) => m.date >= startDate && (m.type === "cobro" || m.type === "ingreso"))
      .reduce((sum, m) => sum + m.amount, 0);

    const gastosTotal = gastos
      .filter((e) => e.date >= startDate)
      .reduce((sum, e) => sum + e.amount, 0);

    const comprasTotal = compras
      .filter((c) => c.date >= startDate)
      .reduce((sum, c) => sum + c.total, 0);

    const clientesNuevos = clientes.filter((c) => c.createdAt >= startDate).length;

    setData({
      totalVentas: ventas,
      totalCobros: cobros,
      totalGastos: gastosTotal,
      totalCompras: comprasTotal,
      gananciaNeta: cobros - gastosTotal - comprasTotal,
      trabajosEntregados: trabajos.filter((j) => j.status === "entregado").length,
      trabajosPendientes: trabajos.filter((j) => j.status !== "entregado" && j.status !== "cancelado").length,
      clientesNuevos,
    });
  }

  function exportCSV() {
    const rows = [
      ["Métrica", "Valor"],
      ["Ventas", data.totalVentas],
      ["Cobros", data.totalCobros],
      ["Gastos", data.totalGastos],
      ["Compras", data.totalCompras],
      ["Ganancia Neta", data.gananciaNeta],
      ["Trabajos Entregados", data.trabajosEntregados],
      ["Trabajos Pendientes", data.trabajosPendientes],
      ["Clientes Nuevos", data.clientesNuevos],
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-${period}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Reportes</h1>
          <p className="text-muted">Informes y estadísticas</p>
        </div>
        <div className="flex gap-2">
          <select
            className="px-3 py-2 border border-border rounded-lg bg-surface text-ink"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="mes">Este Mes</option>
            <option value="trimestre">Este Trimestre</option>
            <option value="año">Este Año</option>
          </select>
          <Button variant="secondary" onClick={exportCSV}>
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted">Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-ink">{formatCurrency(data.totalVentas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted">Cobros</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">{formatCurrency(data.totalCobros)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted">Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-danger">{formatCurrency(data.totalGastos)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted">Ganancia Neta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${data.gananciaNeta >= 0 ? "text-success" : "text-danger"}`}>
              {formatCurrency(data.gananciaNeta)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted">Trabajos Entregados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-ink">{data.trabajosEntregados}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted">Trabajos Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">{data.trabajosPendientes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted">Clientes Nuevos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-ink">{data.clientesNuevos}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen Financiero</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted">Ventas del período</span>
              <span className="text-sm font-medium text-ink">{formatCurrency(data.totalVentas)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted">Cobros efectivos</span>
              <span className="text-sm font-medium text-success">{formatCurrency(data.totalCobros)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted">Gastos operativos</span>
              <span className="text-sm font-medium text-danger">-{formatCurrency(data.totalGastos)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted">Compras a proveedores</span>
              <span className="text-sm font-medium text-danger">-{formatCurrency(data.totalCompras)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-semibold text-ink">Resultado del Período</span>
              <span className={`text-sm font-bold ${data.gananciaNeta >= 0 ? "text-success" : "text-danger"}`}>
                {formatCurrency(data.gananciaNeta)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
