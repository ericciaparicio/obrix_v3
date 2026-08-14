import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { calcularReporte } from "@/lib/services/reporte";

// FR-018 — casos borde del cálculo del reporte financiero: AC-16, AC-17,
// AC-18, y redondeo del porcentaje consumido.
const TEST_EMAIL_DOMAIN = "@test.obrix.local";

async function crearObra(emailLocalPart: string, presupuestoInicial: number) {
  const constructor = await prisma.constructor.create({
    data: {
      email: `${emailLocalPart}${TEST_EMAIL_DOMAIN}`,
      passwordHash: "irrelevante",
      nombre: "Test",
      apellido: "Test",
      celular: "+5491100000000",
    },
  });
  return prisma.obra.create({
    data: {
      constructorId: constructor.id,
      nombre: "Obra Test",
      pais: "Argentina",
      provincia: "Buenos Aires",
      localidad: "CABA",
      direccion: "Calle 123",
      latitud: -34.6,
      longitud: -58.4,
      fechaInicio: new Date("2026-01-01"),
      presupuestoInicial,
    },
  });
}

beforeEach(async () => {
  await prisma.gasto.deleteMany({});
  await prisma.obra.deleteMany({
    where: { propietario: { email: { endsWith: TEST_EMAIL_DOMAIN } } },
  });
});

afterEach(async () => {
  await prisma.constructor.deleteMany({
    where: { email: { endsWith: TEST_EMAIL_DOMAIN } },
  });
});

describe("calcularReporte", () => {
  it("devuelve null si la obra no existe", async () => {
    const reporte = await calcularReporte("no-existe");
    expect(reporte).toBeNull();
  });

  it("sin gastos: gastado 0, disponible = presupuesto, 0% consumido — AC-18", async () => {
    const obra = await crearObra("reporte-unit-sin-gastos", 100000);
    const reporte = await calcularReporte(obra.id);

    expect(reporte).toEqual({
      presupuestoTotal: 100000,
      gastado: 0,
      disponible: 100000,
      porcentajeConsumido: 0,
      desglosePorTipo: [],
    });
  });

  it("con sobregasto: disponible queda negativo — AC-16", async () => {
    const obra = await crearObra("reporte-unit-sobregasto", 10000);
    const tipoGasto = await prisma.tipoGasto.findFirstOrThrow();
    await prisma.gasto.create({
      data: { obraId: obra.id, tipoGastoId: tipoGasto.id, monto: 15000, moneda: "ARS", fecha: new Date() },
    });

    const reporte = await calcularReporte(obra.id);
    expect(reporte?.disponible).toBe(-5000);
    expect(reporte?.porcentajeConsumido).toBe(150);
  });

  it("redondea el porcentaje consumido a 2 decimales sin artefactos de punto flotante", async () => {
    const obra = await crearObra("reporte-unit-redondeo", 3);
    const tipoGasto = await prisma.tipoGasto.findFirstOrThrow();
    await prisma.gasto.create({
      data: { obraId: obra.id, tipoGastoId: tipoGasto.id, monto: 1, moneda: "ARS", fecha: new Date() },
    });

    const reporte = await calcularReporte(obra.id);
    // 1/3 * 100 = 33.333... — sin redondeo daría 33.33333333333333.
    expect(reporte?.porcentajeConsumido).toBe(33.33);
  });

  it("agrupa el desglose por tipo de gasto sumando montos del mismo tipo", async () => {
    const obra = await crearObra("reporte-unit-desglose", 100000);
    const [tipoA, tipoB] = await prisma.tipoGasto.findMany({ orderBy: { nombre: "asc" }, take: 2 });
    await prisma.gasto.createMany({
      data: [
        { obraId: obra.id, tipoGastoId: tipoA.id, monto: 1000, moneda: "ARS", fecha: new Date() },
        { obraId: obra.id, tipoGastoId: tipoA.id, monto: 2000, moneda: "ARS", fecha: new Date() },
        { obraId: obra.id, tipoGastoId: tipoB.id, monto: 500, moneda: "ARS", fecha: new Date() },
      ],
    });

    const reporte = await calcularReporte(obra.id);
    expect(reporte?.gastado).toBe(3500);
    const desgloseA = reporte?.desglosePorTipo.find((d) => d.tipoGastoId === tipoA.id);
    expect(desgloseA?.monto).toBe(3000);
  });
});
