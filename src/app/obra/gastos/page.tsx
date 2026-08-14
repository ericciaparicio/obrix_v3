"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type TipoGasto = { id: string; nombre: string };
type Gasto = {
  id: string;
  tipoGastoId: string;
  tipoGastoNombre: string;
  monto: number;
  fecha: string;
};

const formatoARS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export default function GastosPage() {
  const router = useRouter();
  const [obraId, setObraId] = useState<string | null | undefined>(undefined);
  const [tipos, setTipos] = useState<TipoGasto[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const cargarGastos = useCallback(async (id: string) => {
    const res = await fetch(`/api/obra/${id}/gastos`);
    if (res.ok) setGastos(await res.json());
  }, []);

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
      cargarGastos(obra.id);
    });

    fetch("/api/tipos-gasto").then(async (res) => {
      if (res.ok) setTipos(await res.json());
    });
  }, [router, cargarGastos]);

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

    const url = editandoId
      ? `/api/obra/${obraId}/gastos/${editandoId}`
      : `/api/obra/${obraId}/gastos`;
    const res = await fetch(url, {
      method: editandoId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo guardar el gasto");
      return;
    }

    setSuccess(true);
    setEditandoId(null);
    event.currentTarget.reset();
    cargarGastos(obraId);
  }

  function empezarEdicion(gasto: Gasto, form: HTMLFormElement) {
    setEditandoId(gasto.id);
    setSuccess(false);
    setError(null);
    form.reset();
    (form.elements.namedItem("tipoGastoId") as HTMLSelectElement).value = gasto.tipoGastoId;
    (form.elements.namedItem("monto") as HTMLInputElement).value = String(gasto.monto);
    (form.elements.namedItem("fecha") as HTMLInputElement).value = gasto.fecha.slice(0, 10);
  }

  async function eliminarGasto(gastoId: string) {
    if (!obraId) return;
    const res = await fetch(`/api/obra/${obraId}/gastos/${gastoId}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      cargarGastos(obraId);
    }
  }

  if (obraId === undefined) {
    return <p>Cargando...</p>;
  }

  return (
    <div>
      <div className="card">
        <h1>{editandoId ? "Editar gasto" : "Registrar gasto"}</h1>
        <form onSubmit={handleSubmit} id="gasto-form">
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
          {success && <p>Gasto guardado correctamente.</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Guardando..." : editandoId ? "Guardar cambios" : "Registrar gasto"}
          </button>
          {editandoId && (
            <button
              type="button"
              onClick={() => {
                setEditandoId(null);
                document.getElementById("gasto-form")?.dispatchEvent(
                  new Event("reset", { bubbles: true }),
                );
              }}
            >
              Cancelar edición
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <h2>Gastos registrados</h2>
        {gastos.length === 0 ? (
          <p>Todavía no hay gastos registrados.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Fecha</th>
                <th style={{ textAlign: "left" }}>Tipo</th>
                <th style={{ textAlign: "right" }}>Monto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((gasto) => (
                <tr key={gasto.id}>
                  <td>{gasto.fecha.slice(0, 10)}</td>
                  <td>{gasto.tipoGastoNombre}</td>
                  <td style={{ textAlign: "right" }}>{formatoARS.format(gasto.monto)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => {
                        const form = document.getElementById("gasto-form") as HTMLFormElement;
                        empezarEdicion(gasto, form);
                      }}
                    >
                      Editar
                    </button>
                    <button type="button" onClick={() => eliminarGasto(gasto.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
