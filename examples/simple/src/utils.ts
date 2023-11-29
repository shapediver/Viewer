import {
    addListener,
    DataEngine,
    ENVIRONMENT_MAP,
    EVENTTYPE,
    FLAG_TYPE,
    GeometryData,
    ITaskEvent,
    ITreeNode,
    IViewportApi,
    MaterialStandardData,
    MATERIAL_ALPHA,
    MATERIAL_SIDE,
    sceneTree,
    TASK_TYPE
} from '@shapediver/viewer';
import {
    createCustomUi,
    IBooleanElement,
    IColorElement,
    IDropdownElement,
    ISliderElement,
    IStringElement
} from '@shapediver/viewer.shared.demo-helper';

import { XMLParser } from 'fast-xml-parser';
import { modelOptions, viewport } from '.';
import { Converter } from '@shapediver/viewer.shared.services';

const dataEngine: DataEngine = DataEngine.instance;

let materialMenus: HTMLDivElement[] = [];
let pendantNode: ITreeNode;
let pendantGroupIndex = 0;
let colorIndex = 0;
let variationIndex = 0;

(<any>ENVIRONMENT_MAP).FOOTPRINT_COURT = 'https://viewer.shapediver.com/v3/envmaps/2k/footprintCourt_2k.hdr';


export type Option = {
    value: string;
    label: string;
    timestamp: string;
};

type Content = {
    Key: string;
    LastModified: string;
    Size: number;
    Type: string;
    StorageClass: string;
    Owner: {
        ID: number;
        DisplayName: number;
    };
};
let currentOption: Option;

const URL = 'https://bocci.sfo3.digitaloceanspaces.com';
const pattern = /^configurator\/models\/pendants\/((?:[0-9a-z-]+\/)+)([0-9a-z_-]+)\.gltf$/i;

const getAllKeys = (url) => {
    const allKeys = [];
    function fetchKeys(marker) {
        let apiUrl = url;
        if (marker) {
            apiUrl += `?prefix=configurator/models/&marker=${marker}`;
        }
        return fetch(apiUrl)
            .then((res) => res.text())
            .then((data) => new XMLParser().parse(data))
            .then((data) => {
                const contents = data.ListBucketResult.Contents as Content[];
                allKeys.push(...contents);
                const nextMarker = data.ListBucketResult.NextMarker;
                if (nextMarker) {
                    return fetchKeys(nextMarker);
                }
                return allKeys;
            });
    }
    return fetchKeys(null);
};

export const fetchPendants = (): Promise<Option[]> => {
    return getAllKeys(URL).then(contents => {
        return contents
            .filter((item) => pattern.test(item.Key))
            .map((content): Option => {
                const contentResult = pattern.exec(content.Key)!;
        
                return {
                    label: `${contentResult[0]}`,
                    value: `${URL}/${content.Key}`,
                    timestamp: `${content.LastModified}`
                };
            })
            .sort((a, b) => a.label.localeCompare(b.label));
    });
};

type MaterialSettings = {
    [key: string]: {
        [key: string]: {
            alphaMode?: MATERIAL_ALPHA,
            color?: string,
            ior?: number,
            thickness?: number,
            opacity?: number,
            metalness?: number,
            roughness?: number,
            transmission?: number,
            normalScale?: number,
            emissiveness?: string,
        }
    }
}

let materialSettings: MaterialSettings = require('./materialSettings.json');

const jsonUpload = document.getElementById('materialJsonUpload') as HTMLInputElement;
jsonUpload.oninput = (e) => {
    // Exit if no files selected
    if (!jsonUpload.files) return;

    const file = jsonUpload.files[0];
    const reader = new FileReader();
    reader.addEventListener('load', async () => {
        materialSettings = JSON.parse(<string>reader.result);
        addGLTF(currentOption);
    });
    reader.readAsText(file);
};

const jsonDownload = document.getElementById('materialJsonDownload') as HTMLInputElement;
jsonDownload.onclick = (e) => {
    const data = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(materialSettings, null, 2));
    const a = document.createElement('a');
    a.href = 'data:' + data;
    a.download = 'materialSettings.json';
    a.click();
};


/**
 * Create the material menus.
 * For every material that can be found, a new entry is created that enables the editing of the alpha blending and side options.
 * More can be added in the future.
 *
 * @returns
 */
export const createMaterialMenu = (option: Option) => {
    if (!pendantNode) return;

    const materials: {
        node: ITreeNode;
        materialData: MaterialStandardData;
        geometryData: GeometryData;
    }[] = [];

    // read out all new materials and store them into the array
    const getGeometries = async (node: ITreeNode) => {
        for (let i = 0; i < node.data.length; i++) {
            if (node.data[i] instanceof GeometryData) {
                const geometryData = <GeometryData>node.data[i];
                const materialData = <MaterialStandardData>(
                    geometryData.material
                );
                if (!materialData) continue;
                if (
                    materialData.name &&
                    materials.find((m) => m.materialData.name === materialData.name)
                )
                    continue;
                materials.push({
                    node,
                    materialData,
                    geometryData
                });
            }
        }

        for (let i = 0; i < node.children.length; i++)
            getGeometries(node.children[i]);
    };
    getGeometries(pendantNode);

    const menuDiv = document.getElementById('menu') as HTMLDivElement;

    // add a menu item for all materials in the array
    for (let i = 0; i < materials.length; i++) {
        const materialMenuDiv = document.createElement('div');
        materialMenus.push(materialMenuDiv);
        menuDiv.appendChild(materialMenuDiv);

        const h6 = document.createElement('h6');
        h6.classList.value = 'text-lg font-bold dark:text-white';
        h6.innerText = materials[i].materialData.name || 'Material ' + i;

        materialMenuDiv.appendChild(h6);

        let cleanedLabel = option.label;
        if (cleanedLabel.includes('_Z-')) {
            const extensionIndex = cleanedLabel.indexOf('.gltf');
            const radiusIndex = cleanedLabel.indexOf('_Z-');
            cleanedLabel = cleanedLabel.substring(0, radiusIndex) + cleanedLabel.substring(extensionIndex);
        }

        if (cleanedLabel.includes('configurator/models/pendants/')) {
            cleanedLabel = cleanedLabel.replace('configurator/models/pendants/', 'configurator/');
        }

        if (materialSettings[cleanedLabel]) {
            const settings = materialSettings[cleanedLabel][materials[i].materialData.name || ''];

            if (settings) {
                if (settings.alphaMode !== undefined)
                    materials[i].materialData.alphaMode = settings.alphaMode;

                if (settings.color !== undefined)
                    materials[i].materialData.color = settings.color;

                if (settings.ior !== undefined)
                    materials[i].materialData.ior = settings.ior;

                if (settings.thickness !== undefined)
                    materials[i].materialData.thickness = settings.thickness;

                if (settings.opacity !== undefined)
                    materials[i].materialData.opacity = settings.opacity;
                    
                if (settings.metalness !== undefined)
                    materials[i].materialData.metalness = settings.metalness;
                
                if (settings.roughness !== undefined)
                    materials[i].materialData.roughness = settings.roughness;
                    
                if (settings.transmission !== undefined)
                    materials[i].materialData.transmission = settings.transmission;
                 
                if (settings.normalScale !== undefined)
                    materials[i].materialData.normalScale = settings.normalScale;
                    
                if (settings.emissiveness !== undefined)
                    materials[i].materialData.emissiveness = settings.emissiveness;

                materials[i].materialData.updateVersion();
                materials[i].geometryData.updateVersion();
                materials[i].node.updateVersion();
            }
        }

        

        // const SRGBToLinear = (c) => {

        //     return (c < 0.04045) ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4);

        // }

        // const LinearToSRGB = (c) => {

        //     return (c < 0.0031308) ? c * 12.92 : 1.055 * (Math.pow(c, 0.41666)) - 0.055;

        // }

        // if(Array.isArray(materials[i].materialData.color)) {
        //     const color = materials[i].materialData.color as number[];
        //     (materials[i].materialData.color as number[])[0] = LinearToSRGB(color[0]/255.0)*255.0;
        //     (materials[i].materialData.color as number[])[1] = LinearToSRGB(color[1]/255.0)*255.0;
        //     (materials[i].materialData.color as number[])[2] = LinearToSRGB(color[2]/255.0)*255.0;
        // } else if(typeof materials[i].materialData.color === "string") {
        //     // materials[i].materialData.color = [1.055 * (Math.pow(1, 0.41666)) - 0.055, 1.055 * (Math.pow(1, 0.41666)) - 0.055,1.055 * (Math.pow(1, 0.41666)) - 0.055]
        // }

        createCustomUi(
            [
                <IDropdownElement>{
                    choices: Object.values(MATERIAL_ALPHA),
                    value: Object.values(MATERIAL_ALPHA).indexOf(materials[i].materialData.alphaMode),
                    name: 'Material Alpha Mode',
                    type: 'dropdown',
                    onInputCallback: (value: any) => { },
                    onChangeCallback: async (value: any) => {
                        if (!materialSettings[cleanedLabel])
                            materialSettings[cleanedLabel] = {};
                        if (!materialSettings[cleanedLabel][materials[i].materialData.name!])
                            materialSettings[cleanedLabel][materials[i].materialData.name!] = {};
                        materialSettings[cleanedLabel][materials[i].materialData.name!].alphaMode = Object.values(MATERIAL_ALPHA)[value];

                        materials[i].materialData.alphaMode = Object.values(MATERIAL_ALPHA)[value];
                        materials[i].materialData.updateVersion();
                        materials[i].geometryData.updateVersion();
                        materials[i].node.updateVersion();
                    }
                },
                <IColorElement>{
                    value: Converter.instance.toThreeJsColorInput(materials[i].materialData.color),
                    name: 'Material Color',
                    type: 'color',
                    onInputCallback: (value: any) => { },
                    onChangeCallback: async (value: any) => {
                        if (!materialSettings[cleanedLabel])
                            materialSettings[cleanedLabel] = {};
                        if (!materialSettings[cleanedLabel][materials[i].materialData.name!])
                            materialSettings[cleanedLabel][materials[i].materialData.name!] = {};
                        materialSettings[cleanedLabel][materials[i].materialData.name!].color = value;

                        materials[i].materialData.color = value;
                        materials[i].materialData.updateVersion();
                        materials[i].geometryData.updateVersion();
                        materials[i].node.updateVersion();
                    }
                },
                <ISliderElement>{
                    value: materials[i].materialData.ior,
                    name: 'Material IOR',
                    type: 'slider',
                    min: 1.0,
                    max: 4.0,
                    step: 0.001,
                    onInputCallback: (value: any) => {
                        if (!materialSettings[cleanedLabel])
                            materialSettings[cleanedLabel] = {};
                        if (!materialSettings[cleanedLabel][materials[i].materialData.name!])
                            materialSettings[cleanedLabel][materials[i].materialData.name!] = {};
                        materialSettings[cleanedLabel][materials[i].materialData.name!].ior = +value;

                        materials[i].materialData.ior = +value;
                        materials[i].materialData.updateVersion();
                        materials[i].geometryData.updateVersion();
                        materials[i].node.updateVersion();
                    },
                    onChangeCallback: async (value: any) => { }
                },
                <ISliderElement>{
                    value: materials[i].materialData.thickness,
                    name: 'Material Thickness',
                    type: 'slider',
                    min: 0,
                    max: 1.0,
                    step: 0.001,
                    onInputCallback: (value: any) => {
                        if (!materialSettings[cleanedLabel])
                            materialSettings[cleanedLabel] = {};
                        if (!materialSettings[cleanedLabel][materials[i].materialData.name!])
                            materialSettings[cleanedLabel][materials[i].materialData.name!] = {};
                        materialSettings[cleanedLabel][materials[i].materialData.name!].thickness = +value;

                        materials[i].materialData.thickness = +value;
                        materials[i].materialData.updateVersion();
                        materials[i].geometryData.updateVersion();
                        materials[i].node.updateVersion();
                    },
                    onChangeCallback: async (value: any) => { }
                },
                <ISliderElement>{
                    value: materials[i].materialData.opacity,
                    name: 'Material Opacity',
                    type: 'slider',
                    min: 0,
                    max: 1.0,
                    step: 0.001,
                    onInputCallback: (value: any) => {
                        if (!materialSettings[cleanedLabel])
                            materialSettings[cleanedLabel] = {};
                        if (!materialSettings[cleanedLabel][materials[i].materialData.name!])
                            materialSettings[cleanedLabel][materials[i].materialData.name!] = {};
                        materialSettings[cleanedLabel][materials[i].materialData.name!].opacity = +value;

                        materials[i].materialData.opacity = +value;
                        materials[i].materialData.updateVersion();
                        materials[i].geometryData.updateVersion();
                        materials[i].node.updateVersion();
                    },
                    onChangeCallback: async (value: any) => { }
                },
                <ISliderElement>{
                    value: materials[i].materialData.metalness,
                    name: 'Material Metalness',
                    type: 'slider',
                    min: 0,
                    max: 1.0,
                    step: 0.001,
                    onInputCallback: (value: any) => {
                        if (!materialSettings[cleanedLabel])
                            materialSettings[cleanedLabel] = {};
                        if (!materialSettings[cleanedLabel][materials[i].materialData.name!])
                            materialSettings[cleanedLabel][materials[i].materialData.name!] = {};
                        materialSettings[cleanedLabel][materials[i].materialData.name!].metalness = +value;

                        materials[i].materialData.metalness = +value;
                        materials[i].materialData.updateVersion();
                        materials[i].geometryData.updateVersion();
                        materials[i].node.updateVersion();
                    },
                    onChangeCallback: async (value: any) => { }
                },
                <ISliderElement>{
                    value: materials[i].materialData.roughness,
                    name: 'Material Roughness',
                    type: 'slider',
                    min: 0,
                    max: 1.0,
                    step: 0.001,
                    onInputCallback: (value: any) => {
                        if (!materialSettings[cleanedLabel])
                            materialSettings[cleanedLabel] = {};
                        if (!materialSettings[cleanedLabel][materials[i].materialData.name!])
                            materialSettings[cleanedLabel][materials[i].materialData.name!] = {};
                        materialSettings[cleanedLabel][materials[i].materialData.name!].roughness = +value;

                        materials[i].materialData.roughness = +value;
                        materials[i].materialData.updateVersion();
                        materials[i].geometryData.updateVersion();
                        materials[i].node.updateVersion();
                    },
                    onChangeCallback: async (value: any) => { }
                },
                <ISliderElement>{
                    value: materials[i].materialData.transmission,
                    name: 'Material Transmission',
                    type: 'slider',
                    min: 0,
                    max: 1.0,
                    step: 0.001,
                    onInputCallback: (value: any) => {
                        if (!materialSettings[cleanedLabel])
                            materialSettings[cleanedLabel] = {};
                        if (!materialSettings[cleanedLabel][materials[i].materialData.name!])
                            materialSettings[cleanedLabel][materials[i].materialData.name!] = {};
                        materialSettings[cleanedLabel][materials[i].materialData.name!].transmission = +value;

                        materials[i].materialData.transmission = +value;
                        materials[i].materialData.updateVersion();
                        materials[i].geometryData.updateVersion();
                        materials[i].node.updateVersion();
                    },
                    onChangeCallback: async (value: any) => { }
                },
                <ISliderElement>{
                    value: materials[i].materialData.normalScale,
                    name: 'Material Normal Scale',
                    type: 'slider',
                    min: 0,
                    max: 1.0,
                    step: 0.001,
                    onInputCallback: (value: any) => {
                        if (!materialSettings[cleanedLabel])
                            materialSettings[cleanedLabel] = {};
                        if (!materialSettings[cleanedLabel][materials[i].materialData.name!])
                            materialSettings[cleanedLabel][materials[i].materialData.name!] = {};
                        materialSettings[cleanedLabel][materials[i].materialData.name!].normalScale = +value;

                        materials[i].materialData.normalScale = +value;
                        materials[i].materialData.updateVersion();
                        materials[i].geometryData.updateVersion();
                        materials[i].node.updateVersion();
                    },
                    onChangeCallback: async (value: any) => { }
                },
                <IColorElement>{
                    value: Converter.instance.toThreeJsColorInput(materials[i].materialData.emissiveness),
                    name: 'Emissiveness',
                    type: 'color',
                    onInputCallback: (value: any) => { },
                    onChangeCallback: async (value: any) => {
                        if (!materialSettings[cleanedLabel])
                            materialSettings[cleanedLabel] = {};
                        if (!materialSettings[cleanedLabel][materials[i].materialData.name!])
                            materialSettings[cleanedLabel][materials[i].materialData.name!] = {};
                        materialSettings[cleanedLabel][materials[i].materialData.name!].emissiveness = value;

                        materials[i].materialData.emissiveness = value;
                        materials[i].materialData.updateVersion();
                        materials[i].geometryData.updateVersion();
                        materials[i].node.updateVersion();
                    }
                },
            ],
            materialMenuDiv as HTMLDivElement
        );
    }
};

/**
 * Add a new gltf to the scene and create a material menu for it.
 *
 * @param url
 */
export const addGLTF = async (option: Option) => {
    currentOption = option;
    if (pendantNode) sceneTree.removeNode(pendantNode);

    const menuDiv = document.getElementById('menu') as HTMLDivElement;
    for (let i = 0; i < materialMenus.length; i++)
        menuDiv.removeChild(materialMenus[i]);

    materialMenus = [];

    pendantNode = await dataEngine.loadContent({
        format: 'gltf',
        href: option.value
    });

    createMaterialMenu(option);

    sceneTree.addNode(pendantNode);
    sceneTree.root.updateVersion();
    viewport.update();
    viewport.camera!.zoomToFactor = 2;
    await viewport.camera!.zoomTo(sceneTree.root.boundingBox);
};

const createMainMenu = async (mainMenuDiv: HTMLDivElement, colors: string[], variations: string[]) => {

    while(mainMenuDiv.firstChild)
        mainMenuDiv.removeChild(mainMenuDiv.firstChild);
    
    const h6 = document.createElement('h6');
    h6.classList.value = 'text-lg font-bold dark:text-white';
    h6.innerText = 'Main Settings';

    mainMenuDiv.appendChild(h6);

    createCustomUi(
        [
            <IDropdownElement>{
                choices: Object.keys(modelOptions),
                value: pendantGroupIndex,
                name: 'Pendant Type',
                type: 'dropdown',
                onInputCallback: (value: any) => { },
                onChangeCallback: async (value: any) => {
                    pendantGroupIndex = value;
                    colorIndex = 0;
                    variationIndex = 0;
                    await createMainMenu(
                        mainMenuDiv, 
                        Object.keys(Object.values(modelOptions)[pendantGroupIndex]), 
                        Object.keys(Object.values(Object.values(modelOptions)[pendantGroupIndex])[0])
                    );
                }
            },
            <IDropdownElement>{
                choices: colors,
                value: colorIndex,
                name: 'Color',
                type: 'dropdown',
                onInputCallback: (value: any) => { },
                onChangeCallback: async (value: any) => {
                    colorIndex = value;
                    variationIndex = 0;
                    await createMainMenu(
                        mainMenuDiv, 
                        Object.keys(Object.values(modelOptions)[pendantGroupIndex]), 
                        Object.keys(Object.values(Object.values(modelOptions)[pendantGroupIndex])[colorIndex])
                    );
                }
            },
            <IDropdownElement>{
                choices: variations,
                value: variationIndex,
                name: 'Variation',
                type: 'dropdown',
                onInputCallback: (value: any) => { },
                onChangeCallback: async (value: any) => {
                    variationIndex = value;
                    await createMainMenu(
                        mainMenuDiv, 
                        Object.keys(Object.values(modelOptions)[pendantGroupIndex]), 
                        Object.keys(Object.values(Object.values(modelOptions)[pendantGroupIndex])[colorIndex])
                    );
                }
            },
            <IDropdownElement>{
                choices: (Object.values(Object.values(Object.values(modelOptions)[pendantGroupIndex])[colorIndex])[variationIndex]).map(o => o.label.replace('configurator/models/pendants/', '')),
                value: 0,
                name: 'Models',
                type: 'dropdown',
                onInputCallback: (value: any) => { },
                onChangeCallback: async (value: any) => {
                    const option = (Object.values(Object.values(Object.values(modelOptions)[pendantGroupIndex])[colorIndex])[variationIndex])[value];

                    const token = viewport.addFlag(FLAG_TYPE.BUSY_MODE);
                    console.log(option.label, option.value);
                    await addGLTF(option);
                    viewport.removeFlag(token);
                }
            },
            <IStringElement>{
                value: '',
                name: 'Direct GLTF Link',
                type: 'string',
                onInputCallback: (value: any) => { },
                onChangeCallback: async (value: any) => {
                    const token = viewport.addFlag(FLAG_TYPE.BUSY_MODE);
                    try {
                        await addGLTF(value);
                    } catch (e) {

                    } finally {
                        viewport.removeFlag(token);
                    }
                }
            },
            <IDropdownElement>{
                choices: Object.values(ENVIRONMENT_MAP),
                value: Object.values(ENVIRONMENT_MAP).indexOf(ENVIRONMENT_MAP.NEUTRAL),
                name: 'Environment Map',
                type: 'dropdown',
                onInputCallback: (value: any) => { },
                onChangeCallback: async (value: any) => {
                    const token = viewport.addFlag(FLAG_TYPE.BUSY_MODE);
                    const promise = new Promise<void>((resolve) => {
                        addListener(EVENTTYPE.TASK.TASK_END, (e) => {
                            const taskEvent = e as ITaskEvent;
                            if (taskEvent.type === TASK_TYPE.ENVIRONMENT_MAP_LOADING)
                                resolve();
                        });
                    });
                    viewport.environmentMap = Object.values(ENVIRONMENT_MAP)[value];
                    await promise;
                    viewport.removeFlag(token);
                }
            },
            <IBooleanElement>{
                value: false,
                name: 'View Environment Map',
                type: 'boolean',
                onInputCallback: (value: any) => { },
                onChangeCallback: async (value: any) => {
                    viewport.environmentMapAsBackground = value;
                }
            },
            <IColorElement>{
                value: '#efefef',
                name: 'Background Color',
                type: 'color',
                onInputCallback: (value: any) => { },
                onChangeCallback: async (value: any) => {
                    viewport.clearColor = value;
                }
            }
        ],
        mainMenuDiv as HTMLDivElement
    );

    // loading of first model in the current dropdown structure
    {
        const option = (Object.values(Object.values(Object.values(modelOptions)[pendantGroupIndex])[colorIndex])[variationIndex])[0];
        const token = viewport.addFlag(FLAG_TYPE.BUSY_MODE);
        console.log(option.label, option.value);
        await addGLTF(option);
        viewport.removeFlag(token);
    }
};

/**
 * Create the main menu with options for selecting models,
 * environment maps, viewing the environment map and the background color.
 *
 */
export const createMenu = () => {
    const menuDiv = document.getElementById('menu') as HTMLDivElement;

    const mainMenuDiv = document.createElement('div');
    menuDiv.appendChild(mainMenuDiv);

    createMainMenu(mainMenuDiv, Object.keys(Object.values(modelOptions)[0]), Object.keys(Object.values(Object.values(modelOptions)[0])[0]));
};
