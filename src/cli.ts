#!/usr/bin/env node

import 'reflect-metadata';
import * as path from 'path';
import * as cliProgress from 'cli-progress';
import * as commander from 'commander';
import * as resolveFrom from 'resolve-from';
import * as yargsParser from 'yargs-parser';
import * as chalk from 'chalk';
import {Loader} from './Loader';
import {createConnection, fixturesIterator} from './util';
import {Resolver} from './Resolver';
import {Builder} from './Builder';
import {Parser} from './Parser';

commander
    .version(require('../package.json').version, '-v, --version')
    .usage('[options] <path> Fixtures folder/file path')
    .arguments('<path> [otherPaths...]')
    .action((fixturesPath: string, otherPaths: Array<string>, options) => {
        options.paths = [fixturesPath, ...otherPaths];
    })
    .option('--require <package>', 'A list of additional modules. e.g. ts-node/register')
    .option('--databaseUrl <databaseUrl>', 'The database path overrides the DATABASE_URL environment variable')
    .option('-d --debug', 'Enable debug')
    .option('--no-color', 'Disable color');

commander.parse(process.argv);

const argv = yargsParser(process.argv.slice(2));

if (argv.require) {
    const requires = Array.isArray(argv.require) ? argv.require : [argv.require];

    for (const req of requires) {
        require(resolveFrom.silent(process.cwd(), req) || req);
    }
}

if (!commander.paths) {
    console.error('Path to fixtureConfigs folder is not passed.\n');
    commander.outputHelp();
    process.exit(1);
}

const debug = (message: string) => {
    if (commander.debug) {
        console.log(chalk.grey(message)); // tslint:disable-line
    }
};

const error = (message: string) => {
    console.log(chalk.red(message)); // tslint:disable-line
};

debug('Connection to database...');

createConnection(commander.databaseUrl)
    .then(async connection => {
        debug('Database is connected');
        debug('Loading fixtureConfigs');
        const loader = new Loader();
        commander.paths.forEach((fixturePath: string) => {
            loader.load(path.resolve(fixturePath));
        });
        debug('Resolving fixtureConfigs');
        const resolver = new Resolver();
        const fixtures = resolver.resolve(loader.fixtureConfigs);
        const builder = new Builder(connection, new Parser());

        const bar = new cliProgress.Bar({
            format: `${chalk.yellow('Progress')}  ${chalk.green('[{bar}]')} ${chalk.yellow(
                '{percentage}% | ETA: {eta}s | {value}/{total} {name}',
            )} `,
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            fps: 5,
            stream: process.stdout,
            barsize: 50,
        });

        bar.start(fixtures.length, 0, {name: ''});

        for (const fixture of fixturesIterator(fixtures)) {

            try {
                bar.increment(1, {name: fixture.name});
                await builder.build(fixture);
            } catch (e) {
                bar.stop();
                throw e;
            }
        }

        bar.update(fixtures.length, {name: ''});
        bar.stop();

        debug('\nDatabase disconnect');
        await connection.$disconnect();
        process.exit(0);
    })
    .catch(async e => {
        error('Fail fixture loading: ' + e.message);
        console.log(e); // tslint:disable-line
        process.exit(1);
    });
