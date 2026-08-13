import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

// FR-005/RNF-03: sesión JWT de 30 minutos que se renueva en cada request
// autenticado exitoso (sliding session) — ver research.md #1.
const SESSION_MAX_AGE_SECONDS = 30 * 60;

export type ConstructorSessionUser = {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
};

// Extraída como función standalone para poder testearla sin pasar por el
// flujo completo de `signIn` de Auth.js (research.md #7).
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<ConstructorSessionUser | null> {
  const constructor = await prisma.constructor.findUnique({
    where: { email },
  });

  if (!constructor) {
    return null;
  }

  const isValid = await verifyPassword(password, constructor.passwordHash);
  if (!isValid) {
    return null;
  }

  return {
    id: constructor.id,
    email: constructor.email,
    nombre: constructor.nombre,
    apellido: constructor.apellido,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }
        return verifyCredentials(email, password);
      },
    }),
  ],
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
});
