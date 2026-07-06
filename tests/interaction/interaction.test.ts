import {expect, test} from "@playwright/test";

const name = "interaction";

test.describe("Interaction", () => {
	test.beforeEach(async ({page}) => {
		await page.goto(
			"test-cdn/index.html",
		);

		// Inject the #bottom and #top overlay buttons used by the test interactions
		await page.evaluate(() => {
			const createButton = (id: string, left: number, ondown: string) => {
				const btn = document.createElement("input");
				btn.id = id;
				btn.type = "button";
				btn.style.position = "absolute";
				btn.style.left = left + "px";
				btn.style.top = "25px";
				btn.style.width = "100px";
				btn.style.height = "100px";
				btn.setAttribute("onpointerdown", ondown);
				document.body.appendChild(btn);
			};
			createButton("bottom", 25, "window.addBottomShelf()");
			createButton("top", 125, "window.addTopShelf()");
		});

		await page.evaluate(async () => {
			const SDV = (<any>window).SDV;
			const SDVInteractions = (<any>window).SDVInteractions;
			const {mat4, vec3, quat} = (<any>window).GL_MATRIX;

			const {
				DragManager,
				HoverManager,
				IDragEvent,
				InteractionData,
				InteractionEngine,
				LineConstraint,
				PlaneConstraint,
				PointConstraint,
			} = SDVInteractions;

			// Shelf definitions (inlined from definition.ts)
			const bottomShelf: any = {
				matrices: [
					{
						transformation: mat4.create(),
						rotation: mat4.create(),
						translation: mat4.create(),
					},
				],
				counter: 1,
				snapPoints: [
					{
						point: vec3.fromValues(-2.2, 0, 0),
						radius: 0.5,
						rotation: {axis: vec3.fromValues(0, 0, 1), angle: 0},
					},
					{
						point: vec3.fromValues(-1.6, 0, 0),
						radius: 0.5,
						rotation: {axis: vec3.fromValues(0, 0, 1), angle: 0},
					},
					{
						point: vec3.fromValues(-1.0, 0, 0),
						radius: 0.5,
						rotation: {axis: vec3.fromValues(0, 0, 1), angle: 0},
					},
					{
						point: vec3.fromValues(-0.4, 0, 0),
						radius: 0.5,
						rotation: {axis: vec3.fromValues(0, 0, 1), angle: 0},
					},
					{
						point: vec3.fromValues(0.2, 0, 0),
						radius: 0.5,
						rotation: {axis: vec3.fromValues(0, 0, 1), angle: 0},
					},
					{
						point: vec3.fromValues(0.8, 0, 0),
						radius: 0.5,
						rotation: {axis: vec3.fromValues(0, 0, 1), angle: 0},
					},
					{
						point: vec3.fromValues(1.4, 0, 0),
						radius: 0.5,
						rotation: {axis: vec3.fromValues(0, 0, 1), angle: 0},
					},
					{
						point: vec3.fromValues(2.0, 0, 0),
						radius: 0.5,
						rotation: {axis: vec3.fromValues(0, 0, 1), angle: 0},
					},
					{
						point: vec3.fromValues(-2.5, -0.3, 0),
						radius: 0.5,
						rotation: {
							axis: vec3.fromValues(0, 0, 1),
							angle: Math.PI / 2,
						},
					},
					{
						point: vec3.fromValues(-2.5, -0.9, 0),
						radius: 0.5,
						rotation: {
							axis: vec3.fromValues(0, 0, 1),
							angle: Math.PI / 2,
						},
					},
					{
						point: vec3.fromValues(-2.5, -1.5, 0),
						radius: 0.5,
						rotation: {
							axis: vec3.fromValues(0, 0, 1),
							angle: Math.PI / 2,
						},
					},
					{
						point: vec3.fromValues(-2.5, -2.1, 0),
						radius: 0.5,
						rotation: {
							axis: vec3.fromValues(0, 0, 1),
							angle: Math.PI / 2,
						},
					},
					{
						point: vec3.fromValues(-2.5, -2.7, 0),
						radius: 0.5,
						rotation: {
							axis: vec3.fromValues(0, 0, 1),
							angle: Math.PI / 2,
						},
					},
					{
						point: vec3.fromValues(-2.5, -3.3, 0),
						radius: 0.5,
						rotation: {
							axis: vec3.fromValues(0, 0, 1),
							angle: Math.PI / 2,
						},
					},
					{
						point: vec3.fromValues(-2.5, -3.9, 0),
						radius: 0.5,
						rotation: {
							axis: vec3.fromValues(0, 0, 1),
							angle: Math.PI / 2,
						},
					},
					{
						point: vec3.fromValues(-2.5, -4.5, 0),
						radius: 0.5,
						rotation: {
							axis: vec3.fromValues(0, 0, 1),
							angle: Math.PI / 2,
						},
					},
				],
				snapLines: [
					{
						point1: vec3.fromValues(-2.2, -5, 0),
						point2: vec3.fromValues(2.2, -5, 0),
						radius: 0.5,
						rotation: {
							axis: vec3.fromValues(0, 0, 1),
							angle: Math.PI,
						},
					},
					{
						point1: vec3.fromValues(2.5, -0.3, 0),
						point2: vec3.fromValues(2.5, -4.7, 0),
						radius: 0.5,
						rotation: {
							axis: vec3.fromValues(0, 0, 1),
							angle: -Math.PI / 2,
						},
					},
				],
			};

			const topShelf: any = {
				matrices: [
					{
						transformation: mat4.create(),
						rotation: mat4.create(),
						translation: mat4.create(),
					},
				],
				counter: 1,
				snapPoints: [
					{
						point: vec3.fromValues(-2.2, 0, 1.5),
						radius: 0.5,
						rotation: {axis: vec3.fromValues(0, 0, 1), angle: 0},
					},
					{
						point: vec3.fromValues(-1.6, 0, 1.5),
						radius: 0.5,
						rotation: {axis: vec3.fromValues(0, 0, 1), angle: 0},
					},
					{
						point: vec3.fromValues(-1.0, 0, 1.5),
						radius: 0.5,
						rotation: {axis: vec3.fromValues(0, 0, 1), angle: 0},
					},
					{
						point: vec3.fromValues(-0.4, 0, 1.5),
						radius: 0.5,
						rotation: {axis: vec3.fromValues(0, 0, 1), angle: 0},
					},
					{
						point: vec3.fromValues(0.2, 0, 1.5),
						radius: 0.5,
						rotation: {axis: vec3.fromValues(0, 0, 1), angle: 0},
					},
					{
						point: vec3.fromValues(0.8, 0, 1.5),
						radius: 0.5,
						rotation: {axis: vec3.fromValues(0, 0, 1), angle: 0},
					},
					{
						point: vec3.fromValues(1.4, 0, 1.5),
						radius: 0.5,
						rotation: {axis: vec3.fromValues(0, 0, 1), angle: 0},
					},
					{
						point: vec3.fromValues(2.0, 0, 1.5),
						radius: 0.5,
						rotation: {axis: vec3.fromValues(0, 0, 1), angle: 0},
					},
					{
						point: vec3.fromValues(-2.5, -0.3, 1.5),
						radius: 0.5,
						rotation: {
							axis: vec3.fromValues(0, 0, 1),
							angle: Math.PI / 2,
						},
					},
					{
						point: vec3.fromValues(-2.5, -0.9, 1.5),
						radius: 0.5,
						rotation: {
							axis: vec3.fromValues(0, 0, 1),
							angle: Math.PI / 2,
						},
					},
					{
						point: vec3.fromValues(-2.5, -1.5, 1.5),
						radius: 0.5,
						rotation: {
							axis: vec3.fromValues(0, 0, 1),
							angle: Math.PI / 2,
						},
					},
					{
						point: vec3.fromValues(-2.5, -2.1, 1.5),
						radius: 0.5,
						rotation: {
							axis: vec3.fromValues(0, 0, 1),
							angle: Math.PI / 2,
						},
					},
					{
						point: vec3.fromValues(-2.5, -2.7, 1.5),
						radius: 0.5,
						rotation: {
							axis: vec3.fromValues(0, 0, 1),
							angle: Math.PI / 2,
						},
					},
					{
						point: vec3.fromValues(-2.5, -3.3, 1.5),
						radius: 0.5,
						rotation: {
							axis: vec3.fromValues(0, 0, 1),
							angle: Math.PI / 2,
						},
					},
					{
						point: vec3.fromValues(-2.5, -3.9, 1.5),
						radius: 0.5,
						rotation: {
							axis: vec3.fromValues(0, 0, 1),
							angle: Math.PI / 2,
						},
					},
					{
						point: vec3.fromValues(-2.5, -4.5, 1.5),
						radius: 0.5,
						rotation: {
							axis: vec3.fromValues(0, 0, 1),
							angle: Math.PI / 2,
						},
					},
				],
				snapLines: [
					{
						point1: vec3.fromValues(-2.2, -5, 1.5),
						point2: vec3.fromValues(2.2, -5, 1.5),
						radius: 0.5,
						rotation: {
							axis: vec3.fromValues(0, 0, 1),
							angle: Math.PI,
						},
					},
					{
						point1: vec3.fromValues(2.5, -0.3, 1.5),
						point2: vec3.fromValues(2.5, -4.7, 1.5),
						radius: 0.5,
						rotation: {
							axis: vec3.fromValues(0, 0, 1),
							angle: -Math.PI / 2,
						},
					},
				],
			};

			// Track mouse/touch state for drag-from-outside behaviour
			let mouseDown = 0;
			document.body.onmousedown = () => {
				++mouseDown;
			};
			document.body.onmouseup = () => {
				--mouseDown;
			};
			let touchDown = 0;
			document.body.ontouchstart = () => {
				++touchDown;
			};
			document.body.ontouchend = () => {
				--touchDown;
			};

			let customizationInProgress = false;
			const dragLineConstraintsIDs: string[] = [];
			const activateInteractionsToken = {start: "", end: ""};

			let session: any;
			let viewport: any;
			let dragManager: any;
			let hoverManager: any;

			const updateParameter = async (def: any) => {
				const stringMatrixArray: string[] = [];
				def.matrices.forEach((m: any) =>
					stringMatrixArray.push(
						"[" + m.transformation.toString() + "]",
					),
				);
				def.parameter.value =
					stringMatrixArray.length === 0
						? "{}"
						: `{matrices:[${stringMatrixArray.join()}]}`;
				await session.customize();
			};

			const updateInteractions = (interactionTypes: {
				[key: string]: boolean;
			}) => {
				const shelves = [topShelf, bottomShelf];
				for (let i = 0; i < shelves.length; i++) {
					for (let j = 0; j < shelves[i].counter; j++) {
						const node = shelves[i].output.node.getNodesByName(
							shelves[i].output.name + "_" + j,
						)[0];
						if (!node) continue;
						const data = new InteractionData(interactionTypes);
						let inverse = mat4.invert(
							mat4.create(),
							shelves[i].matrices[j].rotation,
						);
						if (!inverse) inverse = mat4.create();
						const bb = node.boundingBox
							.clone()
							.applyMatrix(inverse);
						const position = vec3.fromValues(
							(bb.max[0] + bb.min[0]) / 2,
							bb.max[1],
							bb.min[2],
						);
						vec3.transformMat4(
							position,
							position,
							shelves[i].matrices[j].rotation,
						);
						const angle = quat.getAngle(
							quat.setAxisAngle(
								quat.create(),
								vec3.fromValues(0, 0, 1),
								0,
							),
							mat4.getRotation(
								quat.create(),
								shelves[i].matrices[j].rotation,
							),
						);
						data.dragAnchors.push({
							position,
							rotation: {axis: vec3.fromValues(0, 0, 1), angle},
						});
						const old = node.data.filter(
							(d: any) => d instanceof InteractionData,
						);
						node.removeData(old);
						node.addData(data);
					}
				}
			};

			const deactivateInteractions = () => {
				dragLineConstraintsIDs.forEach((d) =>
					dragManager.removeDragConstraint(d),
				);
				SDV.removeListener(activateInteractionsToken.start);
				SDV.removeListener(activateInteractionsToken.end);
				updateInteractions({drag: false, hover: false});
			};

			const activateInteractions = () => {
				deactivateInteractions();
				updateInteractions({drag: true, hover: true});
				activateInteractionsToken.start = SDV.addListener(
					SDV.EVENTTYPE.INTERACTION.DRAG_START,
					async (e: any) => {
						if (customizationInProgress) {
							dragManager.removeNode();
							return;
						}
						dragLineConstraintsIDs.forEach((d) =>
							dragManager.removeDragConstraint(d),
						);
						const shelves = [topShelf, bottomShelf];
						let def: any;
						for (let i = 0; i < shelves.length; i++) {
							if (
								e.node.getPath().includes(shelves[i].output.id)
							) {
								def = shelves[i];
								def.snapPoints.forEach((element: any) =>
									dragLineConstraintsIDs.push(
										dragManager.addDragConstraint(
											new PointConstraint(
												element.point,
												element.radius,
												element.rotation,
											),
										),
									),
								);
								def.snapLines.forEach((element: any) =>
									dragLineConstraintsIDs.push(
										dragManager.addDragConstraint(
											new LineConstraint(
												element.point1,
												element.point2,
												element.radius,
												element.rotation,
											),
										),
									),
								);
								break;
							}
						}
						activateInteractionsToken.end = SDV.addListener(
							SDV.EVENTTYPE.INTERACTION.DRAG_END,
							async (e: any) => {
								dragLineConstraintsIDs.forEach((d) =>
									dragManager.removeDragConstraint(d),
								);
								const number = e.node
									.getPath()
									.substring(
										e.node.getPath().lastIndexOf("_") + 1,
									);
								mat4.multiply(
									def.matrices[+number].translation,
									def.matrices[+number].translation,
									mat4.fromTranslation(
										mat4.create(),
										mat4.getTranslation(
											vec3.create(),
											e.matrix,
										),
									),
								);
								mat4.multiply(
									def.matrices[+number].rotation,
									def.matrices[+number].rotation,
									mat4.fromQuat(
										mat4.create(),
										mat4.getRotation(
											quat.create(),
											e.matrix,
										),
									),
								);
								mat4.multiply(
									def.matrices[+number].transformation,
									def.matrices[+number].transformation,
									mat4.transpose(mat4.create(), e.matrix),
								);
								customizationInProgress = true;
								await updateParameter(def);
								const node = def.output.node.getNodesByName(
									def.output.name + "_" + (def.counter - 1),
								)[0];
								node.visible = false;
								node.updateVersion(false, false);
								viewport.updateNode(node);
								SDV.removeListener(
									activateInteractionsToken.end,
								);
								activateInteractions();
								customizationInProgress = false;
							},
						);
						SDV.removeListener(activateInteractionsToken.start);
					},
				);
			};

			const addShelf = async (def: any) => {
				if (customizationInProgress) return;
				deactivateInteractions();
				const dragConstraintsIDs: string[] = [];
				def.snapPoints.forEach((element: any) =>
					dragConstraintsIDs.push(
						dragManager.addDragConstraint(
							new PointConstraint(
								element.point,
								element.radius,
								element.rotation,
							),
						),
					),
				);
				def.snapLines.forEach((element: any) =>
					dragConstraintsIDs.push(
						dragManager.addDragConstraint(
							new LineConstraint(
								element.point1,
								element.point2,
								element.radius,
								element.rotation,
							),
						),
					),
				);
				const newNode = def.output.node.getNodesByName(
					def.output.name + "_" + (def.counter - 1),
				)[0];
				const data = new InteractionData({drag: true});
				data.dragOrigin = vec3.fromValues(
					(newNode.boundingBox.max[0] + newNode.boundingBox.min[0]) /
						2,
					newNode.boundingBox.max[1],
					newNode.boundingBox.min[2],
				);
				newNode.addData(data);
				newNode.visible = false;
				viewport.update();
				dragManager.setNode(newNode);
				const tokenMove = SDV.addListener(
					SDV.EVENTTYPE.INTERACTION.DRAG_MOVE,
					async () => {
						if (!mouseDown && !touchDown) {
							dragManager.removeNode();
							activateInteractions();
						} else {
							newNode.visible = true;
							newNode.updateVersion(false, false);
							viewport.updateNode(newNode);
						}
						SDV.removeListener(tokenMove);
					},
				);
				const tokenEnd = SDV.addListener(
					SDV.EVENTTYPE.INTERACTION.DRAG_END,
					async (e: any) => {
						dragConstraintsIDs.forEach((d) =>
							dragManager.removeDragConstraint(d),
						);
						def.matrices[def.matrices.length - 1].translation =
							mat4.fromTranslation(
								mat4.create(),
								mat4.getTranslation(vec3.create(), e.matrix),
							);
						def.matrices[def.matrices.length - 1].rotation =
							mat4.fromQuat(
								mat4.create(),
								mat4.getRotation(quat.create(), e.matrix),
							);
						mat4.multiply(
							def.matrices[def.matrices.length - 1]
								.transformation,
							def.matrices[def.matrices.length - 1]
								.transformation,
							mat4.transpose(mat4.create(), e.matrix),
						);
						def.matrices.push({
							transformation: mat4.create(),
							rotation: mat4.create(),
							translation: mat4.create(),
						});
						def.counter++;
						customizationInProgress = true;
						await updateParameter(def);
						const node = def.output.node.getNodesByName(
							def.output.name + "_" + (def.counter - 1),
						)[0];
						node.visible = false;
						node.updateVersion(false, false);
						viewport.updateNode(node);
						SDV.removeListener(tokenEnd);
						activateInteractions();
						customizationInProgress = false;
					},
				);
			};

			(<any>window).addTopShelf = async () => addShelf(topShelf);
			(<any>window).addBottomShelf = async () => addShelf(bottomShelf);

			// Initialize viewport and session
			customizationInProgress = true;
			viewport = await SDV.createViewport({
				canvas: <HTMLCanvasElement>document.getElementById("canvas"),
				id: "myViewport",
				visibility: SDV.VISIBILITY_MODE.MANUAL,
			});
			session = await SDV.createSession({
				ticket: "0d547cd66556b390b5184d53386064d05eadb0b553dfd455a37f1ed8de2a688bf3c4bba1c1d977f5bece5ad6ce669782e4cc01b376e28f29db0488f022a0e7d64c72509db437511b30080f3534d7a7a7b045d53bd49d5fcdc4d5c9af3ad5bd1ab16d6317af5999-0dbbcdc5c2ebf524aa59dbdce0b99712",
				modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
				id: "mySession",
			});
			viewport.beautyRenderDelay = 100;
			viewport.beautyRenderBlendingDuration = 1;

			// Adjust lights for the large scene
			const directionalLight = Object.values(
				(viewport.lightScene as any).lights,
			).find((l: any) => l.type === SDV.LIGHT_TYPE.DIRECTIONAL) as any;
			directionalLight.shadowMapResolution = 4096;
			directionalLight.shadowMapBias = -0.0005;

			topShelf.output = session.getOutputByName("topShelf")[0];
			bottomShelf.output = session.getOutputByName("bottomShelf")[0];
			topShelf.parameter =
				session.getParameterByName("topShelfMatrices")[0];
			bottomShelf.parameter = session.getParameterByName(
				"bottomShelfMatrices",
			)[0];

			await updateParameter(topShelf);
			await updateParameter(bottomShelf);

			const shelves = [topShelf, bottomShelf];
			for (let i = 0; i < shelves.length; i++) {
				const node = shelves[i].output.node.getNodesByName(
					shelves[i].output.name + "_0",
				)[0];
				node.visible = false;
				node.updateVersion(false, false);
			}
			viewport.update();
			viewport.show = true;

			// Set up interaction engine and managers
			const interactionEngine = new InteractionEngine(viewport);
			hoverManager = new HoverManager();
			hoverManager.effectMaterial = new SDV.MaterialStandardData({
				color: "#dddddd",
			});
			interactionEngine.addInteractionManager(hoverManager);
			dragManager = new DragManager();
			dragManager.effectMaterial = new SDV.MaterialStandardData({
				color: "#dddddd",
			});
			interactionEngine.addInteractionManager(dragManager);

			dragManager.addDragConstraint(
				new PlaneConstraint(
					vec3.fromValues(0, -1, 0),
					vec3.fromValues(0, -0.3, 0),
				),
			);
			dragManager.addDragConstraint(
				new PlaneConstraint(
					vec3.fromValues(1, 0, 0),
					vec3.fromValues(-2.5, 0, 0),
					{
						axis: vec3.fromValues(0, 0, 1),
						angle: Math.PI / 2,
					},
				),
			);
			dragManager.addDragConstraint(
				new PlaneConstraint(
					vec3.fromValues(0, 0, 1),
					vec3.fromValues(0, 0, 0),
				),
			);
			customizationInProgress = false;
		});
	});

	test("drag interactions", async ({page}) => {
		await page.waitForTimeout(1000);

		const factor = 0.75;

		const bottomBox = await page.locator("#bottom").boundingBox();
		const bottomCX = bottomBox!.x + bottomBox!.width / 2;
		const bottomCY = bottomBox!.y + bottomBox!.height / 2;

		const topBox = await page.locator("#top").boundingBox();
		const topCX = topBox!.x + topBox!.width / 2;
		const topCY = topBox!.y + topBox!.height / 2;

		// bottom interactions
		await page.mouse.move(bottomCX, bottomCY);
		await page.mouse.down();
		await page.waitForTimeout(1000);
		await page.mouse.move(
			Math.round(640 * factor),
			Math.round(380 * factor),
		);
		await page.mouse.up();
		await page.waitForTimeout(1000);

		await page.mouse.move(bottomCX, bottomCY);
		await page.mouse.down();
		await page.waitForTimeout(1000);
		await page.mouse.move(
			Math.round(840 * factor),
			Math.round(450 * factor),
		);
		await page.mouse.up();
		await page.waitForTimeout(1000);

		await page.mouse.move(bottomCX, bottomCY);
		await page.mouse.down();
		await page.waitForTimeout(1000);
		await page.mouse.move(
			Math.round(540 * factor),
			Math.round(400 * factor),
		);
		await page.mouse.up();
		await page.waitForTimeout(1000);

		// top interactions
		await page.mouse.move(topCX, topCY);
		await page.mouse.down();
		await page.waitForTimeout(1000);
		await page.mouse.move(
			Math.round(640 * factor),
			Math.round(300 * factor),
		);
		await page.mouse.up();
		await page.waitForTimeout(1000);

		await page.mouse.move(topCX, topCY);
		await page.mouse.down();
		await page.waitForTimeout(1000);
		await page.mouse.move(
			Math.round(850 * factor),
			Math.round(380 * factor),
		);
		await page.mouse.up();
		await page.waitForTimeout(1000);

		await page.mouse.move(topCX, topCY);
		await page.mouse.down();
		await page.waitForTimeout(1000);
		await page.mouse.move(
			Math.round(540 * factor),
			Math.round(300 * factor),
		);
		await page.mouse.up();
		await page.waitForTimeout(1000);

		await page.waitForTimeout(1000);
		await expect(page).toHaveScreenshot(name + "/interaction.png");
	});
});
