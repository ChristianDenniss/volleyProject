import { RegionFilterInput } from '../modules/regions/region.service.js';

export function parseRegionQuery(query: Record<string, unknown>): RegionFilterInput {
    const rawRegionId = query.regionId;
    const regionId =
        rawRegionId !== undefined && rawRegionId !== null && rawRegionId !== ''
            ? Number(rawRegionId)
            : undefined;

    const region =
        typeof query.region === 'string' && query.region.length > 0
            ? query.region.toLowerCase()
            : undefined;

    return {
        regionId: regionId !== undefined && !Number.isNaN(regionId) ? regionId : undefined,
        region,
    };
}
