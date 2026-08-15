"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/obra/reporte", label: "Reporte" },
  { href: "/obra", label: "Mi obra" },
  { href: "/obra/gastos", label: "Gastos" },
  { href: "/obra/historial", label: "Historial" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      {LINKS.map((link) => {
        const isActive =
          link.href === "/obra" ? pathname === "/obra" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={isActive ? "navbar-link navbar-link-active" : "navbar-link"}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
