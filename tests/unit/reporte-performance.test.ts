import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { calcularReporte } from "@/lib/services/reporte";

// SC-002: el reporte financiero se visualiza en menos de 3 segundos (p95).
// Este test mide el cálculo del lado del servidor (sin red/render) contra
// un volumen representativo de gastos, muy por debajo del umbral real de
// 3000ms para dejar margen a la latencia de red y renderizado del lado UI.
const TEST_EMAIL_DOMAIN = "@test.obrix.local";
const CANTIDAD_GASTOS = 250;
const PRESUPUESTO_ORIGEN = "reporte-performance";

let obraId: string;

beforeAll(async () => {
  const constructor = await prisma.constructor.create({
    data: {
      email: `${PRESUPUESTO_ORIGEN}${TEST_EMAIL_DOMAIN}`,
      passwordHash: "irrelevante",
      nombre: "Test",
      apellido: "Test",
      celular: "+5491100000000",
    },
  });
  const obra = await prisma.obra.create({
    data: {
      constructorId: constructor.id,
      nombre: "Obra con muchos gastos",
      pais: "Argentina",
      provincia: "Buenos Aires",
      localidad: "CABA",
      direccion: "Calle 123",
      latitud: -34.6,
      longitud: -58.4,
      fechaInicio: new Date("2024-01-01"),
      presupuestoInicial: 10_000_000,
    },
  });
  obraId = obra.id;

  const tipos = await prisma.tipoGasto.findMany();
  await prisma.gasto.createMany({
    data: Array.from({ length: CANTIDAD_GASTOS }, (_, i) => ({
      obraId,
      tipoGastoId: tipos[i % tipos.length].id,
      monto: 1000 + i,
      moneda: "ARS",
      fecha: new Date(2024, 0, 1 + (i % 365)),
    })),
  });
});

afterAll(async () => {
  await prisma.gasto.deleteMany({ where: { obraId } });
  await prisma.obra.delete({ where: { id: obraId } });
  await prisma.constructor.deleteMany({
    where: { email: `${PRESUPUESTO_ORIGEN}${TEST_EMAIL_DOMAIN}` },
  });
});

describe("Rendimiento del cálculo del reporte financiero", () => {
  it(`calcula el reporte con ${CANTIDAD_GASTOS} gastos en menos de 1000ms — SC-002`, async () => {
    const inicio = performance.now();
    const reporte = await calcularReporte(obraId);
    const duracionMs = performance.now() - inicio;

    expect(reporte).not.toBeNull();
    expect(reporte?.desglosePorTipo.length).toBeGreaterThan(0);
    expect(duracionMs).toBeLessThan(1000);
  });
});
