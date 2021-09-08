import 'reflect-metadata'

import { LightEngine, LightScene } from '../src/index'

describe('light-engine', () => {
    let lightEngine: LightEngine;
    // IN DEPTH TESTS ARE DONE IN THE TESTS MODULE
    beforeEach(() => {
        lightEngine = new LightEngine('');
    });

    it('addAmbientLight', async () => {
        const ls = <LightScene>lightEngine.createLightScene({});
        const l = ls.addAmbientLight({});
        expect(l.color).toBe('#ffffff')
        expect(l.intensity).toBe(0.5)
        expect(l.id.length).toBe(36)
    });

    it('addAmbientLight properties', async () => {
        const ls = <LightScene>lightEngine.createLightScene({});
        const l = ls.addAmbientLight({ color: '#000000', intensity: 0.2, name: 'test'});
        expect(l.color).toBe('#000000')
        expect(l.intensity).toBe(0.2)
        expect(l.name).toBe('test')
    });

    it('addAmbientLight light scene', async () => {
        const ls = <LightScene>lightEngine.createLightScene({});
        expect(Object.keys(lightEngine.lightScene!.lights).length).toBe(0)
        ls.addAmbientLight({});
        expect(Object.keys(lightEngine.lightScene!.lights).length).toBe(1)
    });
    
    it('addAmbientLight light scene id', async () => {
        const ls = <LightScene>lightEngine.createLightScene({});
        const l = ls.addAmbientLight({});
        expect(Object.keys(lightEngine.lightScene!.lights).includes(l.id)).toBe(true)
    });

    
    it('addDirectionalLight', async () => {
        const ls = <LightScene>lightEngine.createLightScene({});
        const l = ls.addDirectionalLight({});
        expect(l.color).toBe('#ffffff')
        expect(l.intensity).toBe(0.5)
        expect(l.direction[0]).toBe(-1)
        expect(l.direction[1]).toBe(0)
        expect(l.direction[2]).toBe(1)
        expect(l.castShadow).toBe(false)
        expect(l.shadowMapResolution).toBe(1024)
        expect(l.shadowMapBias).toBe(-0.00175)
        expect(l.id.length).toBe(36)
    });

    it('addDirectionalLight properties', async () => {
        const ls = <LightScene>lightEngine.createLightScene({});
        const l = ls.addDirectionalLight({ color: '#000000', intensity: 0.2, name: 'test', direction: [1, 0, 0], castShadow: true, shadowMapBias: 0.1, shadowMapResolution: 16});
        expect(l.color).toBe('#000000')
        expect(l.intensity).toBe(0.2)
        expect(l.direction[0]).toBe(1)
        expect(l.direction[1]).toBe(0)
        expect(l.direction[2]).toBe(0)
        expect(l.castShadow).toBe(true)
        expect(l.shadowMapResolution).toBe(16)
        expect(l.shadowMapBias).toBe(0.1)
        expect(l.name).toBe('test')
    });

    it('addDirectionalLight light scene', async () => {
        const ls = <LightScene>lightEngine.createLightScene({});
        expect(Object.keys(lightEngine.lightScene!.lights).length).toBe(0)
        ls.addDirectionalLight({});
        expect(Object.keys(lightEngine.lightScene!.lights).length).toBe(1)
    });
    
    it('addDirectionalLight light scene id', async () => {
        const ls = <LightScene>lightEngine.createLightScene({});
        const l = ls.addDirectionalLight({});
        expect(Object.keys(lightEngine.lightScene!.lights).includes(l.id)).toBe(true)
    });

    
    
    it('addHemisphereLight', async () => {
        const ls = <LightScene>lightEngine.createLightScene({});
        const l = ls.addHemisphereLight({});
        expect(l.color).toBe('#ffffff')
        expect(l.intensity).toBe(0.5)
        expect(l.groundColor).toBe('#ffffff')
        expect(l.id.length).toBe(36)
    });

    it('addHemisphereLight properties', async () => {
        const ls = <LightScene>lightEngine.createLightScene({});
        const l = ls.addHemisphereLight({ color: '#000000', intensity: 0.2, name: 'test', groundColor: '#000000'});
        expect(l.color).toBe('#000000')
        expect(l.intensity).toBe(0.2)
        expect(l.groundColor).toBe('#000000')
        expect(l.name).toBe('test')
    });

    it('addHemisphereLight light scene', async () => {
        const ls = <LightScene>lightEngine.createLightScene({});
        expect(Object.keys(lightEngine.lightScene!.lights).length).toBe(0)
        ls.addHemisphereLight({});
        expect(Object.keys(lightEngine.lightScene!.lights).length).toBe(1)
    });
    
    it('addHemisphereLight light scene id', async () => {
        const ls = <LightScene>lightEngine.createLightScene({});
        const l = ls.addHemisphereLight({});
        expect(Object.keys(lightEngine.lightScene!.lights).includes(l.id)).toBe(true)
    });

        
    it('addPointLight', async () => {
        const ls = <LightScene>lightEngine.createLightScene({});
        const l = ls.addPointLight({});
        expect(l.color).toBe('#ffffff')
        expect(l.intensity).toBe(0.5)
        expect(l.position[0]).toBe(0)
        expect(l.position[1]).toBe(0)
        expect(l.position[2]).toBe(0)
        expect(l.distance).toBe(0)
        expect(l.decay).toBe(2)
        expect(l.id.length).toBe(36)
    });

    it('addPointLight properties', async () => {
        const ls = <LightScene>lightEngine.createLightScene({});
        const l = ls.addPointLight({ color: '#000000', intensity: 0.2, name: 'test', position: [1,1,1], distance: 2, decay: 5});
        expect(l.color).toBe('#000000')
        expect(l.intensity).toBe(0.2)
        expect(l.position[0]).toBe(1)
        expect(l.position[1]).toBe(1)
        expect(l.position[2]).toBe(1)
        expect(l.distance).toBe(2)
        expect(l.decay).toBe(5)
        expect(l.name).toBe('test')
    });

    it('addPointLight light scene', async () => {
        const ls = <LightScene>lightEngine.createLightScene({});
        expect(Object.keys(lightEngine.lightScene!.lights).length).toBe(0)
        ls.addPointLight({});
        expect(Object.keys(lightEngine.lightScene!.lights).length).toBe(1)
    });
    
    it('addPointLight light scene id', async () => {
        const ls = <LightScene>lightEngine.createLightScene({});
        const l = ls.addPointLight({});
        expect(Object.keys(lightEngine.lightScene!.lights).includes(l.id)).toBe(true)
    });

            
    it('addSpotLight', async () => {
        const ls = <LightScene>lightEngine.createLightScene({});
        const l = ls.addSpotLight({});
        expect(l.color).toBe('#ffffff')
        expect(l.intensity).toBe(0.5)
        expect(l.position[0]).toBe(-1)
        expect(l.position[1]).toBe(0)
        expect(l.position[2]).toBe(1)
        expect(l.target[0]).toBe(0)
        expect(l.target[1]).toBe(0)
        expect(l.target[2]).toBe(0)
        expect(l.distance).toBe(0)
        expect(l.decay).toBe(1)
        expect(l.angle).toBe(Math.PI / 4.0)
        expect(l.penumbra).toBe(0.5)
        expect(l.id.length).toBe(36)
    });

    it('addSpotLight properties', async () => {
        const ls = <LightScene>lightEngine.createLightScene({});
        const l = ls.addSpotLight({ color: '#000000', intensity: 0.2, name: 'test', position: [1,1,1], target: [2,2,2], distance: 2, decay: 5, angle: 3, penumbra: 4});
        expect(l.color).toBe('#000000')
        expect(l.intensity).toBe(0.2)
        expect(l.position[0]).toBe(1)
        expect(l.position[1]).toBe(1)
        expect(l.position[2]).toBe(1)
        expect(l.target[0]).toBe(2)
        expect(l.target[1]).toBe(2)
        expect(l.target[2]).toBe(2)
        expect(l.distance).toBe(2)
        expect(l.decay).toBe(5)
        expect(l.angle).toBe(3)
        expect(l.penumbra).toBe(4)
        expect(l.name).toBe('test')
    });

    it('addSpotLight light scene', async () => {
        const ls = <LightScene>lightEngine.createLightScene({});
        expect(Object.keys(lightEngine.lightScene!.lights).length).toBe(0)
        ls.addSpotLight({});
        expect(Object.keys(lightEngine.lightScene!.lights).length).toBe(1)
    });
    
    it('addSpotLight light scene id', async () => {
        const ls = <LightScene>lightEngine.createLightScene({});
        const l = ls.addSpotLight({});
        expect(Object.keys(lightEngine.lightScene!.lights).includes(l.id)).toBe(true)
    });
    
    it('assignLightScene empty', async () => {
        expect(lightEngine.assignLightScene('')).toBe(false)
    });

    it('assignLightScene incorrect', async () => {
        expect(lightEngine.assignLightScene('test')).toBe(false)
    });

    it('assignLightScene correct', async () => {
        const lightScene = <LightScene>lightEngine.createLightScene({name: 'something'});
        expect(lightEngine.assignLightScene(lightScene.id)).toBe(true)
        expect(lightEngine.lightScene!.name).toBe('something')
    });

    it('createLightScene with id', async () => {
        const lightScene = <LightScene>lightEngine.createLightScene({name: 'something'});
        expect(lightScene.name).toBe('something')
        lightEngine.assignLightScene(lightScene.id)
        expect(lightEngine.lightScene!.name).toBe('something')
        expect(Object.keys(lightEngine.lightScene!.lights).length).toBe(0)
    });

    it('createLightScene with id standard', async () => {
        const lightScene = <LightScene>lightEngine.createLightScene({name: 'something', standard: true});
        expect(lightScene.name).toBe('something')
        lightEngine.assignLightScene(lightScene.id)
        expect(lightEngine.lightScene!.name).toBe('something')
        expect(Object.keys(lightEngine.lightScene!.lights).length).toBe(1)
    });


    it('lightScene', async () => {
        <LightScene>lightEngine.createLightScene({});
        expect(typeof lightEngine.lightScene!.id).toBe('string')
    });

    it('lightScene name', async () => {
        <LightScene>lightEngine.createLightScene({name: 'something'});
        expect(lightEngine.lightScene!.name).toBe('something')
    });
    
    it('removeLight empty', async () => {
        const ls = <LightScene>lightEngine.createLightScene({});
        expect(ls.removeLight('')).toBe(false)
    });
    
    it('removeLightScene 1', async () => {
        expect(lightEngine.removeLightScene('standard')).toBe(false)
    });

    it('removeLightScene 2', async () => {
        const lightScene = <LightScene>lightEngine.createLightScene({name: 'something'});
        expect(lightEngine.removeLightScene(lightScene.id)).toBe(true)
        expect(lightEngine.lightScene!).toBeUndefined()
    });
});