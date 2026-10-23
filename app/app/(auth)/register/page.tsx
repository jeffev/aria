"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao criar conta");
      setLoading(false);
      return;
    }

    // Auto-login após registro
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      router.push("/login");
    } else {
      router.push("/");
    }
  }

  return (
    <div style={cardStyle}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>ARIA</h1>
      <p style={{ fontSize: 13, color: "var(--foreground-muted)", margin: "0 0 28px" }}>
        Criar conta
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Nome (opcional)">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            placeholder="Seu nome"
            autoFocus
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
            placeholder="voce@email.com"
          />
        </Field>

        <Field label="Senha">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={inputStyle}
            placeholder="Mínimo 8 caracteres"
          />
        </Field>

        {error && (
          <p style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>{error}</p>
        )}

        <button type="submit" disabled={loading} style={primaryBtnStyle}>
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <hr style={{ margin: "20px 0", borderColor: "var(--border)", borderTop: "none" }} />

      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        style={googleBtnStyle}
      >
        <GoogleIcon />
        Continuar com Google
      </button>

      <p style={{ textAlign: "center", fontSize: 13, margin: "20px 0 0", color: "var(--foreground-muted)" }}>
        Já tem conta?{" "}
        <Link href="/login" style={{ color: "var(--accent)", textDecoration: "none" }}>
          Entrar
        </Link>
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: "36px 32px",
  width: "100%",
  maxWidth: 380,
};

const inputStyle: React.CSSProperties = {
  padding: "9px 12px",
  border: "1px solid var(--border)",
  borderRadius: 8,
  background: "var(--background)",
  color: "var(--foreground)",
  fontSize: 14,
  outline: "none",
};

const primaryBtnStyle: React.CSSProperties = {
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 0",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  marginTop: 4,
};

const googleBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  width: "100%",
  background: "var(--surface-2)",
  color: "var(--foreground)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "10px 0",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};
