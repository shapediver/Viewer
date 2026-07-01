import {
	HTMLElementAnchorData,
	type ITreeNode} from "@shapediver/viewer.shared.node-tree";
import {BUSY_MODE_DISPLAY} from "@shapediver/viewer.shared.types";
import {vec2, vec3} from "gl-matrix";
import {type ILoader} from "../interfaces/ILoader";
import {RenderingEngine} from "../RenderingEngine";

export class HTMLElementAnchorLoader implements ILoader {
	// #region Properties (2)

	private readonly _htmlElements: {
		[key: string]: {
			anchor: HTMLElementAnchorData;
			node: ITreeNode;
		};
	} = {};
	private readonly _parentDiv: HTMLDivElement;

	// #endregion Properties (2)

	// #region Constructors (1)

	constructor(private readonly _renderingEngine: RenderingEngine) {
		this._parentDiv = document.createElement("div");
		this._parentDiv.classList.add("sdv-anchor-container");
	}

	// #endregion Constructors (1)

	// #region Public Getters And Setters (1)

	public get parentDiv(): HTMLDivElement {
		return this._parentDiv;
	}

	// #endregion Public Getters And Setters (1)

	// #region Public Methods (5)

	public adjustPositions(scaleWidth: number, scaleHeight: number): void {
		for (const anchorId in this._htmlElements) {
			const anchor = this._htmlElements[anchorId].anchor;
			let node = this._htmlElements[anchorId].node;

			// get the transformation from the node
			const transformedAnchor = vec3.transformMat4(
				vec3.create(),
				anchor.location,
				node.worldMatrix,
			);

			const {page, container, client, hidden, distance} =
				this._renderingEngine.sceneTracingManager.convert3Dto2D(
					transformedAnchor,
				);

			const htmlElement = anchor.createViewerHtmlElement(
				this._renderingEngine.id,
			);
			if (!htmlElement) continue;

			let visible = node.visible;
			while (node.parent) {
				node = node.parent;
				visible = node.visible && visible;
			}

			if (this._renderingEngine.show === false) visible = false;

			anchor.update({
				anchor,
				htmlElement,
				page,
				container,
				client,
				scale: vec2.fromValues(scaleWidth, scaleHeight),
				hidden,
				visible,
				distance,
			});
		}
	}

	public init(): void {
		this._renderingEngine.canvas.parentNode?.appendChild(this._parentDiv);
	}

	public load(
		node: ITreeNode,
		anchor: HTMLElementAnchorData,
		isVisibleInHierarchy: boolean,
	): void {
		const htmlElement = anchor.createViewerHtmlElement(
			this._renderingEngine.id,
		);
		if (!htmlElement) return;

		// set the display property to "none" if the viewport is not shown or the node is not visible
		if (
			this._renderingEngine.show === false ||
			isVisibleInHierarchy === false
		)
			htmlElement.style.display = "none";

		// if the node is not visible return
		if (isVisibleInHierarchy === false) return;

		this._parentDiv.appendChild(htmlElement);
		this._htmlElements[anchor.id + "_" + anchor.version] = {
			node,
			anchor,
		};
	}

	public removeData(id: string, version: string) {
		// since the data object might be there, but no data is loaded for this viewport
		// this check is needed
		if (!this._htmlElements[id + "_" + version]) return;

		const anchor = this._htmlElements[id + "_" + version].anchor;
		if (anchor && anchor.getViewerHtmlElement(this._renderingEngine.id)) {
			this._parentDiv.removeChild(
				anchor.getViewerHtmlElement(this._renderingEngine.id)!,
			);
			delete this._htmlElements[id + "_" + version];
		}
	}

	public toggleBusyMode(toggle: boolean) {
		if (
			toggle &&
			this._renderingEngine.busyModeDisplay === BUSY_MODE_DISPLAY.BLUR
		) {
			if (
				navigator.userAgent.toLowerCase().indexOf("firefox") > -1 &&
				navigator.userAgent.toLowerCase().indexOf("android") > -1
			)
				return;
			this._parentDiv.style.filter = "blur(3px)";
		} else {
			this._parentDiv.style.filter = "";
		}
	}

	// #endregion Public Methods (5)
}
