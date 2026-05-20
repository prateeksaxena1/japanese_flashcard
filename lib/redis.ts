import Redis from "ioredis";

let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redis) return redis;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn("[Redis] REDIS_URL not set — falling back to DB queries");
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on("error", (err) => {
      console.warn("[Redis] Connection error:", err.message);
    });

    redis.on("connect", () => {
      console.log("[Redis] Connected successfully");
    });

    return redis;
  } catch {
    console.warn("[Redis] Failed to create client — falling back to DB");
    return null;
  }
}

// ─── Wrapper functions with graceful fallback ──────────

export async function cacheGet(key: string): Promise<string | null> {
  try {
    const client = getRedisClient();
    if (!client) return null;
    return await client.get(key);
  } catch {
    console.warn("[Redis] GET failed for key:", key);
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<boolean> {
  try {
    const client = getRedisClient();
    if (!client) return false;
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
    return true;
  } catch {
    console.warn("[Redis] SET failed for key:", key);
    return false;
  }
}

export async function cacheDel(key: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    if (!client) return false;
    await client.del(key);
    return true;
  } catch {
    console.warn("[Redis] DEL failed for key:", key);
    return false;
  }
}

export default getRedisClient;
