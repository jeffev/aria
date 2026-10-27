import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARIA — Assistente Pessoal",
  description: "Automated Routine Intelligence Assistant",
  applicationName: "ARIA",
  appleWebApp: {
    capable: true,
    title: "ARIA",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1d2e",
  // `cover` deixa o app ocupar a área do entalhe; as barras compensam com
  // env(safe-area-inset-*) em globals.css.
  viewportFit: "cover",
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
