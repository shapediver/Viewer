import "reflect-metadata"
import { container } from "tsyringe";
import { DataEngine } from "../src/index"

describe('data-engine', () => {
    let dataEngine: DataEngine;
    // IN DEPTH TESTS ARE DONE IN THE TESTS MODULE
    beforeEach(() => {
        container.clearInstances();
        dataEngine = <DataEngine>container.resolve(DataEngine)
    });

    it('empty', async () => {
        try {
            const r = await (<any>dataEngine).loadContent()
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });

    it('empty object', async () => {
        try {
            const r = await dataEngine.loadContent({})
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });

    it('incorrect format', async () => {
        try {
            const node = await dataEngine.loadContent({ format: 'something else' })
            expect(node).toBeDefined()
        } catch (e) {
            expect(e).not.toBeDefined();
        }
    });

    it('glb format, but no data', async () => {
        try {
            const r = await dataEngine.loadContent({ format: 'glb' })
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });
    it('gltf format, but no data', async () => {
        try {
            const r = await dataEngine.loadContent({ format: 'gltf' })
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });
    it('material format, but no data', async () => {
        try {
            const r = await dataEngine.loadContent({ format: 'material' })
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });
    it('sdtf format, but no data', async () => {
        try {
            const r = await dataEngine.loadContent({ format: 'sdtf' })
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });
})