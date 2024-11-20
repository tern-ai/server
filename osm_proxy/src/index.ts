import { serve } from "@hono/node-server";
import { assert } from "console";
import dotenv from "dotenv";
import { Context, Handler, Hono, Next } from "hono";
import { createClient } from "redis";

const DEFAULT_PORT = 3000;
const DEFAULT_REDIS_URL = "redis://localhost:6379";

// Read env vars
dotenv.config();

const app = new Hono();

const redisClient = createClient({
    url: process.env.REDIS_URL || DEFAULT_REDIS_URL,
});
// Global error handler
redisClient.on("error", (err) => console.error("Redis Client Error", err));

// Cache middleware
const withCache = (handler: Handler, keyFn = (url: string) => url) => {
    return async (c: Context, next: Next) => {
        const key = keyFn(c.req.url);
        var cached: string | null = await redisClient.get(key);
        const resp = cached ? new Response(cached) : await handler(c, next);

        if (!cached) {
            // Async
            redisClient
            .set(key, JSON.stringify(resp.body))
            .catch((err) =>
                   console.error(`Error caching key ${key} to Redis: ${err}`)
                  );
        }

        return resp;
    };
};

// Middleware: API Key Authentication
const TERN_API_KEY = process.env.TERN_API_KEY;
assert(TERN_API_KEY, "TERN_API_KEY is required");
async function apiKeyAuth(c: Context, next: Next): Promise<Response | void> {
    if (c.req.header("x-api-key") !== TERN_API_KEY) {
        // Helper fxn to return response
        return c.text("Unauthorized: Invalid API Key", 401);
    }

    // TODO: Unfortunately, Hono doesn't allow this to be done purely
    // functionally
    await next();
}

/*--------------------------------- Routes ---------------------------------*/

// Apply API Key Middleware Globally
app.use("*", apiKeyAuth);

app.get(
    "/osm",
    withCache(async (c: Context) => {
        // TODO: This is a stub. git submodules need to be set up so we can
        // import the existing OSM code.
        return c.text("{}");
    })
);

const port = Number(process.env.PORT) || Number(DEFAULT_PORT);
serve(app, () => {
    console.log("Starting server on port", port);
    return { port };
});

export default app;
