import * as fs from 'fs';
import * as path from 'path';
import { IDataParser, IFixture } from './interface';
import { PrismaClient } from '@prisma/client/scripts/default-index';

export class Builder {
    public entities: any = {};

    constructor(private readonly client: PrismaClient, private readonly parser: IDataParser) {}

    /**
     * @param {IFixture} fixture
     * @return {any}
     */
    async build(fixture: IFixture) {
        let data = this.parser.parse(fixture.data, fixture, this.entities);

        if (fixture.processor) {
            const processorPathWithoutExtension = path.join(
                path.dirname(fixture.processor),
                path.basename(fixture.processor, path.extname(fixture.processor)),
            );

            if (
                !fs.existsSync(processorPathWithoutExtension) &&
                !fs.existsSync(processorPathWithoutExtension + '.ts') &&
                !fs.existsSync(processorPathWithoutExtension + '.js')
            ) {
                throw new Error(`Processor "${fixture.processor}" not found`);
            }

            const processor = require(processorPathWithoutExtension).default;
            const processorInstance = new processor();

            /* istanbul ignore else */
            if (typeof processorInstance.preProcess === 'function') {
                data = await processorInstance.preProcess(fixture.name, data);
            }
        }

        if (fixture.connectedFields && Array.isArray(fixture.connectedFields)) {
            fixture.connectedFields.forEach((propertyName) => {
                if (!data[propertyName]) {
                    return; // case the connected field is not present
                }

                const connexions =
                    data[propertyName] instanceof Array
                        ? data[propertyName].map((p: { id: any }) => ({ id: p.id }))
                        : { id: data[propertyName].id };

                data[propertyName] = { connect: connexions };
            });
        }

        let entity = null;
        if (data.id) {
            const foundEntity = await this.client[fixture.entity].findUnique({ where: { id: data.id } });
            if (foundEntity) {
                entity = await this.client[fixture.entity].update({ where: { id: data.id }, data });
            } else {
                entity = await this.client[fixture.entity].create({ data });
            }
        } else {
            entity = await this.client[fixture.entity].create({ data });
        }

        this.entities[fixture.name] = entity;

        return entity;
    }
}
