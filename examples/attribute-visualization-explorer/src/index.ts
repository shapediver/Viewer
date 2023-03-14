import { sceneTree, createSession, createViewport, ITreeNode, RENDERER_TYPE, SDTFItemData, addListener, EVENTTYPE, ISessionApi, IViewportApi, MaterialUnlitData } from "@shapediver/viewer";
import { HoverManager, IHoverEvent, InteractionData, InteractionEngine, ISelectEvent, SelectManager } from "@shapediver/viewer.features.interaction";
import { AttributeVisualizationEngine } from "@shapediver/viewer.features.attribute-visualization";
import * as  SDV from "@shapediver/viewer";
import { SDTF_TYPEHINT } from "@shapediver/viewer";
import { INumberAttribute, ATTRIBUTE_VISUALIZATION } from "@shapediver/viewer.features.attribute-visualization";
import { mat4, vec3 } from "gl-matrix";

let viewport: IViewportApi;
let interactionEngine: InteractionEngine;
let attributeVisualizationEngine: AttributeVisualizationEngine;
let attributeSelectManager: SelectManager;
let attributeHoverManager: HoverManager;
let attributeSelectManagerToken: string;
let attributeHoverManagerToken: string;
let nodeInteractionDataPairs: {
    node: ITreeNode,
    data: InteractionData
}[] = [];

const addInteractionDataToSDTFItems = (node: ITreeNode) => {
    for (let i = 0; i < node.data.length; i++) {
        if (node.data[i] instanceof SDTFItemData) {
            const data = new InteractionData({ select: true, hover: true });
            node.addData(data);
            nodeInteractionDataPairs.push({node, data});
        }
    }

    for (let i = 0; i < node.children.length; i++)
        addInteractionDataToSDTFItems(node.children[i]);
};

const removeInteractionDataFromSDTFItems = () => {
    for (let i = 0; i < nodeInteractionDataPairs.length; i++)
        nodeInteractionDataPairs[i].node.removeData(nodeInteractionDataPairs[i].data);
    nodeInteractionDataPairs = [];
};

const activationBox = <HTMLInputElement>document.getElementById('activate');
activationBox.onclick = () => {
    if (activationBox.checked) {
        viewport.type = RENDERER_TYPE.ATTRIBUTES;
        attributeSelectManagerToken = interactionEngine.addInteractionManager(attributeSelectManager);
        attributeHoverManagerToken = interactionEngine.addInteractionManager(attributeHoverManager);
        addInteractionDataToSDTFItems(sceneTree.root);
    } else {
        viewport.type = RENDERER_TYPE.STANDARD;
        interactionEngine.removeInteractionManager(attributeSelectManagerToken);
        interactionEngine.removeInteractionManager(attributeHoverManagerToken);
        removeInteractionDataFromSDTFItems();
    }
}

addListener(EVENTTYPE.INTERACTION.SELECT_OFF, (e) => {
    const selectEvent = <ISelectEvent>e;
    console.log("SELECT_OFF")
});

addListener(EVENTTYPE.INTERACTION.SELECT_ON, (e) => {
    const selectEvent = <ISelectEvent>e;

    const itemData = <SDTFItemData | undefined>selectEvent.node.data.find(d => d instanceof SDTFItemData);
    if (!itemData) return;

    console.log("SELECT_ON")
    console.log(itemData.attributes)
});


// addListener(EVENTTYPE.INTERACTION.HOVER_OFF, (e) => {
//     const hoverEvent = <IHoverEvent>e;
//     console.log("HOVER_OFF")
// });

// addListener(EVENTTYPE.INTERACTION.HOVER_ON, (e) => {
//     const hoverEvent = <IHoverEvent>e;
//     console.log("HOVER_ON")
// });

(<any>window).SDV = SDV;

(async () => {
    viewport = await createViewport({
        canvas: <HTMLCanvasElement>document.getElementById("canvas"),
        id: "myViewport"
    });

    const promises = [];

    for(let i = 0; i < 11; i++) {

        const session = await createSession({
            ticket:
                "1c435edaf9425ed63ce9e3fcb11048ada9d83a1108e22bc153cfb27c33b00936b8a1e2e97315fa3cde5dd5cda839e4bfbeb6c076e9716737b13a3b17a24198d61e519978d9b93e7fb328e9727b92ed0e8c74a83f42f6f1e8006f2fc28a399f40b6065acebf5143-cb17ee872b8abab457e8b6669c996ffa",
            modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
            id: "mySession" + i
        });
    
        session.node.addTransformation({ id: "abc", matrix: mat4.fromTranslation(mat4.create(), vec3.fromValues(0, 0, i*25))})
    }

    // attributeVisualizationEngine = new AttributeVisualizationEngine(viewport);

    // // create the interactionEngine and provide it the viewport object
    // interactionEngine = new InteractionEngine(viewport);
    // // interactionEngine.intersectionOpacity = 0.1;

    // // create the selectionManager and add it
    // attributeSelectManager = new SelectManager();
    // attributeSelectManager.deselectOnEmpty = false;
    // attributeSelectManager.effectMaterial = new MaterialUnlitData({color: '#FFFF00'});
    
    // attributeHoverManager = new HoverManager();
    // attributeHoverManager.effectMaterial = new MaterialUnlitData({color: '#FF0000'});
    // interactionEngine.addInteractionManager(attributeHoverManager)

    // // attributeVisualizationEngine.layers['envelope'].opacity = 0;
    // // // attributeVisualizationEngine.layers['panels'].opacity = 0.1;
    // // attributeVisualizationEngine.updateLayers(attributeVisualizationEngine.layers);
    // attributeVisualizationEngine.updateAttributes([
    //     <INumberAttribute>{
    //         key: 'DCR',
    //         type: SDTF_TYPEHINT.DOUBLE,
    //         visualization: ATTRIBUTE_VISUALIZATION.GREEN_WHITE_RED
    //     }
    // ])

    // viewport.type = RENDERER_TYPE.ATTRIBUTES;
    // attributeSelectManagerToken = interactionEngine.addInteractionManager(attributeSelectManager);
    // attributeHoverManagerToken = interactionEngine.addInteractionManager(attributeHoverManager);
    // addInteractionDataToSDTFItems(sceneTree.root);

    viewport.update()
})();
