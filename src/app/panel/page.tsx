"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { db, formatCurrency } from "@/lib/db";
import type { Job, CashMovement, Customer } from "@/lib/types";
import { useAuth } from "@/stores/auth";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalJobs: 0,
    pendingJobs: 0,
    totalCustomers: 0,
    cashBalance: 0,
    monthlyRevenue: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const jobs = await db.jobs.toArray();
    const customers = await db.customers.toArray();
    const movements = await db.cashMovements.toArray();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const cashBalance = movements.reduce((sum, m) => {
      if (m.type === "ingreso" || m.type === "cobro" || m.type === "aporte_socio") {
        return sum + m.amount;
      }
      return sum - m.amount;
    }, 0);

    const monthlyRevenue = movements
      .filter((m) => m.date >= startOfMonth && (m.type === "ingreso" || m.type === "cobro"))
      .reduce((sum, m) => sum + m.amount, 0);

    setStats({
      totalJobs: jobs.length,
      pendingJobs: jobs.filter((j) => j.status !== "entregado" && j.status !== "cancelado").length,
      totalCustomers: customers.length,
      cashBalance,
      monthlyRevenue,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-muted">Resumen general del negocio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted">Trabajos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-ink">{stats.totalJobs}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted">Trabajos Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">{stats.pendingJobs}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted">Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-ink">{stats.totalCustomers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted">Balance Caja</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${stats.cashBalance >= 0 ? "text-success" : "text-danger"}`}>
              {formatCurrency(stats.cashBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos del Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">
              {formatCurrency(stats.monthlyRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/panel/trabajos"
              className="block p-3 rounded-lg border border-border hover:bg-bg transition"
            >
              <p className="font-medium text-ink">Nuevo Trabajo</p>
              <p className="text-sm text-muted">Crear orden de trabajo</p>
            </a>
            <a
              href="/panel/presupuestos"
              className="block p-3 rounded-lg border border-border hover:bg-bg transition"
            >
              <p className="font-medium text-ink">Nuevo Presupuesto</p>
              <p className="text-sm text-muted">Cotizar un trabajo</p>
            </a>
            <a
              href="/panel/clientes"
              className="block p-3 rounded-lg border border-border hover:bg-bg transition"
            >
              <p className="font-medium text-ink">Nuevo Cliente</p>
              <p className="text-sm text-muted">Registrar cliente</p>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
