import {
    api,
    ENVIRONMENT_MAP,
    EVENTTYPE,
    GeometryData,
    ITaskEvent,
    IViewer,
    MapData,
    MaterialData,
    MaterialEngine,
    MaterialStandardData,
    MATERIAL_ALPHA,
    MATERIAL_SIDE,
    TASKTYPE,
    TreeNode,
    VISIBILITYMODE,
} from "@shapediver/viewer";
import { container } from "tsyringe";
import { DataEngine } from "@shapediver/viewer.data-engine.data-engine";
import { UuidGenerator } from "@shapediver/viewer.shared.services";
import { vec3 } from "gl-matrix";

const dataEngine: DataEngine = <DataEngine>container.resolve(DataEngine);
const uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
const materialEngine: MaterialEngine = <MaterialEngine>(container.resolve(MaterialEngine));

const modelsSelect = <HTMLSelectElement>document.getElementById("models");
const envMapsSelect = <HTMLSelectElement>document.getElementById("envMaps");
const backgroundColorInput = <HTMLInputElement>document.getElementById("background");
const environmentMapAsBackgroundInput = <HTMLInputElement>document.getElementById("environmentMapAsBackground");

let viewer: IViewer;

const modelIDs: {
    [key: string]: {
        [key: string]: any
    }
} = {
    '28_clear': {
        'Glass': {
            alphaMode: MATERIAL_ALPHA.BLEND,
            side: MATERIAL_SIDE.DOUBLE,
        }
    }, 
    '28_opaque': {
        'Glass': {
            alphaMode: MATERIAL_ALPHA.BLEND,
            side: MATERIAL_SIDE.DOUBLE,
        }
    }, 
    '73': {}
}

const addGLTF = async (id: string) => {
    const node = await dataEngine.loadContent({
        format: "gltf",
        href: 'https://viewer.shapediver.com/v3/demos/bocci/simple/models/' + id.substring(0,2) + '/bocci_lights_3D_' + id + '.gltf'
    });


    const getGeometries = async (node: TreeNode) => {
        for (let i = 0; i < node.data.length; i++) {
            if (node.data[i] instanceof GeometryData) {
                const geometryData = <GeometryData>node.data[i];
                const materialData = <MaterialStandardData>geometryData.primitive.material;
                if(!materialData) throw new Error('No material found.')
                if(!materialData.name) throw new Error('No material name found.')
                console.log(materialData.name)

                const model = modelIDs[id];
                const materialChange = model[materialData.name];
                if(materialChange) 
                    for(let m in materialChange) 
                        (<any>materialData)[m] = materialChange[m];

                materialData.updateVersion();
                geometryData.updateVersion();
                node.updateVersion();
                
            }
        }

        for(let i = 0; i < node.children.length; i++)
            await getGeometries(node.children[i]);
    }
    await getGeometries(node);

    for(let child of api.sceneTree.root.children)
        api.sceneTree.removeNode(child);
    api.sceneTree.addNode(node);

    api.update();

    const center = api.sceneTree.root.boundingBox.boundingSphere.center;    
    await viewer.camera!.zoomTo(api.sceneTree.root.boundingBox);//vec3.add(vec3.create(), center, [0, 6, -2]), vec3.add(vec3.create(), center, [0, 0, -2]), { duration: 0 });
};

const createModelDropdown = () => {
    const models = Object.keys(modelIDs).sort();
    console.log(models)
    modelsSelect.value = models[0];

    modelsSelect.onchange = async () => {
        const id = uuidGenerator.create();
        viewer.registerBusyMode(id)
        await addGLTF(models[+modelsSelect.value]);
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
    const envMaps = ['photo_studio', 'sepulchral_chapel_rotunda', 'ballroom', 'paul_lobe_haus', 'old_hall', 'leadenhall_market'];
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

        viewer.environmentMap = "https://viewer.shapediver.com/v3/demos/bocci/simple/envMaps/" + envMaps[+envMapsSelect.value] + "_4k.hdr";
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
    viewer = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer', visibility: VISIBILITYMODE.MANUAL, branding: { backgroundColor: '#35363a' } });
    viewer.groundPlaneVisibility = false;
    viewer.gridVisibility = false;
    viewer.ambientOcclusion = false;
    viewer.shadows = false;

    viewer.environmentMap = ENVIRONMENT_MAP.PHOTO_STUDIO;
    viewer.createLightScene();

    backgroundColorInput.onchange = () => viewer.clearColor = backgroundColorInput.value;
    backgroundColorInput.value = '#35363a'
    viewer.clearColor = '#35363a';
    environmentMapAsBackgroundInput.onchange = () => viewer.environmentMapAsBackground = environmentMapAsBackgroundInput.checked;
    
    const promises = [];

    promises.push(new Promise<void>((resolve) => {
        api.addListener(EVENTTYPE.TASK.TASK_END, (e) => {
            const taskEvent = e as ITaskEvent;
            if (taskEvent.type === TASKTYPE.ENVIRONMENT_MAP_LOADING) resolve();
        });
    }));

    promises.push(addGLTF("28_clear"));
    createModelDropdown();
    createEnvironmentMapDropdown();

    await Promise.all(promises);
    viewer.show = true;

})();
