import * as SDV from "@shapediver/viewer";
import {addListener, EVENTTYPE_TRANSFORMATION_TOOLS} from "@shapediver/viewer";
import {
	EventResponseMapping,
	GumballTransform,
} from "@shapediver/viewer.features.transformation-tools";

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
		ticket: "8894e4cc24fe1188912016ba6852de3577c51304f924d7c5450c71b524551ff48f7d5b928391a815c585c0ab810b3a6426d20a9ec05cb691572e4656dfde7cbc2a59ad05133b3e4787324b8414fe6b6a548a3c84632aee22fc2f02d56a1f40b3876effedd731a2-9194398ae33fb0500a689a3e3982c4e1",
		modelViewUrl: "https://sddev3.eu-central-1.shapediver.com",
	});

	let boxTranslatedNode: SDV.ITreeNode | undefined = undefined;
	let boxTransformedNode: SDV.ITreeNode | undefined = undefined;
	let boxOriginalNode: SDV.ITreeNode | undefined = undefined;
	session.node.traverse((c) => {
		if (c.name === "box_transformed") boxTransformedNode = c;
		if (c.name === "box_translated") boxTranslatedNode = c;
		if (c.name === "box_original") boxOriginalNode = c;
	});

	// create the gumball
	const gumball = new GumballTransform(viewport, [boxTransformedNode!], {
		enableScaling: false,
		enableRotation: false,
		enableTranslation: true,
	});

	// create an event listener for the gumball
	const eventListenerToken = addListener(
		EVENTTYPE_TRANSFORMATION_TOOLS.MATRIX_CHANGED,
		(e) => {
			const gumballEvent =
				e as EventResponseMapping[EVENTTYPE_TRANSFORMATION_TOOLS.MATRIX_CHANGED];

			// show the notification
			sendNotification(
				"Gumball has changed",
				`- viewportId: ${gumballEvent.viewportId}
            - nodes: ${gumballEvent.nodes}
            - transformations: ${gumballEvent.transformations}`,
			);
		},
	);
})();
