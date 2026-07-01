import * as SDV from "@shapediver/viewer";
import {
	addListener,
	BlendFunction,
	createSession,
	createViewport,
	type IOutlineEffectDefinition,
	KernelSize,
	POST_PROCESSING_EFFECT_TYPE} from "@shapediver/viewer";
import {
	type IDragEvent,
	InteractionData,
	InteractionEngine,
	SelectManager} from "@shapediver/viewer.features.interaction";

(<any>window).SDV = SDV;

(async () => {
	// create a viewport
	const viewport = await createViewport({
		canvas: document.getElementById("canvas") as HTMLCanvasElement,
		id: "myViewport",
	});
	// create a session
	const session = await createSession({
		ticket: "95aa45115f2bfa0e9501127bf9c9f392c977792e44c62c6b2a5575133426c4066ead20626932b8c199eec88594bbc03a80854a6d06f3db775880a00df465c8bd3e53dd290464b51c69f4afad03e8bbe80f0a70b7dc9896a43ca4c75eaa97dc11713e1bacd650d1-6c09ff8204f1fce099cde4b86dd74ba5",
		modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
		id: "mySession",
	});

	const outlineEffectDefinition: IOutlineEffectDefinition = {
		properties: {
			/** The blend function of this effect. (default: BlendFunction.SCREEN) */
			blendFunction: BlendFunction.ALPHA,
			/** Whether the outline should be blurred. (default: false) */
			blur: true,
			/** The edge strength. (default: 1.0) */
			edgeStrength: 10,
			/** The color of hidden edges. (default: #22090a) */
			hiddenEdgeColor: "#ffffff",
			/** The blur kernel size. (default: KernelSize.VERY_SMALL) */
			kernelSize: KernelSize.LARGE,
			/** The number of samples used for multisample antialiasing. Requires WebGL 2. (default: 0) */
			multisampling: 0,
			/** The pulse speed. A value of zero disables the pulse effect. (default: 0.0) */
			pulseSpeed: 0,
			/** The color of visible edges. (default: #ffffff) */
			visibleEdgeColor: "#ffffff",
			/** Whether occluded parts of selected objects should be visible. (default: true) */
			xRay: true,
		},
		type: POST_PROCESSING_EFFECT_TYPE.OUTLINE,
	};
	const outlineEffectToken = viewport.postProcessing.addEffect(
		outlineEffectDefinition,
	);

	// create the interactionEngine and provide it the viewport object
	const interactionEngine = new InteractionEngine(viewport);

	// create the selectionManager and add it
	const selectManger = new SelectManager();
	interactionEngine.addInteractionManager(selectManger);

	for (let i = 0; i < session.node.children.length; i++) {
		session.node.children[i].data.push(new InteractionData({select: true}));
		session.node.children[i].updateVersion();
	}

	addListener(SDV.EVENTTYPE.INTERACTION.SELECT_ON, (e) => {
		const dragEvent: IDragEvent = e as IDragEvent;
		viewport.postProcessing.outlineEffects[
			outlineEffectToken
		].clearSelection();
		viewport.postProcessing.outlineEffects[outlineEffectToken].addSelection(
			dragEvent.node,
		);
	});
})();
