/* eslint-disable no-case-declarations */
import {
	addListener,
	type ITreeNode,
	type IViewportApi,
	sceneTree} from "@shapediver/viewer";
import {
	MaterialGemData,
	MaterialShadowData,
	MaterialSpecularGlossinessData,
	MaterialStandardData,
	MaterialUnlitData,
	SDTFItemData} from "@shapediver/viewer.shared.node-tree";
import {EVENTTYPE, UuidGenerator} from "@shapediver/viewer.shared.services";
import {
	type IMaterialAbstractData,
	type ISDTFItemData,
	type ISDTFOverview,
	SdtfPrimitiveTypeGuard} from "@shapediver/viewer.shared.types";
import {mat4} from "gl-matrix";
import {
	type IAttribute,
	type IDefaultAttribute,
	type INumberAttribute,
	type IStringAttribute} from "../interfaces/IAttribute";
import {type IAttributeVisualizationEngine} from "../interfaces/IAttributeVisualizationEngine";
import {type ILayer} from "../interfaces/ILayer";
import {AttributeVisualizationUtils} from "./AttributeVisualizationUtils";

/** Shared identity matrix — never mutate this. */
const IDENTITY_MATRIX: mat4 = mat4.create();

type SDTFOverviewEntry = ISDTFOverview[string][number];

export class AttributeVisualizationEngine
	implements IAttributeVisualizationEngine
{
	// #region Properties (7)

	readonly #uuidGenerator: UuidGenerator = UuidGenerator.instance;
	readonly #viewport: IViewportApi;

	#attributes: IAttribute[] = [];
	#defaultMaterial: IMaterialAbstractData = new MaterialUnlitData({
		color: "#000000",
		opacity: 1,
	});
	#defaultLayer: ILayer = {
		color: "#000000",
		opacity: 1,
		enabled: true,
	};
	#layers: {
		[key: string]: ILayer;
	} = {};
	#overview: ISDTFOverview;
	#listeners: {
		[key: string]: () => void;
	} = {};
	#visualizedMaterialType: "unlit" | "standard" = "unlit";
	#layerMaterialType: "unlit" | "standard" = "unlit";
	#nodesWithAttributeData: ITreeNode[] = [];
	/** Pre-cached overview lookups keyed by "attributeKey:typeHint" */
	#overviewCache: Map<string, SDTFOverviewEntry> = new Map();
	#updateScheduled: boolean = false;

	// #endregion Properties (7)

	// #region Constructors (1)

	constructor(viewport: IViewportApi) {
		this.#viewport = viewport;

		this.#overview = this.#viewport.createSDTFOverview(sceneTree.root);
		this.createLayers();
		this.gatherNodesWithAttributeData();
		this.buildOverviewCache();
		this.constructAttributeVisualization();

		const cb = () => {
			this.#overview = this.#viewport.createSDTFOverview(sceneTree.root);

			const layers = this.#layers;
			this.createLayers();
			for (const l in layers) {
				if (this.#layers[l]) this.#layers[l] = layers[l];
			}

			this.gatherNodesWithAttributeData();
			this.buildOverviewCache();
			this.constructAttributeVisualization();

			for (const l in this.#listeners) this.#listeners[l]();
		};

		addListener(EVENTTYPE.SESSION.SESSION_CUSTOMIZED, cb);
		addListener(EVENTTYPE.SESSION.SESSION_SDTF_DELAYED_LOADED, cb);
	}

	// #endregion Constructors (1)

	// #region Public Accessors (3)

	private gatherNodesWithAttributeData() {
		this.#nodesWithAttributeData = [];

		sceneTree.root.traverse((node: ITreeNode) => {
			const data = node.data;
			for (let i = 0, len = data.length; i < len; i++) {
				if (data[i] instanceof SDTFItemData) {
					this.#nodesWithAttributeData.push(node);
					break;
				}
			}
		});
	}

	public get defaultMaterial(): IMaterialAbstractData {
		return this.#defaultMaterial;
	}

	public get defaultLayer(): ILayer {
		return this.#defaultLayer;
	}

	public get layers(): {[key: string]: ILayer} {
		return this.#layers;
	}

	public get layerMaterialType(): "unlit" | "standard" {
		return this.#layerMaterialType;
	}

	public get visualizedMaterialType(): "unlit" | "standard" {
		return this.#visualizedMaterialType;
	}

	public get overview(): ISDTFOverview {
		return this.#overview;
	}

	// #endregion Public Accessors (3)

	// #region Public Methods (3)

	public updateAttributes(attributes: IAttribute[]) {
		this.#attributes = attributes;
		this.buildOverviewCache();
		this.scheduleUpdate();
	}

	public updateDefaultLayer(layer: ILayer) {
		this.#defaultLayer = layer;
		this.scheduleUpdate();
	}

	public updateDefaultMaterial(material: IMaterialAbstractData) {
		this.#defaultMaterial = material;
		this.scheduleUpdate();
	}

	public updateLayerMaterialType(type: "unlit" | "standard") {
		this.#layerMaterialType = type;
		this.createLayers();
		this.scheduleUpdate();
	}

	public updateVisualizedMaterialType(type: "unlit" | "standard") {
		this.#visualizedMaterialType = type;
		this.createLayers();
		this.scheduleUpdate();
	}

	public updateLayers(layers: {[key: string]: ILayer}) {
		this.#layers = layers;
		this.scheduleUpdate();
	}

	public addListener(cb: () => void): string {
		const token = this.#uuidGenerator.create();
		this.#listeners[token] = cb;
		return token;
	}

	public removeListener(token: string): boolean {
		if (!this.#listeners[token]) return false;
		delete this.#listeners[token];
		return true;
	}

	// #endregion Public Methods (3)

	// #region Private Methods

	/**
	 * Coalesce multiple rapid update calls into a single
	 * constructAttributeVisualization + invalidation pass using microtask scheduling.
	 */
	private scheduleUpdate() {
		if (this.#updateScheduled) return;
		this.#updateScheduled = true;
		queueMicrotask(() => {
			this.#updateScheduled = false;
			this.constructAttributeVisualization();
		});
	}

	/**
	 * Pre-build a lookup map from "key:typeHint" -> ISDTFAttributeOverview
	 * so the hot-path callback avoids Array.filter() per geometry item.
	 */
	private buildOverviewCache() {
		this.#overviewCache.clear();
		for (const a of this.#attributes) {
			const overviewEntries = this.#overview[a.key];
			if (!overviewEntries) continue;
			for (let j = 0; j < overviewEntries.length; j++) {
				if (overviewEntries[j].typeHint === a.type) {
					this.#overviewCache.set(
						a.key + ":" + a.type,
						overviewEntries[j],
					);
					break;
				}
			}
		}
	}

	private createMaterial(
		type: "unlit" | "standard",
		color: IMaterialAbstractData["color"],
		opacity: number,
	): IMaterialAbstractData {
		return type === "unlit"
			? new MaterialUnlitData({color, opacity})
			: new MaterialStandardData({color, opacity});
	}

	private constructAttributeVisualization() {
		this.#viewport.visualizeAttributes = (
			_overview: ISDTFOverview,
			itemData?: ISDTFItemData,
		) => {
			// early out if there are not attributes in this itemData
			if (!itemData || !itemData.attributes) {
				if (this.#attributes.length === 0) {
					return {
						matrix: IDENTITY_MATRIX,
						material: this.createMaterial(
							this.#layerMaterialType,
							this.#defaultLayer.color,
							this.#defaultLayer.enabled
								? this.#defaultLayer.opacity
								: 0,
						),
					};
				} else {
					return {
						matrix: IDENTITY_MATRIX,
						material: this.createMaterial(
							this.#layerMaterialType,
							this.#defaultMaterial.color,
							this.#defaultLayer.enabled
								? this.#defaultLayer.opacity *
										this.#defaultMaterial.opacity
								: 0,
						),
					};
				}
			}

			// search for the responsible layer property, if none is found, default layer is assigned
			let layer: ILayer = this.defaultLayer;
			if (
				itemData.attributes["layer"] &&
				SdtfPrimitiveTypeGuard.isStringType(
					itemData.attributes["layer"].typeHint,
				)
			) {
				const layerAttributes = itemData.attributes["layer"];
				layer = this.#layers[layerAttributes.value];
			}

			// early out, layer is not enabled
			if (layer.enabled === false) {
				const mat = this.createMaterialCopy(this.#defaultMaterial);
				mat.opacity = 0;
				return {
					matrix: IDENTITY_MATRIX,
					material: mat,
				};
			}

			if (this.#attributes.length === 0) {
				// no attributes are specified, we go into layer visualization mode
				return {
					matrix: IDENTITY_MATRIX,
					material: this.createMaterial(
						this.#layerMaterialType,
						layer.color,
						layer.opacity,
					),
				};
			} else {
				// attributes are specified, we go into attribute visualization mode
				const material =
					this.#visualizedMaterialType === "unlit"
						? new MaterialUnlitData()
						: new MaterialStandardData();
				for (let i = 0; i < this.#attributes.length; i++) {
					const a = this.#attributes[i];
					if (
						itemData.attributes[a.key] &&
						itemData.attributes[a.key].typeHint === a.type
					) {
						const itemDataAttribute = itemData.attributes[a.key];
						const itemDataAttributeOverview =
							this.#overviewCache.get(a.key + ":" + a.type);

						switch (true) {
							case SdtfPrimitiveTypeGuard.isColorType(a.type):
								// multiply each color values with 255 to convert them to the range [0, 255]
								const convertedValue =
									itemDataAttribute.value.map(
										(v: number) => v * 255,
									);
								material.color = convertedValue;
								material.opacity *= layer.opacity;
								return {
									matrix: IDENTITY_MATRIX,
									material,
								};
							case SdtfPrimitiveTypeGuard.isNumberType(a.type):
								const numberAttribute = <INumberAttribute>a;
								const numberVisualizationData =
									AttributeVisualizationUtils.numberVisualization(
										itemDataAttribute.value,
										(numberAttribute.min !== undefined
											? numberAttribute.min
											: itemDataAttributeOverview?.min)!,
										(numberAttribute.max !== undefined
											? numberAttribute.max
											: itemDataAttributeOverview?.max)!,
										numberAttribute.visualization,
										this.#visualizedMaterialType,
										this.#defaultMaterial,
									);

								if (!numberVisualizationData) {
									return {
										matrix: IDENTITY_MATRIX,
										material,
									};
								} else {
									numberVisualizationData.material.opacity *=
										layer.opacity;
									return numberVisualizationData;
								}
							case SdtfPrimitiveTypeGuard.isStringType(a.type):
								const stringAttribute = <IStringAttribute>a;
								const stringVisualizationData =
									AttributeVisualizationUtils.stringVisualization(
										itemDataAttribute.value,
										stringAttribute.values ||
											itemDataAttributeOverview?.values,
										stringAttribute.visualization,
										this.#visualizedMaterialType,
										this.#defaultMaterial,
									);

								if (!stringVisualizationData) {
									return {
										matrix: IDENTITY_MATRIX,
										material,
									};
								} else {
									stringVisualizationData.material.opacity *=
										layer.opacity;
									return stringVisualizationData;
								}
							default:
								const defaultAttribute = <IDefaultAttribute>a;
								material.color = defaultAttribute.color;
								material.opacity *= layer.opacity;
								return {
									matrix: IDENTITY_MATRIX,
									material,
								};
						}
					}
				}

				// no attributes were found, return the default material adjusted by the layer opacity
				const mat = this.createMaterialCopy(this.#defaultMaterial);
				mat.opacity *= layer.opacity;
				return {
					matrix: IDENTITY_MATRIX,
					material: mat,
				};
			}
		};

		// Use the viewport's updateNode helper to directly re-convert each
		// affected node, which re-runs injectAttributeData (and our visualizeAttributes
		// callback) without the overhead of version-stomping the entire tree.
		for (let i = 0; i < this.#nodesWithAttributeData.length; i++) {
			this.#viewport.updateNode(this.#nodesWithAttributeData[i]);
		}
	}

	private createMaterialCopy(
		material: IMaterialAbstractData,
	): IMaterialAbstractData {
		if (material instanceof MaterialGemData) {
			const newMaterial = new MaterialGemData();
			newMaterial.copy(material);
			return newMaterial;
		} else if (material instanceof MaterialShadowData) {
			const newMaterial = new MaterialShadowData();
			newMaterial.copy(material);
			return newMaterial;
		} else if (material instanceof MaterialSpecularGlossinessData) {
			const newMaterial = new MaterialSpecularGlossinessData();
			newMaterial.copy(material);
			return newMaterial;
		} else if (material instanceof MaterialStandardData) {
			const newMaterial = new MaterialStandardData();
			newMaterial.copy(material);
			return newMaterial;
		} else if (material instanceof MaterialUnlitData) {
			const newMaterial = new MaterialUnlitData();
			newMaterial.copy(material);
			return newMaterial;
		} else {
			return new MaterialStandardData();
		}
	}

	private createLayers() {
		this.#layers = {};
		if (this.#overview["layer"]) {
			const layerStringAttributeOverview = this.#overview["layer"].find(
				(a) => a.typeHint === "string",
			);
			if (
				layerStringAttributeOverview &&
				layerStringAttributeOverview.values
			) {
				for (
					let i = 0;
					i < layerStringAttributeOverview.values.length;
					i++
				) {
					this.#layers[layerStringAttributeOverview.values[i]] = {
						enabled: true,
						opacity: 1,
						color: this.defaultMaterial.color,
					};
				}
			}
		}
	}

	// #endregion Private Methods (2)
}
