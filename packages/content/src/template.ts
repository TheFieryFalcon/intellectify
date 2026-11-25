/** Fill `{{name}}` placeholders from a variant's parameters. Browser-safe (no Node imports). */
export function fillTemplate<T>(value: T, params: Record<string, string | number>): T {
  const sub = (s: string) => s.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
  const walk = (v: unknown): unknown =>
    typeof v === "string" ? sub(v) : Array.isArray(v) ? v.map(walk) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : v;
  return walk(value) as T;
}
