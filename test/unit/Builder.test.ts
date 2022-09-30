import 'mocha';
import * as path from 'path';
import * as chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import { Builder, Parser } from '../../src';
import { Connection as MockConnection } from './assets/mock/Connection';
import { User } from './assets/entity/User';
import { Listing } from './assets/entity/Listing';

chai.use(chaiAsPromised);

describe('Builder', () => {
    it('should be build entity', async () => {
        const connection = new MockConnection();
        const parser = new Parser();
        const builder = new Builder(connection, parser);

        const result = await builder.build({
            parameters: {},
            entity: 'user',
            name: 'user1',
            processor: undefined,
            dependencies: [],
            data: {
                firstName: 'firstName',
                lastName: 'lastName',
                email: 'email',
            },
        });

        chai.expect(result).to.be.deep.equal(
            Object.assign(new User(), {
                id: 1,
                firstName: 'firstName',
                lastName: 'lastName',
                email: 'email',
            }),
        );
    });

    it('should be build entity once if it already exists', async () => {
        const connection = new MockConnection();
        const parser = new Parser();
        const builder = new Builder(connection, parser);

        const result1 = await builder.build({
            parameters: {},
            entity: 'user',
            name: 'user1',
            processor: undefined,
            dependencies: [],
            data: {
                id: 1,
                firstName: 'firstName',
                lastName: 'lastName',
                email: 'email1',
            },
        });

        const result2 = await builder.build({
            parameters: {},
            entity: 'user',
            name: 'user1',
            processor: undefined,
            dependencies: [],
            data: {
                id: 1,
                firstName: 'firstName',
                lastName: 'lastName',
                email: 'email2',
            },
        });

        chai.expect(result1).to.be.deep.equal(
            Object.assign(new User(), {
                id: 1,
                firstName: 'firstName',
                lastName: 'lastName',
                email: 'email1',
            }),
        );

        chai.expect(result2).to.be.deep.equal(
            Object.assign(new User(), {
                id: 1,
                firstName: 'firstName',
                lastName: 'lastName',
                email: 'email2',
            }),
        );
    });

    it('should be processed entity', async () => {
        const connection = new MockConnection();
        const parser = new Parser();
        const builder = new Builder(connection, parser);

        const result = await builder.build({
            parameters: {},
            entity: 'user',
            name: 'user1',
            processor: path.join(__dirname, 'assets/processor/UserProcessor.ts'),
            dependencies: [],
            data: {
                firstName: 'firstName',
                lastName: 'lastName',
                email: 'email',
            },
        });

        chai.expect(result).to.be.deep.equal(
            Object.assign(new User(), {
                id: 1,
                firstName: 'foo',
                lastName: 'boo',
                email: 'email',
            }),
        );
    });

    it('should be processor not found', () => {
        const connection = new MockConnection();
        const parser = new Parser();
        const builder = new Builder(connection, parser);

        chai.expect(
            builder.build({
                parameters: {},
                entity: 'user',
                name: 'user1',
                processor: 'assets/processor/UserProcessor.ts',
                dependencies: [],
                data: {
                    firstName: 'firstName',
                    lastName: 'lastName',
                    email: 'email',
                },
            }),
        ).to.be.rejectedWith('Processor "assets/processor/UserProcessor.ts" not found');
    });
});
