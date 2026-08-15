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
  descripcion: string | null;
};

const formatoARS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export default function HistorialPage() {
  const router = useRouter();
  const [obraId, setObraId] = useState<string | null | undefined>(undefined);
  const [tipos, setTipos] = useState<TipoGasto[]>([]);
  const [historial, setHistorial] = useState<Gasto[]>([]);
  const [tipoGastoId, setTipoGastoId] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [error, setError] = useState<string | null>(null);

  const cargarHistorial = useCallback(
    async (id: string, filtros: { tipoGastoId?: string; fechaDesde?: string; fechaHasta?: string }) => {
      setError(null);
      const params = new URLSearchParams();
      if (filtros.tipoGastoId) params.set("tipoGastoId", filtros.tipoGastoId);
      if (filtros.fechaDesde) params.set("fechaDesde", filtros.fechaDesde);
      if (filtros.fechaHasta) params.set("fechaHasta", filtros.fechaHasta);

      const res = await fetch(`/api/obra/${id}/historial?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "No se pudo cargar el historial");
        setHistorial([]);
        return;
      }
      setHistorial(await res.json());
    },
    [],
  );

  useEffect(() => {
    fetch("/api/obra/me").then(async (res) => {
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 404) {
        router.push("/obra");
        return;
      }
      const obra = await res.json();
      setObraId(obra.id);
      cargarHistorial(obra.id, {});
    });

    fetch("/api/tipos-gasto").then(async (res) => {
      if (res.ok) setTipos(await res.json());
    });
  }, [router, cargarHistorial]);

  function handleFiltrar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!obraId) return;
    cargarHistorial(obraId, { tipoGastoId, fechaDesde, fechaHasta });
  }

  function limpiarFiltros() {
    setTipoGastoId("");
    setFechaDesde("");
    setFechaHasta("");
    if (obraId) cargarHistorial(obraId, {});
  }

  if (obraId === undefined) {
    return <p>Cargando...</p>;
  }

  return (
    <div>
      <div className="card">
        <h1>Historial de gastos</h1>
        <form onSubmit={handleFiltrar}>
          <label>
            Tipo de gasto
            <select value={tipoGastoId} onChange={(e) => setTipoGastoId(e.target.value)}>
              <option value="">Todos</option>
              {tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Desde
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit">Filtrar</button>
          <button type="button" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </form>
      </div>

      <div className="card">
        {historial.length === 0 ? (
          <p>No hay gastos que coincidan con estos filtros.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Fecha</th>
                <th style={{ textAlign: "left" }}>Tipo</th>
                <th style={{ textAlign: "right" }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((gasto) => (
                <tr key={gasto.id}>
                  <td>{gasto.fecha.slice(0, 10)}</td>
                  <td>
                    {gasto.tipoGastoNombre}
                    {gasto.descripcion && (
                      <>
                        <br />
                        <small style={{ color: "#666" }}>{gasto.descripcion}</small>
                      </>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>{formatoARS.format(gasto.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
