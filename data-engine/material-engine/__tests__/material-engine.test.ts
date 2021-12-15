import 'reflect-metadata'

import { container } from 'tsyringe'
import { ShapeDiverViewerError } from '@shapediver/viewer.shared.services';

import { MaterialEngine } from '../src/index'

describe('material-engine', () => {
    let materialEngine: MaterialEngine;
    // IN DEPTH TESTS ARE DONE IN THE TESTS MODULE
    beforeEach(() => {
        container.clearInstances();
        materialEngine = <MaterialEngine>container.resolve(MaterialEngine)
    });

    it('data version invalid', async () => {
        try {
            const r = await materialEngine.loadContent({ format: '', data: { version: '4.0' } })
            expect(r).not.toBeDefined();
        } catch (e) {
            expect(e).toBeInstanceOf(ShapeDiverViewerError)
        }
    });

    it('data version valid', async () => {
        try {
            const r = await materialEngine.loadContent({ format: '', data: { version: '1.0' } })
            expect(r).toBeDefined();
        } catch (e) {
            expect(e).not.toBeDefined();
            expect(e).toBeInstanceOf(ShapeDiverViewerError)
        }
    });
    
    it('data version valid', async () => {
        try {
            const r = await materialEngine.loadContent({ format: '', data: { version: '2.0' } })
            expect(r).toBeDefined();
        } catch (e) {
            expect(e).not.toBeDefined();
            expect(e).toBeInstanceOf(ShapeDiverViewerError)
        }
    });
    
    it('data version valid', async () => {
        try {
            const r = await materialEngine.loadContent({  format: '', data: { version: '2.0' } })
            expect(r).toBeDefined();
        } catch (e) {
            expect(e).not.toBeDefined();
            expect(e).toBeInstanceOf(ShapeDiverViewerError)
        }
    });
})