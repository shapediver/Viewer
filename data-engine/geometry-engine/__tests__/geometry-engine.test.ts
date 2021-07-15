import 'reflect-metadata'

import { container } from 'tsyringe'

import { GeometryEngine } from '../src/index'

describe('geometry-engine', () => {
    let geometryEngine: GeometryEngine;
    // IN DEPTH TESTS ARE DONE IN THE TESTS MODULE
    beforeEach(() => {
        container.clearInstances();
        geometryEngine = <GeometryEngine>container.resolve(GeometryEngine)
    });

    it('empty', async () => {
        try {
            const r = await (<any>geometryEngine).loadContent()
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });

    it('empty object', async () => {
        try {
            const r = await geometryEngine.loadContent({ format: '' })
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });

    it('no href', async () => {
        try {
            const node = await geometryEngine.loadContent({ format: 'something else' })
            expect(node).toBeDefined()
        } catch (e) {
            expect(e).not.toBeDefined();
        }
    });

    it('glb format, but no href', async () => {
        try {
            const r = await geometryEngine.loadContent({ format: 'glb' })
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });
    it('glb format, but invalid href', async () => {
        try {
            const r = await geometryEngine.loadContent({ format: 'glb', href: 'temp' })
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });
    
    it('gltf format, but no href', async () => {
        try {
            const r = await geometryEngine.loadContent({ format: 'gltf' })
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });
    it('gltf format, but invalid href', async () => {
        try {
            const r = await geometryEngine.loadContent({ format: 'gltf', href: 'temp' })
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
    });
})