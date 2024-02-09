import * as SDV from '@shapediver/viewer';
import {
    AngularRestrictionApi,
    createDrawingTools,
    CustomizationProperties,
    GridRestrictionApi,
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
            '0e23ddb1ac28dc00550d435ea4f16ec440a369212d548852fa93f98ebcd1ad76f05982af1dabfceceb7bca7dbab3404c50f1a21d889041b9934f55db552051d30950929259e34e2da5e963551c5a76e263487f6d5a3b4f45f5400173131fbbb37ced0a1b52b5c7-7138e13ae43f7322267ce34373e43519',
        modelViewUrl: 'https://sdr7euc1.eu-central-1.shapediver.com',
        id: 'mySession',
        initialParameterValues: {
            'points': JSON.stringify({ points: [] })
        }
    });

    const json = { points: [[494.7, 354.3, 0.0], [488.9, 420.7, 0.0], [556.9, 422.9, 0.0], [557.2, 363.7, 0.0]] };
    const defaultPoints: number[][] = json.points;
    // calculate the center of the points
    const center = defaultPoints.reduce((acc, val) => [acc[0] + val[0], acc[1] + val[1], acc[2] + val[2]], [0, 0, 0]).map(val => val / defaultPoints.length) as vec3;

    const customizationProperties: CustomizationProperties = {
        visualizationOptions: {
            points: {
                map_0: texture,
                map_1: texture_0,
                map_2: texture,
                map_3: texture_0,
                size_0: 15,
                size_1: 15,
                size_2: 20,
                size_3: 20,
                color_0: '#0d44f0',
                color_1: '#9e27d8',
                color_2: '#197aeb',
                color_3: '#bc47fd',
                sizeAttenuation_0: false,
                sizeAttenuation_1: false,
                sizeAttenuation_2: false,
                sizeAttenuation_3: false,
            },
            lines: {
                color: '#0d44f0'
            }
        },
        geometry: {
            mode: SDV.PRIMITIVE_MODE.LINES
        },
        restrictions: {
            grid: { gridSize: 100, gridUnit: 1, origin: center, normal: vec3.fromValues(0, 0, 1) },
            plane: { gridSize: 100, origin: center, normal: vec3.fromValues(0, 0, 1) },
            angular: { angleStep: Math.PI / 8, normal: vec3.fromValues(0, 0, 1) }
        },
        controls: {
            insert: 'Ctrl',
            delete: 'Shift',
            finish: 'Enter',
            cancel: 'Escape'
        }
    };

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
        await session.customize();
    };

    const sessionCallback = () => {
        const drawingToolsApi = createDrawingTools(viewport, drawingToolsCallback, customizationProperties);

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

    session.updateCallback = sessionCallback;
    // call once to initialize the drawing tool
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
