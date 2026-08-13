import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// FR-014: tipos de gasto precargados, disponibles sin configuración previa.
const TIPOS_GASTO = [
  "Administrativos",
  "Dirección de Obra",
  "Materiales",
  "Mano de Obra",
  "Otros",
];

async function main() {
  for (const nombre of TIPOS_GASTO) {
    await prisma.tipoGasto.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
