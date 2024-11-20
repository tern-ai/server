import {express, Request, Response} from 'express';
import dotenv from 'dotenv';
import { createClient } from 'redis';
// Import from a file in the same dir:
import { handleMap } from "./handlers";
import {MapQuery} from './query';

const DEFAULT_PORT = 3000;
const DEFAULT_REDIS_URL = 'redis://localhost:6379';

// Read env vars
dotenv.config();

const app = express();
const port = process.env.PORT || DEFAULT_PORT;
const redisClient = createClient({
    url: process.env.REDIS_URL || DEFAULT_REDIS_URL,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
    await redisClient.connect();
})();

app.use(express.json());

// auth
// TODO: Disable for local runs
const TERN_API_KEY = process.env.TERN_API_KEY || '';
app.use((req: Request, res: Response, next: any) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== TERN_API_KEY) {
        res.status(401).send('Unauthorized: set x-api-key header');
        return;
    }
    // Continue to route handling
    next();
});

const ROUTES: Map<string, (_: Request) => Promise<{ status: number, body: any}>> = new Map(
    ['/map', handleMap]
);

for (const [route, handler] of ROUTES.entries()) {
    app.get(route, async (req, res) => {
        const resp = await handler(req, res);
        res.status(resp.status).send(resp.body);
    });
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
