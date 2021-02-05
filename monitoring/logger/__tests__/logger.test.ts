import 'reflect-metadata'
import { container } from 'tsyringe';
import { Logger } from '../src'


describe('logger - test', () => {
    let logger: Logger;

    beforeEach(() => {
        logger = <Logger>container.resolve(Logger);
    });

    test('info logging', async () => {
        logger.info('a message')
    });

    // TODO to be expanded when there is more than console logging

})