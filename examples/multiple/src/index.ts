import 'reflect-metadata'

import { api, CAMERATYPE, ENVIRONMENTMAP, EVENTTYPE, EXPORTTYPE, LIGHTTYPE, LOGGINGLEVEL, ORTHOGRAPHIC_CAMERA_DIRECTION, PARAMETERTYPE, PARAMETERVISUALIZATION, RENDERERTYPE, VISIBILITYMODE, SDTFOverview, SDTFItemData, PRIMITIVETYPEHINT, AttributeViewer } from '@shapediver/viewer'
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
    let viewer1 = await api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas1'), id: 'myViewer1' })
    let viewer2 = <AttributeViewer>await api.createViewer({ type: RENDERERTYPE.ATTRIBUTES, canvas: <HTMLCanvasElement>document.getElementById('canvas2'), id: 'myViewer2' })
    let session1 = await api.createSession({ ticket: 'd31f1f4827fdd8f780405930c0b1f8e5b385adf40834a466dcb7a30e9a81fa7bc29ad62446cef5d120c698845f8a08745595842ff1f86ced0546e64d9fd5d3613b2a833b64213b0013075ed7fdcba42c973bac7e5c7e183c668c0745cfa5bb352c8229a17f9c8a-9cf44d46b6267a0a50d7a1bd191a4ae7', modelViewUrl: 'https://sddev2.eu-central-1.shapediver.com', id: 'mySession1' });
    
    viewer2.convertSDTFItemToVisualizationData = (itemData: SDTFItemData, overview: SDTFOverview, visualizationAttributes: { [key: string]: boolean; }): { color: string, opacity: number, matrix: mat4} => {
        let red = 0, green = 247, blue = 255, opacity = 0;

        if(visualizationAttributes['Floor Area'] === true) {
            if (itemData.attributes && itemData.attributes['Floor Area']) {
                const floorAreaAttributes = itemData.attributes['Floor Area'];
                const floorAreaDoubleOverview = attributes.overview['Floor Area'].filter(o => o.typeHint === PRIMITIVETYPEHINT.DOUBLE)[0];

                red = 0, green = 0, blue = 0, opacity = 1;
                // blue -> green -> yellow -> red
                const factor = (floorAreaAttributes.value - floorAreaDoubleOverview.min!) / (floorAreaDoubleOverview.max! - floorAreaDoubleOverview.min!);
                if(factor < 0.333) {
                    const remappedFactor = factor / 0.333;
                    blue = 255.0 * (1 - remappedFactor);
                    green = 255.0 * remappedFactor;
                } else if (factor < 0.666) {
                    const remappedFactor = (factor - 0.333) / 0.333;
                    red = 255.0 * remappedFactor;
                    green = 255.0;
                } else {
                    const remappedFactor = Math.min(1.0, (factor - 0.666) / 0.333);
                    red = 255.0;
                    green = 255.0 * (1 - remappedFactor);
                }
            }
        }

        if(visualizationAttributes['Area'] === true) {
            if (itemData.attributes && itemData.attributes['Area']) {
                const areaAttributes = itemData.attributes['Area'];
                const areaDoubleOverview = attributes.overview['Area'].filter(o => o.typeHint === PRIMITIVETYPEHINT.DOUBLE)[0];

                red = 0, green = 0, blue = 0, opacity = 1;
                // blue -> green -> yellow -> red
                const factor = (areaAttributes.value - areaDoubleOverview.min!) / (areaDoubleOverview.max! - areaDoubleOverview.min!);
                if(factor < 0.333) {
                    const remappedFactor = factor / 0.333;
                    blue = 255.0 * (1 - remappedFactor);
                    green = 255.0 * remappedFactor;
                } else if (factor < 0.666) {
                    const remappedFactor = (factor - 0.333) / 0.333;
                    red = 255.0 * remappedFactor;
                    green = 255.0;
                } else {
                    const remappedFactor = Math.min(1.0, (factor - 0.666) / 0.333);
                    red = 255.0;
                    green = 255.0 * (1 - remappedFactor);
                }
            }
        }


        if(visualizationAttributes['Level Height'] === true) {
            if (itemData.attributes && itemData.attributes['Level Height']) {
                const levelHeightAttributes = itemData.attributes['Level Height'];
                const levelHeightDoubleOverview = attributes.overview['Level Height'].filter(o => o.typeHint === PRIMITIVETYPEHINT.DOUBLE)[0];

                opacity = 1;
                const factor = (levelHeightAttributes.value - levelHeightDoubleOverview.min!) / (levelHeightDoubleOverview.max! - levelHeightDoubleOverview.min!);
                red *= factor;
                blue *= factor;
                green *= factor;
            }
        }
        return {
            color: `rgb(${Math.floor(red)},${Math.floor(green)},${Math.floor(blue)})`,
            opacity,
            matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
        }
    };
    api.sceneTree.root.updateVersion();
    api.update()
})();