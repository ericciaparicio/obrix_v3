# Quickstart: Gestión de Presupuesto y Gastos de Obra

Guía para validar manualmente que la feature funciona de punta a punta, siguiendo AGENTS.md.

## Prerrequisitos

```bash
pnpm install
cp .env.example .env        # completar DATABASE_URL y AUTH_SECRET
pnpm dlx prisma db push
pnpm dlx prisma db seed     # carga el catálogo de tipos de gasto (FR-014)
pnpm dev
```

La app queda disponible en `http://localhost:3000`.

## Escenario 1 — Cuenta y sesión (User Story 1)

1. Registrar un constructor: `POST /api/auth/register` con email, contraseña, nombre, apellido, celular.
   - **Esperado**: `201`.
2. Repetir el registro con el mismo email.
   - **Esperado**: `409` (AC-23).
3. Iniciar sesión con las credenciales creadas.
   - **Esperado**: sesión creada (cookie), acceso a rutas protegidas.
4. Intentar `GET /api/obra/me` sin sesión (sin cookie).
   - **Esperado**: `401` (AC-19).
5. Cerrar sesión y repetir `GET /api/obra/me`.
   - **Esperado**: `401` (AC-25).

## Escenario 2 — Obra y presupuesto (User Story 2)

1. Autenticado, `POST /api/obra` con todos los campos obligatorios y `presupuestoInicial: 1000000`.
   - **Esperado**: `201`.
2. `GET /api/obra/:obraId/reporte`.
   - **Esperado**: `presupuestoTotal: 1000000, gastado: 0, disponible: 1000000, porcentajeConsumido: 0` (AC-18).
3. Repetir `POST /api/obra` con el mismo constructor.
   - **Esperado**: `409` (AC-03).
4. `POST /api/obra` con `presupuestoInicial: 0` en una cuenta nueva.
   - **Esperado**: `400` (AC-05).

## Escenario 3 — Gastos y reporte (User Story 3)

1. `GET /api/tipos-gasto`.
   - **Esperado**: 5 tipos (Administrativos, Dirección de Obra, Materiales, Mano de Obra, Otros) (AC-30).
2. `POST /api/obra/:obraId/gastos` con `monto: 50000, tipoGastoId, moneda: "ARS", fecha`.
   - **Esperado**: `201`.
3. `GET /api/obra/:obraId/reporte`.
   - **Esperado**: `gastado: 50000, disponible: 950000, porcentajeConsumido: 5` (AC-17).
4. `POST /api/obra/:obraId/gastos` con `monto: 2000000` (supera el disponible).
   - **Esperado**: `201`; el reporte siguiente muestra `disponible` negativo (AC-16).
5. `POST /api/obra/:obraId/gastos` con `moneda: "USD"`.
   - **Esperado**: `400` (AC-15).

## Escenario 4 — Edición (User Story 4 y 5)

1. `PATCH /api/obra/:obraId` cambiando `direccion`.
   - **Esperado**: `200`; el reporte y los datos de obra reflejan el cambio (AC-06).
2. `PATCH /api/obra/:obraId/gastos/:gastoId` cambiando `monto`.
   - **Esperado**: `200`; reporte recalculado (AC-26).
3. `DELETE /api/obra/:obraId/gastos/:gastoId`.
   - **Esperado**: `204`; el gasto desaparece del historial y del reporte (AC-27).

## Escenario 5 — Aislamiento entre constructores (AC-20, AC-28)

1. Registrar e iniciar sesión como un segundo constructor (B).
2. Como B, `GET /api/obra/:obraIdDeA`.
   - **Esperado**: `403`.
3. Como B, `PATCH /api/obra/:obraIdDeA/gastos/:gastoIdDeA`.
   - **Esperado**: `403`.

## Escenario 6 — Historial con filtros (User Story 6)

1. Cargar al menos 3 gastos de distintos tipos y fechas.
2. `GET /api/obra/:obraId/historial`.
   - **Esperado**: todos los gastos, ordenados cronológicamente (AC-29).
3. `GET /api/obra/:obraId/historial?tipoGastoId=<id>`.
   - **Esperado**: solo los gastos de ese tipo.
4. `GET /api/obra/:obraId/historial?fechaDesde=...&fechaHasta=...`.
   - **Esperado**: solo los gastos en ese rango.

## Verificación automatizada

```bash
pnpm test
```

Debe cubrir, como mínimo, los escenarios 1 a 6 de arriba (Principio I de la constitución: tests antes que implementación).
