import * as SDV from "@shapediver/viewer";
import {
	BlendFunction,
	createSession,
	createViewport,
	type IOutlineEffectDefinition,
	KernelSize,
	POST_PROCESSING_EFFECT_TYPE} from "@shapediver/viewer";
import {
	createCustomUi,
	type IBooleanElement,
	type IColorElement,
	type IDropdownElement,
	type ISliderElement} from "@shapediver/viewer.shared.demo-helper";

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
			blendFunction: BlendFunction.SCREEN,
			/** Whether the outline should be blurred. (default: false) */
			blur: false,
			/** The edge strength. (default: 1.0) */
			edgeStrength: 1,
			/** The color of hidden edges. (default: #22090a) */
			hiddenEdgeColor: "#22090a",
			/** The blur kernel size. (default: KernelSize.VERY_SMALL) */
			kernelSize: KernelSize.VERY_SMALL,
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
	viewport.postProcessing.outlineEffects[outlineEffectToken].addSelection(
		session.node!,
	);

	createCustomUi(
		[
			<IDropdownElement>{
				name: "BlendFunction",
				type: "dropdown",
				onChangeCallback: (value: string) => {
					outlineEffectDefinition.properties!.blendFunction =
						Object.values(BlendFunction)[+value] as BlendFunction;
					viewport.postProcessing.updateEffect(
						outlineEffectToken,
						outlineEffectDefinition,
					);
					viewport.postProcessing.outlineEffects[
						outlineEffectToken
					].addSelection(session.node!);
				},
				choices: Object.keys(BlendFunction),
				value: Object.values(BlendFunction).indexOf(
					outlineEffectDefinition.properties!.blendFunction!,
				),
			},
			<IBooleanElement>{
				name: "blur",
				type: "boolean",
				onChangeCallback: (value: boolean) => {
					outlineEffectDefinition.properties!.blur = value;
					viewport.postProcessing.updateEffect(
						outlineEffectToken,
						outlineEffectDefinition,
					);
					viewport.postProcessing.outlineEffects[
						outlineEffectToken
					].addSelection(session.node!);
				},
				value: outlineEffectDefinition.properties!.blur,
			},
			<IBooleanElement>{
				name: "xRay",
				type: "boolean",
				onChangeCallback: (value: boolean) => {
					outlineEffectDefinition.properties!.xRay = value;
					viewport.postProcessing.updateEffect(
						outlineEffectToken,
						outlineEffectDefinition,
					);
					viewport.postProcessing.outlineEffects[
						outlineEffectToken
					].addSelection(session.node!);
				},
				value: outlineEffectDefinition.properties!.xRay,
			},
			<ISliderElement>{
				name: "edgeStrength",
				type: "slider",
				onChangeCallback: (value: number) => {
					outlineEffectDefinition.properties!.edgeStrength = value;
					viewport.postProcessing.updateEffect(
						outlineEffectToken,
						outlineEffectDefinition,
					);
					viewport.postProcessing.outlineEffects[
						outlineEffectToken
					].addSelection(session.node!);
				},
				value: outlineEffectDefinition.properties!.edgeStrength,
				min: 0,
				max: 100,
				step: 0.01,
			},
			<ISliderElement>{
				name: "multisampling",
				type: "slider",
				onChangeCallback: (value: number) => {
					outlineEffectDefinition.properties!.multisampling = value;
					viewport.postProcessing.updateEffect(
						outlineEffectToken,
						outlineEffectDefinition,
					);
					viewport.postProcessing.outlineEffects[
						outlineEffectToken
					].addSelection(session.node!);
				},
				value: outlineEffectDefinition.properties!.multisampling,
				min: 0,
				max: 10,
				step: 1,
			},
			<ISliderElement>{
				name: "pulseSpeed",
				type: "slider",
				onChangeCallback: (value: number) => {
					outlineEffectDefinition.properties!.pulseSpeed = value;
					viewport.postProcessing.updateEffect(
						outlineEffectToken,
						outlineEffectDefinition,
					);
					viewport.postProcessing.outlineEffects[
						outlineEffectToken
					].addSelection(session.node!);
				},
				value: outlineEffectDefinition.properties!.pulseSpeed,
				min: 0,
				max: 10,
				step: 0.01,
			},
			<IColorElement>{
				name: "visibleEdgeColor",
				type: "color",
				onChangeCallback: (value: string) => {
					outlineEffectDefinition.properties!.visibleEdgeColor =
						value;
					viewport.postProcessing.updateEffect(
						outlineEffectToken,
						outlineEffectDefinition,
					);
					viewport.postProcessing.outlineEffects[
						outlineEffectToken
					].addSelection(session.node!);
				},
				value: outlineEffectDefinition.properties!.visibleEdgeColor,
			},
			<IColorElement>{
				name: "hiddenEdgeColor",
				type: "color",
				onChangeCallback: (value: string) => {
					outlineEffectDefinition.properties!.hiddenEdgeColor = value;
					viewport.postProcessing.updateEffect(
						outlineEffectToken,
						outlineEffectDefinition,
					);
					viewport.postProcessing.outlineEffects[
						outlineEffectToken
					].addSelection(session.node!);
				},
				value: outlineEffectDefinition.properties!.hiddenEdgeColor,
			},
			<IDropdownElement>{
				name: "blur - kernelSize",
				type: "dropdown",
				onChangeCallback: (value: number) => {
					outlineEffectDefinition.properties!.kernelSize = value;
					viewport.postProcessing.updateEffect(
						outlineEffectToken,
						outlineEffectDefinition,
					);
					viewport.postProcessing.outlineEffects[
						outlineEffectToken
					].addSelection(session.node!);
				},
				choices: Object.keys(KernelSize),
				value: outlineEffectDefinition.properties!.kernelSize,
			},
		],
		document.getElementById("ui") as HTMLDivElement,
	);
})();
