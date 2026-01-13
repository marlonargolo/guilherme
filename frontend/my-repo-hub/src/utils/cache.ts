const CACHE_PREFIX = "cspro-cache:";

type CacheEnvelope<T> = {
  expiresAt: number;
  payload: T;
};

const isStorageAvailable = () => typeof window !== "undefined" && !!window.localStorage;

export function setCache<T>(key: string, value: T, ttlMs: number) {
  if (!isStorageAvailable() || ttlMs <= 0) return;
  const envelope: CacheEnvelope<T> = {
    expiresAt: Date.now() + ttlMs,
    payload: value,
  };
  try {
    window.localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(envelope));
  } catch (error) {
    console.warn("cache:set failed", error);
  }
}

export function getCache<T>(key: string): T | null {
  if (!isStorageAvailable()) return null;
  const raw = window.localStorage.getItem(`${CACHE_PREFIX}${key}`);
  if (!raw) return null;

  try {
    const envelope = JSON.parse(raw) as CacheEnvelope<T>;
    if (!envelope.expiresAt || envelope.expiresAt < Date.now()) {
      window.localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    return envelope.payload;
  } catch (error) {
    console.warn("cache:get failed", error);
    window.localStorage.removeItem(`${CACHE_PREFIX}${key}`);
    return null;
  }
}

export function clearCache(key?: string) {
  if (!isStorageAvailable()) return;
  if (key) {
    window.localStorage.removeItem(`${CACHE_PREFIX}${key}`);
    return;
  }
  Object.keys(window.localStorage)
    .filter((storageKey) => storageKey.startsWith(CACHE_PREFIX))
    .forEach((storageKey) => window.localStorage.removeItem(storageKey));
}
