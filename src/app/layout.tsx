import type { Metadata } from "next";
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
            <header
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <span>Hola, {session.user.name ?? session.user.email}</span>
              <LogoutButton />
            </header>
          )}
          {children}
        </main>
      </body>
    </html>
  );
}
