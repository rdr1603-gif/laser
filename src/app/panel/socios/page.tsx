"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/stores/ui";
import { db } from "@/lib/db";
import { Partner, MoneyDistributionConfig, DistributionRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { useToast } from "@/stores/ui";
import { useNavigate } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function SociosPage() {
  const { user } = useAuth();
  const [showNewPartner, setShowNewPartner] = useState(false);
  [partners, setPartners] = useState<Array<Partner>>([]);
  [config, setConfig] = useState<MoneyDistributionConfig | null>(null);
  [distributions, setDistributions] = useState<Array<DistributionRecord>>([]);
  [form, setForm] = useState({
    name: "",
    participationPercentage: 50,
    initialContribution: 0,
    additionalContributions: 0,
    loansToBusiness: 0,
    personalExpenses: 0,
    withdrawals: 0,
    distributions: 0,
    active: true,
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    // Cargar socios
    const all Partners = await db.partners.where("storeId").equals(user?.storeId || "default").toArray();
    setPartners(all Partners);

    // Cargar configuración de reinversión
    const cfg = await db.moneyDistributionConfigs.where("storeId").equals(user?.storeId || "default").limit(1).toArray();
    setConfig(cfg[0] || null);

    // Cargar historial de distribuciones
    const dists = await db.distributionRecords
      .where("storeId")
      .equals(user?.storeId || "default")
      .sortBy("date")
      .toArray();
    setDistributions(dists);
  }

  async function handleSavePartner() {
    try {
      const now = Date.now();
      const newPartner: any = {
        storeId: user?.storeId || "default",
        name: form.name,
        role: "active",
        participationPercentage: form.participationPercentage,
        initialContribution: form.initialContribution,
        additionalContributions: form.additionalContributions,
        loansToBusiness: form.loansToBusiness,
        personalExpenses: form.personalExpenses,
        withdrawals: form.withdrawals,
        distributions: form.distributions,
        capitalBalance: form.initialContribution,
        currentAccountBalance: form.initialContribution,
        active: form.active,
        createdAt: now,
        updatedAt: now,
        createdBy: user?.id || 1,
      };

      await db.partners.add(newPartner);
      setShowNewPartner(false);
      setForm({
        name: "",
        participationPercentage: 50,
        initialContribution: 0,
        additionalContributions: 0,
        loansToBusiness: 0,
        personalExpenses: 0,
        withdrawals: 0,
        distributions: 0,
        active: true,
      });
      toast({ title: "Socio registrado", type: "ok" });
      await cargarDatos();
    } catch (error: any) {
      toast({ title: "Error", type: "err", message: error.message || "Error al registrar socio" });
    }
  }

  async function handleDeletePartner(id: number) {
    try {
      await db.partners.delete(id);
      toast({ title: "Socio dado de baja", type: "ok" });
      await cargarDatos();
    } catch (error: any) {
      toast({ title: "Error", type: "err", message: error.message || "Error al dar de baja el socio" });
    }
  }

  async function handleRecordDistribution() {
    try {
      // Obtener configuración
      const cfg = await getReinversionConfig(user?.storeId || "default");
      if (!cfg) {
        toast({ title: "Error", type: "err", message: "Configuración de reinversión no encontrada" });
        return;
      }

      // Calcular ganancia distribuible
      const endDate = Date.now();
      const startDate = endDate - 30 * 24 * 60 * 60 * 1000; // último mes

      const result = await calculatePeriodResult(
        user?.storeId || "default",
        startDate,
        endDate
      );

      if (result.netResult <= 0) {
        toast({ title: "Sin distribución", type: "info", message: "El resultado del período es negativo o cero. No hay ganancias para distribuir." });
        return;
      }

      // Aplicar reservas y reinversión
      const distConfig: any = {
        reinvestmentPercentage: cfg.reinvestmentPercentage || 30,
        minDistributionAmount: cfg.minDistributionAmount || 1000,
        reservePercentage: 0, // Por defecto 0 o configurable
      };

      const applied = await applyReservesAndReinvestment(result.netResult, distConfig);

      if (applied.baseForDistribution <= 0) {
        toast({ title: "Sin distribución", type: "info", message: "Después de aplicar reservas e inversión, no queda importe para distribuir." });
        return;
      }

      // Calcular participaciones
      const partners = await db.partners.where("storeId").equals(user?.storeId || "default").where("active").equals(true).toArray();

      if (partners.length === 0) {
        toast({ title: "Error", type: "err", message: "No hay socios activos definidos" });
        return;
      }

      const shares = await calculatePartnerShares(
        user?.storeId || "default",
        applied.baseForDistribution,
        partners.map((p) => ({ id: p.id, name: p.name, participationPercentage: p.participationPercentage }))
      );

      // Registrar distribución para cada socio
      for (const share of shares) {
        await db.distributionRecords.add({
          storeId: user?.storeId || "default",
          period: Math.floor(startDate / 1000000000), // período en meses simplificado
          totalDistributable: applied.baseForDistribution,
          partnerPercentage: share.participationPercentage,
          partnerShare: share.partnerName,
          partnerId: share.partnerId,
          partnerName: share.partnerName,
          amount: share.shareAmount,
          date: Date.now(),
          confirmed: false,
          note: `Distribución del período: ${result.revenue.toLocaleString()} ingresos - ${result.costs.toLocaleString()} costos`,
        });

        // Actualizar saldos de los socios
        const partnerIndex = partners.findIndex((p) => p.id === share.partnerId);
        if (partnerIndex >= 0) {
          await db.partners.update(partners[partnerIndex].id!, {
            currentAccountBalance: partners[partnerIndex].currentAccountBalance + share.shareAmount,
            distributions: partners[partnerIndex].distributions + share.shareAmount,
          });
        }
      }

      toast({ title: "Distribución registrada", type: "ok", message: `Se distribuyeron $${applied.baseForDistribution.toLocaleString()} entre ${partners.length} socios` });
      await cargarDatos();
    } catch (error: any) {
      toast({ title: "Error", type: "err", message: error.message || "Error al procesar distribución" });
    }
  }

  // Formulario nuevo socio
  const handleNewPartner = () => setShowNewPartner(true);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Socios y Capital</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Nueva socio */}
        <div className="border rounded p-4 bg-surface/50">
          <h3 className="font-medium mb-4">Nuevo Socio</h3>
          <Select onValueChange={(val) => setForm((prev) => ({ ...prev, participationPercentage: Number(val) }))} value={form.participationPercentage.toString()}>
            <SelectTrigger>
              <SelectValue placeholder="Participación %..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={10}>10%</SelectItem>
              <SelectItem value={25}>25%</SelectItem>
              <SelectItem value={50}>50%</SelectItem>
              <SelectItem value={75}>75%</SelectItem>
              <SelectItem value={100}>100%</SelectItem>
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <Input placeholder="Nombre del socio" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            <Input type="number" min={0} max={1000000} step={1000} placeholder="Aporte inicial" value={form.initialContribution} onChange={(e) => setForm((prev) => ({ ...prev, initialContribution: Number(e.target.value) }))} />
          </div>

          <Input type="number" min={0} step={1000} placeholder="Aportes adicionales" value={form.additionalContributions} onChange={(e) => setForm((prev) => ({ ...prev, additionalContributions: Number(e.target.value) }))} />
          <Input type="number" min={0} step={1000} placeholder="Préstamos al negocio" value={form.loansToBusiness} onChange={(e) => setForm((prev) => ({ ...prev, loansToBusiness: Number(e.target.value) }))} />
          <Input type="number" min={0} step={1000} placeholder="Gastos personales" value={form.personalExpenses} onChange={(e) => setForm((prev) => ({ ...prev, personalExpenses: Number(e.target.value) }))} />

          <div className="mt-4">
            <Button onClick={handleSavePartner} disabled={!form.name || form.participationPercentage <= 0}>
              Guardar Socio
            </Button>
            <Button
              variant="outline"
              onClick={handleNewPartner}
              className="mt-2 w-full"
            >
              Cancelar
            </Button>
          </div>

          <p className="text-sm text-muted/60 mt-2">
            Los porcentajes deben sumar 100% cuando haya 2 o más socios. Participación 50%/50% por defecto.
          </p>
        </div>

        {/* Lista de Socios */}
        <div>
          <h3 className="font-medium mb-3">Socios Registrados</h3>
          {partners.length === 0 ? (
            <p className="text-muted/60">No hay socios registrados. Agregue el primero arriba.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCategory>Socio</TableCategory>
                  <TableCategory>Participación</TableCategory>
                  <TableCategory>Capital</TableCategory>
                  <TableCategory>Corriente</TableCategory>
                  <TableCategory>Distribuciones</TableCategory>
                  <TableCategory>Acciones</TableCategory>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                        {p.participationPercentage}%
                      </span>
                    </TableCell>
                    <TableCell>${p.capitalBalance.toLocaleString()}</TableCell>
                    <TableCell>${p.currentAccountBalance.toLocaleString()}</TableCell>
                    <TableCell>${p.distributions.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/panel/socios/${p.id}`)}
                      >
                        Ver
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePartner(p.id)}
                      >
                        Dar de baja
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Configuración de Reinversión */}
        {config ? (
          <div className="mt-4 p-3 bg-surface/30 rounded">
            <h4 className="font-medium mb-2">Configuración de Fondo de Reinversión</h4>
            <div className="grid grid-cols-2 gap-2">
              <span className="text-sm">% Reinversión: {cfg.reinvestmentPercentage}%</span>
              <span className="text-sm">Mín. Distribución: ${cfg.minDistributionAmount?.toLocaleString() || "1000"}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/panel/configuracion")}
              className="mt-2 w-full"
            >
              Editar Configuración
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted/60">No hay configuración de reinversión. Defínala en Configuración.</p>
        )}

        {/* Registrar Distribución */}
        <div className="mt-4 p-3 bg-surface/30 rounded">
          <h4 className="font-medium mb-2">Distribución de Utilidades (Próxima Liquidación)</h4>
          {result ? (
            <div>
              <p className="font-medium">Resultado del período: ${result.revenue.toLocaleString()}</p>
              <p className="text-muted/60">Costos: ${result.costs.toLocaleString()}</p>
              <p className="font-medium text-green-600">Utilidad neta: ${result.netResult.toLocaleString()}</p>
              <p className="text-muted/60">Disponible para distribución: ${applied?.baseForDistribution?.toLocaleString() || "0"}</p>
              <p className="text-muted/60">Fondo reinversión: ${applied?.reinvestmentAmount?.toLocaleString() || "0"}</p>
            </div>
          ) : (
            <p className="text-muted/60">Cargando...</p>
          )}

          <Button
            onClick={handleRecordDistribution}
            disabled={!result || result.netResult <= 0 || !partners.length}
            className="w-full mt-3"
          >
            {result && result.netResult > 0 && partners.length > 0 ? "Simular y Confirmar Distribución" : "No hay distribuciones este período"}
          </Button>
        </div>

        <p className="text-xs text-muted/60 mt-3">
          * La distribución nunca supera el importe autorizado disponible después de restar reservas y reinversión.
          * Los porcentajes se aplican sobre la utilidad neta confirmada.
        </p>
      </CardContent>
    </Card>
  );
}