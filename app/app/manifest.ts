import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ARIA — Assistente Pessoal",
    short_name: "ARIA",
    description: "Agenda, tarefas, notas e um assistente que cria tudo isso por conversa.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f1117",
    theme_color: "#1a1d2e",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Agenda", url: "/agenda", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Tarefas", url: "/tarefas", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Notas", url: "/notas", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
