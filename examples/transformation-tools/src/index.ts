import * as SDV from "@shapediver/viewer";
import {addListener, EVENTTYPE_TRANSFORMATION_TOOLS} from "@shapediver/viewer";
import {
	EventResponseMapping,
	RectangleTransform,
} from "@shapediver/viewer.features.transformation-tools";
import {RESTRICTION_TYPE} from "../../../rendering-engine/intersection-restriction-engine/dist";
import {
	createCustomUi,
	IBooleanElement,
	IDropdownElement,
	ISliderElement,
} from "@shapediver/viewer.shared.demo-helper";
import {RectangleTransformSettingsOptional} from "@shapediver/viewer.features.transformation-tools/dist/interfaces/rectangleTransform/IRectangleTransform";
import {vec3} from "gl-matrix";

(<any>window).SDV = SDV;

const sendNotification = (title: string, message: string) => {
	if (Notification.permission === "granted") {
		new Notification(title, {body: message});
	} else if (Notification.permission !== "denied") {
		Notification.requestPermission().then((permission) => {
			if (permission === "granted") {
				new Notification(title, {body: message});
			}
		});
	}
};

(async () => {
	// create the viewport
	const viewport = await SDV.createViewport({
		id: "myViewport",
		canvas: <HTMLCanvasElement>document.getElementById("canvas"),
	});

	// create the session
	const session = await SDV.createSession({
		id: "mySession",
		ticket: "50eb2a26ddaa432ca18288b8a120ef194fa35bb813e4f43ae89d657991a865f9deaa20a1c840e47cdf6dbc019cd16ae15a9a6b3a7d91722455299d6bd29b1f26b3ff3b7adaac1df3d50f3ba4d010a560180dff8f745c946dadb41167a3431e223d69b32743f167-5b9465f92a0cf9c235b8ea315aab0cd5",
		modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
	});

	const imageOutput = session.getOutputByName("Image Plane")![0];
	console.log(imageOutput.node?.boundingBox.boundingSphere.center);

	const settings: RectangleTransformSettingsOptional = {
		enableScaling: true,
		enableRotation: true,
		enableTranslation: true,
		plane: {
			origin: vec3.clone(
				imageOutput.node?.boundingBox.boundingSphere.center!,
			),
			vector_u: [1, 0, 0],
			vector_v: [0, 1, 0],
			type: RESTRICTION_TYPE.PLANE,
		},
	};

	// create the gumballTransform
	let gumballTransform = new RectangleTransform(viewport, [imageOutput.node!], settings);

	console.log(imageOutput.node!);

	/**
	 * Remove the transformation applied by this tool from all nodes, resetting
	 * them to the state they were in before the tool was created.
	 */
	const resetTransformation = () => {
		const idx = imageOutput.node!.transformations.findIndex(
			(t) => t.id === "SD_transformation_tools_matrix",
		);
		if (idx !== -1) {
			imageOutput.node!.transformations.splice(idx, 1);
			imageOutput.node!.updateVersion();
		}
	};
	/**
	 * Close the current rectangleTransform, reset the node transformation, and create a
	 * fresh rectangleTransform with the current settings.
	 */
	const recreateRectangleTransform = async () => {
		gumballTransform.close();
		resetTransformation();
		await new Promise((resolve) => setTimeout(resolve, 100)); // ensure the old rectangleTransform is fully closed before creating a new one
		gumballTransform = new RectangleTransform(viewport, [imageOutput.node!], settings);
	};

	// create an event listener for the gumballTransform
	const eventListenerToken = addListener(
		EVENTTYPE_TRANSFORMATION_TOOLS.MATRIX_CHANGED,
		(e) => {
			const gumballTransformEvent =
				e as EventResponseMapping[SDV.EVENTTYPE_TRANSFORMATION_TOOLS.MATRIX_CHANGED];

			// // show the notification
			// sendNotification(
			// 	"GumballTransform has changed",
			// 	`- viewportId: ${gumballTransformEvent.viewportId}
			// - nodes: ${gumballTransformEvent.nodes}
			// - transformations: ${gumballTransformEvent.transformations}`,
			// );
		},
	);

	const parameterUiDiv = document.createElement("div");
	parameterUiDiv.style.position = "absolute";
	parameterUiDiv.style.width = "20rem";
	parameterUiDiv.style.overflow = "scroll";
	parameterUiDiv.style.height = "100%";
	document.body.appendChild(parameterUiDiv);
	createCustomUi(
		[
			// ── General ──────────────────────────────────────────────────────
			<IBooleanElement>{
				type: "boolean",
				name: "Enable Translation",
				value: settings.enableTranslation ?? true,
				onChangeCallback: (value: boolean) => {
					settings.enableTranslation = value;
					recreateRectangleTransform();
				},
			},
			<IBooleanElement>{
				type: "boolean",
				name: "Enable Scaling",
				value: settings.enableScaling ?? true,
				onChangeCallback: (value: boolean) => {
					settings.enableScaling = value;
					recreateRectangleTransform();
				},
			},
			<IBooleanElement>{
				type: "boolean",
				name: "Enable Rotation",
				value: settings.enableRotation ?? true,
				onChangeCallback: (value: boolean) => {
					settings.enableRotation = value;
					recreateRectangleTransform();
				},
			},

			// ── Corners ───────────────────────────────────────────────────────
			<IBooleanElement>{
				type: "boolean",
				name: "Corner: Bottom Left",
				value: settings.corners?.bottomLeft ?? true,
				onChangeCallback: (value: boolean) => {
					settings.corners = {...settings.corners, bottomLeft: value};
					recreateRectangleTransform();
				},
			},
			<IBooleanElement>{
				type: "boolean",
				name: "Corner: Bottom Right",
				value: settings.corners?.bottomRight ?? true,
				onChangeCallback: (value: boolean) => {
					settings.corners = {
						...settings.corners,
						bottomRight: value,
					};
					recreateRectangleTransform();
				},
			},
			<IBooleanElement>{
				type: "boolean",
				name: "Corner: Top Right",
				value: settings.corners?.topRight ?? true,
				onChangeCallback: (value: boolean) => {
					settings.corners = {...settings.corners, topRight: value};
					recreateRectangleTransform();
				},
			},
			<IBooleanElement>{
				type: "boolean",
				name: "Corner: Top Left",
				value: settings.corners?.topLeft ?? true,
				onChangeCallback: (value: boolean) => {
					settings.corners = {...settings.corners, topLeft: value};
					recreateRectangleTransform();
				},
			},

			// ── Midpoints ─────────────────────────────────────────────────────
			<IBooleanElement>{
				type: "boolean",
				name: "Midpoint: Top",
				value: settings.midpoints?.top ?? true,
				onChangeCallback: (value: boolean) => {
					settings.midpoints = {...settings.midpoints, top: value};
					recreateRectangleTransform();
				},
			},
			<IBooleanElement>{
				type: "boolean",
				name: "Midpoint: Bottom",
				value: settings.midpoints?.bottom ?? true,
				onChangeCallback: (value: boolean) => {
					settings.midpoints = {...settings.midpoints, bottom: value};
					recreateRectangleTransform();
				},
			},
			<IBooleanElement>{
				type: "boolean",
				name: "Midpoint: Left",
				value: settings.midpoints?.left ?? true,
				onChangeCallback: (value: boolean) => {
					settings.midpoints = {...settings.midpoints, left: value};
					recreateRectangleTransform();
				},
			},
			<IBooleanElement>{
				type: "boolean",
				name: "Midpoint: Right",
				value: settings.midpoints?.right ?? true,
				onChangeCallback: (value: boolean) => {
					settings.midpoints = {...settings.midpoints, right: value};
					recreateRectangleTransform();
				},
			},

			// ── Scaling ───────────────────────────────────────────────────────
			<IBooleanElement>{
				type: "boolean",
				name: "Scaling: Uniform",
				value: settings.scaling?.uniform ?? false,
				onChangeCallback: (value: boolean) => {
					settings.scaling = {...settings.scaling, uniform: value};
					recreateRectangleTransform();
				},
			},
			<IBooleanElement>{
				type: "boolean",
				name: "Scaling: Allow X",
				value: settings.scaling?.x ?? true,
				onChangeCallback: (value: boolean) => {
					settings.scaling = {...settings.scaling, x: value};
					recreateRectangleTransform();
				},
			},
			<IBooleanElement>{
				type: "boolean",
				name: "Scaling: Allow Y",
				value: settings.scaling?.y ?? true,
				onChangeCallback: (value: boolean) => {
					settings.scaling = {...settings.scaling, y: value};
					recreateRectangleTransform();
				},
			},
			<ISliderElement>{
				type: "slider",
				name: "Scaling: X Min",
				min: 0,
				max: 100,
				step: 0.1,
				value: settings.scaling?.xMin ?? 0,
				onChangeCallback: (value: number) => {
					settings.scaling = {
						...settings.scaling,
						xMin: value || undefined,
					};
					recreateRectangleTransform();
				},
			},
			<ISliderElement>{
				type: "slider",
				name: "Scaling: X Max",
				min: 0,
				max: 100,
				step: 0.1,
				value: settings.scaling?.xMax ?? 0,
				onChangeCallback: (value: number) => {
					settings.scaling = {
						...settings.scaling,
						xMax: value || undefined,
					};
					recreateRectangleTransform();
				},
			},
			<ISliderElement>{
				type: "slider",
				name: "Scaling: Y Min",
				min: 0,
				max: 100,
				step: 0.1,
				value: settings.scaling?.yMin ?? 0,
				onChangeCallback: (value: number) => {
					settings.scaling = {
						...settings.scaling,
						yMin: value || undefined,
					};
					recreateRectangleTransform();
				},
			},
			<ISliderElement>{
				type: "slider",
				name: "Scaling: Y Max",
				min: 0,
				max: 100,
				step: 0.1,
				value: settings.scaling?.yMax ?? 0,
				onChangeCallback: (value: number) => {
					settings.scaling = {
						...settings.scaling,
						yMax: value || undefined,
					};
					recreateRectangleTransform();
				},
			},
			<ISliderElement>{
				type: "slider",
				name: "Scaling: Step",
				min: 0,
				max: 2,
				step: 0.05,
				value: settings.scaling?.step ?? 0,
				onChangeCallback: (value: number) => {
					settings.scaling = {
						...settings.scaling,
						step: value || undefined,
					};
					recreateRectangleTransform();
				},
			},
			<ISliderElement>{
				type: "slider",
				name: "Scaling: Step Threshold",
				min: 0,
				max: 1,
				step: 0.05,
				value: settings.scaling?.stepThreshold ?? 0,
				onChangeCallback: (value: number) => {
					settings.scaling = {
						...settings.scaling,
						stepThreshold: value || undefined,
					};
					recreateRectangleTransform();
				},
			},

			// ── Rotation ──────────────────────────────────────────────────────
			<ISliderElement>{
				type: "slider",
				name: "Rotation: Step (deg)",
				min: 0,
				max: 90,
				step: 0.1,
				value: settings.rotation?.step ?? 0,
				onChangeCallback: (value: number) => {
					settings.rotation = {
						...settings.rotation,
						step: value || undefined,
					};
					recreateRectangleTransform();
				},
			},
			<ISliderElement>{
				type: "slider",
				name: "Rotation: Step Threshold (deg)",
				min: 0,
				max: 45,
				step: 1,
				value: settings.rotation?.stepThreshold ?? 0,
				onChangeCallback: (value: number) => {
					settings.rotation = {
						...settings.rotation,
						stepThreshold: value || undefined,
					};
					recreateRectangleTransform();
				},
			},
			<ISliderElement>{
				type: "slider",
				name: "Rotation: Min (deg)",
				min: -360,
				max: 0,
				step: 1,
				value: settings.rotation?.min ?? -360,
				onChangeCallback: (value: number) => {
					settings.rotation = {
						...settings.rotation,
						min: value <= -360 ? undefined : value,
					};
					recreateRectangleTransform();
				},
			},
			<ISliderElement>{
				type: "slider",
				name: "Rotation: Max (deg)",
				min: 0,
				max: 360,
				step: 1,
				value: settings.rotation?.max ?? 360,
				onChangeCallback: (value: number) => {
					settings.rotation = {
						...settings.rotation,
						max: value >= 360 ? undefined : value,
					};
					recreateRectangleTransform();
				},
			},
			<ISliderElement>{
				type: "slider",
				name: "Rotation: Handle Distance",
				min: 0,
				max: 1,
				step: 0.05,
				value: settings.rotation?.handleDistance ?? 0.25,
				onChangeCallback: (value: number) => {
					settings.rotation = {
						...settings.rotation,
						handleDistance: value,
					};
					recreateRectangleTransform();
				},
			},
		],
		parameterUiDiv,
	);
})();
