import * as SDV from '@shapediver/viewer';
import {
    createDrawingTools,
    GeometryRestrictionApi,
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
            'e68eb247669db1dd9143edfddb621e97cf631d54757781eb66cd25a36224a8c3e4d803fa1f8d67552469920526ebe969b906541d2041d85702f7b4f46df3b76909c034a3d7f00618356dc0b485115092cb21f304c3f592a9ccc2e48240e8ca933a8280c8660ab0-a71165b362ca9e696710c2d7bc86e88b',
        modelViewUrl: 'https://sdr7euc1.eu-central-1.shapediver.com',
        id: 'mySession',
        initialParameterValues: {
            'Grid Unit Editable': 'false',
            'Angle Step Editable': 'false',
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

    const onFinish = async (pointsData: PointsData) => {
        onUpdate(pointsData);
        onCancel();
    };


    const drawingToolsApi: IDrawingToolsApi | undefined = createDrawingTools(viewport, { onUpdate, onCancel, onFinish }, customizationProperties);
    (window as any).drawingToolsApi = drawingToolsApi;

    const towerNode = session.getOutputByName('Tower')[0].node!;
    const geometryRestrictionApi = drawingToolsApi.addRestriction({
        type: RESTRICTION_TYPE.GEOMETRY,
        nodes: [towerNode]
    }) as GeometryRestrictionApi;

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

    elements.push({
        name: 'snap to vertices',
        type: 'boolean',
        value: geometryRestrictionApi.snapToVertices,
        onInputCallback: (value: boolean) => {
            geometryRestrictionApi.snapToVertices = value;
        }
    });

    elements.push({
        name: 'snap to edges',
        type: 'boolean',
        value: geometryRestrictionApi.snapToEdges,
        onInputCallback: (value: boolean) => {
            geometryRestrictionApi.snapToEdges = value;
        }
    });

    elements.push({
        name: 'snap to faces',
        type: 'boolean',
        value: geometryRestrictionApi.snapToFaces,
        onInputCallback: (value: boolean) => {
            geometryRestrictionApi.snapToFaces = value;
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

    /**
     * 
     * UNDO / REDO
     * 
     */

    const imgUndo = document.createElement('img');
    imgUndo.src = 'https://viewer.shapediver.com/v3/graphics/undo.svg';
    imgUndo.width = 50;
    imgUndo.height = 50;
    imgUndo.style.position = 'absolute';
    imgUndo.style.left = '1rem';
    imgUndo.style.top = '1rem';
    imgUndo.style.cursor = 'not-allowed';
    imgUndo.style.filter = 'brightness(50%)';
    imgUndo.onclick = () => {
        drawingToolsApi.undo();
    };
    document.body.appendChild(imgUndo);

    const imgRedo = document.createElement('img');
    imgRedo.src = 'https://viewer.shapediver.com/v3/graphics/redo.svg';
    imgRedo.width = 50;
    imgRedo.height = 50;
    imgRedo.style.position = 'absolute';
    imgRedo.style.left = '5rem';
    imgRedo.style.top = '1rem';
    imgRedo.style.cursor = 'not-allowed';
    imgRedo.style.filter = 'brightness(50%)';
    imgRedo.onclick = () => {
        drawingToolsApi.redo();
    };
    document.body.appendChild(imgRedo);


    SDV.addListener(SDV.EVENTTYPE_DRAWING_TOOLS.GEOMETRY_CHANGED, () => {
        if(drawingToolsApi.canRedo()) {
            imgRedo.style.filter = 'brightness(0%)';
            imgRedo.style.cursor = 'pointer';
        } else {
            imgRedo.style.filter = 'brightness(50%)';
            imgRedo.style.cursor = 'not-allowed';
        }

        if(drawingToolsApi.canUndo()) {
            imgUndo.style.filter = 'brightness(0%)';
            imgUndo.style.cursor = 'pointer';
        } else {
            imgUndo.style.filter = 'brightness(50%)';
            imgUndo.style.cursor = 'not-allowed';
        }
    });

})();
