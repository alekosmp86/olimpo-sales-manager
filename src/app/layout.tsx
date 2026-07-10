import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { NavBar } from "@/components/ui/NavBar";

export const metadata: Metadata = {
  title: "Olimpo — Gestión de Ventas",
  description: "Sistema de gestión de ventas de Olimpo",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Olimpo",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D7377",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <Providers>
          <NavBar />
          {children}
          <div className="orientation-warning" aria-hidden="true">
            <div className="orientation-content">
              <div className="phone-icon-wrapper">
                <svg className="phone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" strokeLinecap="round" />
                </svg>
              </div>
              <h2>Por favor, gira tu dispositivo</h2>
              <p>Esta aplicación está optimizada para el modo vertical en teléfonos móviles.</p>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
