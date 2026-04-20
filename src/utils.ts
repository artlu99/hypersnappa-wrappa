export const firstNUnique = <T, K>(xs: T[], key: (x: T) => K, n: number) => {
    const seen = new Set<K>();
    const out: T[] = [];
    for (const x of xs) {
      const k = key(x);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(x);
      if (out.length >= n) break;
    }
    return out;
  };