import * as SDV from '@shapediver/viewer';
import {
    createDrawingTools,
    IDrawingToolsApi,
    PlaneRestrictionApi,
    PointsData,
    Settings
} from '@shapediver/viewer.features.drawing-tools';
import { createCustomUi, IBooleanElement, ISliderElement } from '@shapediver/viewer.shared.demo-helper';
(<any>window).SDV = SDV;

(async () => {
    // create a viewport
    const viewport = await SDV.createViewport({
        canvas: document.getElementById('canvas') as HTMLCanvasElement,
        id: 'myViewport'
    });
    // create a session
    const session = await SDV.createSession({
        ticket:
            '1b3d8bb58b502ee9e1cec2f36225b2b282afeaeef871dcbe8b0314d9acc198bf5436dde29d6a9b74a21002bb4fcffd58df3df697778ae4f617f72a3deb663568ee8f8b2c75dc2546d3386b28faa7ac9e96f1c1b9bd4676b83730be1d048dcd1c12e7d5e5575384-503f0b37ca9351b13ac048de37f43f66',
        modelViewUrl: 'https://sdr7euc1.eu-central-1.shapediver.com',
        id: 'mySession',
    });

    const pointsParameter = session.getParameterByName('points')[0];

    // get the output for the drawing tools options
    const customizationProperties: Settings = session.getOutputByName('DrawingToolsOptions')[0].content![0].data as Settings;
    console.log(customizationProperties);

    /**
     * Callback function for the drawing tool
     * executed when the drawing tool is finished
     * 
     * @param geometryData 
     */
    const onUpdate = async (pointsData: PointsData) => {
        console.log('Drawing tools updated');

        pointsParameter.value = JSON.stringify({ "points": pointsData });
        await session.customize();

    };

    const onCancel = () => {
        console.log('Drawing tools cancelled');

        // remove ui
        const menuDiv = document.getElementById('menu');
        if (menuDiv) {
            menuDiv.remove();
        }
    };

    const onFinish = async (pointsData: PointsData) => {
        onUpdate(pointsData);
        onCancel();
    };


    const drawingToolsApi: IDrawingToolsApi | undefined = createDrawingTools(viewport, { onUpdate, onCancel, onFinish }, customizationProperties);

    /**
     * 
     * RESTRICTION UI
     * 
     */
    const planeRestrictionApi = drawingToolsApi.restrictions['plane'] as PlaneRestrictionApi;

    const menuDiv = document.createElement('div');
    menuDiv.id = 'menu';
    menuDiv.style.position = 'absolute';
    menuDiv.style.top = '4rem';
    menuDiv.style.left = '1rem';
    menuDiv.style.zIndex = '100';
    document.body.appendChild(menuDiv);

    createCustomUi([
        <IBooleanElement>{
            name: 'show point labels',
            type: 'boolean',
            value: drawingToolsApi!.showPointLabels,
            onInputCallback: (value: boolean) => {
                drawingToolsApi!.showPointLabels = value;
            }
        },
        <IBooleanElement>{
            name: 'show distance labels',
            type: 'boolean',
            value: drawingToolsApi!.showDistanceLabels,
            onInputCallback: (value: boolean) => {
                drawingToolsApi!.showDistanceLabels = value;
            }
        },
        <IBooleanElement>{
            name: 'grid',
            type: 'boolean',
            value: planeRestrictionApi.gridRestrictionApi.enabled,
            onInputCallback: (value: boolean) => {
                planeRestrictionApi.gridRestrictionApi.enabled = value;
            }
        },
        <ISliderElement>{
            name: 'grid unit',
            type: 'slider',
            value: planeRestrictionApi.gridRestrictionApi.gridUnit,
            min: 0.1,
            max: 10,
            step: 0.1,
            onInputCallback: (value: string) => {
                planeRestrictionApi.gridRestrictionApi.gridUnit = +value;
            }
        },
        <IBooleanElement>{
            name: 'angular',
            type: 'boolean',
            label: 'Show Points',
            value: planeRestrictionApi.angularRestrictionApi.enabled,
            onInputCallback: (value: boolean) => {
                planeRestrictionApi.angularRestrictionApi.enabled = value;
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
                planeRestrictionApi.angularRestrictionApi.angleStep = Math.PI / +value;
            }
        },
    ], menuDiv);

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
