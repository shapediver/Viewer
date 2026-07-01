import * as SDV from "@shapediver/viewer";
import {
	addListener,
	createSession,
	createViewport,
	EVENTTYPE,
	type ITreeNode,
	type IViewportApi,
	MaterialUnlitData,
	RENDERER_TYPE,
	sceneTree,
	SDTFItemData} from "@shapediver/viewer";
import {AttributeVisualizationEngine} from "@shapediver/viewer.features.attribute-visualization";
import {
	HoverManager,
	InteractionData,
	InteractionEngine,
	type ISelectEvent,
	SelectManager} from "@shapediver/viewer.features.interaction";
import {
	createCustomUi,
	createUi,
	type IBooleanElement} from "@shapediver/viewer.shared.demo-helper";
import {createAttributeVisualizationUi} from "./attributeVisualizationUi";

let nodeInteractionDataPairs: {
	node: ITreeNode;
	data: InteractionData;
}[] = [];
let viewport: IViewportApi;

const addInteractionDataToSDTFItems = (node: ITreeNode) => {
	for (let i = 0; i < node.data.length; i++) {
		if (node.data[i] instanceof SDTFItemData) {
			const data = new InteractionData({select: true, hover: true});
			node.addData(data);
			nodeInteractionDataPairs.push({node, data});
			viewport.updateNode(node);
		}
	}

	for (let i = 0; i < node.children.length; i++)
		addInteractionDataToSDTFItems(node.children[i]);
};

const removeInteractionDataFromSDTFItems = () => {
	for (let i = 0; i < nodeInteractionDataPairs.length; i++) {
		nodeInteractionDataPairs[i].node.removeData(
			nodeInteractionDataPairs[i].data,
		);
		viewport.updateNode(nodeInteractionDataPairs[i].node);
	}
	nodeInteractionDataPairs = [];
};

addListener(EVENTTYPE.INTERACTION.SELECT_OFF, (e) => {
	const selectEvent = <ISelectEvent>e;
	console.log("SELECT_OFF");
});

addListener(EVENTTYPE.INTERACTION.SELECT_ON, (e) => {
	const selectEvent = <ISelectEvent>e;

	const itemData = <SDTFItemData | undefined>(
		selectEvent.node.data.find((d) => d instanceof SDTFItemData)
	);
	if (!itemData) return;

	console.log("SELECT_ON");
	console.log(itemData.attributes);
});

(<any>window).SDV = SDV;

(async () => {
	viewport = await createViewport({
		canvas: <HTMLCanvasElement>document.getElementById("canvas"),
		id: "myViewport",
	});

	// Get the URL of the current page
	const url = window.location.href;

	// Create a URL object
	const urlObject = new URL(url);

	// Get the URLSearchParams object from the URL
	const queryParams = urlObject.searchParams;

	// Reading individual query parameters
	const ticket =
		queryParams.get("ticket") ||
		"2327f137cfe00be4b3dcb87def2d7906d8575d7b1b8b4e2a225433284e2ac3712203456f10b6b7dca19b645b758c4463c08ce73641d38d85695bf6da5a4d6e85acc5205f33c0611c68b8663a107c4167e9487679386cc9b1319f66633394bc24597c012bad4ce4-109c9925ede0bc853d18abcccfd5d37c";
	const modelViewUrl =
		queryParams.get("modelViewUrl") ||
		"https://sdeuc1.eu-central-1.shapediver.com";

	const session = await createSession({
		ticket,
		modelViewUrl,
		id: "mySession",
		loadSdtf: true,
	});

	// create the attribute visualization engine
	const attributeVisualizationEngine = new AttributeVisualizationEngine(
		viewport,
	);

	// create the parameter UI to the right of the canvas
	const parameterUI = document.createElement("div");
	parameterUI.style.position = "absolute";
	parameterUI.style.right = "0.5rem";
	parameterUI.style.top = "0.5rem";
	parameterUI.style.width = "15rem";
	document.body.appendChild(parameterUI);
	createUi(session, parameterUI);

	// create the custom UI to the left of the canvas
	const customUI = document.createElement("div");
	customUI.style.position = "absolute";
	customUI.style.left = "0.5rem";
	customUI.style.top = "0.5rem";
	customUI.style.width = "20rem";
	customUI.style.maxHeight = "calc(100vh - 1rem)";
	customUI.style.overflowY = "auto";
	document.body.appendChild(customUI);

	let interactionEngine: InteractionEngine | undefined;
	let attributeVisualizationActive = false;

	const initializeAttributeVisualization = () => {
		// create the interaction engine and add the interaction managers
		interactionEngine = new InteractionEngine(viewport);

		// create the selectionManager and add it
		const attributeSelectManager = new SelectManager();
		attributeSelectManager.deselectOnEmpty = false;
		attributeSelectManager.effectMaterial = new MaterialUnlitData({
			color: "#FFFF00",
		});
		interactionEngine.addInteractionManager(attributeSelectManager);

		// create the hoverManager and add it
		const attributeHoverManager = new HoverManager();
		attributeHoverManager.effectMaterial = new MaterialUnlitData({
			color: "#FF0000",
		});
		interactionEngine.addInteractionManager(attributeHoverManager);

		viewport.type = RENDERER_TYPE.ATTRIBUTES;
		addInteractionDataToSDTFItems(sceneTree.root);

		viewport.update();
	};

	const closeAttributeVisualization = () => {
		interactionEngine?.close();
		viewport.type = RENDERER_TYPE.STANDARD;
		removeInteractionDataFromSDTFItems();

		viewport.update();
	};

	const createAVUi = () => {
		// remove all elements in the custom UI
		while (customUI.childNodes.length > 0) {
			customUI.removeChild(customUI.lastChild!);
		}

		createCustomUi(
			[
				<IBooleanElement>{
					type: "boolean",
					name: "Activate",
					value: false,
					onChangeCallback: (value: boolean) => {
						console.log("Activate", value);
						attributeVisualizationActive = value;
						if (value) {
							initializeAttributeVisualization();
							createAttributeVisualizationUi(
								customUI,
								attributeVisualizationEngine!,
							);
						} else {
							closeAttributeVisualization();

							// remove all elements in the custom UI after the first one
							while (customUI.childNodes.length > 1) {
								customUI.removeChild(customUI.lastChild!);
							}
						}
					},
				},
			],
			customUI,
		);
	};

	const cb = () => {
		if (attributeVisualizationActive) {
			closeAttributeVisualization();
			attributeVisualizationActive = false;
		}

		createAVUi();
	};
	session.updateCallback = cb;
	cb();
})();
