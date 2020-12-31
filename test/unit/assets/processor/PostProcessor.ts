import { IProcessor } from '../../../../src/interface';

export default class PostProcessor implements IProcessor<any> {
    preProcess(name: string, object: { [key: string]: any }): void {
        object = {};
    }
}
