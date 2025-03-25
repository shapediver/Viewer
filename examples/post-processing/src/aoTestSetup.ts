import * as SDV from "@shapediver/viewer";
import {
	createSession,
	createViewport,
	POST_PROCESSING_EFFECT_TYPE,
} from "@shapediver/viewer";
import {mat4, vec3} from "gl-matrix";

(<any>window).SDV = SDV;

(async () => {
	let promises = [];
	for (let i = 1; i <= 4; i++) {
		promises.push(
			createViewport({
				canvas: document.getElementById(
					"canvas" + i,
				) as HTMLCanvasElement,
				id: "myViewport" + i,
				visibility: SDV.VISIBILITY_MODE.INSTANT,
			}),
		);
	}
	await Promise.all(promises);

	// create a session
	const session1 = await createSession({
		ticket: "2cda4f5fc595066965ee34e9577b32dbd49e9938ec965bb72aa078e1e59822d2a8420c14e7aca9142c5859e25eebcd9078fa0e798848d88193d740de047092448a950f770e8aed4b451027bd4b7875b64bda753b7c21be13022f3d2edcf3f15fdd519f117e42d3-9298c5dcbebb67e460904215807c8184",
		modelViewUrl: "https://sddev2.eu-central-1.shapediver.com",
		id: "mySession1",
		excludeViewports: ["myViewport2", "myViewport4"],
	});

	// create a session 2
	const session2 = await createSession({
		ticket: "2cda4f5fc595066965ee34e9577b32dbd49e9938ec965bb72aa078e1e59822d2a8420c14e7aca9142c5859e25eebcd9078fa0e798848d88193d740de047092448a950f770e8aed4b451027bd4b7875b64bda753b7c21be13022f3d2edcf3f15fdd519f117e42d3-9298c5dcbebb67e460904215807c8184",
		modelViewUrl: "https://sddev2.eu-central-1.shapediver.com",
		id: "mySession2",
		excludeViewports: ["myViewport1", "myViewport3"],
	});
	session2.node.addTransformation({
		id: "scale",
		matrix: mat4.fromScaling(
			mat4.create(),
			vec3.fromValues(0.001, 0.001, 0.001),
		),
	});
	session2.node.updateVersion();

	SDV.viewports["myViewport1"].postProcessing.addEffect({
		properties: {
			resolutionScale: 1,
			spp: 16,
			distance: 1,
			distanceIntensity: 1,
			intensity: 2.5,
			color: "#000000",
			iterations: 1,
			radius: 12,
			rings: 11,
			lumaPhi: 10,
			depthPhi: 2,
			normalPhi: 3.25,
			samples: 16,
		},
		type: POST_PROCESSING_EFFECT_TYPE.SSAO,
	});
	SDV.viewports["myViewport1"].camera?.zoomTo();

	SDV.viewports["myViewport2"].postProcessing.addEffect({
		properties: {
			resolutionScale: 1,
			spp: 16,
			distance: 1,
			distanceIntensity: 1,
			intensity: 2.5,
			color: "#000000",
			iterations: 1,
			radius: 12,
			rings: 11,
			lumaPhi: 10,
			depthPhi: 2,
			normalPhi: 3.25,
			samples: 16,
		},
		type: POST_PROCESSING_EFFECT_TYPE.SSAO,
	});
	SDV.viewports["myViewport2"].camera?.zoomTo();

	SDV.viewports["myViewport3"].postProcessing.addEffect({
		properties: {
			resolutionScale: 1,
			spp: 16,
			distance: 1,
			distanceIntensity: 1,
			intensity: 2.5,
			color: "#000000",
			bias: 10,
			thickness: 0.5,
			iterations: 1,
			radius: 12,
			rings: 11,
			lumaPhi: 10,
			depthPhi: 2,
			normalPhi: 3.25,
			samples: 16,
		},
		type: POST_PROCESSING_EFFECT_TYPE.HBAO,
	});
	SDV.viewports["myViewport3"].camera?.zoomTo();

	SDV.viewports["myViewport4"].postProcessing.addEffect({
		properties: {
			resolutionScale: 1,
			spp: 16,
			distance: 1,
			distanceIntensity: 1,
			intensity: 2.5,
			color: "#000000",
			bias: 10,
			thickness: 0.5,
			iterations: 1,
			radius: 12,
			rings: 11,
			lumaPhi: 10,
			depthPhi: 2,
			normalPhi: 3.25,
			samples: 16,
		},
		type: POST_PROCESSING_EFFECT_TYPE.HBAO,
	});
	SDV.viewports["myViewport4"].camera?.zoomTo();
})();
