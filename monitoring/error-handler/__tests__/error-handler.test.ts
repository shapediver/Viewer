import 'reflect-metadata'
import { container } from 'tsyringe';
import { ErrorHandler } from '../src'


describe('error handler - test', () => {
    let errorHandler: ErrorHandler;

    beforeEach(() => {
        errorHandler = <ErrorHandler>container.resolve(ErrorHandler);
    });

    test('standard error', async () => {
        errorHandler.handle(new Error('this is an error message'))
    });

    test('http error', async () => {
        errorHandler.handleHttpError(404, new Error('this is an http error message'))
    });

    // TODO to be expanded when there is more errors to handle

})