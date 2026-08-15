import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import NavBar from "@/components/NavBar";

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
        {session?.user && (
          <header className="app-header">
            <div className="app-header-top">
              <strong>Obrix</strong>
              <span>Hola, {session.user.name ?? session.user.email}</span>
              <LogoutButton />
            </div>
            <NavBar />
          </header>
        )}
        <main>{children}</main>
      </body>
    </html>
  );
}
