
import * as ShapeDiverViewer from '@shapediver/viewer';
import * as ShapeDiverViewerAttributeVisualization from '@shapediver/viewer.features.attribute-visualization';

(<any>window).SDV = ShapeDiverViewer;
(<any>window).SDVAV = ShapeDiverViewerAttributeVisualization;


(async () => {
    const viewport = await ShapeDiverViewer.createViewport({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    const session = await ShapeDiverViewer.createSession({ 
        ticket: '49d1d6228c0f9910810266d6ff02d5a5b304add84d2548e6bf5b994bc4c7191a58246e637aa88507c1853e8bfea8bb47d7b9311aaa3c2f9c5b811beeea8807991f61a0c4f9b4cfaf9f90ea14184e4101240b08894ea4d5a4ef3e0629e22fe75488b51552b9b864-96514fbf6e9c093bb20402c8f79c0fd5', 
        modelViewUrl: 'https://sddev2.eu-central-1.shapediver.com', 
        id: 'mySession'
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