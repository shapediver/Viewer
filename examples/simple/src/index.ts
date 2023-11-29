import { addListener, createViewport, ITaskEvent, IViewportApi, TASK_TYPE, VISIBILITY_MODE } from '@shapediver/viewer';
import { EVENTTYPE } from '@shapediver/viewer.shared.services';
import { addGLTF, createMenu, fetchPendants, Option } from './utils';
import * as SHAPEDIVERVIEWER from '@shapediver/viewer';
import { resolve } from 'path';

(<any>window).SDV = SHAPEDIVERVIEWER;

export let viewport: IViewportApi;

export const modelOptions: {
    [pendantGroup: string]: {
        [color: string]: {
            [variation: string]: Option[]
        }
    }
} = {};

(async () => {
    const options = await fetchPendants();
    // options.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    for(let i = 0; i < options.length; i++) {
        const o = options[i];
        const o_removedPath = o.label.replace('configurator/models/pendants/', '');
        const pendantGroup = o_removedPath.substring(0, o_removedPath.indexOf('/'));

        if(pendantGroup === 'optimized') continue;

        if(!modelOptions[pendantGroup]) 
            modelOptions[pendantGroup] = {};

        const variationIndex = o_removedPath.indexOf('_Var') + 1;

        if(variationIndex === 0) {
            if(!modelOptions[pendantGroup]['color']) 
                modelOptions[pendantGroup]['color'] = {};

            if(!modelOptions[pendantGroup]['color']['variation'])
                modelOptions[pendantGroup]['color']['variation'] = [];

            modelOptions[pendantGroup]['color']['variation'].push(o);
        } else {
            const variation = o_removedPath.substring(variationIndex, o_removedPath.indexOf('_', variationIndex));

            const nextUnderscoreIndex = o_removedPath.indexOf('_', variationIndex)+1;
            const color = o_removedPath.substring(nextUnderscoreIndex, o_removedPath.indexOf('_', nextUnderscoreIndex));

            if(!modelOptions[pendantGroup][color]) 
                modelOptions[pendantGroup][color] = {};

            if(!modelOptions[pendantGroup][color][variation])
                modelOptions[pendantGroup][color][variation] = [];

            modelOptions[pendantGroup][color][variation].push(o);
        }

    }

    // create a viewport
    viewport = await createViewport({
        canvas: <HTMLCanvasElement>document.getElementById('canvas'),
        id: 'myViewer',
        visibility: VISIBILITY_MODE.MANUAL,
        branding: { backgroundColor: '#efefef' }
    });

    Object.keys(viewport.postProcessing.getEffectTokens()).forEach(e => viewport.postProcessing.removeEffect(e));

    // adjust some of the settings
    viewport.groundPlaneVisibility = false;
    viewport.gridVisibility = false;
    // viewport.ambientOcclusion = false;
    viewport.shadows = false;
    viewport.clearColor = '#efefef';

    viewport.environmentMap = SHAPEDIVERVIEWER.ENVIRONMENT_MAP.NEUTRAL;
    viewport.createLightScene();
    viewport.automaticColorAdjustment = false;

    // wait for the environment map to load
    const promises = [];
    promises.push(new Promise<void>((resolve) => {
        addListener(EVENTTYPE.TASK.TASK_END, (e) => {
            const taskEvent = e as ITaskEvent;
            if (taskEvent.type === TASK_TYPE.ENVIRONMENT_MAP_LOADING) resolve();
        });
    }));

    // create the main menu
    const menuDiv = document.getElementById('menu') as HTMLDivElement;
    menuDiv.style.visibility = 'hidden';
    createMenu();

    await Promise.all(promises);

    // once everything is loaded, show it
    viewport.show = true;
    menuDiv.style.visibility = '';

    await new Promise(resolve => setTimeout(resolve, 5000));

    const gltf = await viewport.convertToGlTF();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(gltf);
    a.click();
})();