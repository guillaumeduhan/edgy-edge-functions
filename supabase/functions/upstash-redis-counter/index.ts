import { serve } from "std/server";
import { Redis } from "Redis";
console.log(`Function "upstash-redis-counter" up and running!`);
serve(async (_req) => {
  try {
    const redis = new Redis({
      url: Deno.env.get("UPSTASH_REDIS_REST_URL")!,
      token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN")!,
    });
    const deno_region = Deno.env.get("DENO_REGION");
    if (deno_region) {
      // Increment region counter
      await redis.hincrby("supa-edge-counter", deno_region, 1);
    } else {
      // Increment localhost counter
      await redis.hincrby("supa-edge-counter", "localhost", 1);
    }
    // Get all values
    const counterHash: Record<string, number> | null = await redis.hgetall(
      "supa-edge-counter"
    );
    const counters = Object.entries(counterHash!)
      .sort(([, a], [, b]) => b - a) // sort desc
      .reduce(
        (r, [k, v]) => ({
          total: r.total + v,
          regions: { ...r.regions, [k]: v },
        }),
        {
          total: 0,
          regions: {},
        }
      );
    return new Response(JSON.stringify({ counters }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200,
    });
  }
});
