import "reflect-metadata"
import { container } from "tsyringe";
import { MaterialEngine } from "../src/index"

describe('material-engine', () => {
    let materialEngine: MaterialEngine;
    // IN DEPTH TESTS ARE DONE IN THE TESTS MODULE
    beforeEach(() => {
        container.clearInstances();
        materialEngine = <MaterialEngine>container.resolve(MaterialEngine)
    });

    it('empty', async () => {
        try {
            const r = await (<any>materialEngine).loadContent();
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });

    it('empty object', async () => {
        try {
            const r = await materialEngine.loadContent({})
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });

    it('empty data', async () => {
        try {
            const r = await materialEngine.loadContent({ data: { } })
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });

    it('data version invalid', async () => {
        try {
            const r = await materialEngine.loadContent({ data: { version: '4.0' } })
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });

    it('data version valid', async () => {
        try {
            const r = await materialEngine.loadContent({ data: { version: '1.0' } })
            expect(r).toBeDefined();
        } catch (e) {
            expect(e).not.toBeDefined();
            expect(e).toBeInstanceOf(Error)
        }
    });
    
    it('data version valid', async () => {
        try {
            const r = await materialEngine.loadContent({ data: { version: '2.0' } })
            expect(r).toBeDefined();
        } catch (e) {
            expect(e).not.toBeDefined();
            expect(e).toBeInstanceOf(Error)
        }
    });
    
    it('data version valid', async () => {
        try {
            const r = await materialEngine.loadContent({ data: { version: '2.0' } })
            expect(r).toBeDefined();
        } catch (e) {
            expect(e).not.toBeDefined();
            expect(e).toBeInstanceOf(Error)
        }
    });
})