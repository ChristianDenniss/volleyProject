import { AppDataSource } from './data-source.js';
import { Region } from '../modules/regions/region.entity.js';

const DEFAULT_REGIONS: Array<Pick<Region, 'code' | 'name' | 'sortOrder'>> = [
    { code: 'na', name: 'North American', sortOrder: 1 },
    { code: 'eu', name: 'European', sortOrder: 2 },
    { code: 'as', name: 'Asian', sortOrder: 3 },
];

export async function seedDevData(): Promise<void> {
    const regionRepo = AppDataSource.getRepository(Region);
    const count = await regionRepo.count();
    if (count > 0) {
        return;
    }

    await regionRepo.save(DEFAULT_REGIONS);
    console.log('Seeded default regions for local development');
}
