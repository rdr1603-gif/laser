"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Wrench,
  Banknote,
  ShoppingCart,
  Package,
  Truck,
  UserCog,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/stores/auth";
import { ROLE_LABELS } from "@/lib/types";

const NAV = [
  { href: "/panel", label: "Dashboard", icon: LayoutDashboard },
  { href: "/panel/clientes", label: "Clientes", icon: Users },
  { href: "/panel/presupuestos", label: "Presupuestos", icon: FileText },
  { href: "/panel/trabajos", label: "Trabajos", icon: Wrench },
  { href: "/panel/caja", label: "Caja", icon: Banknote },
  { href: "/panel/compras", label: "Compras", icon: ShoppingCart },
  { href: "/panel/inventario", label: "Inventario", icon: Package },
  { href: "/panel/proveedores", label: "Proveedores", icon: Truck },
  { href: "/panel/socios", label: "Socios", icon: UserCog },
  { href: "/panel/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/panel/configuracion", label: "Configuración", icon: Settings },
];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-bg">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-secondary text-white flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-white/10 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-black text-sm">
            O
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm truncate leading-tight">ONIX LASER</p>
            <p className="text-[11px] text-white/50 truncate">Gestión</p>
          </div>
          <button
            className="lg:hidden text-white/60"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2.5 no-scrollbar">
          {NAV.map((item) => {
            const active =
              item.href === "/panel"
                ? pathname === "/panel"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-2.5 h-10 rounded-xl text-sm font-medium transition mb-0.5 ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0) || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate leading-tight">
                {user?.name || "Usuario"}
              </p>
              <p className="text-[11px] text-white/50 truncate">
                {user ? ROLE_LABELS[user.role] : ""}
              </p>
            </div>
            <button
              onClick={logout}
              className="text-white/70 hover:text-white px-2"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 lg:ml-64 min-w-0 flex flex-col">
        <header className="h-14 shrink-0 bg-surface border-b border-border flex items-center gap-3 px-4 sticky top-0 z-30">
          <button
            className="lg:hidden text-ink"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">ONIX LASER GESTIÓN</p>
          </div>
        </header>

        <main className="flex-1 min-w-0 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
