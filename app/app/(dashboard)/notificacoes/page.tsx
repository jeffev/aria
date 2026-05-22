export default function NotificacoesPage() {
  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 600, margin: "0 0 8px" }}>Notificações</h1>
      <p style={{ color: "var(--foreground-muted)", fontSize: 14, margin: "0 0 32px" }}>
        Mensagens do Teams e Discord
      </p>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 32,
          color: "var(--foreground-muted)",
          fontSize: 14,
        }}
      >
        Em breve — notificações sincronizadas do Teams e Discord.
      </div>
    </div>
  );
}
