import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { auth } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "Obrix",
  description: "Presupuesto y gastos de obra",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="es">
      <body>
        <main>
          {session?.user && (
            <header style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <span>Hola, {session.user.name ?? session.user.email}</span>
                <LogoutButton />
              </div>
              <nav
                style={{
                  display: "flex",
                  gap: "1rem",
                  flexWrap: "wrap",
                  marginTop: "0.5rem",
                }}
              >
                <Link href="/obra">Mi obra</Link>
                <Link href="/obra/gastos">Gastos</Link>
                <Link href="/obra/reporte">Reporte</Link>
                <Link href="/obra/historial">Historial</Link>
              </nav>
            </header>
          )}
          {children}
        </main>
      </body>
    </html>
  );
}
