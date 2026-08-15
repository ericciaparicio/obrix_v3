# Tasks: Gestión de Presupuesto y Gastos de Obra

**Input**: Design documents from `/specs/001-gestion-presupuesto-obra/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Según el Principio I de la constitución (Test-First, NO NEGOCIABLE), las tareas de test son OBLIGATORIAS para cada historia de usuario — escribirlas primero, confirmar que FALLAN, y luego implementar hasta que pasen.

**Organization**: Tareas agrupadas por historia de usuario (spec.md), en el mismo orden de prioridad P1 → P2 → P3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece (US1–US6)
- Cada tarea incluye la ruta de archivo exacta

## Path Conventions

Proyecto único Next.js 15 App Router (ver `plan.md` → Project Structure): `src/app/`, `src/lib/`, `prisma/`, `tests/unit/`, `tests/integration/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización del proyecto Next.js 15 según AGENTS.md

- [X] T001 Crear estructura de carpetas del proyecto (`src/app`, `src/lib/services`, `src/lib/validations`, `prisma/`, `tests/unit`, `tests/integration`) según `plan.md` → Project Structure
- [X] T002 Inicializar `package.json` con pnpm: `next@15`, `react`, `react-dom`, `typescript`, `prisma`, `@prisma/client`, `next-auth@5`, `bcryptjs`, `zod`, `vitest`, tipos correspondientes
- [X] T003 [P] Configurar `tsconfig.json` para Next.js 15 App Router
- [X] T004 [P] Configurar `vitest.config.ts` para tests unitarios y de integración
- [X] T005 [P] Crear `.env.example` con `DATABASE_URL` y `AUTH_SECRET` (AGENTS.md); confirmar que `.env` está en `.gitignore` (Principio III de la constitución)
- [X] T006 [P] Configurar ESLint/Prettier con las reglas por defecto de Next.js 15

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Base de datos y utilidades compartidas por todas las historias de usuario

**⚠️ CRITICAL**: Ninguna historia de usuario puede empezar hasta completar esta fase

- [X] T007 Definir el schema de Prisma (`Constructor`, `Obra`, `TipoGasto`, `Gasto` con sus relaciones y constraints `@unique`) en `prisma/schema.prisma` según `data-model.md`
- [X] T008 Ejecutar `pnpm dlx prisma db push` para aplicar el schema (sin archivos de migración, per AGENTS.md)
- [X] T009 [P] Crear `prisma/seed.ts` que carga los 5 `TipoGasto` precargados (Administrativos, Dirección de Obra, Materiales, Mano de Obra, Otros — FR-014) y configurar el script `prisma.seed` en `package.json`
- [X] T010 [P] Crear cliente Prisma singleton en `src/lib/prisma.ts`

**Checkpoint**: Base de datos y cliente Prisma listos — las historias de usuario pueden comenzar

---

## Phase 3: User Story 1 - Crear cuenta e iniciar sesión (Priority: P1) 🎯 MVP (parte 1/3)

**Goal**: Un usuario puede registrarse, iniciar sesión, cerrar sesión, y cualquier acceso no autenticado a datos de obra es rechazado.

**Independent Test**: Escenario 1 de `quickstart.md` (registro, duplicado de email, login inválido, acceso sin sesión → 401, logout → 401 posterior).

### Tests para la Historia de Usuario 1 (OBLIGATORIO) ⚠️

> Escribir estos tests primero y confirmar que FALLAN antes de implementar.

- [X] T011 [P] [US1] Test de integración: `POST /api/auth/register` — éxito (201), email duplicado (409), campos inválidos (400) en `tests/integration/auth-register.test.ts` (`contracts/auth.md`, AC-22, AC-23, AC-24)
- [X] T012 [P] [US1] Test de integración: login con credenciales inválidas (401), logout invalida la sesión, acceso a ruta protegida sin sesión (401) en `tests/integration/auth-session.test.ts` (AC-19, AC-21, AC-25)

### Implementation for User Story 1

- [X] T013 [US1] Utilidad de hash de contraseña con bcrypt en `src/lib/password.ts` (research.md #2)
- [X] T014 [US1] Esquema de validación de registro (email, password, nombre, apellido, celular) con zod en `src/lib/validations/auth.ts`
- [X] T015 [US1] Configurar Auth.js v5: Credentials provider (compara hash con `src/lib/password.ts`) y sesión JWT deslizante de 30 min (`session.maxAge`, callback `jwt`) en `src/lib/auth.ts` (research.md #1)
- [X] T016 [US1] Handler de Auth.js en `src/app/api/auth/[...nextauth]/route.ts`
- [X] T017 [US1] Endpoint `POST /api/auth/register` en `src/app/api/auth/register/route.ts` (201/400/409, usa T013 y T014, `contracts/auth.md`)
- [X] T018 [US1] Middleware de sesión que responde 401 en rutas protegidas (`/api/obra/**`, `/api/tipos-gasto`) en `src/middleware.ts`
- [X] T019 [US1] Página de registro en `src/app/(auth)/registro/page.tsx`
- [X] T020 [US1] Página de login (con `signIn` de Auth.js) y acción de logout (`signOut`) en `src/app/(auth)/login/page.tsx`

**Checkpoint**: User Story 1 completa y testeable de forma independiente

---

## Phase 4: User Story 2 - Registrar la obra y el presupuesto inicial (Priority: P1) 🎯 MVP (parte 2/3)

**Goal**: Un constructor autenticado registra su obra y presupuesto inicial, y ve el reporte financiero en cero.

**Independent Test**: Escenario 2 de `quickstart.md`.

**Depends on**: User Story 1 (necesita sesión autenticada, FR-003).

### Tests para la Historia de Usuario 2 (OBLIGATORIO) ⚠️

- [X] T021 [P] [US2] Test de integración: `POST /api/obra` (201/400/409), `GET /api/obra/me` y `GET /api/obra/:obraId` (200/401/403/404), reporte sin gastos (AC-18) en `tests/integration/obra.test.ts` (`contracts/obra.md`, AC-01 a AC-05, AC-19, AC-20)

### Implementation for User Story 2

- [X] T022 [P] [US2] Esquema de validación de Obra (campos obligatorios, `presupuestoInicial` > 0) con zod en `src/lib/validations/obra.ts`
- [X] T023 [US2] Servicio de Obra: crear, obtener, verificar unicidad (una obra por constructor) y verificar propiedad en `src/lib/services/obra.ts` (data-model.md, AC-03)
- [X] T024 [US2] Servicio de cálculo del Reporte Financiero, caso sin gastos, en `src/lib/services/reporte.ts` (FR-018, AC-18)
- [X] T025 [US2] Endpoint `POST /api/obra` en `src/app/api/obra/route.ts`
- [X] T026 [US2] Endpoints `GET`/`PATCH /api/obra/:obraId` (incluye verificación de propiedad → 403) en `src/app/api/obra/[obraId]/route.ts`
- [X] T027 [US2] Endpoint `GET /api/obra/me` en `src/app/api/obra/me/route.ts`
- [X] T028 [US2] Endpoint `GET /api/obra/:obraId/reporte` (caso sin gastos) en `src/app/api/obra/[obraId]/reporte/route.ts`
- [X] T029 [US2] Página de alta de obra y presupuesto en `src/app/obra/page.tsx`

**Checkpoint**: User Stories 1 y 2 funcionan juntas — un constructor puede crear cuenta, loguearse y registrar su obra con presupuesto

---

## Phase 5: User Story 3 - Registrar gastos y ver el reporte financiero (Priority: P1) 🎯 MVP (parte 3/3)

**Goal**: Un constructor carga gastos y consulta el reporte financiero actualizado — el valor central del producto.

**Independent Test**: Escenario 3 de `quickstart.md`.

**Depends on**: User Story 1 y User Story 2 (necesita obra y presupuesto existentes, FR-013).

### Tests para la Historia de Usuario 3 (OBLIGATORIO) ⚠️

- [X] T030 [P] [US3] Test de integración: `GET /api/tipos-gasto` (5 tipos), `POST /api/obra/:obraId/gastos` (201/400/403/404), `GET .../reporte` con gastos incluyendo saldo negativo en `tests/integration/gastos.test.ts` (`contracts/gastos.md`, `contracts/reporte-historial.md`, AC-10 a AC-17, AC-30)

### Implementation for User Story 3

- [X] T031 [P] [US3] Esquema de validación de Gasto (`monto` > 0, `tipoGastoId`, `fecha`, `moneda === "ARS"`) con zod en `src/lib/validations/gasto.ts`
- [X] T032 [US3] Servicio de Gasto: crear, listar, validar pertenencia a la obra en `src/lib/services/gastos.ts` (data-model.md)
- [X] T033 [US3] Completar servicio de Reporte Financiero: gastado, disponible (puede ser negativo), % consumido, desglose por tipo en `src/lib/services/reporte.ts` (FR-018, AC-16, AC-17)
- [X] T034 [US3] Endpoint `GET /api/tipos-gasto` en `src/app/api/tipos-gasto/route.ts`
- [X] T035 [US3] Endpoint `POST /api/obra/:obraId/gastos` en `src/app/api/obra/[obraId]/gastos/route.ts`
- [X] T036 [US3] Completar `GET /api/obra/:obraId/reporte` con gastos reales (usa T033) en `src/app/api/obra/[obraId]/reporte/route.ts`
- [X] T037 [US3] Página de carga de gastos en `src/app/obra/gastos/page.tsx`, incluyendo el guard de FR-013/AC-13: si el constructor autenticado no tiene obra creada (`GET /api/obra/me` → 404), redirigir a `src/app/obra/page.tsx` antes de mostrar el formulario de gasto
- [X] T038 [US3] Página de reporte financiero (presupuesto, gastado, disponible, %, desglose por tipo) en `src/app/obra/reporte/page.tsx`

**Checkpoint**: MVP completo — User Stories 1+2+3 cubren el flujo central del PRD (crear cuenta → obra → presupuesto → gastos → reporte)

---

## Phase 6: User Story 4 - Editar los datos de la obra y el presupuesto (Priority: P2)

**Goal**: Un constructor corrige los datos de su obra o ajusta el presupuesto inicial.

**Independent Test**: Escenario 4 (parte 1) de `quickstart.md`.

**Depends on**: User Story 2 (opera sobre una obra ya existente).

### Tests para la Historia de Usuario 4 (OBLIGATORIO) ⚠️

- [X] T039 [P] [US4] Test de integración: `PATCH /api/obra/:obraId` con valores válidos (200) e inválidos — campo obligatorio vacío, presupuesto cero/negativo/no numérico (400) en `tests/integration/obra-edicion.test.ts` (AC-06 a AC-09)

### Implementation for User Story 4

- [X] T040 [US4] Extender el servicio de Obra (`src/lib/services/obra.ts`, T023) con edición de datos y de presupuesto, reutilizando las validaciones de T022 — ya implementado en Phase 4 (`editarObra`), verificado ahora por T039
- [X] T041 [US4] Completar `PATCH /api/obra/:obraId` (`src/app/api/obra/[obraId]/route.ts`, T026) con las reglas de edición de T040 — ya implementado en Phase 4, verificado ahora por T039
- [X] T042 [US4] Agregar formulario de edición de obra y presupuesto en `src/app/obra/page.tsx` (T029) — ya implementado en Phase 4 (detecta obra existente y hace PATCH)

**Checkpoint**: Un constructor puede corregir los datos de su obra y presupuesto sin afectar US1–US3

---

## Phase 7: User Story 5 - Editar y eliminar gastos registrados (Priority: P2)

**Goal**: Un constructor corrige o elimina de forma permanente un gasto cargado por error.

**Independent Test**: Escenario 4 (parte 2) de `quickstart.md`.

**Depends on**: User Story 3 (opera sobre gastos ya existentes).

### Tests para la Historia de Usuario 5 (OBLIGATORIO) ⚠️

- [X] T043 [P] [US5] Test de integración: `PATCH` y `DELETE /api/obra/:obraId/gastos/:gastoId` (200/204/400/403/404) en `tests/integration/gastos-edicion.test.ts` (AC-26 a AC-28)

### Implementation for User Story 5

- [X] T044 [US5] Extender el servicio de Gasto (`src/lib/services/gastos.ts`, T032) con edición y eliminación permanente, reutilizando las validaciones de T031
- [X] T045 [US5] Endpoint `PATCH`/`DELETE /api/obra/:obraId/gastos/:gastoId` en `src/app/api/obra/[obraId]/gastos/[gastoId]/route.ts`
- [X] T046 [US5] Agregar acciones de editar/eliminar gasto en `src/app/obra/gastos/page.tsx` (T037) — también se agregó `GET /api/obra/:obraId/gastos` (listado simple sin filtros, no estaba en contracts/ original) para poblar esta pantalla

**Checkpoint**: Un constructor puede corregir errores de carga en sus gastos sin afectar US1–US4

---

## Phase 8: User Story 6 - Consultar el historial de gastos (Priority: P3)

**Goal**: Un constructor consulta el historial completo de gastos, con filtros por tipo y por rango de fechas.

**Independent Test**: Escenario 6 de `quickstart.md`.

**Depends on**: User Story 3 (necesita gastos ya cargados).

### Tests para la Historia de Usuario 6 (OBLIGATORIO) ⚠️

- [X] T047 [P] [US6] Test de integración: `GET /api/obra/:obraId/historial` sin filtros (orden cronológico), con filtro por tipo, con filtro por rango de fechas, rango inválido (400), y acceso de un constructor B a un `obraId` de A (403) en `tests/integration/historial.test.ts` (`contracts/reporte-historial.md`, AC-29, AC-20, FR-019, checklist CHK024)

### Implementation for User Story 6

- [X] T048 [US6] Servicio de historial con filtros por `tipoGastoId` y por rango de fechas en `src/lib/services/gastos.ts` (T032, FR-017)
- [X] T049 [US6] Endpoint `GET /api/obra/:obraId/historial` en `src/app/api/obra/[obraId]/historial/route.ts`
- [X] T050 [US6] Página de historial con filtros por tipo y fecha en `src/app/obra/historial/page.tsx`

**Checkpoint**: Las 6 historias de usuario del spec están completas e independientemente testeables

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras que afectan a varias historias de usuario

- [X] T051 [P] Tests unitarios del cálculo del reporte financiero (sin gastos, saldo negativo, redondeo de %) en `tests/unit/reporte.test.ts` (research.md #7)
- [X] T052 [P] Verificar FR-021/SC-007 (sin scroll horizontal, sin elementos superpuestos desde 320px) en todas las páginas de `src/app/obra/**` y `src/app/(auth)/**`
- [X] T053 Ejecutar manualmente los 6 escenarios de `quickstart.md` de punta a punta
- [X] T054 Revisar que no haya secretos hardcodeados en el diff y que `.env` esté en `.gitignore` (Principio III de la constitución)
- [X] T055 Confirmar que `pnpm test` pasa completo (gate de Flujo de Desarrollo de la constitución)
- [X] T056 [P] Benchmark liviano de `GET /api/obra/:obraId/reporte` con un volumen representativo de gastos (ej. 200+ registros seed) para verificar SC-002 (<3s p95) en `tests/unit/reporte-performance.test.ts`
- [X] T057 [P] Test de integración que simula la expiración de sesión tras 30 min de inactividad (mock del reloj o del `exp` del JWT) y confirma que la siguiente request a una ruta protegida devuelve 401 en `tests/integration/auth-session-expiry.test.ts` (FR-005) — detectó y corrigió un bug real: sin header `x-forwarded-proto`, Auth.js asumía `https` y buscaba la cookie `__Secure-` equivocada
- [X] T058 [P] Test unitario que confirma que `src/lib/password.ts` nunca devuelve ni persiste la contraseña en texto plano (el hash almacenado es distinto del input) en `tests/unit/password.test.ts` (FR-020/SC-008)

**Extra (no listado originalmente)**: separación de `auth.config.ts` (edge-safe) y `auth.ts` (Node, con bcrypt/Prisma) — `pnpm build` mostraba warnings porque `middleware.ts` (Edge Runtime) arrastraba bcryptjs a través de `auth.ts`. `middleware.ts` ahora usa una instancia `NextAuth(authConfig)` propia y liviana, sin el Credentials provider.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — puede iniciar de inmediato
- **Foundational (Phase 2)**: depende de Setup — bloquea todas las historias de usuario
- **User Story 1 (Phase 3)**: depende de Foundational — no depende de otras historias
- **User Story 2 (Phase 4)**: depende de Foundational y de User Story 1 (necesita sesión autenticada)
- **User Story 3 (Phase 5)**: depende de User Story 2 (necesita obra y presupuesto)
- **User Story 4 (Phase 6)**: depende de User Story 2 (edita una obra existente); independiente de US3, US5, US6
- **User Story 5 (Phase 7)**: depende de User Story 3 (edita/elimina gastos existentes); independiente de US4, US6
- **User Story 6 (Phase 8)**: depende de User Story 3 (consulta gastos existentes); independiente de US4, US5
- **Polish (Phase 9)**: depende de que todas las historias deseadas estén completas

### Within Each User Story

- Los tests DEBEN escribirse y FALLAR antes de implementar (Principio I, NO NEGOCIABLE)
- Esquemas de validación antes que servicios
- Servicios antes que endpoints
- Endpoints antes que páginas
- Historia completa antes de pasar a la siguiente en orden de prioridad

### Parallel Opportunities

- Todas las tareas [P] de Setup (T003–T006) en paralelo
- Todas las tareas [P] de Foundational (T009–T010) en paralelo
- Una vez completado Foundational, US1 puede iniciar; US2 solo tras US1; US3 solo tras US2
- US4, US5 y US6 pueden desarrollarse en paralelo entre sí una vez completada US3 (todas dependen de US3, no entre ellas)
- Los tests marcados [P] dentro de una misma historia pueden ejecutarse en paralelo si están en archivos distintos

---

## Parallel Example: User Story 1

```bash
# Tests de User Story 1 en paralelo (archivos distintos):
Task: "Test de integración de registro en tests/integration/auth-register.test.ts"
Task: "Test de integración de sesión (login/logout/401) en tests/integration/auth-session.test.ts"
```

## Parallel Example: User Stories 4, 5 y 6 (tras completar US3)

```bash
# Tres historias P2/P3 independientes entre sí, cada una en su propio conjunto de archivos:
Task: "User Story 4 completa (T039–T042)"
Task: "User Story 5 completa (T043–T046)"
Task: "User Story 6 completa (T047–T050)"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 + 3)

Las tres historias P1 del spec son, en conjunto, el MVP mínimo viable — ninguna por sí sola entrega el valor central sin las otras dos (cuenta sin obra no sirve; obra sin gastos no resuelve el problema del PRD).

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (bloqueante)
3. Completar Phase 3: User Story 1 → validar Escenario 1 de quickstart.md
4. Completar Phase 4: User Story 2 → validar Escenario 2
5. Completar Phase 5: User Story 3 → validar Escenario 3
6. **STOP and VALIDATE**: correr los Escenarios 1–3 y 5 (aislamiento) de `quickstart.md` completos
7. Deploy/demo del MVP

### Incremental Delivery

1. Setup + Foundational → base lista
2. US1 → US2 → US3 → MVP completo, demo
3. US4, US5, US6 (en cualquier orden o en paralelo) → cada una agrega valor sin romper el MVP
4. Polish (Phase 9) → cierre de calidad

### Parallel Team Strategy

Con más de un desarrollador, tras completar Foundational y US1–US3 (secuenciales por dependencia real de datos):

- Developer A: User Story 4
- Developer B: User Story 5
- Developer C: User Story 6

Las tres se integran de forma independiente sobre el mismo MVP.

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- [Story] mapea cada tarea a su historia de usuario para trazabilidad
- Confirmar que los tests fallan antes de implementar (Principio I)
- Commitear después de cada tarea o grupo lógico
- Detenerse en cada checkpoint para validar la historia de forma independiente

## Cambios posteriores a la implementación inicial

Funcionalidades agregadas conversacionalmente después de completar las Phase 1–9, a pedido explícito del usuario, no derivadas del spec original. Se implementaron siguiendo el mismo Principio I (test primero, confirmar rojo, implementar) y quedaron reflejadas en `data-model.md` y `contracts/obra.md`.

- **Baja lógica de Obra** (`DELETE /api/obra/:obraId`): marca `eliminadaEn` en vez de borrar la fila; libera el cupo de "una obra por constructor" para poder registrar una obra nueva. Los Gastos de la obra dada de baja no se borran, solo dejan de ser accesibles. Tests en `tests/integration/obra.test.ts` (describe "DELETE /api/obra/:obraId (baja lógica)"). Requirió sacar el `@unique` de `Obra.constructorId` en el schema (ya no alcanza para expresar "una activa, N archivadas").
