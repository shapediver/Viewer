import * as SDV from '@shapediver/viewer';
import {
    AngularRestrictionApi,
    createDrawingTools,
    CustomizationProperties,
    GridRestrictionApi,
    IDrawingToolsApi,
    PlaneRestrictionApi
} from '@shapediver/viewer.features.drawing-tools';
import { createCustomUi, IBooleanElement, ISliderElement } from '@shapediver/viewer.shared.demo-helper';
import { vec3 } from 'gl-matrix';
(<any>window).SDV = SDV;

(async () => {
    const texture = (await SDV.MaterialEngine.instance.loadMap('https://viewer.shapediver.com/v3/graphics/point_soft.png'))!;
    const texture_0 = (await SDV.MaterialEngine.instance.loadMap('https://viewer.shapediver.com/v3/graphics/point_soft_v2.png'))!;

    // create a viewport
    const viewport = await SDV.createViewport({
        canvas: document.getElementById('canvas') as HTMLCanvasElement,
        id: 'myViewport'
    });
    // create a session
    const session = await SDV.createSession({
        ticket:
            '0ce71edda5e3dd290727d996da946ef4b5c8c6ff9ec96050da199baca167755d200a0787b708845f0736a2c46976de010b99a9a7ee9ac23afcd60b0f75a15be63ea16ce5a1a3fcfb465128b23d143e0811be3fe5880d6058d6ab94d50e7cb04bed76b3233f5b3f-8e85641a609edc1bc2b59bf7bfbc5a37',
        modelViewUrl: 'https://sdr7euc1.eu-central-1.shapediver.com',
        id: 'mySession',
    });

    // get the output for the drawing tools options
    const drawingToolsOptions = session.getOutputByName('DrawingToolsOptions')[0];
    console.log(drawingToolsOptions.content![0].data)
    const customizationProperties: CustomizationProperties = JSON.parse(drawingToolsOptions.content![0].data);
    console.log(customizationProperties)

    /**
     * Callback function for the drawing tool
     * executed when the drawing tool is finished
     * 
     * @param geometryData 
     */
    const drawingToolsCallback = async (geometryData: SDV.IGeometryData) => {
        const positionArray = geometryData.primitive.attributes['POSITION'].array;

        // get all points
        const points = [];
        for (let i = 0; i < positionArray.length; i += 3) {
            points.push([positionArray[i], positionArray[i + 1], positionArray[i + 2]]);
        }

        session.getParameterByName('points')[0].value = JSON.stringify({ points: points });
        await session.customize(undefined, undefined, true);

        sessionCallback();
    };

    let drawingToolsApi: IDrawingToolsApi | undefined;
    const sessionCallback = async () => {
        if(drawingToolsApi) drawingToolsApi.close();
        SDV.sceneTree.root.updateVersion();
        viewport.update();

        
        drawingToolsApi = createDrawingTools(viewport, drawingToolsCallback, customizationProperties);

        /**
         * 
         * RESTRICTION UI
         * 
         */

        const planeRestrictionApi = Object.values(drawingToolsApi.restrictions).find(restriction => restriction instanceof PlaneRestrictionApi)! as PlaneRestrictionApi;
        const gridRestrictionApi = Object.values(drawingToolsApi.restrictions).find(restriction => restriction instanceof GridRestrictionApi)! as GridRestrictionApi;
        const angularRestrictionApi = Object.values(drawingToolsApi.restrictions).find(restriction => restriction instanceof AngularRestrictionApi)! as AngularRestrictionApi;

        const menuDiv = document.createElement('div');
        menuDiv.style.position = 'absolute';
        menuDiv.style.top = '1rem';
        menuDiv.style.left = '1rem';
        menuDiv.style.zIndex = '100';
        document.body.appendChild(menuDiv);

        createCustomUi([
            <IBooleanElement>{
                name: 'show point labels',
                type: 'boolean',
                value: true,
                onInputCallback: (value: boolean) => {
                    drawingToolsApi!.showPointLabels = value;
                }
            },
            <IBooleanElement>{
                name: 'show distance labels',
                type: 'boolean',
                value: true,
                onInputCallback: (value: boolean) => {
                    drawingToolsApi!.showDistanceLabels = value;
                }
            },
            <IBooleanElement>{
                name: 'grid',
                type: 'boolean',
                value: true,
                onInputCallback: (value: boolean) => {
                    gridRestrictionApi.enabled = value;
                }
            },
            <ISliderElement>{
                name: 'grid unit',
                type: 'slider',
                value: 1,
                min: 0.1,
                max: 10,
                step: 0.1,
                onInputCallback: (value: string) => {
                    gridRestrictionApi.gridUnit = +value;
                }
            },
            <ISliderElement>{
                name: 'grid size',
                type: 'slider',
                value: 100,
                min: 10,
                max: 10000,
                step: 10,
                onInputCallback: (value: string) => {
                    gridRestrictionApi.gridSize = +value;
                }
            },
            <IBooleanElement>{
                name: 'angular',
                type: 'boolean',
                label: 'Show Points',
                value: true,
                onInputCallback: (value: boolean) => {
                    angularRestrictionApi.enabled = value;
                }
            },
            <ISliderElement>{
                name: 'angle step',
                type: 'slider',
                value: 8,
                min: 1,
                max: 16,
                step: 1,
                onInputCallback: (value: string) => {
                    angularRestrictionApi.angleStep = Math.PI / +value;
                }
            },
        ], menuDiv);
    };

    sessionCallback();

    /**
     * 
     * CAMERA SWITCH
     * 
     */

    const imgCameraSwitch = document.createElement('img');
    imgCameraSwitch.src = 'https://viewer.shapediver.com/v3/graphics/cameraswitch.svg';
    imgCameraSwitch.width = 50;
    imgCameraSwitch.height = 50;
    imgCameraSwitch.style.position = 'absolute';
    imgCameraSwitch.style.right = '1rem';
    imgCameraSwitch.style.top = '1rem';
    imgCameraSwitch.onclick = async () => {
        if (viewport.camera?.type === SDV.CAMERA_TYPE.PERSPECTIVE) {
            viewport.assignCamera('top');
        } else {
            viewport.assignCamera('perspective');
        }
    };
    document.body.appendChild(imgCameraSwitch);

})();
