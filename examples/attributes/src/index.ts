import 'reflect-metadata'

import { api, SDTFAttributeVisualization, ATTRIBUTEVISUALIZATION, CAMERATYPE, ENVIRONMENTMAP, EVENTTYPE, EXPORTTYPE, LIGHTTYPE, LOGGINGLEVEL, ORTHOGRAPHIC_CAMERA_DIRECTION, PARAMETERTYPE, PARAMETERVISUALIZATION, RENDERERTYPE, VISIBILITYMODE, AttributeViewer, SDTFOverview, SDTFItemData, PRIMITIVETYPEHINT } from '@shapediver/viewer'
import { mat4 } from 'gl-matrix';

(<any>window).api = api;
(<any>window).sceneTree = api.sceneTree;
(<any>window).RENDERERTYPE = RENDERERTYPE;
(<any>window).CAMERATYPE = CAMERATYPE;
(<any>window).ORTHOGRAPHIC_CAMERA_DIRECTION = ORTHOGRAPHIC_CAMERA_DIRECTION;
(<any>window).LIGHTTYPE = LIGHTTYPE;
(<any>window).VISIBILITYMODE = VISIBILITYMODE;
(<any>window).LOGGINGLEVEL = LOGGINGLEVEL;
(<any>window).EVENTTYPE = EVENTTYPE;
(<any>window).EXPORTTYPE = EXPORTTYPE;
(<any>window).PARAMETERTYPE = PARAMETERTYPE;
(<any>window).PARAMETERVISUALIZATION = PARAMETERVISUALIZATION;
(<any>window).ENVIRONMENTMAP = ENVIRONMENTMAP;


(async () => {
    await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas1'), id: 'myViewerStandard' })
    let viewer = <AttributeViewer>await api.createViewer({ type: RENDERERTYPE.ATTRIBUTES, canvas: <HTMLCanvasElement>document.getElementById('canvas2'), id: 'myViewer' })
    let session = await api.createSession({ ticket: 'd31f1f4827fdd8f780405930c0b1f8e5b385adf40834a466dcb7a30e9a81fa7bc29ad62446cef5d120c698845f8a08745595842ff1f86ced0546e64d9fd5d3613b2a833b64213b0013075ed7fdcba42c973bac7e5c7e183c668c0745cfa5bb352c8229a17f9c8a-9cf44d46b6267a0a50d7a1bd191a4ae7', modelViewUrl: 'https://sddev2.eu-central-1.shapediver.com', id: 'mySession' });

    viewer.convertSDTFItemToVisualizationData = (itemData: SDTFItemData, overview: SDTFOverview, visualizationAttributes: { [key: string]: boolean; }): { color: string, opacity: number, matrix: mat4 } => {
        if (visualizationAttributes['Area'] === true) {
            if (itemData.attributes && itemData.attributes['Area']) {
                const areaAttributes = itemData.attributes['Area'];
                const areaDoubleOverview = overview['Area'].filter(o => o.typeHint === PRIMITIVETYPEHINT.DOUBLE)[0];

                return SDTFAttributeVisualization.numberVisualization(
                    areaAttributes.value,
                    areaDoubleOverview.min!,
                    areaDoubleOverview.max!,
                    ATTRIBUTEVISUALIZATION.BLUE_GREEN_YELLOW_RED_PURPLE_WHITE
                );
            }
        }

        if (visualizationAttributes['Floor Area'] === true) {
            if (itemData.attributes && itemData.attributes['Floor Area']) {
                const areaAttributes = itemData.attributes['Floor Area'];
                const areaDoubleOverview = overview['Floor Area'].filter(o => o.typeHint === PRIMITIVETYPEHINT.DOUBLE)[0];

                return SDTFAttributeVisualization.numberVisualization(
                    areaAttributes.value,
                    areaDoubleOverview.min!,
                    areaDoubleOverview.max!,
                    ATTRIBUTEVISUALIZATION.BLUE_WHITE_RED
                );
            }
        }

        if (visualizationAttributes['Level Height'] === true) {
            if (itemData.attributes && itemData.attributes['Level Height']) {
                const areaAttributes = itemData.attributes['Level Height'];
                const areaDoubleOverview = overview['Level Height'].filter(o => o.typeHint === PRIMITIVETYPEHINT.DOUBLE)[0];

                return SDTFAttributeVisualization.numberVisualization(
                    areaAttributes.value,
                    areaDoubleOverview.min!,
                    areaDoubleOverview.max!,
                    ATTRIBUTEVISUALIZATION.HSL
                );
            }
        }

        return {
            color: '#ffffff',
            opacity: 0,
            matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
        }
    };
    viewer.visualizationAttributes =
    {
        'Area': true,
        'Floor Area': false,
        'Level Height': false
    }

    api.sceneTree.root.updateVersion();
    api.update()
})();