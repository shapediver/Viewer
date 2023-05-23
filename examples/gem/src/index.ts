
import * as SDV from '@shapediver/viewer';
import { MaterialEngine } from '@shapediver/viewer';
import { gems, IGemMaterialProperties, IGemMaterialSettings } from './definitions';
import { createCustomUi, createParameterUi, IDropdownElement, ISliderElement, IStringElement, updateCustomUi, updateParameterUi } from './ui';

(<any>window).SDV = SDV;

const menuLeft = <HTMLDivElement>document.getElementById('menu-left');
const menuRight = <HTMLDivElement>document.getElementById('menu-right');

let session: SDV.ISessionApi;
let viewport: SDV.IViewportApi;

const materialEngine: MaterialEngine = MaterialEngine.instance;

export const updateGemMaterial = async (properties: IGemMaterialProperties) => {

    const gemMaterialProperties: SDV.IMaterialGemDataProperties = {};
    for (let p in properties) {
        if(p === 'impurityMap' && properties.impurityMap) {
            gemMaterialProperties.impurityMap = (await materialEngine.loadMap(<string>properties.impurityMap)) || undefined;
        } else {
            (<any>gemMaterialProperties[<keyof SDV.IMaterialGemDataProperties>p]) = properties[<keyof IGemMaterialProperties>p];
        }
    }

    const outputNames = ['SmallSideDiamonds', 'BigSideDiamonds', 'BigDiamond', 'Gem'];
    for(let j = 0; j < outputNames.length; j++) {
        const output = session.getOutputByName(outputNames[j]).find(o => !o.format.includes('material'));
        if(!output) continue;
        output.node!.traverse(n => {
            for(let i = 0; i < n.data.length; i++) {
                if(n.data[i] instanceof SDV.GeometryData) {
                    (<SDV.GeometryData>n.data[i]).material = new SDV.MaterialGemData(gemMaterialProperties);
                }
            }
        })
        output.node?.updateVersion();
    }

    viewport.update();
}

const update = (settings: IGemMaterialSettings) => {
    updateCustomUi(settings.properties, menuLeft);
    updateParameterUi(settings.parameters, menuRight);
}

const createInitialUi = () => {
    createCustomUi([
        <IDropdownElement>{
            tooltip: 'The environment map plays a huge role in the rendering of the gemstones. Not only does it provide additional color input, it also adds illumination. This illumination can vary depending on the map that is chosen. Therefore, it might be necessary to adapt other properties when changing the environment map (like gamma, contrast or brightness). The presets are adjusted to the "photo_studio_broadway_hall" map.',
            key: 'environmentMap',
            name: 'Environment Map',
            type: 'dropdown',
            callback: (value: string) => { 
                let tokenStart: string, tokenEnd: string, tokenCancel: string, taskID: string, busyFlag: string;
                tokenStart = SDV.addListener(SDV.EVENTTYPE.TASK.TASK_START, (e) => {
                    const taskEvent = <SDV.ITaskEvent>e;
                    if(taskEvent.type === SDV.TASK_TYPE.ENVIRONMENT_MAP_LOADING) {
                        taskID = taskEvent.id;
                        //busyFlag = viewport.addFlag(SDV.FLAG_TYPE.BUSY_MODE);
                        SDV.removeListener(tokenStart);
                    }
                })


                const endCB = (e: SDV.IEvent) => {
                    const taskEvent = <SDV.ITaskEvent>e;
                    if(taskEvent.type === SDV.TASK_TYPE.ENVIRONMENT_MAP_LOADING && taskID === taskEvent.id) {
                        viewport.update();
                        //viewport.removeFlag(busyFlag);
                        SDV.removeListener(tokenEnd);
                        SDV.removeListener(tokenCancel);
                    }
                }

                tokenEnd = SDV.addListener(SDV.EVENTTYPE.TASK.TASK_END, endCB)
                tokenCancel = SDV.addListener(SDV.EVENTTYPE.TASK.TASK_CANCEL, endCB)

                viewport.environmentMap = Object.values(SDV.ENVIRONMENT_MAP)[+value] 
            },
            choices: Object.values(SDV.ENVIRONMENT_MAP),
            value: viewport.environmentMap
        },
        <ISliderElement>{
            tooltip: 'The refraction index (or refractive index) provides information about the bending of light within the medium.',
            key: 'refractionIndex',
            name: 'Refraction Index',
            type: 'slider',
            min: 1,
            max: 4,
            step: 0.01
        },
        <IStringElement>{
            tooltip: 'The impurity map is used to simulate small imperfections. See the emerald example to see this property in use.',
            key: 'impurityMap',
            name: 'Impurity Map',
            type: 'string'
        },
        <ISliderElement>{
            tooltip: 'The impurity scale is a range that is used to control the effect of the impurity map.',
            key: 'impurityScale',
            name: 'Impurity Scale',
            type: 'slider',
            min: 0,
            max: 1,
            step: 0.01
        },
        <IStringElement>{
            tooltip: 'To simulate the color depth of gemstones, we use to color values that are interpolated depending on the depth of the tracing.',
            key: 'colorTransferBegin',
            name: 'Color Transfer Begin',
            type: 'string',
        },
        <IStringElement>{
            tooltip: 'To simulate the color depth of gemstones, we use to color values that are interpolated depending on the depth of the tracing.',
            key: 'colorTransferEnd',
            name: 'Color Transfer End',
            type: 'string',
        },
        <ISliderElement>{
            tooltip: 'Adjusts the gamma value of the gem rendering.',
            key: 'gamma',
            name: 'Gamma',
            type: 'slider',
            min: 0,
            max: 2,
            step: 0.01
        },
        <ISliderElement>{
            tooltip: 'Adjusts the contrast value of the gem rendering.',
            key: 'contrast',
            name: 'Contrast',
            type: 'slider',
            min: 0,
            max: 5,
            step: 0.01
        },
        <ISliderElement>{
            tooltip: 'Adjusts the brightness value of the gem rendering.',
            key: 'brightness',
            name: 'Brightness',
            type: 'slider',
            min: -1,
            max: 1,
            step: 0.01
        },
        <ISliderElement>{
            tooltip: 'Dispersion is a phenomenon that splits light rays into their separate color components. To simulate this, we have an approximation of dispersion. This value can be used to adjust the impact of the dispersion effect.',
            key: 'dispersion',
            name: 'Dispersion',
            type: 'slider',
            min: 0,
            max: 1,
            step: 0.01
        },
        <ISliderElement>{
            tooltip: 'In the real world, the light bounces through gem stones an infinite amount of times and splits into infinete separate rays. As this is not possible for us we have a fixed tracing depth that can be adjusted.',
            key: 'tracingDepth',
            name: 'Tracing Depth',
            type: 'slider',
            min: 1,
            max: 10,
            step: 1
        },
        <ISliderElement>{
            tooltip: 'To adjust the opacity of the stone, this value can be used. The overall opacity is still affected by the probability of the incident refraction, but this value can be used to have influence on it.',
            key: 'tracingOpacity',
            name: 'Tracing Opacity',
            type: 'slider',
            min: 0,
            max: 1,
            step: 0.01
        },
    ], menuLeft);

    createCustomUi([
        <ISliderElement>{
            name: 'Auto Rotation Speed',
            type: 'slider',
            min: -10,
            max: 10,
            step: 0.1,            
            value: (<SDV.IPerspectiveCameraApi>viewport.camera).autoRotationSpeed,
            callback: (value: string) => { 
                (<SDV.IPerspectiveCameraApi>viewport.camera).autoRotationSpeed = +value;
            }
        },
        <IDropdownElement>{
            name: 'Presets',
            type: 'dropdown',
            callback: (value: string) => {
                update(Object.values(gems)[+value])
            },
            choices: Object.keys(gems),
            value: 'Diamond'
        }
    ], menuRight);

    createParameterUi(session, menuRight)
    update(gems['Diamond'])
}

(async () => {
    viewport = await SDV.createViewport({
        id: 'myViewport',
        canvas: <HTMLCanvasElement>document.getElementById('canvas'),
        branding: {
            backgroundColor: '#374151'
        }
    })
    session = await SDV.createSession({
        id: 'mySession',
        ticket: 'ea66dc0152131834e00b9afdace2c5f455b5eb930a69f71c3a0b25da8c9326e70f2a8b5a87e177c7ded8803375c8101b313e49b5ddba74100b9097a8598355a804e0454747e0b4d3b339078b7d6a29c9fc48e4be2bb79833c3106dcfabd5fd9ebb8fc1d5348ea7-e014782bb8b8d7cc01ed94600b2342e6',
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com'
    });

    viewport.clearColor = "#374151"

    createInitialUi();
    viewport.camera!.zoomTo();
})();