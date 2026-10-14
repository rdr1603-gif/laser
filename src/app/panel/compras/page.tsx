"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/stores/ui";
import { useNavigate } from "next/navigation";
import { db } from "@/lib/db";
import { canDeductMaterial } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Check } from "lucide-react";
import { useToast } from "@/stores/ui";

export default function ComprasPage() {
  const { user } = useAuth();
  const [compras, setCompras] = useState<Array<{
    id: number;
    number: number;
    supplier: string;
    date: number;
    status: "pendiente" | "parcial" | "recibido" | "cancelado";
    total: number;
    paid: number;
    remaining: number;
  }>>([]);
  [compraForm, setCompraForm] = useState({
    supplier: "",
    items: [] as Array<{
      name: string;
      productId?: number;
      materialId?: number;
      qty: number;
      unit: string;
      unitPrice: number;
      total: number;
    }>,
    status: "pendiente",
    notes: "",
  });
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    cargarCompras();
  }, []);

  async function cargarCompras() {
    const all = await db.purchases.where("storeId").equals(user?.storeId || "default").toArray();
    setCompras(all);
  }

  async function handleSave() {
    try {
      // Validar que hay suficientes materiales en stock
      for (const item of compraForm.items) {
        if (item.productId || item.materialId) {
          const hasEnough = await canDeductMaterial(
            user?.storeId || "default",
            item.productId || item.materialId,
            item.qty
          );
          if (!hasEnough) {
            throw new Error(`Stock insuficiente para: ${item.name} (solicitado: ${item.qty})`);
          }
        }
      }

      const now = Date.now();
      const newCompra: any = {
        storeId: user?.storeId || "default",
        number: Math.max(1, ...(await db.purchases.where("storeId").equals(user?.storeId || "default").map((p) => p.number))) + 1,
        supplier: compraForm.supplier,
        date: now,
        status: "pendiente",
        items: compraForm.items.map((item: any) => ({
          ...item,
          id: uuidv4(),
        })),
        subtotal: compraForm.items.reduce((sum: number, i: any) => sum + i.total, 0),
        discount: 0,
        total: compraForm.items.reduce((sum: number, i: any) => sum + i.total, 0),
        paid: 0,
        remaining: compraForm.items.reduce((sum: number, i: any) => sum + i.total, 0),
        notes: compraForm.notes,
        createdAt: now,
        createdBy: user?.id || 1,
      };

      const id = await db.purchases.add(newCompra);

      // Registrar movimientos de inventario ENTRADA para cada item
      for (const item of newCompra.items) {
        await db.inventoryMovements.add({
          storeId: user?.storeId || "default",
          productId: item.productId || item.materialId,
          productName: item.name,
          type: "compra",
          before: 0,
          after: item.qty,
          reason: "compra_" + newCompra.id,
          referenceId: newCompra.id,
          referenceType: "purchase",
          userId: user?.id || 1,
          userName: user?.name || "Usuario",
          date: now,
          createdAt: now,
        });
      }

      // Registrar movimiento de caja (compra de materiales)
      await db.cashMovements.add({
        storeId: user?.storeId || "default",
        cashRegisterId: 1,
        type: "compra",
        concept: "Compra de materiales: " + newCompra.supplier,
        amount: newCompra.total,
        userId: user?.id || 1,
        userName: user?.name || "Usuario",
        date: now,
        referenceId: newCompra.id,
        referenceType: "purchase",
        notes: newCompra.notes,
      });

      setShowNew(false);
      setCompraForm({ supplier: "", items: [], status: "pendiente", notes: "" });
      toast({ title: "Compra registrada", type: "ok", message: "Compra y actualización de inventario completados" });
      await cargarCompras();
    } catch (error: any) {
      toast({ title: "Error", type: "err", message: error.message || "Error al registrar compra" });
    }
  }

  function addItem() {
    const newItem = {
      name: "",
      productId: undefined,
      materialId: undefined,
      qty: 1,
      unit: "unidad",
      unitPrice: 0,
      total: 0,
    };
    setCompraForm((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  }

  function removeItem(index: number) {
    setCompraForm((prev) => {
      const newItems = [...prev.items];
      newItems.splice(index, 1);
      return { ...prev, items: newItems };
    });
  }

  function calculateTotals() {
    const items = compraForm.items.map((item) => ({
      ...item,
      total: item.qty * item.unitPrice,
    }));
    const total = items.reduce((sum, i) => sum + i.total, 0);
    return { items, total };
  }

  const { items, total } = calculateTotals();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Compras y Proveedores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulario Nueva Compra */}
        <div className="border rounded p-4 bg-surface/50">
          <h3 className="font-medium mb-4">Nueva Compra</h3>
          <Select
            onValueChange={(val) => setCompraForm((prev) => ({ ...prev, supplier: val }))}
            value={compraForm.supplier}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar proveedor..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nuevo proveedor</SelectItem>
              {/* Aquí irían los proveedores cargados de la BD */}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <Input
              placeholder="Fecha"
              value=""
              onChange={(e) => {}}
              readOnly
            />
            <Input
              placeholder="Estado"
              value={compraForm.status}
              onChange={(e) => setCompraForm((prev) => ({ ...prev, status: e.target.value as any }))}
            />
          </div>

          <Textarea
            placeholder="Notas"
            value={compraForm.notes}
            onChange={(e) => setCompraForm((prev) => ({ ...prev, notes: e.target.value }))}
            rows={2}
          />

          <div className="mt-4">
            <h4 className="font-semibold mb-2">Items de Compra</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {items.map((item, idx) => (
                <div key={idx} className="border rounded p-3 bg-surface/50">
                  <Input
                    placeholder="Material/Producto"
                    value={item.name}
                    onChange={(e) =>
                      setCompraForm((prev) => {
                        const newItems = [...prev.items];
                        newItems[idx].name = e.target.value;
                        return { ...prev, items: newItems };
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Cantidad"
                    min={1}
                    value={item.qty}
                    onChange={(e) =>
                      setCompraForm((prev) => {
                        const newItems = [...prev.items];
                        newItems[idx].qty = Number(e.target.value);
                        newItems[idx].total = newItems[idx].qty * newItems[idx].unitPrice;
                        return { ...prev, items: newItems };
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Precio unitario"
                    min={0}
                    step={0.01}
                    value={item.unitPrice}
                    onChange={(e) =>
                      setCompraForm((prev) => {
                        const newItems = [...prev.items];
                        newItems[idx].unitPrice = Number(e.target.value);
                        newItems[idx].total = newItems[idx].qty * newItems[idx].unitPrice;
                        return { ...prev, items: newItems };
                      })
                    }
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeItem(idx)}
                    className="mt-1 w-full"
                  >
                    Quitar
                  </Button>
                </div>
              ))}
            </div>
            <Button
              onClick={addItem}
              className="mt-2 w-full justify-end"
            >
              Agregar Item
            </Button>
          </div>

          <div className="mt-4 p-3 bg-surface/30 rounded">
            <div className="flex justify-between items-center">
              <span className="font-medium">Subtotal</span>
              <span>${total > 0 ? `$${total}` : "$0"}</span>
            </div>
            <span className="text-sm text-muted/60">Stock verificará al guardar</span>
          </div>

          <Button
            onClick={handleSave}
            disabled={total === 0 || compraForm.items.some((i) => i.qty <= 0 || i.unitPrice <= 0)}
            className="w-full"
          >
            {total > 0 ? "Registrar Compra" : "Agrega items primero"}
          </Button>
        </div>

        {/* Lista de Compras Existentes */}
        <div>
          <h3 className="font-medium mb-3">Historial de Compras</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>N°</TableCell>
                <TableCell>Proveedor</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compras.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.number}</TableCell>
                  <TableCell>{c.supplier}</TableCell>
                  <TableCell>{new Date(c.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        c.status === "recibido"
                          ? "bg-green-100 text-green-800"
                        : c.status === "pendiente"
                          ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {c.status}
                    </span>
                  </TableCell>
                  <TableCell>${c.total > 0 ? `$${c.total}` : "$0"}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/panel/compras/${c.id}`)}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}