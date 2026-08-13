# Contract: Reporte Financiero e Historial de Gastos

Cubre User Story 3 (reporte) y User Story 6 (historial) — FR-017, FR-018. Todas las rutas requieren sesión válida (401) y verifican propiedad de la Obra (403, AC-20).

## GET /api/obra/:obraId/reporte

Devuelve el reporte financiero calculado en el momento (sin histórico, ver Assumptions del spec).

**Responses**:

| Status | Body / Cuándo |
|---|---|
| 200 | `{ "presupuestoTotal": number, "gastado": number, "disponible": number, "porcentajeConsumido": number, "desglosePorTipo": [{ "tipoGastoId": string, "nombre": string, "monto": number }] }` (AC-17). Sin gastos cargados: `gastado: 0`, `disponible === presupuestoTotal`, `porcentajeConsumido: 0` (AC-18). Con sobregasto: `disponible` negativo (AC-16). |
| 401 | No autenticado |
| 403 | `obraId` pertenece a otro constructor |
| 404 | `obraId` no existe |

## GET /api/obra/:obraId/historial

Devuelve el historial de gastos de la obra, ordenado cronológicamente, con filtros opcionales por query string.

**Query params** (todos opcionales):

- `tipoGastoId`: filtra por tipo de gasto exacto
- `fechaDesde`, `fechaHasta`: filtran por rango de fecha (inclusive)
- `orden`: `asc` | `desc` (default `asc`, cronológico)

**Responses**:

| Status | Cuándo |
|---|---|
| 200 | `[{ "id": string, "fecha": ISO date, "tipoGastoId": string, "tipoGastoNombre": string, "monto": number }, ...]` — todos los gastos si no hay filtros (AC-29); acotado si se pasan filtros (User Story 6, escenarios 2 y 3) |
| 400 | `fechaDesde` posterior a `fechaHasta` (checklist CHK024 — rango inválido) |
| 401 | No autenticado |
| 403 | `obraId` pertenece a otro constructor |
| 404 | `obraId` no existe |
