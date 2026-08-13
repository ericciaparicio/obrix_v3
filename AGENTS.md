# AGENTS.md

## Propósito
Obrix es una aplicación web para que constructores particulares registren y controlen el presupuesto y los gastos de su obra.
Permite monitorear en tiempo real el estado financiero: monto gastado, disponible y desglose por tipo y moneda.

## Stack
- Next.js 15 (App Router)
- PostgreSQL (local)
- Prisma ORM — sin archivos de migración, usar `prisma db push`
- Auth.js v5 (NextAuth) — sesiones con expiración a los 30 min de inactividad
- Vitest
- pnpm

## Cómo correr
```bash
pnpm install
cp .env.example .env        # completar DATABASE_URL y AUTH_SECRET
pnpm dlx prisma db push
pnpm dev
pnpm test
```

## Qué NO hacer
- No implementar carga de archivos ni comprobantes asociados a gastos (fuera de alcance).
- No conservar versiones históricas de reportes financieros; solo existe el estado actual de la obra.
- No guardar contraseñas en texto plano; siempre hashear (bcrypt o argon2).
