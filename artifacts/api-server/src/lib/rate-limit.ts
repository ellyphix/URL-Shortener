// Fixed one-hour window per IP. Keeping it in memory is enough for this small app.
export function createRateLimiter(limit: number, windowMs: number) {
  const attempts = new Map<string, { count: number; expires: number }>();

  return (ip: string, now = Date.now()): boolean => {
    const previous = attempts.get(ip);
    const current = previous && previous.expires > now
      ? previous
      : { count: 0, expires: now + windowMs };

    current.count += 1;
    attempts.set(ip, current);

    if (attempts.size > 10000) {
      for (const [address, entry] of attempts) {
        if (entry.expires <= now) attempts.delete(address);
      }
    }

    return current.count <= limit;
  };
}