(async () => {
    const SDV = (<any>window).SDV;
    const viewer = await SDV.api.createViewer({ canvas: <HTMLCanvasElement>document.getElementById('canvas'), id: 'myViewer' });
    const session = await SDV.api.createSession({ 
        ticket: '49d1d6228c0f9910810266d6ff02d5a5b304add84d2548e6bf5b994bc4c7191a58246e637aa88507c1853e8bfea8bb47d7b9311aaa3c2f9c5b811beeea8807991f61a0c4f9b4cfaf9f90ea14184e4101240b08894ea4d5a4ef3e0629e22fe75488b51552b9b864-96514fbf6e9c093bb20402c8f79c0fd5', 
        modelViewUrl: 'https://sddev2.eu-central-1.shapediver.com', 
        id: 'mySession'
    });

    viewer.type = SDV.RENDERER_TYPE.ATTRIBUTES;
    viewer.clearColor = '#000000'

    const attributeVisualizationEngine = new (<any>window).SDVAttributeVisualization.AttributeVisualizationEngine(SDV.api, viewer);
    (<any>window).attributeVisualizationEngine = attributeVisualizationEngine;

    attributeVisualizationEngine.updateAttributes([
        {
            key: 'x+y, number',
            type: SDV.SDTF_TYPEHINT.DOUBLE,
            visualization: SDV.ATTRIBUTE_VISUALIZATION.GREEN_WHITE_RED
        }
    ])
})()