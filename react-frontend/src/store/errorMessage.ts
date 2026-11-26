/** Pull the most useful message out of an axios-style error, for thunks to rethrow. */
export function errorMessage(err: unknown, fallback: string): string {
  const e = err as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const msg = e?.response?.data?.message ?? e?.message ?? fallback;
  return Array.isArray(msg) ? msg.join(", ") : msg || fallback;
}
