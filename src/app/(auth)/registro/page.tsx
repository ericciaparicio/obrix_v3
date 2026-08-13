"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegistroPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const body = {
      email: formData.get("email"),
      password: formData.get("password"),
      nombre: formData.get("nombre"),
      apellido: formData.get("apellido"),
      celular: formData.get("celular"),
    };

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo completar el registro");
      return;
    }

    router.push("/login");
  }

  return (
    <div className="card">
      <h1>Crear cuenta</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Contraseña
          <input name="password" type="password" required minLength={8} />
        </label>
        <label>
          Nombre
          <input name="nombre" type="text" required />
        </label>
        <label>
          Apellido
          <input name="apellido" type="text" required />
        </label>
        <label>
          Celular
          <input name="celular" type="tel" required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>
      <p>
        ¿Ya tenés cuenta? <Link href="/login">Iniciar sesión</Link>
      </p>
    </div>
  );
}
