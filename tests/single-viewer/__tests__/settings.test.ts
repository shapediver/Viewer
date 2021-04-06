import { api as API, RENDERERTYPE, CAMERATYPE, LIGHTTYPE } from "@shapediver/viewer"
import { OrthographicCamera } from "../../../api/api/node_modules/@shapediver/viewer.rendering-engine.camera-engine/dist";
import { OrthographicCameraControls } from "../../../api/api/node_modules/@shapediver/viewer.rendering-engine.camera-engine/dist";
import { PerspectiveCameraControls } from "../../../api/api/node_modules/@shapediver/viewer.rendering-engine.camera-engine/dist";
import { PerspectiveCamera } from "../../../api/api/node_modules/@shapediver/viewer.rendering-engine.camera-engine/dist";
import { getPage, screenshotCompare } from "./setup"

describe('Settings Tests', () => {
    it('build_version', async () => {
        // TODO
    });
    it('settings_version', async () => {
        // TODO
    });
    it('parameters.controlOrder', async () => {
        const page = await getPage('temp');
        const controlOrder = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return session.controlOrder;
        });
        expect(Array.isArray(controlOrder)).toBe(true);
        expect(controlOrder.length).toBe(11);
    });
    it('parameters.controlNames', async () => {
        const page = await getPage('temp');
        const controlNames = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return session.controlNames;
        });
        expect(Object.values(controlNames)[0]).toBe('COLOR');
    });
    it('parameters.controlHidden', async () => {
        const page = await getPage('temp');
        const controlHidden = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return session.controlHidden;
        });
        expect(Array.isArray(controlHidden)).toBe(true);
        expect(controlHidden.length).toBe(9);
    });
    it('viewer.blurSceneWhenBusy', async () => {
        // TODO
    });
    it('viewer.loggingLevel', async () => {
        const page = await getPage('temp');
        const loggingLevel = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            api.loggingLevel = (<any>window).LOGGINGLEVEL.ERROR;
            //let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return api.loggingLevel;
        });
        expect(loggingLevel).toBe('error');  

        const loggingLevel2 = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return api.loggingLevel;
        });
        expect(loggingLevel2).toBe('none');  
    });
    it('viewer.showMessages', async () => {
        const page = await getPage('temp');
        const showMessages = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            api.showMessages = false;
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return api.showMessages;
        });
        expect(showMessages).toBe(true); 
        
        const showMessages2 = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            api.showMessages = false;
            return api.showMessages;
        });
        expect(showMessages2).toBe(false);     
    });
    it('viewer.commitParameters', async () => {
        const page = await getPage('temp');
        const commitParameters = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return session.commitParameters;
        });
        expect(commitParameters).toBe(false);     
    });
    it('viewer.commitSettings', async () => {
        const page = await getPage('temp');
        const commitSettings = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return session.commitSettings;
        });
        expect(commitSettings).toBe(false);     
    });
    it('viewer.scene.show', async () => {
        const page = await getPage('temp');
        const show1 = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            return viewer.show;
        });
        expect(show1).toBe(false);     

        const show2 = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = api.getViewer('myViewer');
            viewer.show = true;
            return viewer.show;
        });
        expect(show2).toBe(true);   
        
        const show3 = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = api.getViewer('myViewer');
            viewer.show = false;
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.show;
        });
        expect(show3).toBe(true);    
    });
    it('viewer.scene.showSceneTransition', async () => {
        // TODO  
    });
    it('viewer.scene.camera.autoAdjust', async () => {
        const page = await getPage('temp');
        const autoAdjust = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.getCamera(Object.keys(viewer.getCameras())[0])!.autoAdjust;
        });
        expect(autoAdjust).toBe(false); 
    });
    it('viewer.scene.camera.cameraMovementDuration', async () => {
        const page = await getPage('temp');
        const cameraMovementDuration = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.getCamera(Object.keys(viewer.getCameras())[0])!.cameraMovementDuration;
        });
        expect(cameraMovementDuration).toBe(800);     
    });
    it('viewer.scene.camera.enableCameraControls', async () => {
        const page = await getPage('temp');
        const enableCameraControls = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.getCamera(Object.keys(viewer.getCameras())[0])!.enableCameraControls;
        });
        expect(enableCameraControls).toBe(true);     
    });
    it('viewer.scene.camera.revertAtMouseUp', async () => {
        const page = await getPage('temp');
        const revertAtMouseUp = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.getCamera(Object.keys(viewer.getCameras())[0])!.revertAtMouseUp;
        });
        expect(revertAtMouseUp).toBe(false);     
    });
    it('viewer.scene.camera.revertAtMouseUpDuration', async () => {
        const page = await getPage('temp');
        const revertAtMouseUpDuration = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.getCamera(Object.keys(viewer.getCameras())[0])!.revertAtMouseUpDuration;
        });
        expect(revertAtMouseUpDuration).toBe(800);     
    });
    it('viewer.scene.camera.zoomExtentsFactor', async () => {
        const page = await getPage('temp');
        const zoomExtentsFactor = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.getCamera(Object.keys(viewer.getCameras())[0])!.zoomExtentsFactor;
        });
        expect(zoomExtentsFactor).toBe(1);     
    });
    it('viewer.scene.camera.cameraTypes.perspective.default.position', async () => {
        const page = await getPage('temp');
        const defaultPosition = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.getCamera(Object.keys(viewer.getCameras())[0])!.defaultPosition;
        });
        expect(defaultPosition[0]).toBe(0);     
        expect(defaultPosition[1]).toBe(0);     
        expect(defaultPosition[2]).toBe(0);     
    });
    it('viewer.scene.camera.cameraTypes.perspective.default.target', async () => {
        const page = await getPage('temp');
        const defaultTarget = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.getCamera(Object.keys(viewer.getCameras())[0])!.defaultTarget;
        });
        expect(defaultTarget[0]).toBe(0);     
        expect(defaultTarget[1]).toBe(0);     
        expect(defaultTarget[2]).toBe(0);     
    });
    it('viewer.scene.camera.cameraTypes.perspective.fov', async () => {
        const page = await getPage('temp');
        const fov = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return (<any>viewer.getCamera(Object.keys(viewer.getCameras())[0]))!.fov;
        });
        expect(fov).toBe(45);
    });
    it('viewer.scene.camera.active', async () => {
        // TODO  
    });
    it('viewer.scene.camera.cameraTypes.orthographic.default.position', async () => {
        const page = await getPage('temp');
        const defaultPosition = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c = viewer.createCamera((<any>window).CAMERATYPE.ORTHOGRAPHIC);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return c.defaultPosition;
        });
        expect(defaultPosition[0]).toBe(0);     
        expect(defaultPosition[1]).toBe(0);     
        expect(defaultPosition[2]).toBe(0);        
    });
    it('viewer.scene.camera.cameraTypes.orthographic.default.target', async () => {
        const page = await getPage('temp');
        const defaultTarget = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c = viewer.createCamera((<any>window).CAMERATYPE.ORTHOGRAPHIC);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return c.defaultTarget;
        });
        expect(defaultTarget[0]).toBe(0);     
        expect(defaultTarget[1]).toBe(0);     
        expect(defaultTarget[2]).toBe(0);     
    });
    it('viewer.scene.camera.controls.orbit.autoRotationSpeed', async () => {
        const page = await getPage('temp');
        const autoRotationSpeed = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: PerspectiveCamera = (<PerspectiveCamera><unknown>viewer.createPerspectiveCamera());
            const controls: PerspectiveCameraControls = (<PerspectiveCameraControls><unknown>(<PerspectiveCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.autoRotationSpeed;
        });
        expect(autoRotationSpeed).toBe(0);
    });
    it('viewer.scene.camera.controls.orbit.damping', async () => {
        const page = await getPage('temp');
        const damping = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: PerspectiveCamera = (<PerspectiveCamera><unknown>viewer.createPerspectiveCamera());
            const controls: PerspectiveCameraControls = (<PerspectiveCameraControls><unknown>(<PerspectiveCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.damping;
        });
        expect(damping).toBe(0.1);
    });
    it('viewer.scene.camera.controls.orbit.enableAutoRotation', async () => {
        const page = await getPage('temp');
        const enableAutoRotation = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: PerspectiveCamera = (<PerspectiveCamera><unknown>viewer.createPerspectiveCamera());
            const controls: PerspectiveCameraControls = (<PerspectiveCameraControls><unknown>(<PerspectiveCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.enableAutoRotation;
        });
        expect(enableAutoRotation).toBe(false);
    });
    it('viewer.scene.camera.controls.orbit.enableKeyPan', async () => {
        const page = await getPage('temp');
        const enableKeyPan = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: PerspectiveCamera = (<PerspectiveCamera><unknown>viewer.createPerspectiveCamera());
            const controls: PerspectiveCameraControls = (<PerspectiveCameraControls><unknown>(<PerspectiveCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.enableKeyPan;
        });
        expect(enableKeyPan).toBe(false);
    });
    it('viewer.scene.camera.controls.orbit.enablePan', async () => {
        const page = await getPage('temp');
        const enablePan = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: PerspectiveCamera = (<PerspectiveCamera><unknown>viewer.createPerspectiveCamera());
            const controls: PerspectiveCameraControls = (<PerspectiveCameraControls><unknown>(<PerspectiveCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.enablePan;
        });
        expect(enablePan).toBe(true);
    });
    it('viewer.scene.camera.controls.orbit.enableRotation', async () => {
        const page = await getPage('temp');
        const enableRotation = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: PerspectiveCamera = (<PerspectiveCamera><unknown>viewer.createPerspectiveCamera());
            const controls: PerspectiveCameraControls = (<PerspectiveCameraControls><unknown>(<PerspectiveCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.enableRotation;
        });
        expect(enableRotation).toBe(true);
    });
    it('viewer.scene.camera.controls.orbit.enableZoom', async () => {
        const page = await getPage('temp');
        const enableZoom = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: PerspectiveCamera = (<PerspectiveCamera><unknown>viewer.createPerspectiveCamera());
            const controls: PerspectiveCameraControls = (<PerspectiveCameraControls><unknown>(<PerspectiveCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.enableZoom;
        });
        expect(enableZoom).toBe(true);
    });
    it('viewer.scene.camera.controls.orbit.input', async () => {
        const page = await getPage('temp');
        const input = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: PerspectiveCamera = (<PerspectiveCamera><unknown>viewer.createPerspectiveCamera());
            const controls: PerspectiveCameraControls = (<PerspectiveCameraControls><unknown>(<PerspectiveCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.input;
        });
        expect(input).toEqual({ keys: { up: 38, down: 40, left: 37, right: 39 }, mouse: { rotate: 0, zoom: 1, pan: 2 }, touch: { rotate: 1, zoom: 2, pan: 3 }, });
    });
    it('viewer.scene.camera.controls.orbit.keyPanSpeed', async () => {
        const page = await getPage('temp');
        const keyPanSpeed = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: PerspectiveCamera = (<PerspectiveCamera><unknown>viewer.createPerspectiveCamera());
            const controls: PerspectiveCameraControls = (<PerspectiveCameraControls><unknown>(<PerspectiveCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.keyPanSpeed;
        });
        expect(keyPanSpeed).toBe(0.5);
    });
    it('viewer.scene.camera.controls.orbit.movementSmoothness', async () => {
        const page = await getPage('temp');
        const movementSmoothness = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: PerspectiveCamera = (<PerspectiveCamera><unknown>viewer.createPerspectiveCamera());
            const controls: PerspectiveCameraControls = (<PerspectiveCameraControls><unknown>(<PerspectiveCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.movementSmoothness;
        });
        expect(movementSmoothness).toBe(0.5);
    });
    it('viewer.scene.camera.controls.orbit.rotationSpeed', async () => {
        const page = await getPage('temp');
        const rotationSpeed = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: PerspectiveCamera = (<PerspectiveCamera><unknown>viewer.createPerspectiveCamera());
            const controls: PerspectiveCameraControls = (<PerspectiveCameraControls><unknown>(<PerspectiveCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.rotationSpeed;
        });
        expect(rotationSpeed).toBe(0.5);
    });
    it('viewer.scene.camera.controls.orbit.panSpeed', async () => {
        const page = await getPage('temp');
        const panSpeed = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: PerspectiveCamera = (<PerspectiveCamera><unknown>viewer.createPerspectiveCamera());
            const controls: PerspectiveCameraControls = (<PerspectiveCameraControls><unknown>(<PerspectiveCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.panSpeed;
        });
        expect(panSpeed).toBe(0.5);
    });
    it('viewer.scene.camera.controls.orbit.zoomSpeed', async () => {
        const page = await getPage('temp');
        const zoomSpeed = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: PerspectiveCamera = (<PerspectiveCamera><unknown>viewer.createPerspectiveCamera());
            const controls: PerspectiveCameraControls = (<PerspectiveCameraControls><unknown>(<PerspectiveCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.zoomSpeed;
        });
        expect(zoomSpeed).toBe(0.5);
    });

    
    it('viewer.scene.camera.controls.orbit.restrictions.position.cube', async () => {
        const page = await getPage('temp');
        const cubePositionRestriction = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: PerspectiveCamera = (<PerspectiveCamera><unknown>viewer.createPerspectiveCamera());
            console.log(c.controls)
            const controls: PerspectiveCameraControls = (<PerspectiveCameraControls><unknown>(<PerspectiveCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.cubePositionRestriction;
        });
        expect(cubePositionRestriction.min[0]).toBe(null); // should be -Infinity but serialization doesn't work
        expect(cubePositionRestriction.min[1]).toBe(null); // should be -Infinity but serialization doesn't work
        expect(cubePositionRestriction.min[2]).toBe(null); // should be -Infinity but serialization doesn't work
        expect(cubePositionRestriction.max[0]).toBe(null); // should be Infinity but serialization doesn't work
        expect(cubePositionRestriction.max[1]).toBe(null); // should be Infinity but serialization doesn't work
        expect(cubePositionRestriction.max[2]).toBe(null); // should be Infinity but serialization doesn't work
    });
    
    it('viewer.scene.camera.controls.orbit.restrictions.target.cube', async () => {
        const page = await getPage('temp');
        const cubeTargetRestriction = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: PerspectiveCamera = (<PerspectiveCamera><unknown>viewer.createPerspectiveCamera());
            const controls: PerspectiveCameraControls = (<PerspectiveCameraControls><unknown>(<PerspectiveCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.cubeTargetRestriction;
        });
        expect(cubeTargetRestriction.min[0]).toBe(null); // should be -Infinity but serialization doesn't work
        expect(cubeTargetRestriction.min[1]).toBe(null); // should be -Infinity but serialization doesn't work
        expect(cubeTargetRestriction.min[2]).toBe(null); // should be -Infinity but serialization doesn't work
        expect(cubeTargetRestriction.max[0]).toBe(null); // should be Infinity but serialization doesn't work
        expect(cubeTargetRestriction.max[1]).toBe(null); // should be Infinity but serialization doesn't work
        expect(cubeTargetRestriction.max[2]).toBe(null); // should be Infinity but serialization doesn't work
    });

    it('viewer.scene.camera.controls.orbit.restrictions.position.sphere', async () => {
        const page = await getPage('temp');
        const spherePositionRestriction = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: PerspectiveCamera = (<PerspectiveCamera><unknown>viewer.createPerspectiveCamera());
            const controls: PerspectiveCameraControls = (<PerspectiveCameraControls><unknown>(<PerspectiveCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.spherePositionRestriction;
        });
        expect(spherePositionRestriction.center[0]).toBe(0);
        expect(spherePositionRestriction.center[1]).toBe(0);
        expect(spherePositionRestriction.center[2]).toBe(0);
        expect(spherePositionRestriction.radius).toBe(null); // should be Infinity but serialization doesn't work
    });

    it('viewer.scene.camera.controls.orbit.restrictions.target.sphere', async () => {
        const page = await getPage('temp');
        const sphereTargetRestriction = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: PerspectiveCamera = (<PerspectiveCamera><unknown>viewer.createPerspectiveCamera());
            const controls: PerspectiveCameraControls = (<PerspectiveCameraControls><unknown>(<PerspectiveCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.sphereTargetRestriction;
        });
        expect(sphereTargetRestriction.center[0]).toBe(0);
        expect(sphereTargetRestriction.center[1]).toBe(0);
        expect(sphereTargetRestriction.center[2]).toBe(0);
        expect(sphereTargetRestriction.radius).toBe(null); // should be Infinity but serialization doesn't work
    });

    it('viewer.scene.camera.controls.orbit.restrictions.rotation', async () => {
        const page = await getPage('temp');
        const rotationRestriction = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: PerspectiveCamera = (<PerspectiveCamera><unknown>viewer.createPerspectiveCamera());
            const controls: PerspectiveCameraControls = (<PerspectiveCameraControls><unknown>(<PerspectiveCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.rotationRestriction;
        });
        expect(rotationRestriction.minPolarAngle).toBe(0);
        expect(rotationRestriction.maxPolarAngle).toBe(180);
        expect(rotationRestriction.minAzimuthAngle).toBe(null); // should be -Infinity but serialization doesn't work
        expect(rotationRestriction.maxAzimuthAngle).toBe(null); // should be Infinity but serialization doesn't work
    });


    it('viewer.scene.camera.controls.orbit.restrictions.zoom', async () => {
        const page = await getPage('temp');
        const zoomRestriction = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: PerspectiveCamera = (<PerspectiveCamera><unknown>viewer.createPerspectiveCamera());
            const controls: PerspectiveCameraControls = (<PerspectiveCameraControls><unknown>(<PerspectiveCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.zoomRestriction;
        });
        expect(zoomRestriction.minDistance).toBe(0);
        expect(zoomRestriction.maxDistance).toBe(null); // should be Infinity but serialization doesn't work
    });




    
    it('viewer.scene.camera.controls.orthographic.damping', async () => {
        const page = await getPage('temp');
        const damping = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: OrthographicCamera = (<OrthographicCamera><unknown>viewer.createOrthographicCamera());
            const controls: OrthographicCameraControls = (<OrthographicCameraControls><unknown>(<OrthographicCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.damping;
        });
        expect(damping).toBe(0.1);
    });
    it('viewer.scene.camera.controls.orthographic.enableKeyPan', async () => {
        const page = await getPage('temp');
        const enableKeyPan = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: OrthographicCamera = (<OrthographicCamera><unknown>viewer.createOrthographicCamera());
            const controls: OrthographicCameraControls = (<OrthographicCameraControls><unknown>(<OrthographicCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.enableKeyPan;
        });
        expect(enableKeyPan).toBe(false);
    });
    it('viewer.scene.camera.controls.orthographic.enablePan', async () => {
        const page = await getPage('temp');
        const enablePan = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: OrthographicCamera = (<OrthographicCamera><unknown>viewer.createOrthographicCamera());
            const controls: OrthographicCameraControls = (<OrthographicCameraControls><unknown>(<OrthographicCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.enablePan;
        });
        expect(enablePan).toBe(true);
    });
    it('viewer.scene.camera.controls.orthographic.enableZoom', async () => {
        const page = await getPage('temp');
        const enableZoom = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: OrthographicCamera = (<OrthographicCamera><unknown>viewer.createOrthographicCamera());
            const controls: OrthographicCameraControls = (<OrthographicCameraControls><unknown>(<OrthographicCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.enableZoom;
        });
        expect(enableZoom).toBe(true);
    });
    it('viewer.scene.camera.controls.orthographic.input', async () => {
        const page = await getPage('temp');
        const input = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: OrthographicCamera = (<OrthographicCamera><unknown>viewer.createOrthographicCamera());
            const controls: OrthographicCameraControls = (<OrthographicCameraControls><unknown>(<OrthographicCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.input;
        });
        expect(input).toEqual({ keys: { up: 38, down: 40, left: 37, right: 39 }, mouse: { rotate: 0, zoom: 1, pan: 2 }, touch: { rotate: 1, zoom: 2, pan: 3 }, });
    });
    it('viewer.scene.camera.controls.orthographic.keyPanSpeed', async () => {
        const page = await getPage('temp');
        const keyPanSpeed = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: OrthographicCamera = (<OrthographicCamera><unknown>viewer.createOrthographicCamera());
            const controls: OrthographicCameraControls = (<OrthographicCameraControls><unknown>(<OrthographicCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.keyPanSpeed;
        });
        expect(keyPanSpeed).toBe(0.5);
    });
    it('viewer.scene.camera.controls.orthographic.movementSmoothness', async () => {
        const page = await getPage('temp');
        const movementSmoothness = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: OrthographicCamera = (<OrthographicCamera><unknown>viewer.createOrthographicCamera());
            const controls: OrthographicCameraControls = (<OrthographicCameraControls><unknown>(<OrthographicCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.movementSmoothness;
        });
        expect(movementSmoothness).toBe(0.5);
    });
    it('viewer.scene.camera.controls.orthographic.panSpeed', async () => {
        const page = await getPage('temp');
        const panSpeed = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: OrthographicCamera = (<OrthographicCamera><unknown>viewer.createOrthographicCamera());
            const controls: OrthographicCameraControls = (<OrthographicCameraControls><unknown>(<OrthographicCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.panSpeed;
        });
        expect(panSpeed).toBe(0.5);
    });
    it('viewer.scene.camera.controls.orthographic.zoomSpeed', async () => {
        const page = await getPage('temp');
        const zoomSpeed = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            const c: OrthographicCamera = (<OrthographicCamera><unknown>viewer.createOrthographicCamera());
            const controls: OrthographicCameraControls = (<OrthographicCameraControls><unknown>(<OrthographicCamera><unknown>c).controls);
            viewer.assignCamera(c.id)
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return controls.zoomSpeed;
        });
        expect(zoomSpeed).toBe(0.5);
    });

    
    it('viewer.scene.duration', async () => {
        const page = await getPage('temp');
        const duration = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.duration;
        });
        expect(duration).toBe(0);     
    });
    it('viewer.scene.fullscreen', async () => {
        const page = await getPage('temp');
        const fullscreen = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.fullscreen;
        });
        expect(fullscreen).toBe(false);     
    });
    it('viewer.scene.gridVisibility', async () => {
        const page = await getPage('temp');
        const gridVisibility = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.gridVisibility;
        });
        expect(gridVisibility).toBe(true);     
    });
    it('viewer.scene.groundPlaneReflectionThreshold', async () => {
        // TODO   
    });
    it('viewer.scene.groundPlaneReflectionVisibility', async () => {
        // TODO   
    });
    it('viewer.scene.groundPlaneVisibility', async () => {
        const page = await getPage('temp');
        const groundPlaneVisibility = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.groundPlaneVisibility;
        });
        expect(groundPlaneVisibility).toBe(true);     
    });
    it('viewer.scene.lights.helper', async () => {
        const page = await getPage('temp');
        const lightHelper = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.lightHelper;
        });
        expect(lightHelper).toBe(false);     
    });
    it('viewer.scene.lights.lightScene', async () => {
        const page = await getPage('temp');
        const lightScene = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.lightScene;
        });
        expect(lightScene).toBe('default');     
    });
    
    it('viewer.scene.material.environmentMap', async () => {
        const page = await getPage('temp');
        const environmentMap = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.environmentMap;
        });
        expect(environmentMap).toBe('none');     
    });
    it('viewer.scene.material.environmentMapAsBackground', async () => {
        const page = await getPage('temp');
        const environmentMapAsBackground = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.environmentMapAsBackground;
        });
        expect(environmentMapAsBackground).toBe(false);     
    });
    it('viewer.scene.material.environmentMapResolution', async () => {
        const page = await getPage('temp');
        const environmentMapResolution = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.environmentMapResolution;
        });
        expect(environmentMapResolution).toBe("1024");     
    });
    
    it('viewer.scene.render.ambientOcclusion', async () => {
        const page = await getPage('temp');
        const ambientOcclusion = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.ambientOcclusion;
        });
        expect(ambientOcclusion).toBe(true);     
    });
    
    it('viewer.scene.render.beautyRenderDelay', async () => {
        const page = await getPage('temp');
        const beautyRenderDelay = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.beautyRenderDelay;
        });
        expect(beautyRenderDelay).toBe(50);     
    });
    it('viewer.scene.render.beautyRenderBlendingDuration', async () => {
        const page = await getPage('temp');
        const beautyRenderBlendingDuration = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.beautyRenderBlendingDuration;
        });
        expect(beautyRenderBlendingDuration).toBe(1500);     
    });
    it('viewer.scene.render.clearColor', async () => {
        const page = await getPage('temp');
        const clearColor = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.clearColor;
        });
        expect(clearColor[0]).toBe(1);     
        expect(clearColor[1]).toBe(1);     
        expect(clearColor[2]).toBe(1);     
    });
    it('viewer.scene.render.clearAlpha', async () => {
        const page = await getPage('temp');
        const clearAlpha = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.clearAlpha;
        });
        expect(clearAlpha).toBe(1);        
    });
    it('viewer.scene.render.pointSize', async () => {
        const page = await getPage('temp');
        const pointSize = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.pointSize;
        });
        expect(pointSize).toBe(1);        
    });
    it('viewer.scene.render.shadows', async () => {
        const page = await getPage('temp');
        const shadows = await page.evaluate(async () => {
            const api: typeof API = (<any>window).api;
            let viewer = await api.createViewer({id: 'myViewer', canvas: <HTMLCanvasElement>document.getElementById('canvas')})
            let session = await api.createSession({ ticket: 'd6f62ac43b39b2899c85de0258e4f395a49617f6c485da65f1450430f8991e1c31231c434b3504254444b4bb81bc7799e26056b92fcd2fd8f8f1500bbdf73867ed2e87862a9a1349bb182bd4d4a764ff4689bfe19a87b07ebff5847565a83db1ab3002ec006a90841bed2a95fa3ae9663655e05febde-78055df2d71f54f8ca8d3815a352e2c8', modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com' });
            return viewer.shadows;
        });
        expect(shadows).toBe(true);        
    });
});