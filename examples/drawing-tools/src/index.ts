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
            '3f4f2205635ed815534ec601f848315576d627d2ef69166a8476e06d2b67eefc9ff6ca487d5b670701ebada86a22cfaa9c9e92c4a2053bd8bd5873f5b0c339f4d88a61ed7a6bc79c49b1e104808fa67c6656395557fcdc960cb84f3f28549622603d2169c72204-1bc02aa8d717333aa124acfacae10740',
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
