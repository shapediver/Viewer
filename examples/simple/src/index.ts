import * as SDV from "@shapediver/viewer";
import {createUi} from "@shapediver/viewer.shared.demo-helper";
import {IParameter} from "../../../session-engine/session-engine/dist";
(<any>window).SDV = SDV;

(async () => {
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
			"3c7c067dca90f2fcaa7626964aefa3fe5bbf1a850e4b3a831613e35d9b86c47d015b54f9f9ea6d710be394257204d8c779710b46e4d0b1a81e53ac9cd15fcd5faf64e9bd9c95135501f2b342950a229f0101bd4693e1160d138924fb73429db8cd3743822a9e55-169f1d05952aafa303e06f6fcea4c2f4",
		modelViewUrl:
			modelViewUrl ?? "https://sdr8euc1.eu-central-1.shapediver.com",
		initialParameterValues: {
			anchor_3d_1_useContainer: "true",
		},
	});

	console.log(
		typeof (
			session.getParameterByName(
				"anchor_2d_1_useContainer",
			)[0] as IParameter<boolean>
		).value,
		typeof session.getParameterByName("anchor_3d_1_useContainer")[0].value,
	);
	// stringified
	// create the parameter ui on the right side
	const parameterUiDiv = document.createElement("div");
	parameterUiDiv.style.position = "absolute";
	parameterUiDiv.style.width = "20rem";
	parameterUiDiv.style.overflow = "scroll";
	parameterUiDiv.style.height = "100%";
	document.body.appendChild(parameterUiDiv);
	createUi(session, parameterUiDiv);
})();
