
import * as ShapeDiverViewer from '@shapediver/viewer';
import * as ShapeDiverViewerAttributeVisualization from '@shapediver/viewer.features.attribute-visualization';

(<any>window).SDV = ShapeDiverViewer;
(<any>window).SDVAV = ShapeDiverViewerAttributeVisualization;


(async () => {
    const viewport = await ShapeDiverViewer.createViewport({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    const session = await ShapeDiverViewer.createSession({ 
        ticket: '2327f137cfe00be4b3dcb87def2d7906d8575d7b1b8b4e2a225433284e2ac3712203456f10b6b7dca19b645b758c4463c08ce73641d38d85695bf6da5a4d6e85acc5205f33c0611c68b8663a107c4167e9487679386cc9b1319f66633394bc24597c012bad4ce4-109c9925ede0bc853d18abcccfd5d37c', 
        modelViewUrl: 'https://sdeuc1.eu-central-1.shapediver.com', 
        id: 'mySession',
        loadSdtf: true
    });
    viewport.type = ShapeDiverViewer.RENDERER_TYPE.ATTRIBUTES;

    const attributeVisualizationEngine = new ShapeDiverViewerAttributeVisualization.AttributeVisualizationEngine(viewport);
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
    //     <ShapeDiverViewerAttributeVisualization.IStringAttribute>{
    //         key: 'x+y, string',
    //         type: ShapeDiverViewer.SDTF_TYPEHINT.STRING,
    //         visualization: ShapeDiverViewerAttributeVisualization.ATTRIBUTE_VISUALIZATION.GREEN_WHITE_RED
    //     }
    // ])

    // case 5 - number attribute
    // attributeVisualizationEngine.updateAttributes([
    //     <ShapeDiverViewerAttributeVisualization.INumberAttribute>{
    //         key: 'x+y, number',
    //         type: ShapeDiverViewer.SDTF_TYPEHINT.DOUBLE,
    //         visualization: ShapeDiverViewerAttributeVisualization.ATTRIBUTE_VISUALIZATION.GREEN_WHITE_RED
    //     }
    // ])
})();