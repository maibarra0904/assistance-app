import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Assistance - Ing. Mario Ibarra",
  description: "Sistema premium de control de asistencia y calificaciones académicas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}
