"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/stores/ui";
import { db } from "@/lib/db";
import { Partner, Job, Quote, Customer, CashRegister, CashMovement, Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/stores/ui";
import { useNavigate } from "next/navigation";

export default function AlertasPage() {
  const { user } = useAuth();
  const [alertas, setAlertas] = useState<Array<{
    id: string;
    titulo: string;
    descripcion: string;
    tipo: "info" | "warning" | "error" | "success";
    accion?: string;
    ruta?: string;
  }>>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    generarAlertas();
  }, []);

  async function generarAlertas() {
    const storeId = user?.storeId || "default";
    const ahora = Date.now();
    const hoy = new Date();
    const nuevasAlertas: Array<{
      id: string;
      titulo: string;
      descripcion: string;
      tipo: "info" | "warning" | "error" | "success";
      accion?: string;
      ruta?: string;
    }> = [];

    // 1. Alertas de cliente: deudas vencidas
    const clientesConDeuda = await db.customers
      .where("storeId")
      .equals(storeId)
      .filter((c: any) => c.balance > 0)
      .toArray();

    const deudasVencidas = cliente.filter((c: any) => {
      // Verificar si hay pedidos/jobs con seña pero saldo pendiente alto
      return c.balance > 50000; // Umbral personalizable
    });

    if (deudasVencidas.length > 0) {
      nuevasAlertas.push({
        id: "deudas-cliente",
        titulo: "Deudas Clientes Vencidas",
        descripcion: `${deudasVencidas.length} cliente(s) tienen saldo pendiente superior a $50.000`,
        tipo: "warning",
        accion: "Ver deudas",
        ruta: "/panel/clientes",
      });
    }

    // 2. Alertas de caja: bajo saldo
    const cajaAbierta = await db.cashRegisters
      .where("storeId")
      .equals(storeId)
      .filter((r: any) => r.status === "abierta")
      .limit(1)
      .toArray();

    if (cajaAbierta.length > 0) {
      const movimientosHoy = await db.cashMovements
        .where("storeId")
        .equals(storeId)
        .filter((m: any) => m.date >= hoy.setHours(0, 0, 0, 0))
        .toArray();

      const egresosHoy = movimientosHoy
        .filter((m: any) => m.type === "retiro" || m.type === "gasto")
        .reduce((sum: number, m: any) => sum + m.amount, 0);

      const ingresosHoy = movimientosHoy
        .filter((m: any) => m.type === "ingreso" || m.type === "seña")
        .reduce((sum: number, m: any) => sum + m.amount, 0);

      const saldoActual = cajaAbierta[0].openingAmount + ingresosHoy - egresosHoy;

      if (saldoActual < 10000) { // Umbral de alerta
        nuevasAlertas.push({
          id: "caja-bajo",
          titulo: "Saldo de Caja Bajo",
          descripcion: `Saldo actual: $${saldoActual.toLocaleString()}. Crítico si menor a $5.000`,
          tipo: "error",
          accion: "Revisar caja",
          ruta: "/panel/caja",
        });
      }
    }

    // 3. Alertas de inventario: stock bajo de materiales
    const productosStockBajo = await db.inventoryMovements
      .where("storeId")
      .equals(storeId)
      .filter((m: any) => m.type === "entrada" || m.type === "compra")
      .sortBy("date")
      .toArray();

    // Contar cantidades actuales por producto (simplificado)
    const productosConStock = new Map();
    productosStockBajo.forEach((m: any) => {
      if (!productosConStock.has(m.productId)) {
        productosConStock.set(m.productId, m.after);
      } else {
        productosConStock.set(m.productId, productosConStock.get(m.productId) + m.after);
      }
    });

    // Verificar productos con stock bajo (menos de 5 unidades)
    let productosBajos = 0;
    for (const [productId, stock] of productosConStock) {
      if (stock < 5) {
        productosBajos++;
      }
    }

    if (productosBajos > 0) {
      nuevasAlertas.push({
        id: "stock-bajo",
        titulo: "Stock Bajo de Materiales",
        descripcion: `${productosBajos} producto(s) con stock inferior a 5 unidades`,
        tipo: "warning",
        accion: "Reabastecer",
        ruta: "/panel/inventario",
      });
    }

    // 4. Alertas de socios: distribuciones pendientes
    const socios = await db.partners.where("storeId").equals(storeId).toArray();
    const distribuccionesPendientes = socios.filter((s: any) => s.distributions > 0 && s.currentAccountBalance < s.capitalBalance * 0.3);

    if (distribuccionesPendientes.length > 0) {
      nuevasAlertas.push({
        id: "distribuciones-socios",
        titulo: "Distribuciones Socio Pendiente",
        descripcion: `${distribuccionesPendientes.length} socio(s) con distribuciones acumuladas y saldo de cuenta bajo`,
        tipo: "info",
        accion: "Revisar distribuciones",
        ruta: "/panel/socios",
      });
    }

    // 5. Alertas de trabajos: pendientes de seña
    const trabajosSinSeña = await db.jobs
      .where("storeId")
      .equals(storeId)
      .filter((j: any) => j.status === "esperando_seña" || j.status === "presupuesto_pendiente")
      .toArray();

    if (trabajosSinSeña.length > 0) {
      nuevasAlertas.push({
        id: "trabajos-senna",
        titulo: "Trabajos Pending Seña",
        descripcion: `${trabajosSinSeña.length} trabajo(s) esperando seña de entrega`,
        tipo: "warning",
        accion: "Ver trabajos",
        ruta: "/panel/trabajos",
      });
    }

    // 6. Alertas de presupuestos vencidos
    const presupuestosVencidos = await db.quotes
      .where("storeId")
      .equals(storeId)
      .filter((q: any) => {
        const vencimiento = q.validUntil ? new Date(q.validUntil) : null;
        return vencimiento && new Date(vencimiento) < new Date() && q.status !== "convertido";
      })
      .toArray();

    if (presupuestosVencidos.length > 0) {
      nuevasAlertas.push({
        id: "presupuestos-vencidos",
        titulo: "Presupuestos Vencidos",
        descripcion: `${presupuestosVencidos.length} presupuesto(s) vencido(s) sin convertir a pedido`,
        tipo: "error",
        accion: "Revisar presupuestos",
        ruta: "/panel/presupuestos",
      });
    }

    // 7. Alertas de flujo de caja: diferencia teórico vs real
    if (cajaAbierta.length > 0) {
      const movimientosTotales = await db.cashMovements
        .where("storeId")
        .equals(storeId)
        .toArray();

      const totalTeorico = cajaAbierta[0].openingAmount;
      const totalReal = movimientosTotales.reduce((sum: number, m: any) => {
        if (m.type === "ingreso" || m.type === "seña") return sum + m.amount;
        if (m.type === "retiro" || m.type === "gasto") return sum - m.amount;
        return sum;
      }, 0);

      const diferencia = totalReal - totalTeorico;

      if (Math.abs(diferencia) > 1000) {
        nuevasAlertas.push({
          id: "diferencia-caja",
          titulo: "Diferencia Caja Teórico vs Real",
          descripcion: `Diferencia de $${diferencia > 0 ? "+" : ""}${diferencia.toLocaleString()}${
            diferencia > 0 ? " (sobre el teórico)" : " (faltante)"
          }`,
          tipo: diferencia > 0 ? "info" : "error",
          accion: "Arquear caja",
          ruta: "/panel/caja",
        });
      }
    }

    setAlertas(nuevasAlertas);
  }

  function marcarComoVisto(id: string) {
    setAlertas((alertas) => alertas.filter((a) => a.id !== id));
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Alertas del Sistema ONIX</CardTitle>
        <p className="text-sm text-muted/60">Sistema de alertas automáticas para operación del negocio</p>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {alertas.length === 0 ? (
          <p className="text-center text-muted/50 py-8">
            No hay alertas activas
          </p>
        ) : (
          <div>
            {alertas.map((alerta) => (
              <div
                key={alerta.id}
                className={`p-3 rounded-xl flex items-start gap-3 border ${alerta.tipo === "error" ? "bg-red-100 border-red-400/20 text-red-600" : alerta.tipo === "warning" ? "bg-yellow-100 border-yellow-400/20 text-yellow-600" : alerta.tipo === "success" ? "bg-green-100 border-green-400/20 text-green-600" : "bg-blue-100 border-blue-400/20 text-blue-600"}`}
              >
                <div className="w-2 h-2 rounded-full bg-{alerta.tipo === "error" ? "red-500" : alerta.tipo === "warning" ? "yellow-500" : alerta.tipo === "success" ? "green-500" : "blue-500"} flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{alerta.titulo}</p>
                  <p className="text-[10px] text-muted/70">{alerta.descripcion}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    marcarComoVisto(alerta.id);
                    if (alerta.ruta) {
                      navigate(alerta.ruta);
                    }
                  }}
                >
                  Ver
                  {alerta.accion && <span className="ml-1 text-xs">({alerta.accion})</span>}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <div className="card-actions justify-end pt-2">
        <Button onClick={generarAlertas} className="text-sm">
          Actualizar
        </Button>
      </div>
    </Card>
  );
}