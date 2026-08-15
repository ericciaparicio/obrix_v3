"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (!result || result.error) {
      // AC-21: email o contraseña incorrectos.
      setError("Email o contraseña incorrectos");
      return;
    }

    // Navegación completa (no router.push): signIn() cambia la cookie de
    // sesión por fuera del router de Next.js, y una navegación client-side
    // puede servir el layout raíz (header/menú) desde el router cache de
    // ANTES del login — sin sesión — hasta el próximo hard refresh. El
    // reporte financiero redirige solo a /obra si el constructor todavía
    // no tiene una obra creada (primer login tras registrarse).
    window.location.href = "/obra/reporte";
  }

  return (
    <div className="card">
      <Logo />
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Contraseña
          <input name="password" type="password" required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
      <p>
        ¿No tenés cuenta? <Link href="/registro">Crear cuenta</Link>
      </p>
    </div>
  );
}
