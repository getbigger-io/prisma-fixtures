import {PrismaClient} from '@prisma/client';

export async function createConnection(databaseUrl?: string): Promise<PrismaClient> {
    const client = new PrismaClient({
        datasources: databaseUrl ? {db: {url: databaseUrl}} : undefined,
    });
    await client.$connect();

    return client;
}
