"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  BookOpen,
  Boxes,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Menu,
  Package,
  Printer,
  Receipt,
  Settings,
  ShoppingCart,
  Users,
  UserCog,
  Wrench,
  X,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/stores/ui";
import { ROLE_LABELS } from "@/lib/types";
import type { Action } from "@/lib/permissions";
import { LogoutButton, PanelGuard, SubscriptionBanner, SyncIndicator, useCan } from "@/components/Access";
import { Avatar } from "@/components/Avatar";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  action: Action;
  group: "principal" | "catalogo" | "taller" | "admin";
}

const NAV: NavItem[] = [
  { href: "/panel", label: "Inicio", icon: <LayoutDashboard className="w-[18px] h-[18px]" />, action: "products.view", group: "principal" },
  { href: "/panel/pos", label: "Punto de venta", icon: <ShoppingCart className="w-[18px] h-[18px]" />, action: "pos", group: "principal" },
  { href: "/panel/trabajos", label: "Órdenes de trabajo", icon: <Wrench className="w-[18px] h-[18px]" />, action: "jobs.view", group: "taller" },
  { href: "/panel/caja", label: "Caja", icon: <Banknote className="w-[18px] h-[18px]" />, action: "cash.view", group: "principal" },
  { href: "/panel/compras", label: "Compras", icon: <ClipboardList className="w-[18px] h-[18px]" />, action: "purchases.view", group: "catalogo" },
  { href: "/panel/gastos", label: "Gastos", icon: <Banknote className="w-[18px] h-[18px]" />, action: "expenses.view", group: "principal" },
  { href: "/panel/productos", label: "Productos", icon: <Package className="w-[18px] h-[18px]" />, action: "products.view", group: "catalogo" },
  { href: "/panel/servicios", label: "Servicios", icon: <Printer className="w-[18px] h-[18px]" />, action: "services.view", group: "catalogo" },
  { href: "/panel/inventario", label: "Inventario", icon: <Boxes className="w-[18px] h-[18px]" />, action: "inventory.view", group: "catalogo" },
  { href: "/panel/presupuestos", label: "Presupuestos", icon: <FileText className="w-[18px] h-[18px]" />, action: "quotes.view", group: "taller" },
  { href: "/panel/clientes", label: "Clientes", icon: <Users className="w-[18px] h-[18px]" />, action: "customers.view", group: "principal" },
  { href: "/panel/ventas", label: "Ventas", icon: <Receipt className="w-[18px] h-[18px]" />, action: "sales.viewOwn", group: "principal" },
  { href: "/panel/proveedores", label: "Proveedores", icon: <ClipboardList className="w-[18px] h-[18px]" />, action: "suppliers.view", group: "catalogo" },
  { href: "/panel/reportes", label: "Reportes", icon: <BookOpen className="w-[18px] h-[18px]" />, action: "reports.view", group: "admin" },
  { href: "/panel/socios", label: "Socios y Capital", icon: <UserCog className="w-[18px] h-[18px]" />, action: "partners.view", group: "admin" },
  { href: "/panel/alertas", label: "Alertas", icon: <AlertCircle className="w-[18px] h-[18px]" />, action: "alerts.view", group: "admin" },
  { href: "/panel/pruebas", label: "Pruebas FASE 5", icon: <Wrench className="w-[18px] h-[18px]" />, action: "tests.run", group: "admin" },
  { href: "/panel/configuracion", label: "Configuración", icon: <Settings className="w-[18px] h-[18px]" />, action: "settings.manage", group: "admin" },
];

const GROUP_TITLES: Record<NavItem["group"], string> = {
  principal: "",
  catalogo: "Catálogo",
  taller: "Taller",
  admin: "Administración",
};

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelGuard>
      <Shell>{children}</Shell>
    </PanelGuard>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user);
  const store = useAuth((s) => s.store);
  const pathname = usePathname();
  const can = useCan();
  const [open, setOpen] = useState(false);

  const visible = NAV.filter((n) => can(n.action));

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-secondary text-white flex flex-col transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-white/10 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-black text-sm">O</div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm truncate leading-tight">{store?.name || "ONIX"}</p>
            <p className="text-[11px] text-white/50 truncate">ONIX</p>
          </div>
          <button className="lg:hidden text-white/60" onClick={() => setOpen(false)} aria-label="Cerrar menú">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2.5 no-scrollbar">
          {visible.map((item, i) => {
            const prev = visible[i - 1];
            const showTitle = item.group !== "principal" && (!prev || prev.group !== item.group);
            const active = item.href === "/panel" ? pathname === "/panel" : pathname.startsWith(item.href);
            return (
              <div key={item.href}>
                {showTitle && (
                  <p className="px-2.5 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/35">
                    {GROUP_TITLES[item.group]}
                  </p>
                )}
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 px-2.5 h-10 rounded-xl text-sm font-medium transition ${
                    active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <Avatar name={user?.name || "?"} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate leading-tight">{user?.name}</p>
              <p className="text-[11px] text-white/50 truncate">{user ? ROLE_LABELS[user.role] : ""}</p>
            </div>
            <LogoutButton className="text-white/70 hover:text-white px-2" />
          </div>
        </aside>

        {open && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setOpen(false)} />}

        {/* Contenido */}
        <div className="flex-1 lg:ml-64 min-w-0 flex flex-col">
          <header className="h-14 shrink-0 bg-surface border-b border-edge flex items-center gap-3 px-4 sticky top-0 z-30">
            <button className="lg:hidden text-ink" onClick={() => setOpen(true)} aria-label="Abrir menú">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{store?.name || "ONIX"}</p>
            </div>
            <SyncIndicator />
          </header>

          <SubscriptionBanner />

          <main className="flex-1 min-w-0 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}