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
            '7f437fd3c3d5a7e69a7fa222f9d95d78c79de1e47e2700e9154e3a3375928af4f013bfc3a9f1d66db520c045c233513c7f2bed7c4de81ccc901d01f6fc5fed35c94da3c6e8e59364f2245d07e74d4702d793c76bd4fa6238cd99ee02c3930082eae17f25090171-139a376e922414621c5f5ee4cce82fbe',
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
