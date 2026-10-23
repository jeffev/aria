import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

// Chaves de terceiros (ex.: Gemini) ficam cifradas no banco com AES-256-GCM.
// A chave de cifra deriva do AUTH_SECRET, que já é segredo obrigatório do NextAuth.
function cipherKey(): Buffer {
  return createHash("sha256").update(process.env.AUTH_SECRET ?? "").digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", cipherKey(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

export function decryptSecret(sealed: string): string {
  const [iv, tag, data] = sealed.split(".").map((p) => Buffer.from(p, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", cipherKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
