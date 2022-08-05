import { sceneTree, createSession, createViewport, ITreeNode, RENDERER_TYPE, SDTFItemData, addListener, EVENTTYPE, ISessionApi, IViewportApi, MaterialUnlitData } from "@shapediver/viewer";
import { InteractionData, InteractionEngine, ISelectEvent, SelectManager } from "@shapediver/viewer.features.interaction";
import { AttributeVisualizationEngine } from "@shapediver/viewer.features.attribute-visualization";
import * as  SDV from "@shapediver/viewer";

let session: ISessionApi, viewport: IViewportApi;
let interactionEngine: InteractionEngine;
let attributeVisualizationEngine: AttributeVisualizationEngine;
let attributeSelectManager: SelectManager;
let attributeSelectManagerToken: string;
let nodeInteractionDataPairs: {
    node: ITreeNode,
    data: InteractionData
}[] = [];

const addInteractionDataToSDTFItems = (node: ITreeNode) => {
    for (let i = 0; i < node.data.length; i++) {
        if (node.data[i] instanceof SDTFItemData) {
            const data = new InteractionData({ select: true });
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
        addInteractionDataToSDTFItems(sceneTree.root);
    } else {
        viewport.type = RENDERER_TYPE.STANDARD;
        interactionEngine.removeInteractionManager(attributeSelectManagerToken);
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

(<any>window).SDV = SDV;

(async () => {
    viewport = await createViewport({
        canvas: <HTMLCanvasElement>document.getElementById("canvas"),
        id: "myViewport"
    });
    session = await createSession({
        ticket:
            "9f1b67daa56999681c1603344dc03fd3a0e9bd91160394015a6bf32fd8611d3284d76f3023db1a3362759742a77d061f036b87a9105ff1b2ea341396ef9902836e2e6701f56c9ac89975416467e5272c3ca5b3ef49e9041d3cbcebb40c4991de27b6aedee0e477-48676bdd0ea4122e21ae74ed198a04d4",
        modelViewUrl: "https://sddev2.eu-central-1.shapediver.com",
        id: "mySession"
    });

    attributeVisualizationEngine = new AttributeVisualizationEngine(viewport);

    // create the interactionEngine and provide it the viewport object
    interactionEngine = new InteractionEngine(viewport);
    interactionEngine.intersectionOpacity = 0.1;

    // create the selectionManager and add it
    attributeSelectManager = new SelectManager();
    attributeSelectManager.deselectOnEmpty = false;
    attributeSelectManager.effectMaterial = new MaterialUnlitData({color: '#FFFF00'});
    
    attributeVisualizationEngine.layers['envelope'].opacity = 0;
    attributeVisualizationEngine.layers['panels'].opacity = 0.1;
    attributeVisualizationEngine.updateLayers(attributeVisualizationEngine.layers);
})();
