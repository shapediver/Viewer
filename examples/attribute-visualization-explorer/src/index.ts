import { sceneTree, createSession, createViewport, ITreeNode, RENDERER_TYPE, SDTFItemData, addListener, EVENTTYPE, ISelectEvent, ISessionApi, IViewportApi, MaterialUnlitData } from "@shapediver/viewer";
import { InteractionData, InteractionEngine, SelectManager } from "@shapediver/viewer.features.interaction";
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
            "0becbe99aa4c0ab77018d695c42bb9fcf17f7e5e67cd277c24fa8868fee85d910f50fe2be0af3baddb431b33dedb548e22aabe743074a2598f36eb70fd2876c727ec5ec456978be5546081be8d6443da1d66d1269d2236e362ace67fe9aa0a47ad11531b222960-46b2ea05fcd73affa12aeb88d0f25ab1",
        modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
        id: "mySession"
    });

    attributeVisualizationEngine = new AttributeVisualizationEngine(viewport);

    // create the interactionEngine and provide it the viewport object
    interactionEngine = new InteractionEngine(viewport);

    // create the selectionManager and add it
    attributeSelectManager = new SelectManager();
    attributeSelectManager.effectMaterial = new MaterialUnlitData({color: '#FFFF00'});
})();
