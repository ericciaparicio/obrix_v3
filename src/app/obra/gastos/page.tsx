"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type TipoGasto = { id: string; nombre: string };

export default function GastosPage() {
  const router = useRouter();
  const [obraId, setObraId] = useState<string | null | undefined>(undefined);
  const [tipos, setTipos] = useState<TipoGasto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/obra/me").then(async (res) => {
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 404) {
        // FR-013/AC-13: sin obra creada, redirigir a crearla primero.
        router.push("/obra");
        return;
      }
      const obra = await res.json();
      setObraId(obra.id);
    });

    fetch("/api/tipos-gasto").then(async (res) => {
      if (res.ok) setTipos(await res.json());
    });
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!obraId) return;
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const body = {
      tipoGastoId: formData.get("tipoGastoId"),
      monto: Number(formData.get("monto")),
      moneda: "ARS",
      fecha: formData.get("fecha"),
    };

    const res = await fetch(`/api/obra/${obraId}/gastos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo registrar el gasto");
      return;
    }

    setSuccess(true);
    event.currentTarget.reset();
  }

  if (obraId === undefined) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="card">
      <h1>Registrar gasto</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Tipo de gasto
          <select name="tipoGastoId" required defaultValue="">
            <option value="" disabled>
              Seleccioná un tipo
            </option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Monto (ARS)
          <input name="monto" type="number" step="0.01" min="0.01" required />
        </label>
        <label>
          Fecha
          <input name="fecha" type="date" required />
        </label>
        {error && <p className="error">{error}</p>}
        {success && <p>Gasto registrado correctamente.</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Registrar gasto"}
        </button>
      </form>
    </div>
  );
}
