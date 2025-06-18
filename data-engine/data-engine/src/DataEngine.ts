import {ResOutputContent} from "@shapediver/sdk.geometry-api-sdk-v2";
import {GeometryEngine} from "@shapediver/viewer.data-engine.geometry-engine";
import {HTMLElementAnchorEngine} from "@shapediver/viewer.data-engine.html-element-anchor-engine";
import {MaterialEngine} from "@shapediver/viewer.data-engine.material-engine";
import {SDTFEngine} from "@shapediver/viewer.data-engine.sdtf-engine";
import {Tag3dEngine} from "@shapediver/viewer.data-engine.tag3d-engine";
import {ITreeNode, TreeNode} from "@shapediver/viewer.shared.node-tree";
import {
	EventEngine,
	EVENTTYPE,
	ShapeDiverViewerDataProcessingError,
	UuidGenerator,
} from "@shapediver/viewer.shared.services";
import {CustomData, TASK_TYPE} from "@shapediver/viewer.shared.types";
import {mat4} from "gl-matrix";

export class DataEngine {
	// #region Properties (8)

	private readonly _eventEngine: EventEngine = EventEngine.instance;
	private readonly _geometryEngine: GeometryEngine = GeometryEngine.instance;
	private readonly _htmlElementAnchorEngine: HTMLElementAnchorEngine =
		HTMLElementAnchorEngine.instance;
	private readonly _materialEngine: MaterialEngine = MaterialEngine.instance;
	private readonly _sdtfEngine: SDTFEngine = SDTFEngine.instance;
	private readonly _tag3dEngine: Tag3dEngine = Tag3dEngine.instance;
	private readonly _uuidGenerator: UuidGenerator = UuidGenerator.instance;

	private static _instance: DataEngine;

	// #endregion Properties (8)

	// #region Public Static Getters And Setters (1)

	public static get instance() {
		return this._instance || (this._instance = new this());
	}

	// #endregion Public Static Getters And Setters (1)

	// #region Public Methods (1)

	public async loadContent(
		content: ResOutputContent,
		jwtToken?: string,
		taskEventId?: string,
	): Promise<ITreeNode> {
		if (!content || (content && !content.format))
			throw new ShapeDiverViewerDataProcessingError(
				"DataEngine cannot load content.",
			);

		taskEventId = taskEventId || this._uuidGenerator.create();

		let node: ITreeNode;

		if (content.format === "glb" || content.format === "gltf") {
			node = await this._geometryEngine.loadContent(content, taskEventId);
		} else if (content.format === "material") {
			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, {
				type: TASK_TYPE.MATERIAL_CONTENT_LOADING,
				id: taskEventId,
				progress: 0,
				status: "Loading material content.",
			});
			node = await this._materialEngine.loadContent(content);
			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, {
				type: TASK_TYPE.MATERIAL_CONTENT_LOADING,
				id: taskEventId,
				progress: 1,
				status: "MATERIAL content loaded.",
			});
		} else if (content.format === "tag2d" || content.format === "anchor") {
			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, {
				type: TASK_TYPE.TAG_CONTENT_LOADING,
				id: taskEventId,
				progress: 0,
				status: "Loading tag content.",
			});
			node = await this._htmlElementAnchorEngine.loadContent(content);
			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, {
				type: TASK_TYPE.TAG_CONTENT_LOADING,
				id: taskEventId,
				progress: 1,
				status: "Tag content loaded.",
			});
		} else if (content.format === "tag3d") {
			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, {
				type: TASK_TYPE.TAG_CONTENT_LOADING,
				id: taskEventId,
				progress: 0,
				status: "Loading tag content.",
			});
			node = await this._tag3dEngine.loadContent(content);
			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, {
				type: TASK_TYPE.TAG_CONTENT_LOADING,
				id: taskEventId,
				progress: 1,
				status: "Tag content loaded.",
			});
		} else if (content.format === "sdtf") {
			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, {
				type: TASK_TYPE.SDTF_CONTENT_LOADING,
				id: taskEventId,
				progress: 0,
				status: "Loading sdTF content.",
			});
			node = await this._sdtfEngine.loadContent(content, jwtToken);
			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, {
				type: TASK_TYPE.SDTF_CONTENT_LOADING,
				id: taskEventId,
				progress: 1,
				status: "SdTF content loaded.",
			});
		} else {
			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_START, {
				type: TASK_TYPE.CUSTOM_CONTENT_LOADING,
				id: taskEventId,
				progress: 0,
				status: "Loading custom content.",
			});
			node = new TreeNode("custom");
			node.data.push(new CustomData({...content}));
			this._eventEngine.emitEvent(EVENTTYPE.TASK.TASK_END, {
				type: TASK_TYPE.CUSTOM_CONTENT_LOADING,
				id: taskEventId,
				progress: 1,
				status: "Custom content loaded.",
			});
		}

		const transformationNode = new TreeNode("transformation");
		if (content.transformations && Array.isArray(content.transformations)) {
			for (let i = 0; i < content.transformations.length; i++) {
				const t = content.transformations[i];
				if (Array.isArray(t) && t.length === 16) {
					const nodeInstance = node.clone();
					nodeInstance.transformations = [
						{
							id: "content_" + i,
							matrix: mat4.fromValues(
								t[0],
								t[1],
								t[2],
								t[3],
								t[4],
								t[5],
								t[6],
								t[7],
								t[8],
								t[9],
								t[10],
								t[11],
								t[12],
								t[13],
								t[14],
								t[15],
							),
						},
					].concat(node.transformations);
					transformationNode.updateVersion();
					transformationNode.addChild(nodeInstance);
				}
			}
		} else {
			transformationNode.addChild(node);
		}
		return transformationNode;
	}

	// #endregion Public Methods (1)
}
