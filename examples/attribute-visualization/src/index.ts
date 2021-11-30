import 'reflect-metadata'
import * as SDV from '@shapediver/viewer'
import * as SDVAttributeVisualization from '@shapediver/viewer.features.attribute-visualization'

(<any>window).SDV = SDV;


(async () => {
    let viewer = await SDV.api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    let session = await SDV.api.createSession({ 
        ticket: 'd321aaeca9175fd2cfd73e8197bddd28421ddc9b77faf774bf1fff6d7a9612070d19418cdfdbb6b61adf490761e1b880896ad83f053acf9e891fef24474cd00200705d4af0131ec85c4a78358abb1312de88db2265ec85c5bde9628161ace50d74710d1261d476-314a69482904867643ee88595164b0cf', 
        modelViewUrl: 'https://sddev2.eu-central-1.shapediver.com', 
        id: 'mySession'
    });
    viewer.type = SDV.RENDERERTYPE.ATTRIBUTES;
    viewer.clearColor = '#000000'

    const attributeVisualizationEngine = new SDVAttributeVisualization.AttributeVisualizationEngine(SDV.api, viewer);
    (<any>window).attributeVisualizationEngine = attributeVisualizationEngine;

    // case 1 - none

    // case 2 - layer enable
    // attributeVisualizationEngine.layers['pinky'].enabled = false;
    // attributeVisualizationEngine.updateLayers(attributeVisualizationEngine.layers);

    // case 3 - layer
    // attributeVisualizationEngine.layers['pinky'].opacity = 0;
    // attributeVisualizationEngine.updateLayers(attributeVisualizationEngine.layers);

    // case 4 - string attribute
    // attributeVisualizationEngine.updateAttributes([
    //     <SDVAttributeVisualization.IStringAttribute>{
    //         key: 'x+y, string',
    //         type: SDV.PRIMITIVETYPEHINT.STRING,
    //         visualization: SDV.ATTRIBUTEVISUALIZATION.GREEN_WHITE_RED
    //     }
    // ])

    // case 5 - number attribute
    // attributeVisualizationEngine.updateAttributes([
    //     <SDVAttributeVisualization.INumberAttribute>{
    //         key: 'x+y, number',
    //         type: SDV.PRIMITIVETYPEHINT.DOUBLE,
    //         visualization: SDV.ATTRIBUTEVISUALIZATION.GREEN_WHITE_RED
    //     }
    // ])
})();