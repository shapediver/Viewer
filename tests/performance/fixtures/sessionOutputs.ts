/**
 * The session tree of the `outputReplaced` budget (SS-10581) and the
 * memory leak test (SS-10582): the AEC tower split into the outputs of one
 * session, and a computation that replaces one output the way the session
 * engine does after a customization.
 */

/** One output of 10 floors and five of 2 floors, 20 floors in all. */
export const OUTPUT_FLOORS = [10, 2, 2, 2, 2, 2];

/**
 * Runs in the page. Replaces `__aec.build` with a builder of the session
 * tree described above and adds `window.__outputs`. Also adds
 * `window.__update`: the bounds computations and the nodes of the
 * last scene change.
 * It must not reference anything outside its own body.
 */
export function installOutputs(floors: number[]) {
	const SDV = (window as any).SDV;
	const aec = (window as any).__aec;
	const buildTower = aec.build;

	function output(index: number, options: any) {
		const content = buildTower({
			...options,
			floors: floors[index],
			detached: true,
		});
		const below = floors.slice(0, index).reduce((a, b) => a + b, 0);
		const z = below * options.floorHeight;
		content.root.addTransformation({
			id: "output",
			matrix: new Float32Array([
				1,
				0,
				0,
				0,
				0,
				1,
				0,
				0,
				0,
				0,
				1,
				0,
				0,
				0,
				z,
				1,
			]),
		});
		const node = new SDV.TreeNode(`output${index}`);
		node.addChild(content.root);
		// Hover on every output, as an app that highlights outputs has; the
		// app gives a new output the same interaction data.
		node.addData(
			new (window as any).SDVInteractions.InteractionData({hover: true}),
		);
		return node;
	}

	aec.build = (options: any) => {
		const session = new SDV.TreeNode("session");
		const outputs = floors.map((_, index) => output(index, options));
		for (const node of outputs) session.addChild(node);
		SDV.sceneTree.addNode(session);
		session.updateVersion();
		const side = options.baysPerSide * options.bayWidth;
		const height = floors.reduce((a, b) => a + b, 0) * options.floorHeight;
		return {
			root: session,
			outputs,
			options,
			glassNodes: [],
			mullionNodes: [],
			glassItems: [],
			items: [],
			// The camera of the 20-floor tower in `aecScene.ts`.
			camera: {
				position: [side * 2.2, -side * 3, height * 0.8],
				target: [0, 0, height / 2],
			},
		};
	};

	const state = {
		sceneChangeNodes: null as number | null,
		boundsComputed: 0,
		hovers: 0,
		programsCreated: 0,
		next: null as any,
	};

	SDV.addListener(SDV.EVENTTYPE.VIEWPORT.VIEWPORT_UPDATED, (event: any) => {
		state.sceneChangeNodes = event.sceneChanges?.nodes.length ?? -1;
	});
	SDV.addListener(SDV.EVENTTYPE.INTERACTION.HOVER_ON, () => state.hovers++);

	/**
	 * Hover on the outputs. The pick indexes (`IntersectionEngine`,
	 * `IntersectionManager`, the group index of the hover manager) are read
	 * from the tree at the first pick and only then follow scene updates.
	 * Also starts counting the programs three.js creates.
	 */
	function setupHover() {
		const probe = (window as any).__probe;
		// Programs created anywhere, also ahead of the draw
		// (`renderer.compile`). `info.programs` is the list three.js pushes a
		// new program onto (`WebGLPrograms.acquireProgram`); its length also
		// drops when programs are released.
		const programs = probe.renderer.info.programs;
		const push = programs.push;
		programs.push = function (...items: any[]) {
			state.programsCreated += items.length;
			return push.apply(this, items);
		};
		const {InteractionEngine, HoverManager} = (window as any)
			.SDVInteractions;
		const engine = new InteractionEngine(probe.viewport);
		const hover = new HoverManager();
		hover.effectMaterial = new SDV.MaterialStandardData({color: "#dddddd"});
		engine.addInteractionManager(hover);
	}

	let boundsTracked = false;
	/**
	 * Counts `computeBoundingBox` and `computeBoundingSphere` of geometries
	 * and batches: the structures a pick and the scene bounds read.
	 */
	function trackBounds() {
		if (boundsTracked) return;
		const probe = (window as any).__probe;
		const protos = new Set<any>();
		probe.scene.traverse((object: any) => {
			if (object.geometry)
				protos.add(Object.getPrototypeOf(object.geometry));
			if (object.isBatchedMesh) protos.add(Object.getPrototypeOf(object));
		});
		const wrapped = new Set<any>();
		for (const proto of protos) {
			for (const name of [
				"computeBoundingBox",
				"computeBoundingSphere",
			]) {
				let owner = proto;
				while (
					owner &&
					!Object.prototype.hasOwnProperty.call(owner, name)
				)
					owner = Object.getPrototypeOf(owner);
				if (!owner || wrapped.has(owner[name])) continue;
				const original = owner[name];
				const counted = function (this: unknown, ...args: any[]) {
					state.boundsComputed++;
					return original.apply(this, args);
				};
				wrapped.add(counted);
				owner[name] = counted;
			}
		}
		boundsTracked = true;
	}

	/** Builds the new output, outside the measured window. */
	function prepare(index: number) {
		const probe = (window as any).__probe;
		state.next = output(index, probe.aec.options);
	}

	/** Swaps the output in as a customization does, then updates. */
	function replace(index: number) {
		const probe = (window as any).__probe;
		const old = probe.aec.root;
		// The tree's version counter (shared/node-tree, `nextVersion`).
		const versions = () =>
			(globalThis as any)[Symbol.for("shapediver.viewer.treeVersion")]
				?.n ?? 0;
		const versionsBefore = versions();
		const session = new SDV.TreeNode("session");
		probe.aec.outputs.forEach((node: any, i: number) =>
			session.addChild(i === index ? state.next : node),
		);
		// UtilsManager.removeFromSceneTree
		const parent = old.parent ?? SDV.sceneTree.root;
		SDV.sceneTree.removeNode(old);
		parent.updateVersion(true, false);
		// UtilsManager.addToSceneTree
		SDV.sceneTree.addNode(session);
		session.updateVersion();
		const ids = versions() - versionsBefore;
		probe.aec.outputs[index] = state.next;
		probe.aec.root = session;
		state.next = null;
		probe.viewport.update();
		return {ids};
	}

	(window as any).__update = {
		state,
		trackBounds,
		setupHover,
		prepare,
		replace,
		reset() {
			state.sceneChangeNodes = null;
			state.boundsComputed = 0;
			state.programsCreated = 0;
		},
	};
}
