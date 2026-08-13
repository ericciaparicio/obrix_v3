# Contract: Obra y Presupuesto

Cubre User Story 2 y User Story 4 (FR-006 a FR-010). Todas las rutas requieren sesión válida (401 si no). Las rutas que reciben `obraId` en el path verifican que la obra pertenezca al constructor autenticado y devuelven 403 si no (AC-20), lo que hace el caso cross-user directamente testeable a nivel de contrato.

## POST /api/obra

Crea la obra (y su presupuesto inicial) del constructor autenticado. No recibe `obraId` — la obra creada queda asociada automáticamente al constructor de la sesión.

**Request body**:

```json
{
  "nombre": "string",
  "pais": "string",
  "provincia": "string",
  "localidad": "string",
  "direccion": "string",
  "latitud": "number",
  "longitud": "number",
  "fechaInicio": "ISO date",
  "fechaFin": "ISO date | null",
  "presupuestoInicial": "number"
}
```

**Responses**:

| Status | Cuándo |
|---|---|
| 201 | Obra creada (AC-01, AC-04) |
| 400 | Falta un campo obligatorio, o `presupuestoInicial` es cero/negativo/no numérico (AC-02, AC-05) |
| 401 | No autenticado |
| 409 | El constructor ya tiene una obra registrada (AC-03) |

## GET /api/obra/:obraId

Devuelve los datos de la obra indicada.

**Responses**:

| Status | Cuándo |
|---|---|
| 200 | `{ ...campos de Obra }` — solo si `obraId` pertenece al constructor autenticado |
| 401 | No autenticado (AC-19) |
| 403 | `obraId` existe pero pertenece a otro constructor (AC-20) |
| 404 | `obraId` no existe |

**Nota de UI**: la aplicación siempre navega usando el `obraId` de la propia sesión (obtenido tras `POST /api/obra` o `GET /api/obra/me`); el caso 403 se da solo ante un acceso directo a un `obraId` ajeno.

## GET /api/obra/me

Atajo para obtener la obra del constructor autenticado sin conocer su `obraId` de antemano.

**Responses**:

| Status | Cuándo |
|---|---|
| 200 | `{ ...campos de Obra }` |
| 401 | No autenticado |
| 404 | El constructor no tiene obra creada aún |

## PATCH /api/obra/:obraId

Edita datos de la obra ya registrada y/o el presupuesto inicial.

**Request body**: subconjunto de los campos de `POST /api/obra`.

**Responses**:

| Status | Cuándo |
|---|---|
| 200 | Cambios persistidos (AC-06, AC-08) |
| 400 | Edición deja vacío un campo obligatorio, o `presupuestoInicial` inválido (AC-07, AC-09) |
| 401 | No autenticado |
| 403 | `obraId` pertenece a otro constructor (AC-20, por consistencia con FR-019) |
| 404 | `obraId` no existe |
