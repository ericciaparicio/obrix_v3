---
name: conventional-commit
description: Commitea un cambio con un mensaje que cumple la convención Conventional Commits. Se usa cuando el usuario pide commitear un cambio.
---

# Commitear un cambio con conventional-commit

Cuando tengas que commitear un cambio, debes generar un mensaje que siga la convención Conventional Commits, la cual plantea que el mensaje tenga el siguiente formato: 

tipo(scope): descripción en imperativo

Ejemplos:

feat(auth): agregar validación de email en el registro
fix(tickets): rechazar tickets con asunto vacío
docs(prd): aclarar criterio de control de acceso.

El tipo dice qué clase de cambio es: feat (feature nueva), fix (arreglo), docs (documentación), refactor, test, chore (mantenimiento).

El scope (opcional) dice qué parte del proyecto toca.

La descripción: en imperativo, minúscula, sin punto final, corta (≤ 72 caracteres).

Para poder definir dicho mensaje, analizá qué cambió se realizó, para luego elegir el tipo y generar una descripción acorde.
