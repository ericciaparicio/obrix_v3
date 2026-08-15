import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { auth } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import NavBar from "@/components/NavBar";
import Logo from "@/components/Logo";

const wordmarkFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-wordmark",
});

export const metadata: Metadata = {
  title: "Obrix",
  description: "Presupuesto y gastos de obra",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="es" className={wordmarkFont.variable}>
      <body>
        {session?.user && (
          <header className="app-header">
            <div className="app-header-top">
              <Logo size={28} compact />
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
