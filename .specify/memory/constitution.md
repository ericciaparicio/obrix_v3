<!--
Sync Impact Report
- Cambio de versión: [PLANTILLA] → 1.0.0 (ratificación inicial)
- Principios modificados: n/a (primera adopción concreta de la plantilla)
- Secciones añadidas:
  - Principios Fundamentales: I. Desarrollo Test-First (NO NEGOCIABLE), II. Sin Datos Inventados — Solo Fuente de Verdad, III. Sin Secretos en el Código
  - Seguridad y Manejo de Datos (SECTION_2)
  - Flujo de Desarrollo (SECTION_3)
  - Gobernanza
- Secciones eliminadas: ninguna
- Plantillas que requieren actualización:
  - ✅ .specify/templates/tasks-template.md (las tareas de test pasan de OPCIONALES a OBLIGATORIAS según el Principio I)
  - ✅ .specify/templates/plan-template.md (el gate "Constitution Check" ya deriva de este archivo — sin cambios necesarios)
  - ✅ .specify/templates/spec-template.md (el lenguaje de testabilidad ya está alineado — sin cambios necesarios)
  - ✅ .specify/templates/commands/*.md (no se encontraron referencias específicas de agente que requieran cambio)
  - ✅ AGENTS.md / CLAUDE.md (revisados; el "Qué NO hacer" y las reglas de stack existentes son consistentes con esta constitución, sin cambios necesarios)
- TODOs pendientes: ninguno
-->

# Constitución de Obrix

## Principios Fundamentales

### I. Desarrollo Test-First (NO NEGOCIABLE)

Los tests DEBEN escribirse antes que la implementación que verifican. Para
cada feature o fix: escribir el/los test(s), confirmar que FALLAN por el
motivo correcto, y luego implementar hasta que pasen (ciclo Red-Green-Refactor).
Ningún commit de implementación puede introducir comportamiento que no tenga
un test previo que lo cubra y que haya fallado primero. Los refactors DEBEN
mantener en verde los tests existentes durante todo el proceso.

**Rationale**: Obrix reporta el estado financiero de una obra real; una
regresión no detectada se traduce directamente en cifras de presupuesto/gasto
incorrectas mostradas al usuario. Escribir los tests primero obliga a
especificar el comportamiento esperado antes de que exista el código, y
mantiene la suite de Vitest (`pnpm test`) como un gate confiable en vez de
un trámite posterior.

### II. Sin Datos Inventados — Solo Fuente de Verdad

El sistema NO DEBE inventar, estimar, inferir ni asignar por defecto de forma
silenciosa datos que no estén presentes en su fuente de verdad (PostgreSQL vía
Prisma). Cuando falten datos requeridos, sean ambiguos o inconsistentes, el
sistema DEBE mostrar ese estado explícitamente (p. ej. "no disponible", error
de validación, estado vacío) en lugar de adivinar. Cualquier situación donde
el comportamiento correcto no sea claro DEBE derivarse a revisión humana en
vez de resolverse por suposición.

**Rationale**: El valor central de Obrix es dar al constructor una visión
confiable en tiempo real de dinero gastado vs. disponible. Un solo número
inventado (un monto adivinado, una moneda asumida silenciosamente, un total
inventado) socava esa confianza y puede llevar a errores financieros reales.
Ante la duda, se deriva a revisión humana — no se adivina.

### III. Sin Secretos en el Código

Credenciales, API keys, tokens, connection strings y cualquier otro secreto
NUNCA DEBEN commitearse al control de versiones ni hardcodearse en el código
de la aplicación. Todos los secretos se leen desde variables de entorno (ver
`.env`, `.env.example`) y `.env` DEBE permanecer en `.gitignore`. Esto incluye
el requisito ya existente de que las contraseñas de usuario nunca se
almacenan en texto plano — siempre hasheadas con bcrypt o argon2.

**Rationale**: Obrix almacena datos financieros personales sobre la obra de
un usuario; una credencial filtrada o un almacenamiento reversible de
contraseñas convierte una fuga de código en una brecha de cuenta/datos.
Mantener los secretos fuera del código es la forma más barata y confiable de
prevenir eso.

## Seguridad y Manejo de Datos

- Las contraseñas DEBEN hashearse (bcrypt o argon2) antes de almacenarse; el
  almacenamiento en texto plano es una violación de la constitución, no una
  preferencia de estilo.
- Las sesiones expiran a los 30 minutos de inactividad (Auth.js v5), según
  AGENTS.md; los cambios al comportamiento de sesión/auth DEBEN preservar
  este timeout salvo que se enmiende la constitución.
- La carga de archivos/comprobantes asociados a gastos está fuera de alcance
  — no agregar esta capacidad. Las versiones históricas de reportes
  financieros también están fuera de alcance — el sistema refleja solo el
  estado actual de la obra.
- Toda nueva integración externa (procesadores de pago, almacenamiento de
  archivos, etc.) DEBE evaluarse contra el Principio III antes de introducir
  secretos o credenciales.

## Flujo de Desarrollo

- `pnpm test` (Vitest) DEBE pasar para considerar una feature terminada.
- Los cambios de schema de Prisma usan `prisma db push`; este proyecto no
  mantiene archivos de migración — no introducir un directorio de
  migraciones como workaround.
- La revisión de código (propia o de un par) DEBE verificar: que los tests
  precedieron a la implementación (Principio I), que no se inventan datos
  donde la fuente de verdad no dice nada (Principio II), y que no se agregó
  material secreto al diff (Principio III).
- Cuando un requisito sea lo bastante ambiguo como para que cumplir el
  Principio II implique adivinar, hay que detenerse y pedir aclaración
  humana en vez de entregar una solución basada en suposiciones.

## Gobernanza

Esta constitución prevalece sobre prácticas en conflicto, convenciones
informales previas y decisiones ad-hoc de este proyecto. AGENTS.md/CLAUDE.md
brindan detalles operativos de stack y comandos; donde entren en conflicto
con este documento en una cuestión de principio, esta constitución rige.

**Procedimiento de enmienda**: Proponer el cambio (qué/por qué), actualizar
este archivo, recalcular la versión según la política de abajo, actualizar
el Sync Impact Report al inicio de este archivo, y propagar los cambios
necesarios a `.specify/templates/*.md`. Las enmiendas entran en vigor una
vez commiteadas.

**Política de versionado** (versionado semántico para gobernanza):
- MAYOR: Eliminación o redefinición de un principio de forma incompatible
  hacia atrás.
- MENOR: Se agrega un nuevo principio o una sección materialmente ampliada.
- PARCHE: Cambios de redacción, tipografía o clarificación sin impacto
  semántico.

**Revisión de cumplimiento**: Todo paso por `/speckit-plan` y
`/speckit-implement` DEBE verificar el trabajo contra los Principios
Fundamentales de arriba (gate "Constitution Check"). Las violaciones deben
justificarse por escrito (Complexity Tracking en plan.md) o el enfoque debe
cambiar.

**Versión**: 1.0.0 | **Ratificada**: 2026-08-13 | **Última Enmienda**: 2026-08-13
