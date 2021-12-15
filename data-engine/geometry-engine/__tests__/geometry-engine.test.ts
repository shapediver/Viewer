import 'reflect-metadata'
import { ShapeDiverViewerError } from '@shapediver/viewer.shared.services';

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
            expect(e).toBeInstanceOf(ShapeDiverViewerError)
        }
    });

    it('empty object', async () => {
        try {
            const r = await geometryEngine.loadContent({ format: '' })
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(ShapeDiverViewerError)
        }
    });

    it('glb format, but no href', async () => {
        try {
            const r = await geometryEngine.loadContent({ format: 'glb' })
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(ShapeDiverViewerError)
        }
    });
    it('glb format, but invalid href', async () => {
        try {
            const r = await geometryEngine.loadContent({ format: 'glb', href: 'temp' })
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(ShapeDiverViewerError)
        }
    });
    
    it('gltf format, but no href', async () => {
        try {
            const r = await geometryEngine.loadContent({ format: 'gltf' })
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(ShapeDiverViewerError)
        }
    });
    it('gltf format, but invalid href', async () => {
        try {
            const r = await geometryEngine.loadContent({ format: 'gltf', href: 'temp' })
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(ShapeDiverViewerError)
        }
    });
})