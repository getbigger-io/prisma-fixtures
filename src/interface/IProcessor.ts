export interface IProcessor<T> {
    preProcess?(name: string, object: any): any | Promise<any>;
}
