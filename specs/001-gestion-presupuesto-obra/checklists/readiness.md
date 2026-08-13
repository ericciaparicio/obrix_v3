# Requirements Readiness Checklist: Gestión de Presupuesto y Gastos de Obra

**Purpose**: Auditoría general de completitud, claridad y consistencia de los requerimientos del spec, como autocontrol del autor antes de pasar a `/speckit-plan`. Profundidad estándar.
**Created**: 2026-08-13
**Feature**: [spec.md](../spec.md)

**Note**: Este checklist valida la CALIDAD de los requerimientos escritos en el spec, no el comportamiento del sistema implementado.

## Requirement Completeness

- [ ] CHK001 - ¿Están definidos los requisitos sobre si un constructor puede editar su email o contraseña de cuenta después del registro? [Gap]
- [ ] CHK002 - ¿Están especificados el formato o las reglas de validación del celular ingresado en el registro (ej. código de país, solo dígitos)? [Gap, Spec §FR-001]
- [ ] CHK003 - ¿Está especificado el formato o rango válido esperado para las coordenadas de la obra? [Completeness, Spec §FR-006, Assumptions]
- [ ] CHK004 - ¿Se documenta la mitigación de riesgo del PRD sobre mostrar un indicador de "última carga realizada" y destacar períodos prolongados sin movimientos, o se decide explícitamente excluirla del alcance de este spec? [Gap, Traceability]
- [ ] CHK005 - ¿Se especifica un límite máximo (o la ausencia deliberada de uno) para el monto del presupuesto o de un gasto individual? [Gap, Spec §FR-009, §FR-011]
- [ ] CHK006 - ¿Están definidos los requisitos de qué sucede si el servicio de autenticación no está disponible al intentar iniciar sesión? [Gap]
- [ ] CHK007 - ¿Se especifica si el registro de constructor requiere algún paso de verificación (ej. de email) antes de poder iniciar sesión? [Gap, Spec §FR-001]

## Requirement Clarity

- [ ] CHK008 - ¿Está cuantificado "de inmediato" en SC-005 con un tiempo máximo específico, o queda como término subjetivo? [Clarity, Spec §SC-005]
- [ ] CHK009 - ¿Es "mensaje de error" suficientemente específico en cuanto a contenido esperado para ser verificable en los FR que lo mencionan (FR-002, FR-008 a FR-013)? [Clarity, Ambiguity]
- [ ] CHK010 - ¿Se define de forma medible el formato exacto del "porcentaje consumido" (ej. redondeo, cantidad de decimales)? [Clarity, Spec §FR-018]
- [ ] CHK011 - ¿Es "sin asistencia externa ni errores no explicados" en SC-006 medible de forma objetiva, o requiere una definición operacional más precisa? [Clarity, Spec §SC-006]

## Requirement Consistency

- [ ] CHK012 - ¿Son consistentes las referencias a acceso denegado/prohibido (401/403) entre User Story 1, User Story 3, User Story 5, Edge Cases y Success Criteria? [Consistency, Spec §SC-003]
- [ ] CHK013 - ¿La restricción de "una obra por constructor" (FR-006/FR-007) se aplica de forma consistente en todas las historias que asumen una obra existente (US3, US4, US5, US6)? [Consistency]
- [ ] CHK014 - ¿Los cinco tipos de gasto precargados se listan de forma idéntica en FR-014, Key Entities y User Story 3? [Consistency, Spec §FR-014]

## Acceptance Criteria Quality

- [ ] CHK015 - ¿Cada escenario Given/When/Then de las seis historias de usuario tiene un resultado objetivamente verificable sin margen de interpretación? [Measurability]
- [ ] CHK016 - ¿Los criterios de éxito (SC-001 a SC-008) evitan referencias a tecnología o detalles de implementación específicos? [Measurability, Spec §Success Criteria]
- [ ] CHK017 - ¿Existe un ID de requisito y criterio de aceptación consistente que permita trazar cada FR a al menos un escenario de aceptación? [Traceability]

## Scenario Coverage

- [ ] CHK018 - ¿Existen requisitos para el caso en que un constructor abandona el registro de la obra a mitad de camino, con datos parcialmente completados? [Coverage, Gap]
- [ ] CHK019 - ¿Se cubren los requisitos de manejo de error cuando falla el guardado de un gasto o presupuesto por una causa distinta a un error de validación (ej. fallo del sistema)? [Coverage, Gap]
- [ ] CHK020 - ¿Están definidos los requisitos de qué ocurre con datos no guardados cuando la sesión expira por inactividad (FR-005)? [Coverage, Gap]

## Edge Case Coverage

- [ ] CHK021 - ¿Se especifica el comportamiento cuando el presupuesto se edita a un monto menor que el total ya gastado? [Edge Case, Gap, Spec §FR-010]
- [ ] CHK022 - ¿Se define qué sucede con el desglose de gasto por tipo (FR-018) cuando se elimina el último gasto de un tipo determinado? [Edge Case, Gap]
- [ ] CHK023 - ¿Están definidos límites de longitud o formato para los campos de texto libre de la obra (nombre, dirección) y del constructor (nombre, apellido)? [Edge Case, Gap]
- [ ] CHK024 - ¿Se especifica el comportamiento del filtro de historial cuando el rango de fechas ingresado es inválido (fecha "desde" posterior a "hasta")? [Edge Case, Gap, Spec §User Story 6]
- [ ] CHK025 - ¿Se define qué sucede cuando la fecha de fin de la obra es anterior a su fecha de inicio? [Edge Case, Gap, Spec §FR-006]

## Non-Functional Requirements

- [ ] CHK026 - ¿El requisito de rendimiento del reporte (SC-002) especifica bajo qué volumen aproximado de gastos se mide ese tiempo? [Completeness, Spec §SC-002]
- [ ] CHK027 - ¿Existe un requisito de registro (logging/auditoría) para eventos sensibles como intentos de acceso denegado (401/403) o inicios de sesión fallidos? [Gap]
- [ ] CHK028 - ¿Está documentado un requisito sobre qué sucede con los datos de una obra y sus gastos si el constructor da de baja su cuenta? [Gap]

## Dependencies & Assumptions

- [ ] CHK029 - ¿Las dependencias de infraestructura del PRD (almacenamiento persistente, servicio de autenticación) están reflejadas como supuestos o dependencias explícitas en el spec? [Assumption, Traceability]
- [ ] CHK030 - ¿El supuesto de que el catálogo de tipos de gasto es cerrado (Assumptions) está señalado como una decisión que podría requerir confirmación de negocio antes de implementar? [Assumption, Spec §Assumptions]

## Ambiguities & Conflicts

- [ ] CHK031 - ¿Algún requisito asume implícitamente soporte multi-obra o colaboración entre constructores que contradiga el supuesto de "una obra por constructor, sin colaboración"? [Conflict check, Spec §Assumptions]
- [ ] CHK032 - ¿El aislamiento entre constructores (FR-019) es consistente con la ausencia de cualquier mecanismo de invitación o de compartir acceso mencionado en el spec? [Consistency, Spec §FR-019]

## Notes

- Foco: Requisitos generales (cobertura amplia de completitud/claridad/consistencia). Profundidad: Estándar. Audiencia: autor, autocontrol previo a `/speckit-plan`.
- CHK004 señala un hallazgo concreto: la mitigación de riesgo del PRD ("indicador de última carga realizada") no quedó traducida a un requisito funcional ni a una historia de usuario en el spec actual — vale la pena resolverlo antes de planificar.
- Los ítems marcados [Gap] no son errores del spec en sí, sino preguntas abiertas que conviene decidir (aunque sea como "fuera de alcance explícito") antes de `/speckit-plan`.
