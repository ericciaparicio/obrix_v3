"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Obra = {
  id: string;
  nombre: string;
  pais: string;
  provincia: string;
  localidad: string;
  direccion: string;
  latitud: number;
  longitud: number;
  fechaInicio: string;
  fechaFin: string | null;
  presupuestoInicial: number;
};

export default function ObraPage() {
  const router = useRouter();
  const [obra, setObra] = useState<Obra | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/obra/me")
      .then(async (res) => {
        if (res.status === 404) {
          setObra(null);
          return;
        }
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        setObra(await res.json());
      })
      .catch(() => setObra(null));
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const fechaFin = formData.get("fechaFin");
    const isEdit = Boolean(obra);

    const body = {
      nombre: formData.get("nombre"),
      pais: formData.get("pais"),
      provincia: formData.get("provincia"),
      localidad: formData.get("localidad"),
      direccion: formData.get("direccion"),
      latitud: Number(formData.get("latitud")),
      longitud: Number(formData.get("longitud")),
      fechaInicio: formData.get("fechaInicio"),
      fechaFin: fechaFin ? fechaFin : null,
      presupuestoInicial: Number(formData.get("presupuestoInicial")),
    };

    const res = await fetch(isEdit ? `/api/obra/${obra!.id}` : "/api/obra", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo guardar la obra");
      return;
    }

    const saved = await res.json();
    setObra(saved);
    router.push("/obra/reporte");
  }

  async function handleEliminar() {
    if (!obra) return;
    const confirmado = window.confirm(
      "¿Dar de baja esta obra? Vas a poder registrar una obra nueva, pero esta y sus gastos dejan de estar disponibles.",
    );
    if (!confirmado) return;

    setError(null);
    setLoading(true);
    const res = await fetch(`/api/obra/${obra.id}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo dar de baja la obra");
      return;
    }

    setObra(null);
  }

  if (obra === undefined) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="card">
      <h1>{obra ? "Editar obra" : "Registrar mi obra"}</h1>
      {/* key: fuerza remount al pasar de "editando obra X" a "sin obra"
          (ej. tras dar de baja) — si no, los <input> no controlados
          (defaultValue) quedan con los valores viejos en pantalla. */}
      <form key={obra?.id ?? "nueva"} onSubmit={handleSubmit}>
        <label>
          Nombre de la obra
          <input name="nombre" defaultValue={obra?.nombre} required />
        </label>
        <label>
          País
          <input name="pais" defaultValue={obra?.pais} required />
        </label>
        <label>
          Provincia
          <input name="provincia" defaultValue={obra?.provincia} required />
        </label>
        <label>
          Localidad
          <input name="localidad" defaultValue={obra?.localidad} required />
        </label>
        <label>
          Dirección
          <input name="direccion" defaultValue={obra?.direccion} required />
        </label>
        <label>
          Latitud
          <input
            name="latitud"
            type="number"
            step="any"
            defaultValue={obra?.latitud}
            required
          />
        </label>
        <label>
          Longitud
          <input
            name="longitud"
            type="number"
            step="any"
            defaultValue={obra?.longitud}
            required
          />
        </label>
        <label>
          Fecha de inicio
          <input
            name="fechaInicio"
            type="date"
            defaultValue={obra?.fechaInicio?.slice(0, 10)}
            required
          />
        </label>
        <label>
          Fecha de fin (opcional)
          <input name="fechaFin" type="date" defaultValue={obra?.fechaFin?.slice(0, 10) ?? ""} />
        </label>
        <label>
          Presupuesto inicial (ARS)
          <input
            name="presupuestoInicial"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={obra?.presupuestoInicial}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : obra ? "Guardar cambios" : "Registrar obra"}
        </button>
      </form>
      {obra && (
        <button type="button" onClick={handleEliminar} disabled={loading} style={{ marginTop: "0.75rem" }}>
          Dar de baja la obra
        </button>
      )}
    </div>
  );
}
