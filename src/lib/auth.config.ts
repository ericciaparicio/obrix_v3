import type { NextAuthConfig } from "next-auth";

// FR-005/RNF-03: sesión JWT de 30 minutos que se renueva en cada request
// autenticado exitoso (sliding session) — ver research.md #1.
const SESSION_MAX_AGE_SECONDS = 30 * 60;

export type ConstructorSessionUser = {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
};

// Config "edge-safe": sin el Credentials provider (que depende de bcryptjs
// y Prisma, APIs de Node no soportadas en el Edge Runtime donde corre
// middleware.ts). middleware.ts usa esta config directamente; auth.ts la
// extiende agregando el provider para el resto de la app (Node runtime).
export const authConfig = {
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      // Cada invocación (request autenticado) renueva `iat`/`exp` — es lo
      // que produce el comportamiento de sesión deslizante de 30 min.
      if (user) {
        const sessionUser = user as unknown as ConstructorSessionUser;
        token.constructorId = sessionUser.id;
        token.nombre = sessionUser.nombre;
        token.apellido = sessionUser.apellido;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.constructorId as string;
        (session.user as unknown as ConstructorSessionUser).nombre = token.nombre as string;
        (session.user as unknown as ConstructorSessionUser).apellido = token.apellido as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
