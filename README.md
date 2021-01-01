# Prisma fixtures cli

[![CircleCI](https://circleci.com/gh/getbigger-io/prisma-fixtures.svg?style=svg)](https://circleci.com/gh/getbigger-io/prisma-fixtures)
[![Version](https://img.shields.io/npm/v/prisma-fixtures-cli.svg?style=flat-square)](https://www.npmjs.com/package/prisma-fixtures-cli)
[![License](https://img.shields.io/npm/l/prisma-fixtures-cli.svg?style=flat-square)](https://github.com/getbigger-io/prisma-fixtures/blob/master/LICENSE)

Relying on [faker.js](https://github.com/marak/Faker.js/), prisma-fixtures-cli allows you to create a ton of fixtures/fake data for use while developing 
or testing your project. It gives you a few essential tools to make it very easy to generate complex data with constraints in a readable and easy to edit 
way, so that everyone on your team can tweak the fixtures if needed.

This package has been adapted from [TypeORM Fixtures CLI](https://github.com/RobinCK/typeorm-fixtures) thanks to its
author [RobinCK](https://github.com/RobinCK).

## Table of Contents

- [Install](#install)
- [Development Setup](#development-setup)
- [Example](#example)
- [Creating Fixtures](#creating-fixtures)
  - [Fixture Ranges](#fixture-ranges)
  - [Fixture Reference](#fixture-reference)
  - [Fixture Lists](#fixture-lists)
  - [Calling Methods](#calling-methods)
- [Handling Relations](#handling-relations)
- [Advanced Guide](#advanced-guide)
  - [Parameters](#parameters)
  - [Faker Data](#faker-data)
  - [EJS templating](#ejs-templating)
  - [Load Processor](#load-processor)
- [Samples](#samples)
- [Usage](#usage)

## Install

#### NPM

```bash
npm install prisma-fixtures-cli --save-dev
```

#### Yarn

```bash
yarn add prisma-fixtures-cli --dev
```

## Development Setup

```bash
# install dependencies
npm install

# build dist files
npm run build
```

## Example

`fixtures/Comment.yml`

```yaml
entity: comment
items:
  comment{1..10}:
    fullName: '{{name.firstName}} {{name.lastName}}'
    email: '{{internet.email}}'
    text: '{{lorem.paragraphs}}'
    post: '@post*'
```

**Note**: Your entity must be named the same as you call it in the prisma client e.g: `client.<entityname>.create`...


`fixtures/Post.yml`

```yaml
entity: post
connectedFields: ['user'] # Use this to connect the user when creating the post
items:
  post1:
    title: '{{name.title}}'
    description: '{{lorem.paragraphs}}'
    user: '@user($current)'
  post2:
    title: '{{name.title}}'
    description: '{{lorem.paragraphs}}'
    user: '@user($current)'
```

`fixtures/User.yml`

```yaml
entity: User
connectedFields: ['profile'] # Use this to connect the user when creating the post
items:
  user1:
    firstName: '{{name.firstName}}'
    lastName: '{{name.lastName}}'
    email: '{{internet.email}}'
    profile: '@profile1'
  user2:
    firstName: '{{name.firstName}}'
    lastName: '{{name.lastName}}'
    email: '{{internet.email}}'
    profile: '@profile2'
```

`fixtures/Profile.yml`

```yaml
entity: profile
items:
  profile1:
    aboutMe: <%= ['about string', 'about string 2', 'about string 3'].join(", ") %>
    skype: skype-account>
    language: english
  profile2:
    aboutMe: <%= ['about string', 'about string 2', 'about string 3'].join(", ") %>
    skype: skype-account
    language: english
```

## Creating Fixtures

The most basic functionality of this library is to turn flat yaml files into objects

```yaml
entity: user
items:
  user0:
    username: bob
    fullname: Bob
    birthDate: 1980-10-10
    email: bob@example.org
    favoriteNumber: 42

  user1:
    username: alice
    fullname: Alice
    birthDate: 1978-07-12
    email: alice@example.org
    favoriteNumber: 27
```

### Fixture Ranges

The first step is to let create many copies of an object for you to remove duplication from the yaml file.

You can do that by defining a range in the fixture name:

```yaml
entity: user
items:
  user{1..10}:
    username: bob
    fullname: Bob
    birthDate: 1980-10-10
    email: bob@example.org
    favoriteNumber: 42
```

Now it will generate ten users, with IDs user1 to user10. Pretty good but we only have 10 bobs with the same name, username and email, which is not so fancy yet.

### Fixture Reference

You can also specify a reference to a previously created list of fixtures:

```yaml
entity: post
connectedFields: ['user'] # Use this to connect the user when creating the post
items:
  post1:
    title: 'Post title'
    description: 'Post description'
    user: '@user1'
```

### Fixture Lists

You can also specify a list of values instead of a range:

```yaml
entity: post
connectedFields: ['user']
items:
  post{1..10}:
    title: 'Post title'
    description: 'Post description'
    user: '@user($current)'
```

In the case of a range (e.g. user{1..10}), `($current)` will return 1 for user1, 2 for user2 etc.

The current iteration can be used as a string value:

```yaml
entity: post
items:
  post{1..10}:
    title: 'Post($current)'
    description: 'Post description'
```

`Post($current)` will return Post1 for post1, Post2 for post2 etc.

You can mutate this output by using basic math operators:

```yaml
entity: post
items:
  post{1..10}:
    title: 'Post($current*100)'
    description: 'Post description'
```

`Post($current*100)` will return Post100 for post1, Post200 for post2 etc.

### Calling Sync and Async Methods

Sometimes though you need to call a method to initialize some more data, you can do this just like with properties but instead using the method name and giving it an array of arguments.

```yaml
entity: user
items:
  user{1..10}:
    username: bob
    fullname: Bob
    birthDate: 1980-10-10
    email: bob@example.org
    favoriteNumber: 42
```

## Handling Relations

```yaml
entity: user
items:
  user1:
    # ...

entity: group
connectedFields: ['owner', 'members']
items:
  group1:
    name: '<{names.admin}>'
    owner: '@user1'
    members:
      - '@user2'
      - '@user3'

```

If you want to create ten users and ten groups and have each user own one group, you can use `($current)` which is replaced with the current ID of each iteration when using fixture ranges:

```yaml
entity: user
items:
  user1:
    # ...

entity: group
connectedFields: ['owner', 'members']
items:
  group{1..10}:
    name: 'name'
    owner: '@user($current)'
    members:
      - '@user2'
      - '@user3'

```

If you would like a random user instead of a fixed one, you can define a reference with a wildcard:

```yaml
entity: user
items:
  user1:
    # ...

entity: group
connectedFields: ['owner', 'members']
items:
  group{1..10}:
    name: 'name'
    owner: '@user*'
    members:
      - '@user2'
      - '@user3'

```

or

```yaml
entity: user
items:
  user1:
    # ...

entity: group
connectedFields: ['owner', 'members']
items:
  group{1..10}:
    name: 'name'
    owner: '@user{1..2}' # @user1 or @user2
    members:
      - '@user2'
      - '@user3'

```

## Advanced Guide

### Parameters

You can set global parameters that will be inserted everywhere those values are used to help with readability. For example:

```yaml
entity: group
connectedFields: ['owner', 'members']
parameters:
  names:
    admin: Admin
items:
  group1:
    name: '<{names.admin}>' # <--- set Admin
    owner: '@user1'
    members:
      - '@user2'
      - '@user3'
```

### Faker Data

This library integrates with the [faker.js](https://github.com/marak/Faker.js/) library. Using {{foo}} you can call Faker data providers to generate random data.

Let's turn our static bob user into a randomized entry:

```yaml
entity: user
items:
  user{1..10}:
    username: '{{internet.userName}}'
    fullname: '{{name.firstName}} {{name.lastName}}'
    birthDate: '{{date.past}}'
    email: '{{internet.email}}'
    favoriteNumber: '{{random.number}}'
```

### EJS templating

This library integrates with the [EJS](https://github.com/mde/ejs)

```yaml
entity: Profile
items:
  profile1:
    aboutMe: <%= ['about string', 'about string 2', 'about string 3'].join(", ") %>
    skype: skype-account>
    language: english
```

### Load Processor

Processors allow you to process objects before and/or after they are persisted. Processors must implement the: `IProcessor`

```typescript
import { IProcessor } from 'prisma-fixtures-cli';
```

Here is an example:

`processor/UserProcessor.ts`

```typescript
import { IProcessor } from 'prisma-fixtures-cli';
import { User } from '@prisma/client';

export default class UserProcessor implements IProcessor<User> {
  preProcess(name: string, object: any): any {
    return { ...object, firstName: 'foo' };
  }
}
```

fixture config `fixtures/user.yml`

```yaml
entity: user
processor: ../processor/UserProcessor
items:
  user1:
    firstName: '{{name.firstName}}'
    lastName: '{{name.lastName}}'
    email: '{{internet.email}}'
```

## Usage

```
Usage: fixtures [options] <path> Fixtures folder/file path

Options:
  -v, --version              output the version number
  --require                  A list of additional modules. e.g. ts-node/register
  -d --debug                 Enable debug
  --databaseUrl              Overrides the DATABASE_URL env variable
  -h, --help                 output usage information
  --no-color                 Disable color
```

##### Require multiple additional modules

If you're using multiple modules at once (e.g. ts-node and tsconfig-paths)
you have the ability to require these modules with multiple require flags. For example:

```
fixtures ./fixtures --require=ts-node/register --require=tsconfig-paths/register --databaseUrl=file:./mydb.sqlite
```

### Programmatically loading fixtures

Although prisma-fixtures-cli is intended to use as a CLI, you can still load
fixtures via APIs in your program.

For example, the below code snippet will load all fixtures exist in `./fixtures` directory:

```typescript
import * as path from 'path';
import { Builder, fixturesIterator, Loader, Parser, Resolver } from 'prisma-fixtures-cli';

const loadFixtures = async (fixturesPath: string) => {
  let connection;

  try {
    connection = await PrismaClient();
    await connection.$connect();

    const loader = new Loader();
    loader.load(path.resolve(fixturesPath));

    const resolver = new Resolver();
    const fixtures = resolver.resolve(loader.fixtureConfigs);
    const builder = new Builder(connection, new Parser());

    for (const fixture of fixturesIterator(fixtures)) {
      const entity = await builder.build(fixture);
      // use the entity if you need it
    }
  } catch (err) {
    throw err;
  } finally {
    if (connection) {
      await connection.$disconnect();
    }
  }
};

loadFixtures('./fixtures')
  .then(() => {
    console.log('Fixtures are successfully loaded.');
  })
  .catch(err => console.log(err));
```

## Samples

- [prisma-fixtures-sample](https://github.com/getbigger-io/prisma-fixtures-sample)

## Contributors

### Code Contributors

This project exists thanks to all the people who contribute. [[Contribute](CONTRIBUTING.md)].
<a href="https://github.com/getbigger-io/prisma-fixtures/graphs/contributors"><img src="https://opencollective.com/prisma-fixtures/contributors.svg?width=890&button=false" /></a>

MIT © [Nicolas MACHEREY](https://github.com/getbigger-io)
