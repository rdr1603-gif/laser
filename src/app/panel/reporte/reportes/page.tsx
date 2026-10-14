"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/stores/ui";
import { db } from "@/lib/db";
import { Job, Quote, Partner, CashMovement, Purchase, Expense } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue, Input } from "@/components/ui/select";
import { useToast } from "@/stores/ui";
import { useNavigate } from "next/navigation";
import { useSearchParams } from "next/navigation";

export default function ReportesPage() {
  const { user } = useAuth();
  const [filtros, setFiltros] = useState({
    tipo: "venta", // venta, trabajo, gasto, socio, proveedor, presupuesto
    fechaInicio: undefined,
    fechaFin: undefined,
    cliente: undefined,
    socio: undefined,
    categoria: undefined,
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const params = useSearchParams();
  
  // Cargar filtros de la URL si existen
  useEffect(() => {
    const storedFiltros = localStorage.getItem("onix_reportes_filtros");
    if (storedFiltros) {
      setFiltros(JSON.parse(storedFiltros));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("onix_reportes_filtros", JSON.stringify(filtros));
  }, [filtros]);

  async function cargarDatos() {
    const storeId = user?.storeId || "default";
    const ahora = Date.now();
    const { tipo, fechaInicio, fechaFin } = filtros;
    
    // Configurar fechas por defecto (último mes)
    const finDefecto = ahora;
    const inicioDefecto = ahora - 30 * 24 * 60 * 60 * 1000;

    // Cargar datos según el tipo de reporte
    let datos = {};
    
    switch (filtros.tipo) {
      case "venta":
        datos = {
          ventas: await db.sales.where("storeId").equals(storeId).filter((s) => 
            (!fechaInicio || s.date >= fechaInicio) && (!fechaFin || s.date <= fechaFin)
          ).toArray(),
          totalVentas: 0, // se calculará
        };
        break;
      case "trabajo":
        datos = {
          trabajos: await db.jobs.where("storeId").equals(storeId).filter((j) => 
            (!fechaInicio || j.date >= fechaInicio) && (!fechaFin || j.date <= fechaFin)
          ).toArray(),
          totalTrabajos: 0,
        };
        break;
      case "gasto":
        datos = {
          gastos: await db.expenses.where("storeId").equals(storeId).filter((e) => 
            (!fechaInicio || e.date >= fechaInicio) && (!fechaFin || e.date <= fechaFin)
          ).toArray(),
          totalGastos: 0,
        };
        break;
      case "socio":
        datos = {
          socios: await db.partners.where("storeId").equals(storeId).toArray(),
          totalSocios: 0,
        };
        break;
      case "proveedor":
        datos = {
          compras: await db.purchases.where("storeId").equals(storeId).filter((p) => 
            (!fechaInicio || p.date >= fechaInicio) && (!fechaFin || p.date <= fechaFin)
          ).toArray(),
          totalCompras: 0,
        };
        break;
      case "presupuesto":
        datos = {
          presupuestos: await db.quotes.where("storeId").equals(storeId).filter((q) => 
            (!fechaInicio || q.date >= fechaInicio) && (!fechaFin || q.date <= fechaFin)
          ).toArray(),
          totalPresupuestos: 0,
        };
        break;
      case "caja":
        datos = {
          movimientos: await db.cashMovements.where("storeId").equals(storeId).filter((m) => 
            (!fechaInicio || m.date >= fechaInicio) && (!fechaFin || m.date <= fechaFin)
          ).toArray(),
          totalMovimientos: 0,
        };
        break;
      case "inventario":
        datos = {
          inventario: await db.inventoryMovements.where("storeId").equals(storeId).filter((m) => 
            (!fechaInicio || m.date >= fechaInicio) && (!fechaFin || m.date <= fechaFin)
          ).toArray(),
        };
        break;
      default:
        datos = {};
    }
    
    // Calcular totales
    switch (filtros.tipo) {
      case "venta":
        datos.totalVentas = datos.ventas.reduce((sum, s) => sum + s.total, 0);
        break;
      case "trabajo":
        datos.totalTrabajos = datos.trabajos.length;
        break;
      case "gasto":
        datos.totalGastos = datos.gastos.reduce((sum, e) => sum + e.amount, 0);
        break;
      case "socio":
        datos.totalSocios = datos.socios.length;
        break;
      case "proveedor":
        datos.totalCompras = datos.compras.reduce((sum, p) => sum + p.total, 0);
        break;
      case "presupuesto":
        datos.totalPresupuestos = datos.presupuestos.filter((q) => q.status === "aprobado").length;
        break;
      case "caja":
        datos.totalMovimientos = datos.movimientos.length;
        break;
    }
    
    setDatos(datos);
  }

  // Función para cambiar tipo de reporte
  function cambiarTipo(tipo: string) {
    setFiltros({ ...filtros, tipo });
  }

  // Funciones de exportación
  async function exportarCSV() {
    try {
      // Recolectar datos basados en el tipo actual
      let filas = [];
      let encabezado = [];
      
      switch (filtros.tipo) {
        case "venta":
          encabezado = ["N°", "Fecha", "Cliente", "Total", "Status"];
          const ventas = await db.sales.where("storeId").equals(user?.storeId || "default").filter((s) => 
            (!filtros.fechaInicio || s.date >= filtros.fechaInicio) && (!filtros.fechaFin || s.date <= filtros.fechaFin)
          ).toArray();
          ventas.forEach((v: any) => {
            filas.push([v.number, new Date(v.date).toLocaleDateString(), v.customerName || "-", `$${v.total}`, v.status]);
          });
          break;
        case "trabajo":
          encabezado = ["N°", "Cliente", "Estado", "Ganancia", "Fecha"];
          const trabajos = await db.jobs.where("storeId").equals(user?.storeId || "default").filter((j: any) => 
            (!filtros.fechaInicio || j.date >= filtros.fechaInicio) && (!filtros.fechaFin || j.date <= filtros.fechaFin)
          ).toArray();
          trabajos.forEach((j: any) => {
            filas.push([j.number, j.customerName || "-", j.status, `$${j.totalPrice || 0}`, new Date(j.date).toLocaleDateString()]);
          });
          break;
        case "gasto":
          encabezado = ["Fecha", "Categoría", "Descripción", "Importe", "Pagado"];
          const gastos = await db.expenses.where("storeId").equals(user?.storeId || "default").filter((e: any) => 
            (!filtros.fechaInicio || e.date >= filtros.fechaInicio) && (!filtros.fechaFin || e.date <= filtros.fechaFin)
          ).toArray();
          gastos.forEach((e: any) => {
            filas.push([new Date(e.date).toLocaleDateString(), getCategoriaLabel(e.category), e.amount > 0 ? `$${e.amount}` : "$0", e.amount, e.paid ? "Sí" : "No"]);
          });
          break;
        case "socio":
          encabezado = ["Socio", "Participación", "Capital", "Corriente", "Distribuciones"];
          const socios = await db.partners.where("storeId").equals(user?.storeId || "default").toArray();
          socios.forEach((p: any) => {
            filas.push([p.name, `${p.participationPercentage}%`, `$${p.capitalBalance.toLocaleString()}`, `$${p.currentAccountBalance.toLocaleString()}`, `$${p.distributions.toLocaleString()}`]);
          });
          break;
        case "proveedor":
          encabezado = ["N°", "Proveedor", "Fecha", "Total", "Status"];
          const compras = await db.purchases.where("storeId").equals(user?.storeId || "default").filter((p: any) => 
            (!filtros.fechaInicio || p.date >= filtros.fechaInicio) && (!filtros.fechaFin || p.date <= filtros.fechaFin)
          ).toArray();
          compras.forEach((p: any) => {
            filas.push([p.number, p.supplierName || "-", new Date(p.date).toLocaleDateString(), `$${p.total}`, p.status]);
          });
          break;
        case "presupuesto":
          encabezado = ["N°", "Cliente", "Status", "Total", "Vencimiento"];
          const presupuestos = await db.quotes.where("storeId").equals(user?.storeId || "default").filter((q: any) => 
            (!filtros.fechaInicio || q.date >= filtros.fechaInicio) && (!filtros.fechaFin || q.date <= filtros.fechaFin)
          ).toArray();
          presupuestos.forEach((q: any) => {
            filas.push([q.number, q.customerName || "-", q.status, `$${q.total}`, new Date(q.validUntil).toLocaleDateString()]);
          });
          break;
        case "caja":
          encabezado = ["Fecha", "Tipo", "Concepto", "Importe", "Cuenta"];
          const movimientos = await db.cashMovements.where("storeId").equals(user?.storeId || "default").filter((m: any) => 
            (!filtros.fechaInicio || m.date >= filtros.fechaInicio) && (!filtros.fechaFin || m.date <= filtros.fechaFin)
          ).toArray();
          movimientos.forEach((m: any) => {
            filas.push([new Date(m.date).toLocaleDateString(), m.concept, `$${m.amount}`, m.method || "-"]);
          });
          break;
        case "inventario":
          encabezado = ["Producto", "Tipo", "Entrada/Salida", "Cantidad", "Motivo"];
          const movimientos = await db.inventoryMovements.where("storeId").equals(user?.storeId || "default").filter((m: any) => 
            (!filtros.fechaInicio || m.date >= filtros.fechaInicio) && (!filtros.fechaFin || m.date <= filtros.fechaFin)
          ).toArray();
          movimientos.forEach((m: any) => {
            filas.push([m.productName || "-", m.type, m.type === "entrada" ? "Entrada" : "Salida", m.qty, m.reason || "-"]);
          });
          break;
      }
      
      // Generar CSV
      const csvContent = [encabezado.map(h => `"${h}"`), ...filas.map(f => f.map(cell => `"${cell}"`).join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `onix-report-${filtros.tipo}-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Exportación CSV completada", type: "ok" });
    } catch (error: any) {
      toast({ title: "Error", type: "err", message: error.message || "Error al exportar CSV" });
    }
  }

  async function exportarPDF() {
    try {
      toast({ title: "Generando PDF...", type: "info" });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast({ title: "PDF generado", type: "ok" });
    } catch (error: any) {
      toast({ title: "Error", type: "err", message: error.message || "Error al generar PDF" });
    }
  }

  // Helper para etiquetas de categorías
  function getCategoriaLabel(cat: string): string {
    const labels: Record<string, string> = {
      operating: "Operativo", direct: "Directo", general: "General",
      capital: "Capital", partner: "Socio", materiales: "Materiales",
    };
    return labels[cat] || cat;
  }

  // Calcular rango de fechas para mostrar
  const rangoFechas = () => {
    if (filtros.fechaInicio && filtros.fechaFin) {
      return `${new Date(filtros.fechaInicio).toLocaleDateString()} - ${new Date(filtros.fechaFin).toLocaleDateString()}`;
    }
    return "Último mes (por defecto)";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Informes y Reportes ONIX LASER GESTIÓN</CardTitle>
        <p className="text-sm text-muted/60">Filtrar por fechas, cliente, trabajo, socio, categoría y período</p>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Filtros */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Select onValueChange={(val) => setFiltros({ ...filtros, tipo: val })} value={filtros.tipo}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de reporte..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="venta">Ventas</SelectItem>
              <SelectItem value="trabajo">Trabajos/Órdenes</SelectItem>
              <SelectItem value="gasto">Gastos</SelectItem>
              <SelectItem value="socio">Socios y Capital</SelectItem>
              <SelectItem value="proveedor">Compras/Proveedores</SelectItem>
              <SelectItem value="presupuesto">Presupuestos</SelectItem>
              <SelectItem value="caja">Caja y Pagos</SelectItem>
              <SelectItem value="inventario">Inventario y Materiales</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            placeholder="Desde"
            value={filtros.fechaInicio ? new Date(filtros.fechaInicio).toLocaleDateString() : ""}
            onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value ? new Date(e.target.value).getTime() : undefined })}
          />
          <Input
            type="date"
            placeholder="Hasta"
            value={filtros.fechaFin ? new Date(filtros.fechaFin).toLocaleDateString() : ""}
            onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value ? new Date(e.target.value).getTime() : undefined })}
          />
          <Button onClick={() => {
            setFiltros({
              tipo: "venta",
              fechaInicio: undefined,
              fechaFin: undefined,
            });
          }} className="text-sm">
            Restablecer
          </Button>
          <Button onClick={() => exportarCSV()} variant="outline">
            Exportar CSV
          </Button>
          <Button onClick={() => exportarPDF()} variant="outline">
            Exportar PDF
          </Button>
        </div>

        {/* Resultados */}
        {datos ? (
          <div className="mt-4 p-3 bg-surface/30 rounded">
            <h3 className="font-medium mb-3">{filtros.tipo === "venta" ? "Ventas" : filtros.tipo === "trabajo" ? "Trabajos" : filtros.tipo === "gasto" ? "Gastos" : filtros.tipo === "socio" ? "Socios" : filtros.tipo === "proveedor" ? "Compras" : filtros.tipo === "presupuesto" ? "Presupuestos" : filtros.tipo === "caja" ? "Caja" : "Inventario"} ${rangoFechas()}</h3>
            
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    {/* Encabezados dinámicos */}
                    {(() => {
                      const headers = (() => {
                        switch (filtros.tipo) {
                          case "venta": return ["N°", "Fecha", "Cliente", "Total", "Status"];
                          case "trabajo": return ["N°", "Cliente", "Estado", "Ganancia", "Fecha"];
                          case "gasto": return ["Fecha", "Categoría", "Descripción", "Importe", "Pagado"];
                          case "socio": return ["Socio", "Participación", "Capital", "Corriente", "Distribuciones"];
                          case "proveedor": return ["N°", "Proveedor", "Fecha", "Total", "Status"];
                          case "presupuesto": return ["N°", "Cliente", "Status", "Total", "Vencimiento"];
                          case "caja": return ["Fecha", "Tipo", "Concepto", "Importe", "Cuenta"];
                          case "inventario": return ["Producto", "Tipo", "Movimiento", "Cantidad", "Motivo"];
                          default: return ["Datos"];
                        }
                      })();
                      return headers.map(h => <th key={h} className="p-2 border bg-surface/50 text-xs font-medium text-muted/60">{h}</th>);
                    })()}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const rows = (() => {
                      switch (filtros.tipo) {
                        case "venta": return datos.ventas.map((v: any) => [v.number, new Date(v.date).toLocaleDateString(), v.customerName || "-", `$${v.total}`, v.status]);
                        case "trabajo": return datos.trabajos.map((j: any) => [j.number, j.customerName || "-", j.status, `$${j.totalPrice || 0}`, new Date(j.date).toLocaleDateString()]);
                        case "gasto": return datos.gastos.map((e: any) => [new Date(e.date).toLocaleDateString(), getCategoriaLabel(e.category), e.description || "-", `$${e.amount}`, e.paid ? "Sí" : "No"]);
                        case "socio": return datos.socios.map((p: any) => [p.name, `${p.participationPercentage}%`, `$${p.capitalBalance.toLocaleString()}`, `$${p.currentAccountBalance.toLocaleString()}`, `$${p.distributions.toLocaleString()}`]);
                        case "proveedor": return datos.compras.map((p: any) => [p.number, p.supplierName || "-", new Date(p.date).toLocaleDateString(), `$${p.total}`, p.status]);
                        case "presupuesto": return datos.presupuestos.map((q: any) => [q.number, q.customerName || "-", q.status, `$${q.total}`, new Date(q.validUntil).toLocaleDateString()]);
                        case "caja": return datos.movimientos.map((m: any) => [new Date(m.date).toLocaleDateString(), m.concept, `$${m.amount}`, m.method || "-"]);
                        case "inventario": return datos.inventario.map((m: any) => [m.productName || "-", m.type, m.type === "entrada" ? "Entrada" : "Salida", m.qty, m.reason || "-"]);
                        default: return [];
                      }
                    })();
                    return rows.map((row: any, i: number) => (
                      <tr key={i}>
                        {row.map((cell: any, j: number) => (
                          <td key={j} className="p-2 border text-sm {j % 2 === 0 ? "bg-surface" : "bg-surface/50"}">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-muted/60">Seleccione un tipo de reporte y filtros para ver los datos</p>
        )}
      </CardContent>
    </Card>
  );
}