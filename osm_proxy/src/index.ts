import {express, Request, Response} from 'express';
import dotenv from 'dotenv';
import { createClient } from 'redis';

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

// Proxy to Open Street Map with Redis caching
app.get('/osm', async (req, res) => {
    const { q } = req.query;
    if (!q) {
    res.status(400).send('Query parameter is required');
    return;
    }
    
    const cacheKey = `osm:${q}`;
    try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
        res.send(JSON.parse(cachedData));
        return;
    }
    
    // Proxy to Open Street Map API
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json`);
    if (!response.ok) {
        throw new Error('Failed to fetch data from OpenStreetMap');
    }
    const osmResponse = await response.json();
    
    // Cache the response
    await redisClient.set(cacheKey, JSON.stringify(osmResponse), {
        EX: 3600,
    });
    res.send(osmResponse);
    } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});