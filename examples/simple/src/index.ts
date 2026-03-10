import * as SDV from "@shapediver/viewer";
import {createUi} from "@shapediver/viewer.shared.demo-helper";
import {PerformanceEvaluator} from "../../../shared/services/dist";
(<any>window).SDV = SDV;
SDV.generalOptions.loggingLevel = SDV.LOGGING_LEVEL.DEBUG_LOW;

(async () => {
	const performanceEvaluator = PerformanceEvaluator.instance;
	const viewport = await SDV.createViewport({
		id: "myViewport",
		canvas: <HTMLCanvasElement>document.getElementById("canvas"),
	});

	// read out query parameters for "ticket" and "modelViewUrl"
	const urlParams = new URLSearchParams(window.location.search);
	const ticket = urlParams.get("ticket");
	const modelViewUrl = urlParams.get("modelViewUrl");

	const session = await SDV.createSession({
		id: "mySession",
		ticket:
			ticket ??
			"b23092d6875871663941aa086f9be50576d5d671db0950a529c6e79ef152f1017108204f3a2729210296f3abd957ec6918c77a4715ea971a6b875c0a5d289c52fd22cda143864548e0a52cc1ca86245632da666e2c2da22e2429c54f1b4aac7d6647d62072afb3-ddba3e023c46ba819b831fbab13c351d",
		modelViewUrl:
			modelViewUrl ?? "https://sdr8euc1.eu-central-1.shapediver.com",
		initialParameterValues: {
			"Number X": "10",
			"Number Y": "10",
			"Number Z": "50",
		},
		loadSdtf: true,
	});

	// let numberOfThreeJsObjects = 0;
	// (
	// 	SDV.sceneTree.root.convertedObject["myViewport"] as THREE.Object3D
	// ).traverseVisible(() => numberOfThreeJsObjects++);
	// console.log("Number of three.js objects in scene:", numberOfThreeJsObjects);

	// /**
	//  * LOADING ANALYSIS
	//  */

	// const bodySizeParam = session.getParameterByName(
	// 	"Body Size",
	// )[0] as SDV.IParameterApi<number>;

	// const times: {
	// 	total: number;
	// 	outputLoading: number;
	// 	sceneTreeUpdate: number;
	// 	loadGltf: number;
	// }[] = [];

	// for (let i = 0; i < 5; i++) {
	// 	performanceEvaluator.start();
	// 	bodySizeParam.value = +bodySizeParam.value + 1;
	// 	await session.customize();

	// 	await new Promise((resolve) =>
	// 		SDV.addListener(SDV.EVENTTYPE.VIEWPORT.VIEWPORT_UPDATED, resolve),
	// 	);

	// 	performanceEvaluator.end();
	// 	const evaluation = performanceEvaluator.getEvaluation();

	// 	const sceneTreeUpdateKey = Object.keys(evaluation!.section).find(
	// 		(key) => key.startsWith("sceneTreeUpdate."),
	// 	);
	// 	const outputLoadingKey = Object.keys(evaluation!.section).find((key) =>
	// 		key.startsWith("outputLoading."),
	// 	);
	// 	const sessionResponseKey = Object.keys(evaluation!.section).find(
	// 		(key) => key.startsWith("sessionResponse.customize."),
	// 	);

	// 	const loadGltfKey = Object.keys(evaluation!.section).find((key) =>
	// 		key.startsWith("loadGltf."),
	// 	);

	// 	times.push({
	// 		total:
	// 			evaluation!.duration! -
	// 			evaluation!.section[sessionResponseKey!].duration! -
	// 			evaluation!.section[loadGltfKey!].duration!,
	// 		outputLoading:
	// 			evaluation!.section[outputLoadingKey!].duration! -
	// 			evaluation!.section[loadGltfKey!].duration!,
	// 		sceneTreeUpdate: evaluation!.section[sceneTreeUpdateKey!].duration!,
	// 		loadGltf: evaluation!.section[loadGltfKey!].duration!,
	// 	});
	// }

	// console.log("Loading times:", times);
	// const avg = times.reduce(
	// 	(acc, time) => {
	// 		acc.total += time.total;
	// 		acc.outputLoading += time.outputLoading;
	// 		acc.sceneTreeUpdate += time.sceneTreeUpdate;
	// 		return acc;
	// 	},
	// 	{total: 0, outputLoading: 0, sceneTreeUpdate: 0},
	// );
	// avg.total /= times.length;
	// avg.outputLoading /= times.length;
	// avg.sceneTreeUpdate /= times.length;
	// console.log("Average loading times:", avg);

	// let numberOfNodes = 0;
	// SDV.sceneTree.root.traverse(() => {
	// 	numberOfNodes++;
	// });
	// console.log("Number of nodes in scene tree:", numberOfNodes);

	// numberOfThreeJsObjects = 0;
	// (
	// 	SDV.sceneTree.root.convertedObject["myViewport"] as THREE.Object3D
	// ).traverseVisible((o) => {
	// 	if (
	// 		!(
	// 			o instanceof THREE.Mesh ||
	// 			o instanceof THREE.Line ||
	// 			o instanceof THREE.Points
	// 		)
	// 	)
	// 		numberOfThreeJsObjects++;
	// });
	// console.log("Number of three.js objects in scene:", numberOfThreeJsObjects);

	// // format the number, from 1000.00 to 1000,00
	// const timeFormatter = (time: number) => {
	// 	return time.toFixed(2).replace(".", ",");
	// };

	// console.log(
	// 	`Full Analysis Report:\nTotal Time\tOutput Loading\tScene Tree Update\tNumber of Nodes\tNumber of three.js Objects\n${timeFormatter(avg.total)}\t${timeFormatter(avg.outputLoading)}\t${timeFormatter(avg.sceneTreeUpdate)}\t${numberOfNodes}\t${numberOfThreeJsObjects}`,
	// );

	// viewport.camera!.enableAutoRotation = true;
	// viewport.camera!.autoRotationSpeed = 1;
	// viewport.showStatistics = true;

	// create the parameter ui on the right side
	const parameterUiDiv = document.createElement("div");
	parameterUiDiv.style.position = "absolute";
	parameterUiDiv.style.width = "20rem";
	parameterUiDiv.style.overflow = "scroll";
	parameterUiDiv.style.height = "100%";
	document.body.appendChild(parameterUiDiv);
	createUi(session, parameterUiDiv);
})();
