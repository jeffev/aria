import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARIA — Assistente Pessoal",
  description: "Automated Routine Intelligence Assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full flex">{children}</body>
    </html>
  );
}
