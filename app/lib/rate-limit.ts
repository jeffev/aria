// Limite de requisições em memória (janela fixa). Basta para a demo, que roda
// num único processo; com várias instâncias seria preciso um store compartilhado.
const buckets = new Map<string, { count: number; resetAt: number }>();

/** true quando `key` já passou de `limit` chamadas dentro de `windowMs`. */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count++;
  return bucket.count > limit;
}

/** IP do cliente. O Caddy da frente sobrescreve o X-Forwarded-For com o IP real. */
export function clientIp(request: Request | undefined): string {
  const forwarded = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request?.headers.get("x-real-ip") || "unknown";
}
