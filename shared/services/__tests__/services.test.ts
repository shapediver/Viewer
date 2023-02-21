import { EventEngine, EVENTTYPE } from '../src/index'
import { IEvent } from '../src/event-engine/interfaces/IEvent'

describe('test', () => {
    let instance: EventEngine;

    beforeEach(() => {
        instance = EventEngine.instance;
    });

    it('test 1', async () => {
        let count = 0;
        instance.addListener(EVENTTYPE.CAMERA, (event: IEvent) => {
            count++;
        })

        instance.emitEvent(EVENTTYPE.CAMERA, { viewportId: '' });
        instance.emitEvent(EVENTTYPE.CAMERA, { viewportId: '' });
        instance.emitEvent(EVENTTYPE.CAMERA, { viewportId: '' });

        expect(count).toBe(3);
    });

    it('test 2', async () => {
        let count = 0;
        const token1 = instance.addListener(EVENTTYPE.CAMERA, (event: IEvent) => {
            count++;
        })

        instance.emitEvent(EVENTTYPE.CAMERA, { viewportId: '' });

        expect(count).toBe(1);

        instance.emitEvent(EVENTTYPE.CAMERA, { viewportId: '' });

        expect(count).toBe(2);
    });

    it('test 3', async () => {
        let count = 0;
        const token1 = instance.addListener(EVENTTYPE.CAMERA, (event: IEvent) => {
            count++;
        })
        const token2 = instance.addListener(EVENTTYPE.CAMERA, (event: IEvent) => {
            count--;
        })

        instance.emitEvent(EVENTTYPE.CAMERA, { viewportId: '' });

        expect(count).toBe(0);

        instance.emitEvent(EVENTTYPE.CAMERA, { viewportId: '' });

        expect(count).toBe(0);
    });

    
    it('test 4', async () => {
        let count = 0;
        const token1 = instance.addListener(EVENTTYPE.CAMERA, (event: IEvent) => {
            count++;
        })
        const token2 = instance.addListener(EVENTTYPE.SCENE, (event: IEvent) => {
            count--;
        })

        instance.emitEvent(EVENTTYPE.CAMERA, { viewportId: '' });

        expect(count).toBe(1);

        instance.emitEvent(EVENTTYPE.SCENE, { viewportId: '' });

        expect(count).toBe(0);
    });  

    it('test 5', async () => {
        let count = 0;
        const token1 = instance.addListener(EVENTTYPE.CAMERA, (event: IEvent) => {
            count++;
        })

        instance.emitEvent(EVENTTYPE.CAMERA, { viewportId: '' });

        expect(count).toBe(1);

        instance.removeListener(token1);

        instance.emitEvent(EVENTTYPE.CAMERA, { viewportId: '' });

        expect(count).toBe(1);
    });

    it('test 6', async () => {
        let count = 0;
        const token1 = instance.addListener(EVENTTYPE.CAMERA, (event: IEvent) => {
            count++;
        })
        const token2 = instance.addListener(EVENTTYPE.SCENE, (event: IEvent) => {
            count--;
        })

        instance.emitEvent(EVENTTYPE.CAMERA, { viewportId: '' });

        expect(count).toBe(1);

        instance.emitEvent(EVENTTYPE.SCENE, { viewportId: '' });

        expect(count).toBe(0);

        instance.removeListener(token1);

        instance.emitEvent(EVENTTYPE.CAMERA, { viewportId: '' });

        expect(count).toBe(0);

        instance.addListener(EVENTTYPE.CAMERA, (event: IEvent) => {
            count++;
        })

        instance.emitEvent(EVENTTYPE.CAMERA, { viewportId: '' });
        instance.emitEvent(EVENTTYPE.CAMERA, { viewportId: '' });

        expect(count).toBe(2);

        instance.emitEvent(EVENTTYPE.SCENE, { viewportId: '' });

        expect(count).toBe(1);

        instance.removeListener(token2);

        instance.emitEvent(EVENTTYPE.SCENE, { viewportId: '' });

        expect(count).toBe(1);
    });

    it('test 7', async () => {
        let count = 0;
        const token1 = instance.addListener(EVENTTYPE.CAMERA, (event: IEvent) => {
            count++;
        })
        const token2 = instance.addListener(EVENTTYPE.CAMERA.CAMERA_START, (event: IEvent) => {
            count++;
        })
        const token3 = instance.addListener(EVENTTYPE.CAMERA.CAMERA_MOVE, (event: IEvent) => {
            count++;
        })
        const token4 = instance.addListener(EVENTTYPE.CAMERA.CAMERA_END, (event: IEvent) => {
            count++;
        })

        instance.emitEvent(EVENTTYPE.CAMERA, { viewportId: '' });

        expect(count).toBe(1);

        instance.emitEvent(EVENTTYPE.CAMERA.CAMERA_START, { viewportId: '' });

        expect(count).toBe(3);

        instance.emitEvent(EVENTTYPE.CAMERA.CAMERA_MOVE, { viewportId: '' });

        expect(count).toBe(5);
        
        instance.emitEvent(EVENTTYPE.CAMERA.CAMERA_END, { viewportId: '' });

        expect(count).toBe(7);

        instance.removeListener(token1);

        instance.emitEvent(EVENTTYPE.CAMERA.CAMERA_START, { viewportId: '' });

        expect(count).toBe(8);
    });
})


import { UuidGenerator } from '../src/index'
import { Logger, LOGGING_TOPIC, PerformanceEvaluator } from '../src/index'

jest.setTimeout(100000);

const sleep = (delay: number) => {
    return new Promise<void>((resolve) => {
        setTimeout(() => { resolve() }, delay);
    })
};

describe('uuid - test', () => {
    let uuidGenerator: UuidGenerator;

    beforeEach(() => {
        uuidGenerator = UuidGenerator.instance;
    });

    test('creation', async () => {
        const uuid1: string = uuidGenerator.create();
        expect(uuid1).toBeDefined();
    });

    test('length', async () => {
        const uuid1: string = uuidGenerator.create();

        const dash1: number = uuid1.indexOf('-');
        expect(dash1).not.toBe(-1);
        const part1: string = uuid1.substring(0, dash1);
        expect(part1.length).toBe(8);
        
        const dash2: number = uuid1.indexOf('-', dash1 + 1);
        expect(dash2).not.toBe(-1);
        const part2: string = uuid1.substring(dash1 + 1, dash2);
        expect(part2.length).toBe(4);

        const dash3: number = uuid1.indexOf('-', dash2 + 1);
        expect(dash3).not.toBe(-1);
        const part3: string = uuid1.substring(dash2 + 1, dash3);
        expect(part3.length).toBe(4);

        const dash4: number = uuid1.indexOf('-', dash3 + 1);
        expect(dash4).not.toBe(-1);
        const part4: string = uuid1.substring(dash3 + 1, dash4);
        expect(part4.length).toBe(4);

        const part5: string = uuid1.substring(dash4 + 1, uuid1.length);
        expect(part5.length).toBe(12);
    });

    test('symbols', async () => {
        const uuid1: string = uuidGenerator.create();

        const dash1: number = uuid1.indexOf('-');
        const part1: string = uuid1.substring(0, dash1);
        expect(part1.match(/^[0-9a-fA-F]+$/))
        
        const dash2: number = uuid1.indexOf('-', dash1 + 1);
        const part2: string = uuid1.substring(dash1 + 1, dash2);
        expect(part2.match(/^[0-9a-fA-F]+$/))

        const dash3: number = uuid1.indexOf('-', dash2 + 1);
        const part3: string = uuid1.substring(dash2 + 1, dash3);
        expect(part3.match(/^[0-9a-fA-F]+$/))

        const dash4: number = uuid1.indexOf('-', dash3 + 1);
        const part4: string = uuid1.substring(dash3 + 1, dash4);
        expect(part4.match(/^[0-9a-fA-F]+$/))

        const part5: string = uuid1.substring(dash4 + 1, uuid1.length);
        expect(part5.match(/^[0-9a-fA-F]+$/))
    });

    test('validator - creation', async () => {
        expect(uuidGenerator.validate(uuidGenerator.create())).toBe(true);
        expect(uuidGenerator.validate(uuidGenerator.create())).toBe(true);
        expect(uuidGenerator.validate(uuidGenerator.create())).toBe(true);
        expect(uuidGenerator.validate(uuidGenerator.create())).toBe(true);
        expect(uuidGenerator.validate(uuidGenerator.create())).toBe(true);
    });

    test('validator - custom correct', async () => {
        expect(uuidGenerator.validate('bacdefbc-fceb-4cbe-acbd-abcdefdacbab')).toBe(true);
        expect(uuidGenerator.validate('73464832-2342-4344-8565-567575755555')).toBe(true);
        expect(uuidGenerator.validate('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa')).toBe(true);
        expect(uuidGenerator.validate('00000000-0000-4000-8000-000000000000')).toBe(true);
        expect(uuidGenerator.validate('ffffffff-ffff-4fff-bfff-ffffffffffff')).toBe(true);
    });

    test('validator - custom faulty', async () => {
        expect(uuidGenerator.validate('bacdefbc-fceb-bcbe-acbd-abcdefdacbab')).toBe(false);
        expect(uuidGenerator.validate('zacdefbc-fceb-fcbe-acbd-abcdefdacbab')).toBe(false);
        expect(uuidGenerator.validate('z3464832-2342-2344-6565-567575755555')).toBe(false);
        expect(uuidGenerator.validate('45gg54g4-fg47-kj77-j687-7oi7o7o7oou7')).toBe(false);
        expect(uuidGenerator.validate('')).toBe(false);
        expect(uuidGenerator.validate('bacdefb-fceb-fcbe-acbd-abcdefdacbab')).toBe(false);
        expect(uuidGenerator.validate('bacdefb2-fceb-fcbe-acbd-abcdefdacba')).toBe(false);
        expect(uuidGenerator.validate('bacdefb2-fceb-acbd-abcdefdacbad')).toBe(false);
    });

    test('parser - stringify', async () => {
        const uuid1: string = uuidGenerator.create();
        const uuid1Converted: string = uuidGenerator.stringify(uuidGenerator.parse(uuid1));
        expect(uuid1).toBe(uuid1Converted);
    });

})