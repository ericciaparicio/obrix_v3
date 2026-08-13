# Feature Specification: Gestión de Presupuesto y Gastos de Obra

**Feature Branch**: `[001-gestion-presupuesto-obra]`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "Generá el spec a partir del PRD en PRD.md"

## Clarifications

### Session 2026-08-13

- Q: ¿El reporte financiero y/o el historial de gastos deben poder exportarse (ej. PDF, CSV)? → A: No; solo visualización en la aplicación, sin exportar/descargar.
- Q: ¿El historial de gastos necesita filtros/búsqueda o alcanza con una lista simple ordenada cronológicamente? → A: Debe permitir filtrar por tipo de gasto y por rango de fechas, además de mostrarse ordenado cronológicamente.
- Q: ¿Hay requisitos de accesibilidad o idioma más allá de lo ya definido (responsive desde 320px)? → A: Ninguno adicional; no se exige un estándar formal de accesibilidad (ej. WCAG) y la interfaz es solo en español.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear cuenta e iniciar sesión (Priority: P1)

Un constructor particular crea su cuenta con email, contraseña, nombre, apellido y celular, y luego inicia sesión con esas credenciales para acceder a su información. También puede cerrar sesión cuando termina.

**Why this priority**: Es la base de todo el sistema: sin una cuenta autenticada no existe forma segura de asociar una obra, un presupuesto ni gastos a una persona. Ninguna otra historia puede probarse de forma realista sin esto.

**Independent Test**: Puede probarse de forma completa registrando una cuenta nueva, iniciando sesión con esas credenciales, verificando que se accede al sistema, y cerrando sesión verificando que el acceso posterior a datos propios requiere volver a autenticarse.

**Acceptance Scenarios**:

1. **Given** datos válidos de registro (email, contraseña, nombre, apellido, celular), **When** el usuario se registra, **Then** la cuenta queda creada y puede iniciar sesión con esas credenciales. (AC-22)
2. **Given** un email ya utilizado por otra cuenta, **When** un usuario intenta registrarse con ese email, **Then** el sistema lo rechaza y muestra un mensaje de error indicando que el email ya está en uso. (AC-23)
3. **Given** un registro con email en formato inválido o con nombre, apellido o celular vacíos, **When** el usuario intenta registrarse, **Then** el sistema lo rechaza y muestra un mensaje de error. (AC-24)
4. **Given** un email o contraseña incorrectos, **When** un usuario intenta iniciar sesión, **Then** el sistema rechaza el acceso y muestra un mensaje de error. (AC-21)
5. **Given** un usuario no autenticado, **When** intenta acceder a información de una obra, **Then** el sistema responde con acceso denegado (401) y no muestra ningún dato. (AC-19)
6. **Given** un constructor autenticado, **When** cierra sesión, **Then** la sesión queda invalidada y un intento posterior de acceder a información de la obra vuelve a requerir autenticación. (AC-25)

---

### User Story 2 - Registrar la obra y el presupuesto inicial (Priority: P1)

Un constructor autenticado registra los datos de su única obra (nombre, país, provincia, localidad, dirección, coordenadas, fecha de inicio y, opcionalmente, fecha de fin) junto con su presupuesto inicial, quedando disponible para empezar a cargar gastos.

**Why this priority**: Sin una obra y un presupuesto registrados no hay nada sobre lo cual calcular gasto, disponible o porcentaje consumido; es el segundo prerequisito indispensable después de tener una cuenta.

**Independent Test**: Puede probarse registrando una obra con presupuesto inicial y consultando el reporte financiero: debe mostrar el presupuesto total, gasto en cero, disponible igual al presupuesto total y 0% consumido, sin necesidad de que existan gastos cargados.

**Acceptance Scenarios**:

1. **Given** datos válidos de obra (nombre, país, provincia, localidad, dirección, coordenadas y fecha de inicio completos; fecha de fin opcional), **When** el constructor la registra, **Then** la obra queda creada y disponible para asociarle un presupuesto y registrar gastos. (AC-01)
2. **Given** un registro de obra con algún campo obligatorio faltante, **When** el constructor intenta registrarla, **Then** el sistema lo rechaza y muestra un mensaje de error indicando el campo faltante. (AC-02)
3. **Given** un constructor que ya tiene una obra registrada, **When** intenta registrar una segunda obra, **Then** el sistema lo impide y muestra un mensaje de error indicando que solo se permite una obra por constructor. (AC-03)
4. **Given** un presupuesto inicial válido, **When** el constructor lo registra para su obra, **Then** el presupuesto queda asociado a la obra y disponible para calcular el saldo restante. (AC-04)
5. **Given** un presupuesto con monto cero, negativo o no numérico, **When** el constructor intenta registrarlo, **Then** el sistema lo rechaza y muestra un mensaje de error. (AC-05)
6. **Given** una obra con presupuesto registrado pero sin gastos cargados, **When** el constructor consulta el reporte financiero, **Then** el sistema muestra el presupuesto total, gasto en cero, disponible igual al presupuesto total y 0% consumido. (AC-18)

---

### User Story 3 - Registrar gastos y ver el reporte financiero (Priority: P1)

Un constructor con una obra y presupuesto ya registrados carga los gastos que va realizando (monto, tipo, fecha), eligiendo entre los tipos de gasto precargados, y consulta en cualquier momento el reporte financiero con el presupuesto total, gastado, disponible, porcentaje consumido y desglose por tipo.

**Why this priority**: Es el valor central del producto: permite al constructor saber en todo momento cuánto gastó, cuánto le queda disponible y en qué está concentrando el gasto, que es el problema principal descrito en el PRD.

**Independent Test**: Puede probarse cargando uno o más gastos sobre una obra con presupuesto ya definido y verificando que el reporte financiero refleja el gasto acumulado, el saldo disponible actualizado, el porcentaje consumido y el desglose por tipo de gasto.

**Acceptance Scenarios**:

1. **Given** un gasto válido (monto mayor a cero, tipo, fecha, moneda ARS) asociado a la obra, **When** el constructor lo registra, **Then** el gasto queda almacenado y es considerado en el presupuesto disponible y en los reportes. (AC-10)
2. **Given** un gasto con monto cero o negativo, **When** el constructor intenta registrarlo, **Then** el sistema lo rechaza y muestra un mensaje de error indicando que el monto debe ser mayor a cero. (AC-11)
3. **Given** un gasto sin tipo seleccionado, **When** el constructor intenta registrarlo, **Then** el sistema lo rechaza y muestra un mensaje de error indicando que el tipo es obligatorio. (AC-12)
4. **Given** un constructor que no tiene una obra creada, **When** intenta registrar un gasto, **Then** el sistema lo impide y lo redirige a crear su obra primero. (AC-13)
5. **Given** un gasto sin fecha, **When** el constructor intenta registrarlo, **Then** el sistema lo rechaza y muestra un mensaje de error indicando que la fecha es obligatoria. (AC-14)
6. **Given** un gasto con moneda distinta de ARS, **When** el constructor intenta registrarlo, **Then** el sistema lo rechaza y muestra un mensaje de error indicando que la única moneda aceptada es pesos (ARS). (AC-15)
7. **Given** un gasto cuyo monto supera el saldo disponible de la obra, **When** el constructor lo registra, **Then** el sistema lo almacena y el reporte muestra el saldo disponible en negativo. (AC-16)
8. **Given** una obra con presupuesto y gastos registrados, **When** el constructor consulta el reporte financiero, **Then** el sistema muestra el presupuesto total, el monto gastado, el saldo disponible, el porcentaje consumido y el detalle de gastos por tipo. (AC-17)
9. **Given** un sistema recién instalado sin tipos de gasto creados manualmente, **When** el constructor accede al registro de gastos, **Then** los tipos Administrativos, Dirección de Obra, Materiales, Mano de Obra y Otros están disponibles para seleccionar. (AC-30)
10. **Given** un constructor A y otro constructor B autenticado, **When** B intenta ver una obra asociada a A, **Then** el sistema responde con acceso prohibido (403) y no permite visualizar esa información. (AC-20)

---

### User Story 4 - Editar los datos de la obra y el presupuesto (Priority: P2)

Un constructor corrige o actualiza los datos de su obra ya registrada (por ejemplo, la dirección o la fecha de fin) o ajusta el presupuesto inicial cuando cambia, y ve esos cambios reflejados de inmediato en el reporte financiero.

**Why this priority**: Es una necesidad real durante una obra en curso (los presupuestos y datos de la obra cambian), pero el sistema ya entrega valor sin esta capacidad si los datos ingresados inicialmente son correctos, por lo que puede construirse después del flujo central de carga y reporte.

**Independent Test**: Puede probarse editando un dato de la obra ya registrada o el presupuesto inicial con un valor válido y verificando que el cambio persiste y se refleja tanto en los datos de la obra como en el reporte financiero.

**Acceptance Scenarios**:

1. **Given** un dato de la obra ya registrado, **When** el constructor lo edita con un valor válido, **Then** el cambio queda persistido y se refleja en los datos de la obra y en el reporte financiero. (AC-06)
2. **Given** un dato de la obra ya registrado, **When** el constructor intenta editarlo dejando vacío un campo obligatorio, **Then** el sistema lo rechaza y muestra un mensaje de error. (AC-07)
3. **Given** un presupuesto inicial ya registrado, **When** el constructor lo edita con un valor válido, **Then** el cambio queda persistido y se refleja en el reporte financiero. (AC-08)
4. **Given** un presupuesto inicial ya registrado, **When** el constructor intenta editarlo a un monto cero, negativo o no numérico, **Then** el sistema lo rechaza y muestra un mensaje de error. (AC-09)

---

### User Story 5 - Editar y eliminar gastos registrados (Priority: P2)

Un constructor corrige un gasto cargado con datos erróneos, o lo elimina de forma permanente si fue cargado por error, viendo el reporte financiero actualizado en ambos casos.

**Why this priority**: Corrige errores de carga, que son esperables en el uso diario, pero el sistema ya es útil sin esto si los gastos se cargan correctamente desde el inicio; depende de que la carga de gastos (US3) ya exista.

**Independent Test**: Puede probarse editando un gasto existente y verificando que el reporte refleja los nuevos valores, y por separado eliminando un gasto y verificando que desaparece del historial y deja de impactar en el presupuesto y los reportes.

**Acceptance Scenarios**:

1. **Given** un gasto existente, **When** el constructor modifica alguno de sus datos, **Then** los cambios quedan persistidos y el reporte financiero refleja los nuevos valores. (AC-26)
2. **Given** un gasto existente, **When** el constructor lo elimina, **Then** el registro se elimina de forma permanente, deja de aparecer en el historial y deja de impactar en el presupuesto y los reportes. (AC-27)
3. **Given** un constructor A y otro constructor B autenticado, **When** B intenta editar o eliminar un gasto asociado a una obra de A, **Then** el sistema responde con acceso prohibido (403) y no permite la operación. (AC-28)

---

### User Story 6 - Consultar el historial de gastos (Priority: P3)

Un constructor consulta el listado completo de gastos registrados en su obra, ordenados cronológicamente, y puede filtrarlo por tipo de gasto y por rango de fechas para revisar en qué y cuándo gastó.

**Why this priority**: Es una vista de consulta complementaria al reporte agregado (US3); aporta valor de trazabilidad pero no es indispensable para conocer el estado financiero general, que ya cubre el reporte.

**Independent Test**: Puede probarse cargando varios gastos de distintos tipos y fechas, y verificando que el historial los muestra todos ordenados cronológicamente, y que al aplicar un filtro por tipo o por rango de fechas el listado se acota correctamente a los gastos que cumplen ese criterio.

**Acceptance Scenarios**:

1. **Given** una obra con gastos registrados, **When** el constructor consulta el historial, **Then** el sistema muestra todos los gastos asociados ordenados cronológicamente, indicando su fecha, tipo y monto. (AC-29)
2. **Given** una obra con gastos de distintos tipos, **When** el constructor filtra el historial por un tipo de gasto, **Then** el sistema muestra únicamente los gastos de ese tipo, manteniendo el orden cronológico. (agregado en Clarifications, sesión 2026-08-13)
3. **Given** una obra con gastos en distintas fechas, **When** el constructor filtra el historial por un rango de fechas, **Then** el sistema muestra únicamente los gastos cuya fecha cae dentro de ese rango, manteniendo el orden cronológico. (agregado en Clarifications, sesión 2026-08-13)

---

### Edge Cases

- ¿Qué sucede cuando un constructor intenta registrar una segunda obra teniendo ya una registrada? El sistema lo impide y explica que solo se permite una obra por constructor.
- ¿Qué sucede cuando un gasto registrado hace que el saldo disponible quede negativo? El sistema lo permite igualmente y muestra el saldo disponible en negativo en el reporte, sin bloquear la carga.
- ¿Qué sucede cuando un constructor intenta ver, editar o eliminar datos de la obra o gastos de otro constructor? El sistema responde con acceso prohibido (403) en todos los casos.
- ¿Qué sucede cuando un usuario no autenticado intenta acceder a cualquier información de una obra? El sistema responde con acceso denegado (401) y no expone ningún dato.
- ¿Qué sucede cuando la sesión permanece inactiva 30 minutos? La sesión expira y se requiere volver a iniciar sesión para continuar.
- ¿Qué sucede cuando un constructor sin obra registrada intenta cargar un gasto? El sistema lo impide y lo redirige a crear su obra primero.
- ¿Qué sucede si se registra un gasto con moneda distinta de pesos (ARS)? El sistema lo rechaza, ya que solo se acepta ARS.
- ¿Qué sucede si un campo obligatorio de la obra, el presupuesto o un gasto queda vacío o inválido al crear o editar? El sistema rechaza la operación y muestra un mensaje de error indicando el problema.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir que un usuario se registre indicando email, contraseña, nombre, apellido y celular.
- **FR-002**: El sistema DEBE rechazar el registro si el email ya está en uso por otra cuenta, o si el email es inválido o falta nombre, apellido o celular.
- **FR-003**: El sistema DEBE requerir autenticación con email y contraseña para acceder a cualquier información de una obra.
- **FR-004**: El sistema DEBE permitir a un constructor autenticado cerrar sesión, invalidando el acceso posterior a sus datos hasta volver a autenticarse.
- **FR-005**: El sistema DEBE expirar automáticamente la sesión de un constructor tras 30 minutos de inactividad.
- **FR-006**: El sistema DEBE permitir el registro de una única obra por constructor, indicando nombre, país, provincia, localidad, dirección, coordenadas y fecha de inicio (obligatorios) y fecha de fin (opcional).
- **FR-007**: El sistema DEBE impedir que un constructor registre una segunda obra si ya tiene una registrada.
- **FR-008**: El sistema DEBE permitir editar los datos de la obra ya registrada, rechazando ediciones que dejen vacío un campo obligatorio.
- **FR-009**: El sistema DEBE permitir el registro del presupuesto inicial de la obra, rechazando montos cero, negativos o no numéricos.
- **FR-010**: El sistema DEBE permitir editar el presupuesto inicial ya registrado, rechazando montos cero, negativos o no numéricos.
- **FR-011**: El sistema DEBE permitir registrar gastos asociados a la obra, indicando monto, tipo y fecha, expresados en pesos (ARS).
- **FR-012**: El sistema DEBE rechazar el registro de un gasto si el monto es cero o negativo, si falta el tipo, si falta la fecha, o si la moneda no es ARS.
- **FR-013**: El sistema DEBE impedir el registro de un gasto si el constructor no tiene una obra creada, y redirigirlo a crearla.
- **FR-014**: El sistema DEBE incluir precargados los siguientes tipos de gasto, disponibles sin configuración previa: Administrativos, Dirección de Obra, Materiales, Mano de Obra y Otros.
- **FR-015**: El sistema DEBE permitir editar cualquier campo de un gasto ya registrado, reflejando los cambios en el reporte financiero.
- **FR-016**: El sistema DEBE permitir eliminar de forma permanente un gasto registrado, dejando de considerarlo en el presupuesto y los reportes.
- **FR-017**: El sistema DEBE permitir consultar el historial completo de gastos de la obra, ordenados cronológicamente, mostrando fecha, tipo y monto de cada uno, con la posibilidad de filtrarlo por tipo de gasto y por rango de fechas.
- **FR-018**: El sistema DEBE generar un reporte financiero con presupuesto total, monto gastado, saldo disponible, porcentaje consumido y desglose de gastado por tipo, incluyendo el caso sin gastos cargados (gastado en cero, disponible igual al presupuesto, 0% consumido) y el caso donde el gasto supera el presupuesto (saldo disponible negativo).
- **FR-019**: El sistema DEBE impedir que un constructor visualice, edite o elimine la obra o los gastos de otro constructor, denegando la operación en todos esos casos.
- **FR-020**: El sistema DEBE almacenar las contraseñas mediante hash seguro, nunca en texto plano.
- **FR-021**: El sistema DEBE presentar la interfaz de forma utilizable sin scroll horizontal ni elementos superpuestos en pantallas desde 320 px de ancho.

### Key Entities

- **Constructor**: Persona que construye su vivienda. Se identifica por email (único) y contraseña; incluye nombre, apellido y celular. Posee como máximo una Obra.
- **Obra**: Proyecto de construcción de un Constructor. Incluye nombre, país, provincia, localidad, dirección, coordenadas, fecha de inicio, fecha de fin (opcional) y un presupuesto inicial. Pertenece a un único Constructor.
- **Gasto**: Erogación registrada contra una Obra. Incluye monto (en ARS), tipo, fecha y pertenece a una única Obra.
- **Tipo de Gasto**: Categoría de clasificación de un Gasto. Precargada con los valores Administrativos, Dirección de Obra, Materiales, Mano de Obra y Otros.
- **Reporte Financiero**: Vista calculada del estado de una Obra a partir de su presupuesto y sus Gastos: presupuesto total, monto gastado, saldo disponible, porcentaje consumido y desglose de gasto por Tipo de Gasto. No conserva versiones históricas; refleja siempre el estado actual.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario nuevo puede completar el registro de cuenta e iniciar sesión en menos de 2 minutos.
- **SC-002**: El reporte financiero de una obra se visualiza en menos de 3 segundos en el 95% de las consultas.
- **SC-003**: El 100% de los intentos de acceso a datos de una obra sin autenticación válida o pertenecientes a otro constructor son rechazados.
- **SC-004**: Un constructor puede registrar un gasto nuevo en menos de 1 minuto.
- **SC-005**: Después de registrar, editar o eliminar un gasto, el reporte financiero refleja el valor correcto de inmediato, sin necesidad de esperar un proceso posterior.
- **SC-006**: Un constructor puede completar el flujo de alta (cuenta, obra, presupuesto y primer gasto) sin asistencia externa ni errores no explicados por el sistema.
- **SC-007**: La interfaz se usa correctamente, sin scroll horizontal ni elementos superpuestos, en pantallas desde 320 px de ancho.
- **SC-008**: El 100% de las contraseñas almacenadas cumplen con no quedar nunca en texto plano.

## Assumptions

- Cada constructor gestiona una única obra; no hay soporte para múltiples obras por cuenta ni para que varios constructores colaboren sobre la misma obra.
- Las coordenadas de la obra se ingresan como un par de valores de latitud y longitud.
- No existe recuperación ni restablecimiento de contraseña ("olvidé mi contraseña") en esta versión, según lo indicado explícitamente en el PRD.
- No se adjuntan facturas ni comprobantes a los gastos; queda fuera de alcance.
- El reporte financiero y el historial de gastos son solo para visualización dentro de la aplicación; no se requiere exportarlos ni descargarlos (ej. PDF, CSV) en esta versión.
- El sistema no envía emails con información de la obra ni notificaciones automáticas.
- El sistema no conserva versiones históricas de los reportes financieros: el reporte refleja siempre el estado actual, no una serie temporal.
- Todos los montos (presupuesto y gastos) se expresan y almacenan en pesos (ARS); no hay soporte multi-moneda.
- Los tipos de gasto precargados (Administrativos, Dirección de Obra, Materiales, Mano de Obra, Otros) son fijos para esta versión; no se especifica en el PRD la posibilidad de que el constructor cree tipos adicionales, por lo que se asume que el catálogo es cerrado.
- La interfaz se ofrece únicamente en español, sin soporte multi-idioma, y no se exige conformidad con un estándar formal de accesibilidad (ej. WCAG) más allá de la usabilidad responsiva ya definida (FR-021).
