import { IProcessor } from '../../../../src/interface';

export default class UserProcessor implements IProcessor<any> {
    preProcess(name: string, object: { [key: string]: any }): any {
        return { ...object, firstName: 'foo', lastName: 'boo' };
    }
}
