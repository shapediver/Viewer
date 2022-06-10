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

const dataEngine: DataEngine = <DataEngine>container.resolve(DataEngine);
const uuidGenerator: UuidGenerator = <UuidGenerator>container.resolve(UuidGenerator);
const materialEngine: MaterialEngine = <MaterialEngine>(container.resolve(MaterialEngine));

const modelsSelect = <HTMLSelectElement>document.getElementById("models");
const envMapsSelect = <HTMLSelectElement>document.getElementById("envMaps");
const backgroundColorInput = <HTMLInputElement>document.getElementById("background");
const environmentMapAsBackgroundInput = <HTMLInputElement>document.getElementById("environmentMapAsBackground");
const transmissionInput = <HTMLInputElement>document.getElementById("transmission");
const transmissionOption = <HTMLElement>document.getElementById("transmissionOption");
transmissionInput.checked = true;

let viewer: IViewer;

const modelMaterials: {
    [key: string]: {
        [key: string]: {
            aoMap?: string,
            alphaMap?: string,
            map?: string,
            normalMap?: string,
            transmission?: number,
            roughness?: number,
            metalness?: number,
            opacity?: number,
        }
    }
} = {
    '28': {
        'Glass': {
            aoMap: 'https://viewer.shapediver.com/v3/demos/bocci/simple/models/28/AmbientOcclusion.png',
            alphaMap: 'https://viewer.shapediver.com/v3/demos/bocci/simple/models/28/AmbientOcclusion.png',
            map: 'https://viewer.shapediver.com/v3/demos/bocci/simple/models/28/Color.png',
            transmission: 0
        }
    },
    '73': {
        'Fabric 73': {
            aoMap: 'https://viewer.shapediver.com/v3/demos/bocci/simple/models/73/Ambient_Occlusion_73.png',
            alphaMap: 'https://viewer.shapediver.com/v3/demos/bocci/simple/models/73/Opacity_map_73_1.png',
            // map: 'https://viewer.shapediver.com/v3/demos/bocci/simple/models/73/Color_73.png',
            // normalMap: 'https://viewer.shapediver.com/v3/demos/bocci/simple/models/73/Normal_73.png',
            // roughness: 0.15,
            // metalness: 0,
        }
    }
}

const addGLTF = async (id: string) => {
    const node = await dataEngine.loadContent({
        format: "gltf",
        href: 'https://viewer.shapediver.com/v3/demos/bocci/simple/models/' + id + '/bocci_lights_3D_' + id + '.gltf'
    });

    const materials = modelMaterials[id];

    const getGeometries = async (node: TreeNode) => {
        for (let i = 0; i < node.data.length; i++) {
            if (node.data[i] instanceof GeometryData) {
                const geometryData = <GeometryData>node.data[i];
                const materialData = <MaterialStandardData>geometryData.primitive.material;
                if(!materialData) throw new Error('No material found.')
                if(!materialData.name) throw new Error('No material name found.')
                if(materials[materialData.name]) {

                    const map = materials[materialData.name].map;
                    if(map !== undefined){
                        materialData.map = (await materialEngine.loadMap(map)) || undefined;
                        materialData.map = new MapData(
                            materialData.map?.image!, 
                            materialData.map?.wrapS, 
                            materialData.map?.wrapT, 
                            materialData.map?.minFilter, 
                            materialData.map?.magFilter, 
                            materialData.map?.center, 
                            materialData.map?.color, 
                            materialData.map?.offset,  
                            materialData.map?.repeat, 
                            materialData.map?.rotation, 
                            false
                        );
                    }

                    const normalMap = materials[materialData.name].normalMap;
                    if (normalMap !== undefined) {
                        materialData.normalMap = (await materialEngine.loadMap(normalMap)) || undefined;
                        materialData.normalMap = new MapData(
                            materialData.normalMap?.image!, 
                            materialData.normalMap?.wrapS, 
                            materialData.normalMap?.wrapT, 
                            materialData.normalMap?.minFilter, 
                            materialData.normalMap?.magFilter, 
                            materialData.normalMap?.center, 
                            materialData.normalMap?.color, 
                            materialData.normalMap?.offset,  
                            materialData.normalMap?.repeat, 
                            materialData.normalMap?.rotation, 
                            false
                        );
                    }

                    const aoMap = materials[materialData.name].aoMap;
                    if (aoMap !== undefined) {
                        materialData.aoMap = (await materialEngine.loadMap(aoMap)) || undefined;
                        materialData.aoMap = new MapData(
                            materialData.aoMap?.image!, 
                            materialData.aoMap?.wrapS, 
                            materialData.aoMap?.wrapT, 
                            materialData.aoMap?.minFilter, 
                            materialData.aoMap?.magFilter, 
                            materialData.aoMap?.center, 
                            materialData.aoMap?.color, 
                            materialData.aoMap?.offset,  
                            materialData.aoMap?.repeat, 
                            materialData.aoMap?.rotation, 
                            false
                        );
                    }

                    if(transmissionInput.checked) {

                    } else {
                        materialData.transmission = 0;

                        const opacity = materials[materialData.name].opacity;
                        if(opacity !== undefined) 
                            materialData.opacity = opacity;

                        const alphaMap = materials[materialData.name].alphaMap;
                        if (alphaMap !== undefined) {
                            materialData.alphaMap = (await materialEngine.loadMap(alphaMap)) || undefined;
                            materialData.alphaMap = new MapData(
                                materialData.alphaMap?.image!, 
                                materialData.alphaMap?.wrapS, 
                                materialData.alphaMap?.wrapT, 
                                materialData.alphaMap?.minFilter, 
                                materialData.alphaMap?.magFilter, 
                                materialData.alphaMap?.center, 
                                materialData.alphaMap?.color, 
                                materialData.alphaMap?.offset,  
                                materialData.alphaMap?.repeat, 
                                materialData.alphaMap?.rotation, 
                                false
                            );
                            materialData.alphaMode = MATERIAL_ALPHA.MASK
                        }
                    }
                        
                    const roughness = materials[materialData.name].roughness;
                    if(roughness !== undefined)
                        materialData.roughness = roughness;
                        
                    const metalness = materials[materialData.name].metalness;
                    if(metalness !== undefined)
                        materialData.metalness = metalness;

                    materialData.updateVersion();
                    geometryData.updateVersion();
                    node.updateVersion();
                }
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
    await viewer.camera!.set([0, 0, 0], [0, 0, 0], { duration: 0 });
    await viewer.camera!.zoomTo(undefined, { duration: 0 });
};

const createModelDropdown = () => {
    const models = Object.keys(modelMaterials);

    modelsSelect.onchange = async () => {
        if(modelsSelect.value === '28') {
            transmissionInput.checked = true;
            transmissionOption.style.visibility = 'visible'
        } else {
            transmissionInput.checked = true;
            transmissionOption.style.visibility = 'hidden'
        }
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
    const envMaps = ['ballroom', 'paul_lobe_haus', 'old_hall', 'leadenhall_market', 'sepulchral_chapel_rotunda'];
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
    viewer.environmentMap = "https://viewer.shapediver.com/v3/demos/bocci/simple/envMaps/ballroom_4k.hdr";
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

    promises.push(addGLTF("28"));
    createModelDropdown();
    createEnvironmentMapDropdown();

    await Promise.all(promises);
    viewer.show = true;

    transmissionInput.checked = true;
    transmissionInput.onchange = async () => {
        const models = Object.keys(modelMaterials);
        const id = uuidGenerator.create();
        viewer.registerBusyMode(id)
        await addGLTF(models[+modelsSelect.value]);
        viewer.deregisterBusyMode(id)
    };

})();
