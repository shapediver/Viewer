import 'reflect-metadata'
import { container } from 'tsyringe';

import { PerformanceEvaluator, Logger, LOGGINGTOPIC } from '../src/index'

jest.setTimeout(100000);

const sleep = (delay: number) => {
    return new Promise<void>((resolve) => {
        setTimeout(() => { resolve() }, delay);
    })
};

describe('performance evaluator - test', () => {
    let pe: PerformanceEvaluator;

    beforeEach(() => {
        pe = <PerformanceEvaluator>container.resolve(PerformanceEvaluator);
    });

    test('simple', async () => {
        pe.start('simple');
        await sleep(200);
        pe.end('simple');
        expect(pe.getEvaluation('simple').duration).toBeDefined();
        expect(pe.getEvaluation('simple').duration).toBeGreaterThanOrEqual(200);
    });

    test('advanced - 1', async () => {
        pe.start('advanced');
        await sleep(200);
        pe.pause('advanced');
        await sleep(500);
        pe.continue('advanced');
        await sleep(200);
        pe.end('advanced');
        expect(pe.getEvaluation('advanced').duration).toBeDefined();
        expect(pe.getEvaluation('advanced').duration).toBeGreaterThanOrEqual(400);
        expect(pe.getEvaluation('advanced').duration).toBeLessThanOrEqual(450);
    });

    test('advanced - 2', async () => {
        pe.start('advanced');
        await sleep(200);
        pe.pause('advanced');
        await sleep(500);
        pe.continue('advanced');
        await sleep(200);
        pe.pause('advanced');
        await sleep(500);
        pe.continue('advanced');
        await sleep(200);
        pe.end('advanced');
        expect(pe.getEvaluation('advanced').duration).toBeDefined();
        expect(pe.getEvaluation('advanced').duration).toBeGreaterThanOrEqual(600);
        expect(pe.getEvaluation('advanced').duration).toBeLessThanOrEqual(650);
    });

    test('advanced - 3', async () => {
        pe.start('advanced');
        await sleep(200);
        pe.pause('advanced');
        await sleep(500);
        pe.continue('advanced');
        await sleep(200);
        pe.pause('advanced');
        await sleep(500);
        pe.continue('advanced');
        await sleep(200);
        pe.pause('advanced');
        await sleep(500);
        pe.continue('advanced');
        await sleep(200);
        pe.end('advanced');
        expect(pe.getEvaluation('advanced').duration).toBeDefined();
        expect(pe.getEvaluation('advanced').duration).toBeGreaterThanOrEqual(800);
        expect(pe.getEvaluation('advanced').duration).toBeLessThanOrEqual(850);
    });

    test('advanced - error 1', async () => {
        pe.start('advanced');
        await sleep(200);
        pe.pause('advanced');
        await sleep(500);
        pe.pause('advanced');
        await sleep(200);
        pe.end('advanced');
        expect(pe.getEvaluation('advanced').duration).toBeDefined();
        expect(pe.getEvaluation('advanced').duration).toBeGreaterThanOrEqual(200);
        expect(pe.getEvaluation('advanced').duration).toBeLessThanOrEqual(250);
    });

    test('advanced - error 2', async () => {
        pe.start('advanced');
        await sleep(200);
        pe.continue('advanced');
        await sleep(500);
        pe.pause('advanced');
        await sleep(200);
        pe.end('advanced');
        expect(pe.getEvaluation('advanced').duration).toBeDefined();
        expect(pe.getEvaluation('advanced').duration).toBeGreaterThanOrEqual(700);
        expect(pe.getEvaluation('advanced').duration).toBeLessThanOrEqual(750);
    });

    test('advanced - error 3', async () => {
        pe.start('advanced');
        await sleep(200);
        pe.pause('advanced');
        await sleep(500);
        pe.continue('advanced');
        await sleep(500);
        pe.continue('advanced');
        await sleep(200);
        pe.end('advanced');
        expect(pe.getEvaluation('advanced').duration).toBeDefined();
        expect(pe.getEvaluation('advanced').duration).toBeGreaterThanOrEqual(900);
        expect(pe.getEvaluation('advanced').duration).toBeLessThanOrEqual(950);
    });
})