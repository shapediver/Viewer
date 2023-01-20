import { addListener, createViewport, ITaskEvent, IViewportApi, TASK_TYPE, VISIBILITY_MODE } from "@shapediver/viewer";
import { EVENTTYPE } from "@shapediver/viewer.shared.services";
import { addGLTF, createMenu, fetchPendants, Option } from "./utils";
import * as SHAPEDIVERVIEWER from "@shapediver/viewer"

(<any>window).SDV = SHAPEDIVERVIEWER;

export let viewport: IViewportApi;
export let modelOptions: Option[] = [];

(async () => {
    modelOptions = await fetchPendants();

    // create a viewport
    viewport = await createViewport({
        canvas: <HTMLCanvasElement>document.getElementById('canvas'),
        id: 'myViewer',
        visibility: VISIBILITY_MODE.MANUAL,
        branding: { backgroundColor: '#35363a' }
    });

    // adjust some of the settings
    viewport.groundPlaneVisibility = false;
    viewport.gridVisibility = false;
    viewport.ambientOcclusion = false;
    viewport.shadows = false;
    viewport.clearColor = '#35363a';

    viewport.environmentMap = "https://viewer.shapediver.com/v3/envmaps/2k/footprintCourt_2k.hdr";
    viewport.createLightScene();

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
    menuDiv.style.visibility = "hidden";
    createMenu();

    promises.push(addGLTF(modelOptions[0]));

    await Promise.all(promises);

    // once everything is loaded, show it
    viewport.show = true;
    menuDiv.style.visibility = "";
})();