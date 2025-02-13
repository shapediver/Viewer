import * as SDV from '@shapediver/viewer';
import { IDirectionalLightApi, LIGHT_TYPE } from '@shapediver/viewer';
import {
    createDrawingTools,
    GeometryRestrictionApi,
    IDrawingToolsEvent,
    IDrawingToolsApi,
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
            '4f55cd2f7a647e0f1ea41563597fddaa77ee3ba2be450d2940b322015f2711744da21c252e0b133b56921a738e14636dc861cd7c3c0e5b23f58fac75c024c3f051c1ef1ea70add71dada25b1ec36efb1c563fa7270b5cab7f0a190ce50d81839fbbe5e86c47908-dba7ecfee7a1c6a4c53aa3203b6e4b23',
        modelViewUrl: 'https://sdr8euc1.eu-central-1.shapediver.com',
        id: 'mySession'
    });
    
    const lightScene = viewport.lightScene!;
    // we search for the lights that are directional and have shadows
    const lightsWithShadows: IDirectionalLightApi[] = <IDirectionalLightApi[]>(
      Object.values(lightScene.lights).filter(
        (l) =>
          l.type === LIGHT_TYPE.DIRECTIONAL &&
          (<IDirectionalLightApi>l).castShadow === true
      )
    );
  
    for (let i = 0; i < lightsWithShadows.length; i++) {
      // changing the shadow map resolution increases the qualtiy, but lowers the performance
      // has to be power of two (default: 1024)
      lightsWithShadows[i].shadowMapResolution = 1024;
      // the shadow map bias is responsible for the offset of the shadow map
      // if this would be 0, the object would cast a shadow on itself
      lightsWithShadows[i].shadowMapBias = -0.0005;
    }

    const geometryRestrictionOutput = session.getOutputByName('GeometryRestriction')[0].node!;

    const customizationProperties: Settings = {
        general: {
            // If the drawing tool is updated automatically when the drawing is changed.
            autoUpdate: true,
            // The unit that will be displayed in the distance and point labels. 
            displayUnit: 'm'
        },
        geometry: {
            // If the line is automatically closed.
            autoClose: false,
            // The minimum amount of points
            minPoints: 4,
            // The maximum number of points
            maxPoints: 25,
        },
        restrictions: {
            // Add a geometry restriction
            'geometry': {
                type: RESTRICTION_TYPE.GEOMETRY,
                // The node to restrict is set below
                nodes: [geometryRestrictionOutput],
                wireframeColor: '#ffffff',
                snapToEdges: false,
                snapToVertices: false,

            }
        }
    };

    /**
     * Callback function for the drawing tool
     * executed when the drawing tool is updated
     * 
     * @param geometryData 
     */
    const onUpdate = async (pointsData: PointsData) => {
        console.log('Drawing tools updated', pointsData);

        const pointsParameter = session.getParameterByName('points')[0];
        pointsParameter.value = JSON.stringify({ 'points': pointsData });
        await session.customize();

    };

    /**
     * Callback function for the drawing tool
     * executed when the drawing tool is cancelled
     */
    const onCancel = () => {
        console.log('Drawing tools cancelled');

        // remove ui
        const menuDiv = document.getElementById('menu');
        if (menuDiv) {
            menuDiv.remove();
        }
    };

    const sendNotification = (title: string, message: string) => {
        if (Notification.permission === 'granted') {
            new Notification(title, { body: message });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body: message });
                }
            });
        }
    };

    SDV.addListener(SDV.EVENTTYPE_DRAWING_TOOLS.MINIMUM_POINTS, (event: SDV.IEvent) => {
        sendNotification('Minimum points reached', (event as IDrawingToolsEvent).message!);
    });

    SDV.addListener(SDV.EVENTTYPE_DRAWING_TOOLS.MAXIMUM_POINTS, (event: SDV.IEvent) => {
        sendNotification('Maximum points reached', (event as IDrawingToolsEvent).message!);
    });

    SDV.addListener(SDV.EVENTTYPE_DRAWING_TOOLS.UNCLOSED_LOOP, (event: SDV.IEvent) => {
        sendNotification('Line loop not closed', (event as IDrawingToolsEvent).message!);
    });


    const drawingToolsApi: IDrawingToolsApi | undefined = createDrawingTools(viewport, { onUpdate, onCancel }, customizationProperties);
    (window as any).drawingToolsApi = drawingToolsApi;

    // const geometryRestrictionApi = drawingToolsApi.restrictions['geometry'] as GeometryRestrictionApi;

    // /**
    //  * Set the node to restrict
    //  */
    // const terrainOutput = session.getOutputByName('Terrain')[0];
    // const cb = (newNode?: SDV.ITreeNode) => {

    //     if (!newNode)  return;
    //     new Promise((resolve) => setTimeout(resolve, 0)).then(() => geometryRestrictionApi.updateNodes([newNode]));
    // };
    // terrainOutput.updateCallback = cb;
    // cb(terrainOutput.node);

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
