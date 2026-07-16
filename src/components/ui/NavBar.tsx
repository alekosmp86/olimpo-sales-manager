"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./NavBar.module.css";

const NAV_LINKS = [
  { href: "/", label: "Ventas" },
  { href: "/stock", label: "Stock" },
];

export function NavBar() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <nav className={styles.nav} aria-label="Navegación principal">
      <div className={styles.inner}>
        <span className={styles.brand}>Olimpo</span>
        {!isLoginPage && (
          <div className={styles.links}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  styles.link,
                  pathname === link.href ? styles.active : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
