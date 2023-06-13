import webdriver from 'selenium-webdriver'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import * as ShapeDiverViewer from '@shapediver/viewer'

import { createDriver, screenshotCompare } from '../../general/src/setup'
import { sdeuc1 } from '../../general/src/models'

require('chromedriver');

const shelfTicket = sdeuc1.models['Shelf'].ticket;

let driver: webdriver.WebDriver;
let name = 'postprocessing';

describe('device testing', () => {
    beforeAll(async () => {
        driver = await createDriver();
    });

    beforeEach(async () => {
        await driver.navigate().to('https://viewer.shapediver.com/v3/latest/test-cdn/index.html')
    });

    afterAll(async () => {
        await driver.close();
        await driver.quit();
    })

    test(name + "_on_off", async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });            
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + "_off");

        const effectTokens = await driver.executeAsyncScript(async (cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = SDV.viewports['myViewport'];            
            
            const smaaEffectToken = viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.SMAA
            })
        
            const bloomEffectToken = viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.BLOOM,
                mipmapBlur: true,
                intensity: 2,
                luminanceSmoothing: 0.5,
                luminanceThreshold: 0.8
        
            })
        
            
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb([bloomEffectToken, smaaEffectToken]);
        });
        await screenshotCompare(await driver.takeScreenshot(), name + "_on");

        await driver.executeAsyncScript(async (effectTokens: string[], cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = SDV.viewports['myViewport'];            
            
            effectTokens.forEach(token => {
                viewport.postProcessing.removeEffect(token)
            });
        
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, effectTokens);
        await screenshotCompare(await driver.takeScreenshot(), name + "_off");
    });

    test(name + "_bloom_mipmap", async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });          
            const smaaEffectToken = viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.SMAA
            })
        
            const bloomEffectToken = viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.BLOOM,
                mipmapBlur: true,
                intensity: 2,
                luminanceSmoothing: 0.5,
                luminanceThreshold: 0.8
        
            })  
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + "_bloom_mipmap");
    });

    test(name + "_bloom", async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });          
            const smaaEffectToken = viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.SMAA
            })
        
            const bloomEffectToken = viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.BLOOM,
                mipmapBlur: false,
                intensity: 2,
                luminanceSmoothing: 0.35,
                luminanceThreshold: 0.5
        
            })  
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + "_bloom");
    });

    test(name + "_chromaticAberration", async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });          
            const chromaticAberrationEffectToken = viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.CHROMATIC_ABERRATION
            })
        
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + "_chromaticAberration");
    });

    test(name + "_depthOfField", async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });          
            
            viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.SMAA
            })

            const depthOfFieldEffectToken = viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.DEPTH_OF_FIELD,
                /** The scale of the bokeh blur. (default: 1.0) */
                bokehScale: 8,
                /** The focal length. Range is [0.0, 1.0]. (default: 0.1) */
                focalLength: 0.02,
                /** The normalized focus distance. Range is [0.0, 1.0]. (default: 0.0) */
                focusDistance: 0.05,
                /** The focus range. Range is [0.0, 1.0]. (default: 0.1) */
                focusRange: 0.025
            })
        
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + "_depthOfField");
    });

    test(name + "_dotScreen", async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });          
            
            viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.SMAA
            })

            const dotScreenEffectToken = viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.DOT_SCREEN,
                /** The angle of the dot pattern. (default: 1.57) */
                angle: 1.57,
                /** The scale of the dot pattern. (default: 1.0) */
                scale: 1.0,
            })
        
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + "_dotScreen");
    });

    test(name + "_fxaa", async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });          
            
            viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.FXAA
            })

            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + "_fxaa");
    });

    test(name + "_godRays", async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });          
            
            viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.SMAA
            })

            const godRaysEffectToken = viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.GOD_RAYS,
                decay: 1,
                weight: 0.6
            })
            const godRaysEffect = viewport.postProcessing.getEffect(godRaysEffectToken);
            viewport.postProcessing.godRaysEffects[godRaysEffectToken].setLightSource(session.getOutputByName("HorizontalBottom").find(o => !o.format.includes("material"))!.node!)

            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + "_godRays");
    });

    test(name + "_grid", async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });          
            
            viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.SMAA
            })
        
            const gridEffectToken = viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.GRID,
                /** The line width of the grid pattern. (default: 0.0) */
                lineWidth: 0.0,
                /** The scale of the grid pattern. (default: 1.0) */
                scale: 1.0,
            })

            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + "_grid");
    });

    test(name + "_hueSaturation", async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });          
            
            viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.SMAA
            })
        
            const hueSaturationEffectToken = viewport.postProcessing.addEffect({
                /** The hue in radians. (default: 0.0) */
                hue: 2,
                /** The saturation factor, ranging from -1 to 1, where 0 means no change. (default: 0.0) */
                saturation: 0.5,
                type: SDV.POST_PROCESSING_EFFECT_TYPE.HUE_SATURATION
            })
            
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + "_hueSaturation");
    });


    /**
     * Noise cannot be tested with screenshots as the noise is random.
     */

    // test(name + "_noise", async () => {
    //     await driver.executeAsyncScript(async (ticket: string, cb: any) => {
    //         const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
    //         let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
    //         let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });          
            
    //         viewport.postProcessing.addEffect({
    //             type: SDV.POST_PROCESSING_EFFECT_TYPE.SMAA
    //         })
        
    //         const noiseEffectToken = viewport.postProcessing.addEffect({
    //             /** Whether the noise should be multiplied with the input colors prior to blending. (default: false) */
    //             premultiply: false,
    //             type: SDV.POST_PROCESSING_EFFECT_TYPE.NOISE
    //         })
            
    //         await new Promise<void>((resolve) => {
    //             SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
    //         })
    //         cb();
    //     }, shelfTicket);
    //     await screenshotCompare(await driver.takeScreenshot(), name + "_noise");
    // });

    test(name + "_outline", async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });          
            

            viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.SMAA
            })

            const outlineEffectToken = viewport.postProcessing.addEffect({
                /** Whether the outline should be blurred. (default: false) */
                blur: true,
                /** The edge strength. (default: 1.0) */
                edgeStrength: 50,
                /** The color of hidden edges. (default: #22090a) */
                hiddenEdgeColor: "#22090a",
                /** The blur kernel size. (default: KernelSize.VERY_SMALL) */
                kernelSize: SDV.KernelSize.MEDIUM,
                /** The number of samples used for multisample antialiasing. Requires WebGL 2. (default: 0) */
                multisampling: 0,
                /** The pulse speed. A value of zero disables the pulse effect. (default: 0.0) */
                pulseSpeed: 0,
                type: SDV.POST_PROCESSING_EFFECT_TYPE.OUTLINE,
                /** The color of visible edges. (default: #ffffff) */
                visibleEdgeColor: "#ff0000",
                /** Whether occluded parts of selected objects should be visible. (default: true) */
                xRay: true,
            })
            const outlineEffect = viewport.postProcessing.getEffect(outlineEffectToken);
            viewport.postProcessing.outlineEffects[outlineEffectToken].addSelection(session.node!);
            
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + "_outline");
    });

    test(name + "_pixelation", async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });          

            const pixelationEffectToken = viewport.postProcessing.addEffect({
                /** The pixel granularity. (default: 30.0) */
                granularity: 30.0,
                type: SDV.POST_PROCESSING_EFFECT_TYPE.PIXELATION
            })
            
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + "_pixelation");
    });

    test(name + "_ssao", async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });          

            const ssaoEffectToken = viewport.postProcessing.addEffect({
                /** An occlusion bias. Eliminates artifacts caused by depth discontinuities. (default: 0.025) */
                bias: 0.1,
                /** The blend function of this effect. (default: BlendFunction.MULTIPLY) */
                blendFunction: SDV.BlendFunction.MULTIPLY,
                /** The color of the ambient occlusion. (default: #000000) */
                color: "#000000",
                /** Enables or disables depth-aware upsampling. Has no effect if WebGL 2 is not supported. (default: true) */
                depthAwareUpsampling: true,
                /** Influences the smoothness of the shadows. A lower value results in higher contrast. (default: 0.01) */
                fade: 0.01,
                /** The intensity of the ambient occlusion. (default: 1.0) */
                intensity: 100.0,
                /** Determines how much the luminance of the scene influences the ambient occlusion. (default: 0.7) */
                luminanceInfluence: 0,
                /** The minimum radius scale. (default: 0.1) */
                minRadiusScale: 0.1,
                /** The occlusion sampling radius, expressed as a scale relative to the resolution. Range [1e-6, 1.0]. (default: 0.1825) */
                radius: 0.1,
                /** The amount of spiral turns in the occlusion sampling pattern. Should be a prime number. (default: 7) */
                rings: 7,
                /** The amount of samples per pixel. Should not be a multiple of the ring count. (default: 9) */
                samples: 9,
                type: SDV.POST_PROCESSING_EFFECT_TYPE.SSAO
            })
            
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + "_ssao");
    });

    test(name + "_scanline", async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });          
            
            viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.SMAA
            })

            const scanlineEffectToken = viewport.postProcessing.addEffect({
                /** The blend function of this effect. (default: BlendFunction.OVERLAY) */
                blendFunction: SDV.BlendFunction.OVERLAY,
                /** The scanline density. (default: 1.25) */
                density: 1.25,
                type: SDV.POST_PROCESSING_EFFECT_TYPE.SCANLINE,
            })
            
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + "_scanline");
    });

    test(name + "_selectiveBloom", async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });          
            
            viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.SMAA
            })

            const selectiveBloomEffectToken = viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.SELECTIVE_BLOOM,
                /** The blend function of this effect. (default: BlendFunction.ADD) */
                blendFunction: SDV.BlendFunction.ADD,
                /** The bloom intensity. (default: 1.0) */
                intensity: 10.0,
                /** The blur kernel size. (default: KernelSize.LARGE) */
                kernelSize: SDV.KernelSize.LARGE,
                /** Controls the smoothness of the luminance threshold. Range is [0, 1]. (default: 0.025) */
                luminanceSmoothing: 0,
                /** The luminance threshold. Raise this value to mask out darker elements in the scene. Range is [0, 1]. (default: 0.9) */
                luminanceThreshold: 0,
                /** Enables or disables mipmap blur. (default: false) */
                mipmapBlur: false
        
            })
            const selectiveBloomEffect = viewport.postProcessing.getEffect(selectiveBloomEffectToken);    
            (<any>selectiveBloomEffect).ignoreBackground = true;
            viewport.postProcessing.selectiveBloomEffects[selectiveBloomEffectToken].addSelection(session.node!);        
            
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + "_selectiveBloom");
    });

    test(name + "_selectiveBloom_mipmap", async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });          
            
            viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.SMAA
            })

            const selectiveBloomEffectToken = viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.SELECTIVE_BLOOM,
                /** The blend function of this effect. (default: BlendFunction.ADD) */
                blendFunction: SDV.BlendFunction.ADD,
                /** The bloom intensity. (default: 1.0) */
                intensity: 10.0,
                /** The blur kernel size. (default: KernelSize.LARGE) */
                kernelSize: SDV.KernelSize.LARGE,
                /** Controls the smoothness of the luminance threshold. Range is [0, 1]. (default: 0.025) */
                luminanceSmoothing: 0,
                /** The luminance threshold. Raise this value to mask out darker elements in the scene. Range is [0, 1]. (default: 0.9) */
                luminanceThreshold: 0,
                /** Enables or disables mipmap blur. (default: false) */
                mipmapBlur: true
        
            })
            const selectiveBloomEffect = viewport.postProcessing.getEffect(selectiveBloomEffectToken);    
            (<any>selectiveBloomEffect).ignoreBackground = true;
            viewport.postProcessing.selectiveBloomEffects[selectiveBloomEffectToken].addSelection(session.node!);        
            
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + "_selectiveBloom_mipmap");
    });

    test(name + "_sepia", async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });          
            
            viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.SMAA
            })
            const sepiaEffectToken = viewport.postProcessing.addEffect({
                /** The blend function of this effect. (default: BlendFunction.NORMAL) */
                blendFunction: SDV.BlendFunction.NORMAL,
                /** The intensity of the effect. (default: 1.0) */
                intensity: 1,
                type: SDV.POST_PROCESSING_EFFECT_TYPE.SEPIA,
            })
            
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + "_sepia");
    });

    test(name + "_smaa", async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });          
            
            viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.SMAA
            })
            
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + "_smaa");
    });

    test(name + "_tiltShift", async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });          
            
            viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.SMAA
            })
                    
            const tiltShiftEffectToken = viewport.postProcessing.addEffect({
                /** The blend function of this effect. (default: BlendFunction.NORMAL) */
                blendFunction: SDV.BlendFunction.NORMAL,
                /** The softness of the focus area edges. (default: 0.3) */
                feather: 0.3,
                /** The relative size of the focus area. (default: 0.4) */
                focusArea: 0.4,
                /** The blur kernel size. (default: KernelSize.MEDIUM) */
                kernelSize: SDV.KernelSize.MEDIUM,
                /** The relative offset of the focus area. (default: 0.0) */
                offset: 0,
                /** The rotation of the focus area in radians. (default: 0.0) */
                rotation: 0,
                type: SDV.POST_PROCESSING_EFFECT_TYPE.TILT_SHIFT,
            })
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + "_tiltShift");
    });

    test(name + "_vignette", async () => {
        await driver.executeAsyncScript(async (ticket: string, cb: any) => {
            const SDV: typeof ShapeDiverViewer = (<any>window).SDV;
            let viewport = await SDV.createViewport({ id: 'myViewport', canvas: <HTMLCanvasElement>document.getElementById('canvas') })
            let session = await SDV.createSession({ id: 'mySession', ticket, modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });          
            
            viewport.postProcessing.addEffect({
                type: SDV.POST_PROCESSING_EFFECT_TYPE.SMAA
            })
                            
            const vignetteEffectToken = viewport.postProcessing.addEffect({
                /** The blend function of this effect. (default: BlendFunction.NORMAL) */
                blendFunction: SDV.BlendFunction.NORMAL,
                /** The Vignette darkness. (default: 0.5) */
                darkness: 0.5,
                /** The Vignette offset. (default: 0.5) */
                offset: 0.5,
                /** The Vignette technique. (default: VignetteTechnique.DEFAULT) */
                technique: SDV.VignetteTechnique.DEFAULT,
                type: SDV.POST_PROCESSING_EFFECT_TYPE.VIGNETTE,
            })
            await new Promise<void>((resolve) => {
                SDV.addListener((<any>window).SDV.EVENTTYPE.RENDERING.BEAUTY_RENDERING_FINISHED, async () => resolve())
            })
            cb();
        }, shelfTicket);
        await screenshotCompare(await driver.takeScreenshot(), name + "_vignette");
    });
});
