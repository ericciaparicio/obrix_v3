# Contract: Autenticación

Implementado con Auth.js v5 (Credentials provider) + un Route Handler propio para el registro. Cubre User Story 1 (FR-001 a FR-005).

## POST /api/auth/register

Registra un nuevo Constructor.

**Auth**: Ninguna (endpoint público).

**Request body**:

```json
{
  "email": "string",
  "password": "string",
  "nombre": "string",
  "apellido": "string",
  "celular": "string"
}
```

**Responses**:

| Status | Cuándo | Body |
|---|---|---|
| 201 | Registro exitoso (AC-22) | `{ "id": "string", "email": "string" }` |
| 400 | Email inválido o falta nombre/apellido/celular (AC-24) | `{ "error": "string" }` con el campo/motivo |
| 409 | Email ya en uso (AC-23) | `{ "error": "email ya registrado" }` |

## POST /api/auth/login (vía Auth.js — `signIn("credentials", ...)`)

Inicia sesión con email + contraseña.

**Auth**: Ninguna (endpoint público).

**Responses**:

| Status | Cuándo |
|---|---|
| 200 + cookie de sesión | Credenciales válidas |
| 401 | Email o contraseña incorrectos (AC-21) |

## POST /api/auth/logout (vía Auth.js — `signOut()`)

Cierra la sesión del Constructor autenticado.

**Auth**: Requiere sesión válida.

**Responses**:

| Status | Cuándo |
|---|---|
| 200 | Sesión invalidada (AC-25); requests posteriores a rutas protegidas devuelven 401 |

## Middleware de sesión (aplica a todas las rutas bajo `/api/obra/**` — incluye obra, gastos, reporte e historial anidados — y `/api/tipos-gasto`)

| Status | Cuándo |
|---|---|
| 401 | No hay sesión válida o expiró por 30 min de inactividad (AC-19, FR-005) |
