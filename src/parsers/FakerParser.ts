import * as faker from 'faker';
import {IFixture, IParser} from '../interface';
import {split} from 'ts-node';

export class FakerParser implements IParser {
    /**
     * @type {number}
     */
    public priority = 70;

    /**
     * @param {string} value
     * @return {boolean}
     */
    isSupport(value: string): boolean {
        return /\{\{.+\}\}/gm.test(value);
    }

    /**
     * @param {string} value
     * @param {IFixture} fixture
     * @return {any}
     */
    parse(value: string, fixture?: IFixture): any {
        if (fixture?.locale) {
            // @ts-ignore
            faker.locale = fixture.locale;
        }

        const result = this.fake(value);

        if ((+result).toString() === result) {
            return +result;
        } else if (result === 'true' || result === 'false') {
            return result === 'true';
        } else {
            return result;
        }
    }

    fake = (str: string): any => {
        // setup default response as empty string
        let res = '';

        // if incoming str parameter is not provided, return error message
        if (!str) {
            throw new Error('string parameter is required!');
        }

        // find first matching {{ and }}
        const start = str.search('{{');
        const end = str.search('}}');

        // if no {{ and }} is found, we are done
        if (start === -1 && end === -1) {
            return str;
        }

        // extract method name from between the {{ }} that we found
        // for example: {{name.firstName}}
        const token = str.substr(start + 2, end - start - 2);
        let method = token.replace('}}', '').replace('{{', '');

        // extract method parameters
        const regExp = /\(([^)]+)\)/;
        const matches = regExp.exec(method);
        let parameters = '';
        if (matches) {
            method = method.replace(regExp, '');
            parameters = matches[1];
        }

        // split the method into module and function
        const parts = method.split('.');
        const anyFaker = faker as any;
        if (typeof anyFaker[parts[0]] === 'undefined') {
            throw new Error('Invalid module: ' + parts[0]);
        }

        if (typeof anyFaker[parts[0]][parts[1]] === 'undefined') {
            throw new Error('Invalid method: ' + parts[0] + '.' + parts[1]);
        }

        // assign the function from the module.function namespace
        const fn = anyFaker[parts[0]][parts[1]];

        // If parameters are populated here, they are always going to be of string type
        // since we might actually be dealing with an object or array,
        // we always attempt to the parse the incoming parameters into JSON
        let params;
        // Note: we experience a small performance hit here due to JSON.parse try / catch
        // If anyone actually needs to optimize this specific code path, please open a support issue on github
        try {
            params = JSON.parse(parameters)
        } catch (err) {
            // since JSON.parse threw an error, assume parameters was actually a string
            params = parameters;
        }

        let result;
        if (typeof params === 'string' && params.length === 0) {
            result = fn();
        } else {
            result = fn(params);
        }

        // replace the found tag with the returned fake value
        res = str.replace('{{' + token + '}}', result);
        // find first matching {{
        const tokens = res.search('{{'); // No more to analyze
        if (tokens === -1) {
            return result;
        }

        // return the response recursively until we are done finding all tags
        return this.fake(res);
    }
}
