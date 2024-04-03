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
            '9ce93e17a415e2ed20a3ebd4ed836e334ee3a03651209e2883d96a304f29e2b3110896c97c84fb41619689931d11c5bd26fc28e23cc55333fc258abbaf0795f43494ee5ac88bb5859844f81d681c736284841bb09c6439791d8a3b7522fbf5deed04fae1e23f7c-1c0f23f7c9ce07181955c4536b0e5edc',
        modelViewUrl: 'https://sdr7euc1.eu-central-1.shapediver.com',
        id: 'mySession',
        initialParameterValues: {
            "Grid Restriction Unit Editable": "false",
            "Angular Restriction Angle Step Editable": "false",
        }
    });

    const pointsParameter = session.getParameterByName('points')[0];

    // get the output for the drawing tools options
    const customizationProperties: Settings = (session.getOutputByName('AppBuilder')[0].content![0].data as any).containers[1].tabs[0].widgets[0].props.drawingToolsSettings;
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

    const elements: (IBooleanElement | ISliderElement)[] = [];

    elements.push({
        name: 'show point labels',
        type: 'boolean',
        value: drawingToolsApi!.showPointLabels,
        onInputCallback: (value: boolean) => {
            drawingToolsApi!.showPointLabels = value;
        }
    });

    elements.push({
        name: 'show distance labels',
        type: 'boolean',
        value: drawingToolsApi!.showDistanceLabels,
        onInputCallback: (value: boolean) => {
            drawingToolsApi!.showDistanceLabels = value;
        }
    });

    if(planeRestrictionApi.gridRestrictionApi.enabledEditable) {
        elements.push({
            name: 'grid',
            type: 'boolean',
            value: planeRestrictionApi.gridRestrictionApi.enabled,
            onInputCallback: (value: boolean) => {
                planeRestrictionApi.gridRestrictionApi.enabled = value;
            }
        });
    }

    if(planeRestrictionApi.gridRestrictionApi.gridUnitEditable) {
        elements.push({
            name: 'grid unit',
            type: 'slider',
            value: planeRestrictionApi.gridRestrictionApi.gridUnit,
            min: 0.1,
            max: 10,
            step: 0.1,
            onInputCallback: (value: string) => {
                planeRestrictionApi.gridRestrictionApi.gridUnit = +value;
            }
        });
    }

    if(planeRestrictionApi.angularRestrictionApi.enabledEditable) {
        elements.push({
            name: 'angular',
            type: 'boolean',
            value: planeRestrictionApi.angularRestrictionApi.enabled,
            onInputCallback: (value: boolean) => {
                planeRestrictionApi.angularRestrictionApi.enabled = value;
            }
        });
    }

    if(planeRestrictionApi.angularRestrictionApi.angleStepEditable) {
        elements.push({
            name: 'angle step',
            type: 'slider',
            value: 8,
            min: 1,
            max: 16,
            step: 1,
            onInputCallback: (value: string) => {
                planeRestrictionApi.angularRestrictionApi.angleStep = Math.PI / +value;
            }
        });
    }

    createCustomUi(elements, menuDiv);

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
