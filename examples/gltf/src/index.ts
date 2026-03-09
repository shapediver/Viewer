import * as SDV from "@shapediver/viewer";
import {
	addListener,
	createViewport,
	ENVIRONMENT_MAP,
	EVENTTYPE,
	ITaskEvent,
	ITreeNode,
	sceneTree,
	TASK_TYPE,
	viewports,
} from "@shapediver/viewer";
import {DataEngine} from "@shapediver/viewer.data-engine.data-engine";

(<any>window).SDV = SDV;
(<any>window).gltfVersion = "2.0";

const dataEngine: DataEngine = DataEngine.instance;
let currentNode: ITreeNode;

let promise: Promise<void>;

(async () => {
	const viewer = await createViewport({
		canvas: <HTMLCanvasElement>document.getElementById("canvas"),
		id: "myViewer",
		branding: {
			logo: "https://viewer.shapediver.com/v3/graphics/gltf_monster.png",
			backgroundColor: "rgb(3, 5, 49)",
		},
	});
	viewer.shadows = false;
	viewer.physicallyCorrectLights = true;
	viewer.groundPlaneVisibility = false;
	viewer.gridVisibility = false;
	viewer.environmentMap = ENVIRONMENT_MAP.NEUTRAL;
	viewer.showStatistics = true;
	promise = new Promise<void>((resolve) => {
		addListener(EVENTTYPE.TASK.TASK_END, (e) => {
			const taskEvent = e as ITaskEvent;
			if (taskEvent.type === TASK_TYPE.ENVIRONMENT_MAP_LOADING) resolve();
		});
	});
	await promise;

	await (<any>window).addGLTF(`http://localhost:8080/sphereInstances.glb`);
})();

(<any>window).addGLTF = async (uri: string) => {
	await promise;
	const viewer = viewports["myViewer"];

	const node = await dataEngine.loadContent({
		format: (<any>window).gltfVersion === "1.0" ? "glb" : "gltf",
		href: uri,
	});
	if (currentNode) sceneTree.removeNode(currentNode);
	currentNode = node;
	sceneTree.addNode(currentNode);
	sceneTree.root.updateVersion();
	viewer.update();
	await viewer.camera!.set([0, 0, 0], [0, 0, 0], {duration: 0});
	await viewer.camera!.zoomTo(undefined, {duration: 0});
	viewer.show = true;
};
document.addEventListener("dragover", (event) => {
	event.preventDefault();
});

document.addEventListener("drop", (event) => {
	event.stopPropagation();
	event.preventDefault();
	const files = event.dataTransfer!.files;
	let rootFile: File | string = "";
	Array.from(files).forEach((file) => {
		if (file.name.match(/\.(gltf|glb)$/)) rootFile = file;
	});

	const fileURL =
		typeof rootFile === "string" ? rootFile : URL.createObjectURL(rootFile);
	(<any>window).addGLTF(fileURL);
});
