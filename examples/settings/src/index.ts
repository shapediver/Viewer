import * as SDV from "@shapediver/viewer";
import {
	createCustomUi,
	type IDropdownElement} from "@shapediver/viewer.shared.demo-helper";
(<any>window).SDV = SDV;

(async () => {
	const viewport = await SDV.createViewport({
		id: "myViewport",
		canvas: <HTMLCanvasElement>document.getElementById("canvas"),
		visibility: SDV.VISIBILITY_MODE.MANUAL,
	});

	// read out query parameters for "ticket" and "modelViewUrl"
	const urlParams = new URLSearchParams(window.location.search);
	const ticket = urlParams.get("ticket");
	const modelViewUrl = urlParams.get("modelViewUrl");

	const session = await SDV.createSession({
		id: "mySession",
		ticket:
			ticket ??
			"aa8f99304bdad13693a123c9187a6a764c13345c448814ad7c70d79dae1b555b72795fbb2fd6faa368ff8cdee1368821771bec38f4b39c5e9fb7955be8c2b5f8f8da605fd4cdc1708402118ad706e8578a108c1fb6b6429f1e7279e19b12d0944a317848fa3ba8-78c86ce3f2f177c0b6ac5dafbb94e84e",
		modelViewUrl:
			modelViewUrl ?? "https://sdr8euc1.eu-central-1.shapediver.com",
	});

	const settings = SDV.defaultSettings["default"];
	await session.applySettings(
		{version: "", viewer: {config: settings()}},
		{
			viewport: {
				ar: true,
				camera: true,
				environment: true,
				general: true,
				light: true,
				postprocessing: true,
				scene: true,
			},
		},
	);

	viewport.show = true;

	await viewport.camera?.zoomTo(undefined, {duration: 0});

	// create a dropdown menu to switch between different settings
	const settingsUiDiv = document.createElement("div");
	settingsUiDiv.style.position = "absolute";
	settingsUiDiv.style.width = "20rem";
	document.body.appendChild(settingsUiDiv);
	createCustomUi(
		[
			<IDropdownElement>{
				type: "dropdown",
				name: "Settings",
				label: "Settings",
				choices: Object.keys(SDV.defaultSettings),
				value: Object.keys(SDV.defaultSettings).indexOf("default"),
				onChangeCallback: async (index: number) => {
					const settings =
						SDV.defaultSettings[
							Object.keys(SDV.defaultSettings)[
								index
							] as keyof typeof SDV.defaultSettings
						];
					await session.applySettings(
						{version: "", viewer: {config: settings()}},
						{
							viewport: {
								ar: true,
								camera: true,
								environment: true,
								general: true,
								light: true,
								postprocessing: true,
								scene: true,
							},
						},
					);
				},
			},
		],
		settingsUiDiv,
	);
})();
