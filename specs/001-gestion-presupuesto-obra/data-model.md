# Data Model: Gestión de Presupuesto y Gastos de Obra

**Input**: Key Entities de `spec.md`, decisiones de `research.md`
**ORM**: Prisma sobre PostgreSQL — sin archivos de migración (`prisma db push`)

## Constructor

Persona autenticada, dueña de a lo sumo una Obra.

| Campo | Tipo | Reglas |
|---|---|---|
| id | String (cuid/uuid) | PK |
| email | String | `@unique`; formato de email válido (FR-002) |
| passwordHash | String | Hash bcrypt (FR-020/SC-008); nunca se expone en respuestas |
| nombre | String | Obligatorio, no vacío (FR-002) |
| apellido | String | Obligatorio, no vacío (FR-002) |
| celular | String | Obligatorio, no vacío (FR-002) |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

**Relaciones**: 1 Constructor → 0..N Obra a lo largo del tiempo, pero **a lo sumo 1 activa** (`eliminadaEn IS NULL`) en un momento dado (FR-006/FR-007). Ver baja lógica más abajo.

## Obra

Proyecto de construcción de un Constructor.

| Campo | Tipo | Reglas |
|---|---|---|
| id | String | PK |
| constructorId | String | FK → Constructor.id. **Sin** `@unique`: un constructor puede tener varias filas de Obra a lo largo del tiempo (una activa + N dadas de baja) — la unicidad de "una obra ACTIVA por constructor" se valida en la capa de servicio (`crearObra`), no a nivel de schema. El campo de relación en Prisma se llama `propietario` (no `constructor`: ese nombre colisiona con `Object.prototype.constructor` y Prisma omite el filtro de relación generado). |
| nombre | String | Obligatorio (FR-006) |
| pais | String | Obligatorio |
| provincia | String | Obligatorio |
| localidad | String | Obligatorio |
| direccion | String | Obligatorio |
| latitud | Decimal | Obligatorio (par de coordenadas, Assumptions) |
| longitud | Decimal | Obligatorio |
| fechaInicio | DateTime | Obligatorio |
| fechaFin | DateTime? | Opcional |
| presupuestoInicial | Decimal(12,2) | Obligatorio, > 0 (FR-009); editable (FR-010) |
| eliminadaEn | DateTime? | Baja lógica: `null` = activa. Ver sección de abajo. |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

**Relaciones**: 1 Obra → 1 Constructor (dueño). 1 Obra → N Gastos.

**Reglas de validación** (de FR-006 a FR-010, AC-01 a AC-09):
- Todos los campos obligatorios deben estar presentes y no vacíos para crear o editar.
- `presupuestoInicial` debe ser numérico y estrictamente mayor a cero, tanto al crear como al editar.
- No puede crearse una segunda Obra ACTIVA si el constructor ya tiene una (validado en servicio antes del insert; `crearObra` filtra por `eliminadaEn: null`).

### Baja lógica de la Obra

Funcionalidad agregada durante la implementación (no estaba en el spec original), a pedido explícito del usuario.

- `DELETE /api/obra/:obraId` marca `eliminadaEn = now()` en vez de borrar la fila (`eliminarObra` en `src/lib/services/obra.ts`). No hay hard delete de Obra expuesto por la API.
- Todas las lecturas de Obra (`obtenerObraPorId`, `obtenerObraDeConstructor`) filtran `eliminadaEn: null` — una obra dada de baja se comporta como **404 / inexistente** para el resto del sistema, incluido su propio dueño; no hay una vista de "obras archivadas" en esta versión.
- Los Gastos de una obra dada de baja **no se tocan ni se borran** (quedan en la base, asociados a esa `obraId`), simplemente dejan de ser alcanzables porque las rutas de gastos/reporte/historial primero resuelven la obra vía `obtenerObraPorId` (que ya excluye las dadas de baja) y devuelven 404.
- Dar de baja la obra activa libera el "cupo" de una obra por constructor: `crearObra` puede volver a crear una obra nueva inmediatamente después.

## TipoGasto

Catálogo precargado de categorías de gasto (FR-014).

| Campo | Tipo | Reglas |
|---|---|---|
| id | String | PK |
| nombre | String | `@unique`; uno de: Administrativos, Dirección de Obra, Materiales, Mano de Obra, Otros |

**Poblado por seed** (`prisma/seed.ts`), no editable por el usuario en esta versión (Assumption del spec: catálogo cerrado).

## Gasto

Erogación registrada contra una Obra.

| Campo | Tipo | Reglas |
|---|---|---|
| id | String | PK |
| obraId | String | FK → Obra.id |
| tipoGastoId | String | FK → TipoGasto.id, obligatorio (FR-012) |
| monto | Decimal(12,2) | Obligatorio, > 0 (FR-012) |
| moneda | String | Fijo `"ARS"` (FR-011); rechazar cualquier otro valor (FR-012) |
| fecha | DateTime | Obligatorio (FR-012) |
| descripcion | String? | Opcional, máx. 500 caracteres. Agregado durante la implementación (no estaba en el spec original), a pedido explícito del usuario. |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

**Relaciones**: N Gastos → 1 Obra. N Gastos → 1 TipoGasto.

**Reglas de validación** (FR-011 a FR-013, FR-015, FR-016, AC-10 a AC-16):
- No puede crearse un Gasto si el Constructor autenticado no tiene una Obra (FR-013 → redirección a creación de obra).
- `monto` > 0, `tipoGastoId` presente, `fecha` presente, `moneda === "ARS"`; cualquier violación rechaza el registro con mensaje específico.
- Un Gasto cuyo monto haga que el saldo disponible de la Obra quede negativo se acepta igualmente (AC-16); no hay tope superior de validación contra el presupuesto.
- Edición (FR-015) permite modificar cualquier campo, re-validando las mismas reglas.
- Eliminación (FR-016) es permanente (hard delete); dejar de considerarse en cálculos posteriores.

## Reporte Financiero (vista calculada, no persistida)

Se deriva en cada consulta a partir de `Obra.presupuestoInicial` y la suma de `Gasto.monto` de esa Obra (FR-018). No es una tabla — no hay entidad de base de datos ni histórico.

| Campo derivado | Cálculo |
|---|---|
| presupuestoTotal | `Obra.presupuestoInicial` |
| gastado | `SUM(Gasto.monto)` de todos los Gastos de la Obra |
| disponible | `presupuestoTotal - gastado` (puede ser negativo, AC-16) |
| porcentajeConsumido | `gastado / presupuestoTotal * 100` (0% si no hay gastos, AC-18) |
| desglosePorTipo | `SUM(Gasto.monto)` agrupado por `TipoGasto`, para todos los tipos con al menos un Gasto |

## Historial de Gastos (vista de consulta filtrable)

No es una entidad nueva: es una consulta sobre `Gasto` de la Obra del Constructor autenticado, ordenada por `fecha` ascendente o descendente, con filtros opcionales:

- `tipoGastoId` (igualdad)
- `fechaDesde` / `fechaHasta` (rango sobre `fecha`)

(FR-017, User Story 6, checklist CHK024: si `fechaDesde > fechaHasta`, el filtro se considera inválido y se rechaza o se ignora mostrando un mensaje — decisión de UX a confirmar en implementación, no bloqueante para el modelo de datos.)

## Diagrama de relaciones

```text
Constructor (1) ──── (0..1) Obra (1) ──── (N) Gasto (N) ──── (1) TipoGasto
```
