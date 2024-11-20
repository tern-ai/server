// Contains business logic for each route
// See ROUTES in index.ts to see it hooked up to routing

import { MapQuery } from "./query";
import { Request } from "express";

const ResponseData = { status: number; body: any };

// The type of handleMap is:
export async function handleMap(
    req: Request
): Promise<{ status: number; body: any }> {
    var outResp;
    try {
        const key = MapQuery.fromQuery(req.query)?.toString();
        if (!key) {
            outResp = { status: 400, body: "Malformed query: " + req.query };
        } else {
            var outData = null;

            outData = await redisClient.get(key);
            // TODO: This is a stub. Set up git submodules and then call our
            // existing OSM query fxn here.
            outData = outData || {};
            if (!outData) {
                outData = {};

                // TODO: Cache parameters, probably LRU but no TTL
                /// TODO DBG: Make async
                await redisClient.set(key, JSON.stringify(outData));
            }


        }
    } catch (err) {
        console.error(err);
        outResp = { status: 500, body: "Internal server error" };
    }

    return outResp;
}
