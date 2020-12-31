import { IProcessor } from '../../../../src/interface';
import {User} from '@prisma/client';

export default class UserProcessor implements IProcessor<User> {
    preProcess(name: string, object: { [key: string]: any }) {
        object.name = `${object.firstName} ${object.lastName}`;

        return object;
    }
}
