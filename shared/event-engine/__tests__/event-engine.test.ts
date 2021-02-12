import "reflect-metadata";
import { container } from "tsyringe";
import { EventEngine } from "../src/EventEngine";
import { EVENTTYPE } from "../src/EventTypes";
import { IEvent } from "../src/interfaces/IEvent";

describe('test', () => {
    let instance: EventEngine;

    beforeEach(() => {
        container.clearInstances();
        instance = <EventEngine>container.resolve(EventEngine);
    });

    it('test 1', async () => {
        let count = 0;
        instance.addListener(EVENTTYPE.CAMERA, (event: IEvent) => {
            count++;
        })

        instance.emitEvent(EVENTTYPE.CAMERA, {});
        instance.emitEvent(EVENTTYPE.CAMERA, {});
        instance.emitEvent(EVENTTYPE.CAMERA, {});

        expect(count).toBe(3);
    });

    it('test 2', async () => {
        let count = 0;
        const token1 = instance.addListener(EVENTTYPE.CAMERA, (event: IEvent) => {
            count++;
        })

        instance.emitEvent(EVENTTYPE.CAMERA, {});

        expect(count).toBe(1);

        instance.emitEvent(EVENTTYPE.CAMERA, {});

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

        instance.emitEvent(EVENTTYPE.CAMERA, {});

        expect(count).toBe(0);

        instance.emitEvent(EVENTTYPE.CAMERA, {});

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

        instance.emitEvent(EVENTTYPE.CAMERA, {});

        expect(count).toBe(1);

        instance.emitEvent(EVENTTYPE.SCENE, {});

        expect(count).toBe(0);
    });  

    it('test 5', async () => {
        let count = 0;
        const token1 = instance.addListener(EVENTTYPE.CAMERA, (event: IEvent) => {
            count++;
        })

        instance.emitEvent(EVENTTYPE.CAMERA, {});

        expect(count).toBe(1);

        instance.removeListener(token1);

        instance.emitEvent(EVENTTYPE.CAMERA, {});

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

        instance.emitEvent(EVENTTYPE.CAMERA, {});

        expect(count).toBe(1);

        instance.emitEvent(EVENTTYPE.SCENE, {});

        expect(count).toBe(0);

        instance.removeListener(token1);

        instance.emitEvent(EVENTTYPE.CAMERA, {});

        expect(count).toBe(0);

        instance.addListener(EVENTTYPE.CAMERA, (event: IEvent) => {
            count++;
        })

        instance.emitEvent(EVENTTYPE.CAMERA, {});
        instance.emitEvent(EVENTTYPE.CAMERA, {});

        expect(count).toBe(2);

        instance.emitEvent(EVENTTYPE.SCENE, {});

        expect(count).toBe(1);

        instance.removeListener(token2);

        instance.emitEvent(EVENTTYPE.SCENE, {});

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

        instance.emitEvent(EVENTTYPE.CAMERA, {});

        expect(count).toBe(1);

        instance.emitEvent(EVENTTYPE.CAMERA.CAMERA_START, {});

        expect(count).toBe(3);

        instance.emitEvent(EVENTTYPE.CAMERA.CAMERA_MOVE, {});

        expect(count).toBe(5);
        
        instance.emitEvent(EVENTTYPE.CAMERA.CAMERA_END, {});

        expect(count).toBe(7);

        instance.removeListener(token1);

        instance.emitEvent(EVENTTYPE.CAMERA.CAMERA_START, {});

        expect(count).toBe(8);
    });
})