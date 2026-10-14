"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useAuth } from "@/stores/auth";
import { db } from "@/lib/db";
import type { User } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await db.users.where("username").equals(username).first();

      if (!user) {
        setError("Usuario no encontrado");
        setLoading(false);
        return;
      }

      if (!user.active) {
        setError("Usuario desactivado");
        setLoading(false);
        return;
      }

      // Simple password check (in production, use proper hashing)
      if (user.passwordHash !== password) {
        setError("Contraseña incorrecta");
        setLoading(false);
        return;
      }

      login(user);
      router.push("/panel");
    } catch (err) {
      setError("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-black text-white">O</span>
          </div>
          <h1 className="text-2xl font-bold text-ink">ONIX LASER GESTIÓN</h1>
          <p className="text-muted">Sistema de gestión para grabado y corte láser</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <Input
            label="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && (
            <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted mt-4">
          ¿No tienes cuenta? Contacta al administrador
        </p>
      </div>
    </div>
  );
}
