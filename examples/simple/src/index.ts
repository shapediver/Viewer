import {
    api,
    ENVIRONMENT_MAP,
    EVENTTYPE,
    ITaskEvent,
    IViewer,
    TASKTYPE,
    VISIBILITYMODE,
} from "@shapediver/viewer";
import { container } from "tsyringe";
import { DataEngine } from "@shapediver/viewer.data-engine.data-engine";
import { UuidGenerator } from "@shapediver/viewer.shared.services";

const dataEngine: DataEngine = <DataEngine>container.resolve(DataEngine);
const uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);

const modelsSelect = <HTMLSelectElement>document.getElementById("models");
const envMapsSelect = <HTMLSelectElement>document.getElementById("envMaps");
const backgroundColorInput = <HTMLInputElement>document.getElementById("background");

let viewer: IViewer;

const addGLTF = async (uri: string) => {
    const node = await dataEngine.loadContent({
        format: "gltf",
        href: uri
    });

    for(let child of api.sceneTree.root.children)
        api.sceneTree.removeNode(child);
    api.sceneTree.addNode(node);
    api.update();
    await viewer.camera!.set([0, 0, 0], [0, 0, 0], { duration: 0 });
    await viewer.camera!.zoomTo(undefined, { duration: 0 });
};

const createModelDropdown = () => {
    const models = ["28", "73"];

    modelsSelect.onchange = async () => {
        const id = uuidGenerator.create();
        viewer.registerBusyMode(id)
        await addGLTF("bocci_lights_3D_" + models[+modelsSelect.value] + ".gltf");
        viewer.deregisterBusyMode(id)
    };

    for (let i = 0; i < models.length; i++) {
        const option = document.createElement("option");
        option.setAttribute("value", i + "");
        option.setAttribute("name", models[i]);
        option.innerHTML = models[i];
        modelsSelect.appendChild(option);
    }
};


const createEnvironmentMapDropdown = () => {
    const envMaps = [ENVIRONMENT_MAP.BALLROOM, ENVIRONMENT_MAP.COLORFUL_STUDIO, ENVIRONMENT_MAP.LARGE_CORRIDOR, ENVIRONMENT_MAP.OLD_HALL, ENVIRONMENT_MAP.PAUL_LOBE_HAUS];
    envMapsSelect.onchange = async () => {
        api.addListener(EVENTTYPE.TASK.TASK_START, (e) => {
            const taskEvent = e as ITaskEvent;
            if (taskEvent.type === TASKTYPE.ENVIRONMENT_MAP_LOADING)
                viewer.registerBusyMode(taskEvent.id)
        });

        api.addListener(EVENTTYPE.TASK.TASK_END, (e) => {
            const taskEvent = e as ITaskEvent;
            if (taskEvent.type === TASKTYPE.ENVIRONMENT_MAP_LOADING)
                viewer.deregisterBusyMode(taskEvent.id)
        });

        viewer.environmentMap = envMaps[+envMapsSelect.value];
    };

    for (let i = 0; i < envMaps.length; i++) {
        const option = document.createElement("option");
        option.setAttribute("value", i + "");
        option.setAttribute("name", envMaps[i]);
        option.innerHTML = envMaps[i];
        envMapsSelect.appendChild(option);
    }
};

(async () => {
    viewer = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer', visibility: VISIBILITYMODE.MANUAL });
    viewer.groundPlaneVisibility = false;
    viewer.gridVisibility = false;
    viewer.ambientOcclusion = false;
    viewer.shadows = false;
    viewer.environmentMap = ENVIRONMENT_MAP.LARGE_CORRIDOR;

    const promises = [];

    promises.push(new Promise<void>((resolve) => {
        api.addListener(EVENTTYPE.TASK.TASK_END, (e) => {
            const taskEvent = e as ITaskEvent;
            if (taskEvent.type === TASKTYPE.ENVIRONMENT_MAP_LOADING) resolve();
        });
    }));

    promises.push(addGLTF("bocci_lights_3D_28.gltf"));
    createModelDropdown();
    createEnvironmentMapDropdown();

    backgroundColorInput.onchange = () => {
        viewer.clearColor = backgroundColorInput.value;
    }

    await Promise.all(promises);
    viewer.show = true;
})();
