# Contract: Gastos

Cubre User Story 3 y User Story 5 (FR-011 a FR-016). Todas las rutas requieren sesión válida (401 si no) y verifican que la Obra referenciada pertenezca al constructor autenticado (403 si no, AC-28).

## GET /api/tipos-gasto

Devuelve el catálogo precargado de tipos de gasto (FR-014).

**Auth**: Requiere sesión válida.

**Responses**:

| Status | Body |
|---|---|
| 200 | `[{ "id": "string", "nombre": "Administrativos" }, ...]` (5 elementos, AC-30) |
| 401 | No autenticado |

## GET /api/obra/:obraId/gastos

Lista simple (sin filtros, orden descendente por fecha) de los gastos de la obra. Pensada para poblar la pantalla de edición/eliminación de gastos (US5); el listado filtrable y ordenado cronológicamente para consulta está en `GET /api/obra/:obraId/historial` (ver `reporte-historial.md`, US6).

**Responses**:

| Status | Cuándo |
|---|---|
| 200 | `[{ "id": string, "tipoGastoId": string, "tipoGastoNombre": string, "monto": number, "fecha": ISO date }, ...]` |
| 401 | No autenticado |
| 403 | `obraId` pertenece a otro constructor |
| 404 | `obraId` no existe |

## POST /api/obra/:obraId/gastos

Registra un gasto contra la obra indicada.

**Request body**:

```json
{
  "tipoGastoId": "string",
  "monto": "number",
  "moneda": "ARS",
  "fecha": "ISO date"
}
```

**Responses**:

| Status | Cuándo |
|---|---|
| 201 | Gasto creado (AC-10) |
| 400 | `monto` cero/negativo (AC-11), falta `tipoGastoId` (AC-12), falta `fecha` (AC-14), o `moneda !== "ARS"` (AC-15) |
| 401 | No autenticado |
| 403 | `obraId` pertenece a otro constructor |
| 404 | `obraId` no existe — o el constructor autenticado no tiene obra creada, en cuyo caso la UI redirige a creación de obra (AC-13) antes de intentar este POST |

Nota: un gasto cuyo `monto` supera el saldo disponible se acepta igual (201); el saldo negativo resultante se refleja en `GET /api/obra/:obraId/reporte` (AC-16).

## PATCH /api/obra/:obraId/gastos/:gastoId

Edita cualquier campo de un gasto existente.

**Responses**:

| Status | Cuándo |
|---|---|
| 200 | Cambios persistidos (AC-26) |
| 400 | Mismas validaciones que POST |
| 401 | No autenticado |
| 403 | La obra (o el gasto, vía la obra) pertenece a otro constructor (AC-28) |
| 404 | `obraId` o `gastoId` no existen |

## DELETE /api/obra/:obraId/gastos/:gastoId

Elimina un gasto de forma permanente.

**Responses**:

| Status | Cuándo |
|---|---|
| 204 | Gasto eliminado (AC-27); deja de aparecer en historial y reportes |
| 401 | No autenticado |
| 403 | La obra pertenece a otro constructor (AC-28) |
| 404 | `obraId` o `gastoId` no existen |
