import * as SDV from '@shapediver/viewer';
import {
    createDrawingTools,
    GeometryRestrictionApi,
    IDrawingToolsEvent,
    IDrawingToolsApi,
    PlaneRestrictionApi,
    PointsData,
    RESTRICTION_TYPE,
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
            '1636173cca09293804fb0084bb4726040b742d1a17fb18dd1801ef70a2cd3c76a45c2a442c6dc602495c43c39f2a5dd1e168a8f8f5edfebca7ad13b6b3fecdb60b0e1d914a8a25a1b16ba61ac9ff2a5a84e27cbfed31c5a4d1e5b416e78abd86a8f76a99b1eb5c-39e4dbd01454d7afbd92052722e1743f',
        modelViewUrl: 'https://sdr7euc1.eu-central-1.shapediver.com',
        id: 'mySession',
        initialParameterValues: {
            'points': JSON.stringify({ 'points': [] })
        }
    });

    const pointsParameter = session.getParameterByName('points')[0];

    // get the output for the drawing tools options
    const customizationProperties: Settings = (session.getOutputByName('DrawingToolsSettings')[0].content![0].data as any);
    console.log('Customization properties', customizationProperties);

    /**
     * Callback function for the drawing tool
     * executed when the drawing tool is finished
     * 
     * @param geometryData 
     */
    const onUpdate = async (pointsData: PointsData) => {
        console.log('Drawing tools updated', pointsData);

        pointsParameter.value = JSON.stringify({ 'points': pointsData });
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

    SDV.addListener(SDV.EVENTTYPE_DRAWING_TOOLS.MINIMUM_POINTS, (event: SDV.IEvent) => {
        alert((event as IDrawingToolsEvent).message);
    });

    SDV.addListener(SDV.EVENTTYPE_DRAWING_TOOLS.MAXIMUM_POINTS, (event: SDV.IEvent) => {
        alert((event as IDrawingToolsEvent).message);
    });


    const drawingToolsApi: IDrawingToolsApi | undefined = createDrawingTools(viewport, { onUpdate, onCancel }, {
        geometry: {
            minPoints: 4,
            maxPoints: 10,
            autoClose: false,
            close: true,
            
        }
    });
    (window as any).drawingToolsApi = drawingToolsApi;

    /**
     * 
     * RESTRICTION UI
     * 
     */
    
    const menuDiv = document.createElement('div');
    menuDiv.id = 'menu';
    menuDiv.style.position = 'absolute';
    menuDiv.style.top = '1rem';
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
