# Research: Gestión de Presupuesto y Gastos de Obra

**Input**: `spec.md`, `AGENTS.md`, `.specify/memory/constitution.md`

El stack ya está fijado por `AGENTS.md` (Next.js 15 App Router, PostgreSQL, Prisma sin migraciones, Auth.js v5, Vitest, pnpm), por lo que no hay decisiones de *qué* tecnología usar. Las decisiones abajo resuelven *cómo* usar ese stack para cumplir los requisitos concretos del spec (sesión con expiración por inactividad, códigos HTTP 401/403 explícitos, montos en ARS, hash de contraseñas, etc.).

## 1. Expiración de sesión por inactividad (FR-005)

- **Decision**: Sesiones JWT de Auth.js v5 con `session.strategy: "jwt"`, `session.maxAge: 30 * 60` (30 min) y `session.updateAge` bajo (ej. cada llamada válida refresca el token vía el callback `jwt`), de forma que cada request autenticado dentro de la ventana de 30 min renueva la expiración (comportamiento "sliding session" / inactividad, no TTL fijo desde el login).
- **Rationale**: Auth.js v5 no ofrece un timer de inactividad "out of the box"; la forma estándar de lograrlo es una sesión JWT de corta duración que se renueva en cada request autenticado exitoso. Así, 30 minutos sin actividad implica que el JWT expira y el middleware de Auth.js redirige a login / responde 401.
- **Alternatives considered**: Estrategia `database` con tabla de sesiones — permite invalidación server-side inmediata (útil para "cerrar sesión" real, FR-004), pero agrega una tabla extra y una consulta a DB por request. Se descarta por complejidad no justificada para un solo usuario por cuenta; en su lugar, el logout (FR-004) se implementa invalidando la cookie de sesión en el cliente/servidor, suficiente dado que no hay revocación remota multi-dispositivo en el alcance del PRD.
- **Nota de implementación (descubierta durante Polish, T051-T058)**: `middleware.ts` corre en el Edge Runtime de Next.js, que no soporta las APIs de Node que usa `bcryptjs` (usado por el Credentials provider). La configuración de Auth.js se dividió en `src/lib/auth.config.ts` (edge-safe: solo `session`/`callbacks`/`pages`, sin providers) y `src/lib/auth.ts` (la extiende agregando el Credentials provider con bcrypt/Prisma, usado por el resto de la app en Node runtime). `middleware.ts` crea su propia instancia liviana `NextAuth(authConfig)` solo para leer la sesión — patrón oficial recomendado por Auth.js v5 para este caso.

## 2. Hash de contraseñas (FR-020 / SC-008 / Principio III de la constitución)

- **Decision**: `bcrypt` (vía `bcryptjs` para compatibilidad con el runtime de Node usado por Next.js Route Handlers) con costo (salt rounds) 10–12.
- **Rationale**: AGENTS.md permite bcrypt o argon2. bcrypt tiene soporte maduro en el ecosistema Node/Next.js sin depender de bindings nativos que puedan fallar en algunos entornos de build, y es el algoritmo más usado con Auth.js `Credentials` provider.
- **Alternatives considered**: argon2 — más moderno y recomendado por OWASP, pero requiere el binding nativo `argon2` (o `argon2-wasm`), lo que agrega fricción de build; se descarta por simplicidad ya que ambas opciones son válidas según AGENTS.md.

## 3. Contrato HTTP explícito para 401/403 (AC-19, AC-20, AC-28)

- **Decision**: Todo acceso a datos de una Obra o de sus Gastos (lectura, edición, eliminación) pasa por Route Handlers de Next.js (`app/api/**/route.ts`), que devuelven explícitamente `401` (no autenticado) o `403` (autenticado pero no es el dueño de la obra). Las páginas (Server Components) consumen esos mismos handlers o una capa de servicio compartida que aplica la misma verificación antes de renderizar.
- **Rationale**: El spec (heredado del PRD) exige códigos HTTP concretos como criterio de aceptación testable (AC-19, AC-20, AC-28). Los Route Handlers de Next.js devuelven `Response`/`NextResponse` con status explícito, lo cual es directamente verificable con tests de integración (fetch a la ruta), a diferencia de un `redirect()` de Server Action que no expone un código HTTP inspeccionable de la misma manera.
- **Alternatives considered**: Server Actions con manejo de errores propio — más idiomático en Next.js 15, pero no produce un código de estado HTTP verificable de forma directa; se descarta porque el spec pide 401/403 como comportamiento observable, no una decisión de UI.

## 4. Modelado de montos monetarios (ARS)

- **Decision**: Campo `Decimal` de Prisma (mapeado a `numeric(12,2)` en PostgreSQL) para presupuesto y monto de gasto.
- **Rationale**: Evita errores de redondeo de punto flotante en cálculos financieros (gastado, disponible, % consumido), que es un requisito implícito de confiabilidad del reporte (SC-002, Principio II de la constitución: "sin datos inventados").
- **Alternatives considered**: `Int` en centavos — funciona pero complica la lectura/escritura en toda la capa de UI y validación sin beneficio adicional dado que Prisma soporta `Decimal` nativamente sobre PostgreSQL.

## 5. Unicidad de "una obra por constructor" (FR-006/FR-007)

- **Decision**: Restricción `@unique` sobre `constructorId` en el modelo `Obra` (relación 1:1 a nivel de base de datos), reforzada además con una verificación explícita en la capa de servicio antes de insertar (para devolver un mensaje de error claro en vez de un error crudo de constraint).
- **Rationale**: Garantiza la regla incluso ante condiciones de carrera, y permite que la capa de aplicación devuelva el mensaje de error específico que pide AC-03 en lugar de un error genérico de base de datos.
- **Alternatives considered**: Verificación solo a nivel de aplicación (sin constraint de DB) — se descarta porque no protege contra escrituras concurrentes.

## 6. Catálogo de Tipos de Gasto precargado (FR-014)

- **Decision**: Tabla `TipoGasto` con los 5 valores fijos (Administrativos, Dirección de Obra, Materiales, Mano de Obra, Otros), poblada por un script de seed (`prisma/seed.ts`) ejecutado tras `prisma db push`, referenciada por FK desde `Gasto`.
- **Rationale**: Mantiene el catálogo consultable/relacional (útil para el desglose por tipo del reporte) sin necesitar migraciones (coherente con "sin archivos de migración" de AGENTS.md); un `enum` de Prisma sería una alternativa más rígida para un catálogo que el PRD no descarta poder ampliar en el futuro (ver Assumption del spec).
- **Alternatives considered**: `enum` nativo de Prisma/PostgreSQL para tipo de gasto — más simple, pero más costoso de extender si en el futuro se permite gestionar tipos; se descarta a favor de una tabla dado que ya existe una entidad "Tipo de Gasto" en el modelo de dominio del spec.

## 7. Testing de Route Handlers y Server Components con Vitest

- **Decision**: Tests de integración con Vitest ejecutando los Route Handlers directamente (invocando la función `GET`/`POST`/etc. exportada con un `Request` construido en el test) contra una base de datos de test (mismo PostgreSQL local, esquema aplicado con `prisma db push`, limpiada entre tests). Tests unitarios con Vitest para la lógica de cálculo del reporte financiero y las validaciones, aislados de la capa HTTP.
- **Rationale**: Evita levantar un servidor HTTP real en cada test; Next.js Route Handlers son funciones exportadas invocables directamente, lo que mantiene los tests rápidos y compatible con el Principio I (Test-First) de la constitución.
- **Alternatives considered**: Playwright/e2e completo — útil para flujos de UI pero más lento y no es lo indicado por AGENTS.md (que declara Vitest como única herramienta de test); se deja fuera de este plan salvo que se pida explícitamente.

## Resumen de decisiones abiertas resueltas

Ninguna decisión queda pendiente como `NEEDS CLARIFICATION`: el stack está fijado por AGENTS.md y las siete decisiones de implementación de arriba cubren los puntos donde el spec no impone una única forma de usarlo.
