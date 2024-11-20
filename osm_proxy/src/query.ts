import { Latlong } from './types';
import { ParsedQs } from 'qs';

export class MapQuery {
    latlong: Latlong;

    constructor(latlong: Latlong) {
        this.latlong = latlong;
    }

    toString(): string {
        return `${this.latlong.lat},${this.latlong.lon}`;
    }

    static fromQuery(q: ParsedQs): MapQuery | undefined {
        if (q && q.ll && typeof q.ll === 'string') {
            const split = q.ll.split(',');
            if (split.length == 2) {
                const [lat, lon] = split.map(parseFloat);
                if (lat && lon && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                    return new MapQuery({
                        lat,
                        lon,
                    });
                }
            }
        }
    }
};
