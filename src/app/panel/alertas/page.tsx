"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { db } from "@/lib/db";
import type { Job, Customer, CashMovement } from "@/lib/types";

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<
    Array<{
      id: string;
      titulo: string;
      descripcion: string;
      tipo: "info" | "warning" | "error" | "success";
    }>
  >([]);

  useEffect(() => {
    generarAlertas();
  }, []);

  async function generarAlertas() {
    const nuevasAlertas: Array<{
      id: string;
      titulo: string;
      descripcion: string;
      tipo: "info" | "warning" | "error" | "success";
    }> = [];

    const clientes = await db.customers.toArray();
    const clientesConDeuda = clientes.filter((c) => c.balance > 0);

    if (clientesConDeuda.length > 0) {
      nuevasAlertas.push({
        id: "deudas-cliente",
        titulo: "Clientes con deuda",
        descripcion: `${clientesConDeuda.length} cliente(s) tienen saldo pendiente`,
        tipo: "warning",
      });
    }

    const trabajos = await db.jobs.toArray();
    const trabajosPendientes = trabajos.filter(
      (j) => j.status !== "entregado" && j.status !== "cancelado"
    );

    if (trabajosPendientes.length > 0) {
      nuevasAlertas.push({
        id: "trabajos-pendientes",
        titulo: "Trabajos pendientes",
        descripcion: `${trabajosPendientes.length} trabajo(s) pendientes de entrega`,
        tipo: "info",
      });
    }

    const materiales = await db.materials.toArray();
    const stockBajo = materiales.filter((m) => m.stock <= m.minStock);

    if (stockBajo.length > 0) {
      nuevasAlertas.push({
        id: "stock-bajo",
        titulo: "Stock bajo",
        descripcion: `${stockBajo.length} material(es) con stock bajo`,
        tipo: "error",
      });
    }

    const movimientos = await db.cashMovements.toArray();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const movimientosHoy = movimientos.filter((m) => m.date >= hoy.getTime());

    if (movimientosHoy.length > 0) {
      nuevasAlertas.push({
        id: "movimientos-hoy",
        titulo: "Movimientos de hoy",
        descripcion: `${movimientosHoy.length} movimiento(s) registrados hoy`,
        tipo: "success",
      });
    }

    setAlertas(nuevasAlertas);
  }

  const tipoColores: Record<string, string> = {
    info: "border-blue-200 bg-blue-50",
    warning: "border-yellow-200 bg-yellow-50",
    error: "border-red-200 bg-red-50",
    success: "border-green-200 bg-green-50",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Alertas</h1>
        <p className="text-muted">Notificaciones del sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alertas Activas</CardTitle>
        </CardHeader>
        <CardContent>
          {alertas.length === 0 ? (
            <p className="text-center text-muted py-8">No hay alertas activas</p>
          ) : (
            <div className="space-y-3">
              {alertas.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`p-4 rounded-xl border ${tipoColores[alerta.tipo]}`}
                >
                  <p className="font-medium text-ink">{alerta.titulo}</p>
                  <p className="text-sm text-muted">{alerta.descripcion}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
