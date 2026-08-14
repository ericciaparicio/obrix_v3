"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Reporte = {
  presupuestoTotal: number;
  gastado: number;
  disponible: number;
  porcentajeConsumido: number;
  desglosePorTipo: { tipoGastoId: string; nombre: string; monto: number }[];
};

const formatoARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

export default function ReportePage() {
  const router = useRouter();
  const [reporte, setReporte] = useState<Reporte | null | undefined>(undefined);

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
      const reporteRes = await fetch(`/api/obra/${obra.id}/reporte`);
      if (reporteRes.ok) {
        setReporte(await reporteRes.json());
      }
    });
  }, [router]);

  if (reporte === undefined) {
    return <p>Cargando...</p>;
  }
  if (reporte === null) {
    return <p>No se pudo cargar el reporte.</p>;
  }

  return (
    <div>
      <h1>Reporte financiero</h1>
      <div className="card">
        <p>Presupuesto total: {formatoARS.format(reporte.presupuestoTotal)}</p>
        <p>Gastado: {formatoARS.format(reporte.gastado)}</p>
        <p>
          Disponible:{" "}
          <strong style={{ color: reporte.disponible < 0 ? "#b00020" : undefined }}>
            {formatoARS.format(reporte.disponible)}
          </strong>
        </p>
        <p>% consumido: {reporte.porcentajeConsumido.toFixed(1)}%</p>
      </div>

      <div className="card">
        <h2>Gastado por tipo</h2>
        {reporte.desglosePorTipo.length === 0 ? (
          <p>Todavía no hay gastos registrados.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Tipo</th>
                <th style={{ textAlign: "right" }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {reporte.desglosePorTipo.map((item) => (
                <tr key={item.tipoGastoId}>
                  <td>{item.nombre}</td>
                  <td style={{ textAlign: "right" }}>{formatoARS.format(item.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
