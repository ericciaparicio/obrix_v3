# Implementation Plan: Gestión de Presupuesto y Gastos de Obra

**Branch**: `main` | **Date**: 2026-08-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-gestion-presupuesto-obra/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Obrix necesita permitir que un constructor particular registre su cuenta, su única obra con presupuesto inicial, cargue y gestione gastos categorizados en pesos (ARS), y consulte en tiempo real un reporte financiero (gastado, disponible, % consumido, desglose por tipo) y un historial filtrable de gastos — todo aislado por constructor mediante autenticación con expiración de sesión por inactividad. El enfoque técnico usa el stack ya fijado por AGENTS.md: Next.js 15 (App Router) con Route Handlers que exponen contratos HTTP explícitos (401/403 incluidos), Prisma sobre PostgreSQL sin migraciones, Auth.js v5 con sesión JWT de 30 minutos deslizantes, y Vitest para tests de integración de esos handlers y unitarios de la lógica de cálculo del reporte.

## Technical Context

**Language/Version**: TypeScript 5.x sobre Node.js 20+ (requerido por Next.js 15 App Router)

**Primary Dependencies**: Next.js 15 (App Router, Route Handlers), Prisma ORM, Auth.js v5 (NextAuth, Credentials provider), bcryptjs (hash de contraseñas, ver research.md #2)

**Storage**: PostgreSQL (local), vía Prisma — sin archivos de migración, `prisma db push`

**Testing**: Vitest (tests de integración invocando Route Handlers directamente + tests unitarios de cálculo del reporte y validaciones)

**Target Platform**: Aplicación web server-rendered, navegadores modernos, usable desde 320px de ancho sin scroll horizontal (FR-021/SC-007)

**Project Type**: web — aplicación full-stack Next.js sin separación explícita frontend/backend (App Router + Route Handlers)

**Performance Goals**: Reporte financiero visualizado en <3s p95 (SC-002)

**Constraints**:
- Sesión expira a los 30 minutos de inactividad (FR-005), implementada como JWT deslizante (research.md #1)
- Contraseñas siempre hasheadas, nunca en texto plano (FR-020/SC-008, Principio III de la constitución)
- Sin archivos de migración de Prisma (AGENTS.md) — solo `prisma db push`
- Un constructor solo puede tener una obra (FR-006/FR-007), reforzado a nivel de esquema (`@unique`)
- Moneda única ARS (FR-011/FR-012) — sin soporte multi-moneda

**Scale/Scope**: Un constructor con una obra y un historial de gastos que puede crecer a cientos de registros a lo largo de la obra (de ahí los filtros de FR-017); sin concurrencia multi-usuario sobre el mismo dato (no hay colaboración entre constructores, ver Assumptions del spec)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Estado |
|---|---|---|
| I. Desarrollo Test-First (NO NEGOCIABLE) | El plan define Vitest como herramienta de test de integración/unitaria para cada Route Handler y para el cálculo del reporte (research.md #7); `tasks.md` deberá marcar las tareas de test como obligatorias y previas a la implementación de cada historia de usuario (Red-Green-Refactor), no opcionales. | PASS (con nota vinculante para `/speckit-tasks`, ver Complexity Tracking) |
| II. Sin Datos Inventados — Solo Fuente de Verdad | El reporte financiero se calcula siempre a partir de `Obra` y `Gasto` en PostgreSQL (data-model.md); no hay valores por defecto inventados — los campos faltantes o inválidos se rechazan explícitamente (400) en vez de completarse con suposiciones. | PASS |
| III. Sin Secretos en el Código | `DATABASE_URL` y `AUTH_SECRET` se leen de variables de entorno (`.env`, ya en `.gitignore` según AGENTS.md); las contraseñas se hashean con bcrypt antes de persistir (research.md #2); ningún contrato ni artefacto de este plan introduce credenciales hardcodeadas. | PASS |

Sin violaciones — no aplica Complexity Tracking salvo la nota de Principio I abajo.

## Project Structure

### Documentation (this feature)

```text
specs/001-gestion-presupuesto-obra/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   ├── auth.md
│   ├── obra.md
│   ├── gastos.md
│   └── reporte-historial.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
prisma/
├── schema.prisma          # Constructor, Obra, TipoGasto, Gasto (data-model.md)
└── seed.ts                 # Carga los 5 TipoGasto precargados (FR-014)

src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── registro/page.tsx
│   ├── obra/
│   │   ├── page.tsx                    # form de alta/edición de obra + presupuesto
│   │   ├── gastos/page.tsx             # alta/edición/eliminación de gastos
│   │   ├── reporte/page.tsx            # reporte financiero
│   │   └── historial/page.tsx          # historial con filtros
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts
│       │   └── [...nextauth]/route.ts  # Auth.js v5 handler
│       ├── tipos-gasto/route.ts
│       └── obra/
│           ├── me/route.ts
│           └── [obraId]/
│               ├── route.ts             # GET/PATCH obra
│               ├── reporte/route.ts
│               ├── historial/route.ts
│               └── gastos/
│                   ├── route.ts         # POST gasto
│                   └── [gastoId]/route.ts  # PATCH/DELETE gasto
├── lib/
│   ├── auth.ts              # Config Auth.js v5 (sesión JWT 30 min deslizante)
│   ├── prisma.ts            # Cliente Prisma singleton
│   ├── services/
│   │   ├── obra.ts          # Reglas de negocio: unicidad, validaciones (FR-006 a FR-010)
│   │   ├── gastos.ts        # Reglas de negocio: validaciones de gasto (FR-011 a FR-016)
│   │   └── reporte.ts       # Cálculo de presupuesto/gastado/disponible/% (FR-018)
│   └── validations/         # Esquemas de validación de request bodies
│       ├── obra.ts
│       └── gasto.ts
└── middleware.ts             # Verificación de sesión (401) para /api/obra/**, /api/tipos-gasto

tests/
├── unit/
│   └── reporte.test.ts       # Cálculo del reporte: casos AC-16, AC-17, AC-18
└── integration/
    ├── auth.test.ts          # Escenario 1 de quickstart.md
    ├── obra.test.ts          # Escenario 2 y 5 de quickstart.md
    ├── gastos.test.ts        # Escenario 3 y 4 de quickstart.md
    └── historial.test.ts     # Escenario 6 de quickstart.md
```

**Structure Decision**: Proyecto único (no hay separación frontend/backend) porque Next.js 15 App Router es full-stack: las páginas bajo `src/app/**/page.tsx` y los Route Handlers bajo `src/app/api/**/route.ts` conviven en el mismo proyecto y comparten la capa de servicios (`src/lib/services/`), que es la que aplica las reglas de negocio y las verificaciones de propiedad (401/403) documentadas en `contracts/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No hay violaciones de la constitución que requieran justificación.

**Nota vinculante para `/speckit-tasks`**: la regla genérica de generación de tareas dice que los tests son opcionales salvo pedido explícito. En este proyecto, el Principio I de la constitución (Test-First, NO NEGOCIABLE) los vuelve obligatorios: `/speckit-tasks` debe generar tareas de test por historia de usuario, ubicadas antes de las tareas de implementación correspondientes, no como fase opcional.
