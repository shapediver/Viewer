import "reflect-metadata"
import { LightEngine } from "../src/index"

describe('light-engine', () => {
    let lightEngine: LightEngine;
    // IN DEPTH TESTS ARE DONE IN THE TESTS MODULE
    beforeEach(() => {
        lightEngine = new LightEngine();
    });

    it('addAmbientLight', async () => {
        const l = lightEngine.addAmbientLight({});
        expect(l.color).toBe('#ffffff')
        expect(l.intensity).toBe(0.5)
        expect(l.id.length).toBe(36)
    });

    it('addAmbientLight properties', async () => {
        const l = lightEngine.addAmbientLight({ color: '#000000', intensity: 0.2, id: 'test'});
        expect(l.color).toBe('#000000')
        expect(l.intensity).toBe(0.2)
        expect(l.name).toBe('test')
    });

    it('addAmbientLight light scene', async () => {
        expect(Object.keys(lightEngine.getLightSceneObject().lights).length).toBe(3)
        lightEngine.addAmbientLight({});
        expect(Object.keys(lightEngine.getLightSceneObject().lights).length).toBe(4)
    });
    
    it('addAmbientLight light scene id', async () => {
        const l = lightEngine.addAmbientLight({});
        expect(Object.keys(lightEngine.getLightSceneObject().lights).includes(l.id)).toBe(true)
    });

    
    it('addDirectionalLight', async () => {
        const l = lightEngine.addDirectionalLight({});
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
        const l = lightEngine.addDirectionalLight({ color: '#000000', intensity: 0.2, id: 'test', direction: [1, 0, 0], castShadow: true, shadowMapBias: 0.1, shadowMapResolution: 16});
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
        expect(Object.keys(lightEngine.getLightSceneObject().lights).length).toBe(3)
        lightEngine.addDirectionalLight({});
        expect(Object.keys(lightEngine.getLightSceneObject().lights).length).toBe(4)
    });
    
    it('addDirectionalLight light scene id', async () => {
        const l = lightEngine.addDirectionalLight({});
        expect(Object.keys(lightEngine.getLightSceneObject().lights).includes(l.id)).toBe(true)
    });

    
    
    it('addHemisphereLight', async () => {
        const l = lightEngine.addHemisphereLight({});
        expect(l.color).toBe('#ffffff')
        expect(l.intensity).toBe(0.5)
        expect(l.groundColor).toBe('#ffffff')
        expect(l.id.length).toBe(36)
    });

    it('addHemisphereLight properties', async () => {
        const l = lightEngine.addHemisphereLight({ color: '#000000', intensity: 0.2, id: 'test', groundColor: '#000000'});
        expect(l.color).toBe('#000000')
        expect(l.intensity).toBe(0.2)
        expect(l.groundColor).toBe('#000000')
        expect(l.name).toBe('test')
    });

    it('addHemisphereLight light scene', async () => {
        expect(Object.keys(lightEngine.getLightSceneObject().lights).length).toBe(3)
        lightEngine.addHemisphereLight({});
        expect(Object.keys(lightEngine.getLightSceneObject().lights).length).toBe(4)
    });
    
    it('addHemisphereLight light scene id', async () => {
        const l = lightEngine.addHemisphereLight({});
        expect(Object.keys(lightEngine.getLightSceneObject().lights).includes(l.id)).toBe(true)
    });

        
    it('addPointLight', async () => {
        const l = lightEngine.addPointLight({});
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
        const l = lightEngine.addPointLight({ color: '#000000', intensity: 0.2, id: 'test', position: [1,1,1], distance: 2, decay: 5});
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
        expect(Object.keys(lightEngine.getLightSceneObject().lights).length).toBe(3)
        lightEngine.addPointLight({});
        expect(Object.keys(lightEngine.getLightSceneObject().lights).length).toBe(4)
    });
    
    it('addPointLight light scene id', async () => {
        const l = lightEngine.addPointLight({});
        expect(Object.keys(lightEngine.getLightSceneObject().lights).includes(l.id)).toBe(true)
    });

            
    it('addSpotLight', async () => {
        const l = lightEngine.addSpotLight({});
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
        const l = lightEngine.addSpotLight({ color: '#000000', intensity: 0.2, id: 'test', position: [1,1,1], target: [2,2,2], distance: 2, decay: 5, angle: 3, penumbra: 4});
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
        expect(Object.keys(lightEngine.getLightSceneObject().lights).length).toBe(3)
        lightEngine.addSpotLight({});
        expect(Object.keys(lightEngine.getLightSceneObject().lights).length).toBe(4)
    });
    
    it('addSpotLight light scene id', async () => {
        const l = lightEngine.addSpotLight({});
        expect(Object.keys(lightEngine.getLightSceneObject().lights).includes(l.id)).toBe(true)
    });
    
    it('assignLightScene empty', async () => {
        expect(lightEngine.assignLightScene('')).toBe(false)
    });

    it('assignLightScene incorrect', async () => {
        expect(lightEngine.assignLightScene('test')).toBe(false)
    });

    it('assignLightScene correct', async () => {
        const lightScene = lightEngine.createLightScene({id: 'something'});
        expect(lightEngine.assignLightScene(lightScene.id)).toBe(true)
        expect(lightEngine.getLightScene().id).toBe('something')
    });

    it('createLightScene with id', async () => {
        const lightScene = lightEngine.createLightScene({id: 'something'});
        expect(lightScene.id).toBe('something')
        lightEngine.assignLightScene(lightScene.id)
        expect(lightEngine.getLightScene().id).toBe('something')
        expect(Object.keys(lightEngine.getLightSceneObject().lights).length).toBe(0)
    });

    it('createLightScene with id standard', async () => {
        const lightScene = lightEngine.createLightScene({id: 'something', standard: true});
        expect(lightScene.id).toBe('something')
        lightEngine.assignLightScene(lightScene.id)
        expect(lightEngine.getLightScene().id).toBe('something')
        expect(Object.keys(lightEngine.getLightSceneObject().lights).length).toBe(3)
    });


    it('getLightScene', async () => {
        expect(typeof lightEngine.getLightScene().id).toBe('string')
    });

    it('getLightScene name', async () => {
        expect(lightEngine.getLightScene().id).toBe('default')
    });
    
    it('removeLight empty', async () => {
        expect(lightEngine.removeLight('')).toBe(false)
    });
    
    it('removeLight empty', async () => {
        expect(lightEngine.removeLight(Object.keys(lightEngine.getLights())[0])).toBe(true)
    });

    it('removeLightScene', async () => {
        expect(lightEngine.removeLightScene('default')).toBe(false)
    });

    it('removeLightScene', async () => {
        const lightScene = lightEngine.createLightScene({id: 'something'});
        lightEngine.assignLightScene(lightScene.id)
        expect(lightEngine.removeLightScene('something')).toBe(true)
        expect(lightEngine.getLightScene().id).toBe('default')
    });
});