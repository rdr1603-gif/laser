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
  Calculator,
  UsersRound,
} from "lucide-react";
import { useAuth } from "@/stores/auth";
import { ROLE_LABELS } from "@/lib/types";

const NAV = [
  { href: "/panel", label: "Dashboard", icon: LayoutDashboard },
  { href: "/panel/clientes", label: "Clientes", icon: Users },
  { href: "/panel/presupuestador", label: "Presupuestador", icon: Calculator },
  { href: "/panel/presupuestos", label: "Presupuestos", icon: FileText },
  { href: "/panel/trabajos", label: "Trabajos", icon: Wrench },
  { href: "/panel/caja-completa", label: "Caja", icon: Banknote },
  { href: "/panel/compras", label: "Compras", icon: ShoppingCart },
  { href: "/panel/inventario", label: "Inventario", icon: Package },
  { href: "/panel/proveedores", label: "Proveedores", icon: Truck },
  { href: "/panel/estadisticas-socios", label: "Estadísticas de socios / Retribución de socios", icon: UsersRound },
  { href: "/panel/socios", label: "Socios", icon: UserCog },
  { href: "/panel/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/panel/configuracion", label: "Configuración", icon: Settings },
];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#0a0a0a]">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#111111] border-r border-[#d4af37]/20 flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center gap-3 px-4 border-b border-[#d4af37]/20 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#b8941f] flex items-center justify-center">
            <span className="text-xl font-black text-[#1a1a2e]">O</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm truncate leading-tight text-[#d4af37]">ONIX LASER</p>
            <p className="text-[11px] text-[#d4af37]/50 truncate">Gestión profesional</p>
          </div>
          <button className="lg:hidden text-[#d4af37]/60" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 no-scrollbar">
          {NAV.map((item) => {
            const active = item.href === "/panel" ? pathname === "/panel" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition mb-0.5 ${
                  active
                    ? "bg-[#d4af37]/15 text-[#d4af37] border-l-2 border-[#d4af37]"
                    : "text-white/60 hover:bg-white/5 hover:text-white border-l-2 border-transparent"
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#d4af37]/20 p-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-sm font-bold text-[#d4af37]">
              {user?.name?.charAt(0) || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate leading-tight text-white">{user?.name || "Usuario"}</p>
              <p className="text-[11px] text-[#d4af37]/50 truncate">{user ? ROLE_LABELS[user.role] : ""}</p>
            </div>
            <button onClick={logout} className="text-[#d4af37]/60 hover:text-[#d4af37] px-2" title="Cerrar sesión">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 lg:ml-72 min-w-0 flex flex-col">
        <header className="h-16 shrink-0 bg-[#111111] border-b border-[#d4af37]/20 flex items-center gap-3 px-4 sticky top-0 z-30">
          <button className="lg:hidden text-[#d4af37]" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-[#d4af37]">ONIX LASER GESTIÓN</p>
          </div>
        </header>

        <main className="flex-1 min-w-0 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
