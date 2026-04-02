import {ResOutputContent} from "@shapediver/sdk.geometry-api-sdk-v2";
import {SdtfPrimitiveTypeGuard} from "@shapediver/sdk.sdtf-primitives";
import {
	create,
	ISdtfReadableAsset,
	ISdtfReadableAttributes,
	ISdtfReadableChunk,
	ISdtfReadableDataItem,
	ISdtfReadableNode,
} from "@shapediver/sdk.sdtf-v1";
import {
	ITreeNode,
	SDTFAttributeData,
	SDTFAttributesData,
	SDTFItemData,
	SDTFOverviewData,
	TreeNode,
} from "@shapediver/viewer.shared.node-tree";
import {
	Logger,
	ShapeDiverViewerDataProcessingError,
} from "@shapediver/viewer.shared.services";
import {ISDTFOverview} from "@shapediver/viewer.shared.types";

export class SDTFEngine {
	// #region Properties (4)

	private readonly _logger: Logger = Logger.instance;

	private static _instance: SDTFEngine;

	private _parsedFile!: ISdtfReadableAsset;

	private _overview: ISDTFOverview = {};

	// #endregion Properties (4)

	// #region Public Static Accessors (1)

	public static get instance() {
		return this._instance || (this._instance = new this());
	}

	// #endregion Public Static Accessors (1)

	// #region Public Methods (1)

	/**
	 * Load the sdtf content into a scene graph node.
	 *
	 * @param content the geometry content
	 * @returns the scene graph node
	 */
	public async loadContent(
		content: ResOutputContent,
		jwtToken?: string,
	): Promise<ITreeNode> {
		const node = new TreeNode("sdtf");

		// We have to be safe and check if the content is a valid SDTF file
		if (!content || (content && !content.href))
			throw new ShapeDiverViewerDataProcessingError(
				"SDTFEngine.loadContent: Invalid content was provided to geometry engine.",
			);

		// create the sdtf sdk
		const sdk = jwtToken
			? await create({authToken: jwtToken})
			: await create();
		// crete the sdtf parser
		const parser = sdk.createParser();
		// parse the file
		this._parsedFile = await parser.readFromUrl(content.href!);

		// reset overview — it will be populated during item loading
		this._overview = {};

		// load all chunks in parallel
		const chunks = await Promise.all(
			this._parsedFile.chunks.map((chunk, i) => this.loadChunk(chunk, i)),
		);
		for (const chunk of chunks) node.children.push(chunk);

		// create the overview from data collected during item loading
		node.data.push(new SDTFOverviewData(this._overview));

		return node;
	}

	// #endregion Public Methods (1)

	// #region Private Methods (5)

	/**
	 * Update the overview with a single attribute entry.
	 * Called during item loading so we avoid a separate pass over all items.
	 */
	private updateOverview(
		key: string,
		dataTypehint: string,
		value: unknown,
	): void {
		const overview = this._overview;

		// check if the attribute is already in the overview
		const existingEntries = overview[key]
			? overview[key].filter((o) => o.typeHint === dataTypehint)
			: [];

		if (overview[key] && existingEntries.length > 0) {
			// update the existing entry
			const entry = existingEntries[0];
			entry.count++;

			if (SdtfPrimitiveTypeGuard.isStringType(dataTypehint)) {
				if (!entry.values?.includes(<string>value)) {
					entry.values?.push(<string>value);
					entry.countForValue?.push(1);
				} else {
					const index = entry.values?.indexOf(<string>value);
					if (index !== undefined && index > -1)
						entry.countForValue![index] += 1;
				}
			}

			if (SdtfPrimitiveTypeGuard.isNumberType(dataTypehint)) {
				entry.min = Math.min(<number>value, entry.min!);
				entry.max = Math.max(<number>value, entry.max!);
			}
		} else {
			if (overview[key]) {
				overview[key].push({
					typeHint: dataTypehint,
					count: 1,
				});
			} else {
				overview[key] = [
					{
						typeHint: dataTypehint,
						count: 1,
					},
				];
			}

			const newEntry = overview[key][overview[key].length - 1];

			if (SdtfPrimitiveTypeGuard.isStringType(dataTypehint)) {
				newEntry.values = [<string>value];
				newEntry.countForValue = [1];
			}

			if (SdtfPrimitiveTypeGuard.isNumberType(dataTypehint)) {
				newEntry.min = <number>value;
				newEntry.max = <number>value;
			}
		}
	}

	/**
	 * Load the attributes into a SDTFAttributesData data item.
	 *
	 * @param attributes
	 * @returns
	 */
	private async loadAttributes(
		attributes: ISdtfReadableAttributes,
	): Promise<SDTFAttributesData> {
		const data = new SDTFAttributesData();
		const keys = Object.keys(attributes.entries);

		// Separate keys into primitive (need content now) and non-primitive (lazy)
		const primitiveKeys: string[] = [];
		const lazyKeys: string[] = [];

		for (const key of keys) {
			const typeName = attributes.entries[key].typeHint?.name;
			if (
				SdtfPrimitiveTypeGuard.isBooleanType(typeName) ||
				SdtfPrimitiveTypeGuard.isColorType(typeName) ||
				SdtfPrimitiveTypeGuard.isNumberType(typeName) ||
				SdtfPrimitiveTypeGuard.isStringType(typeName)
			) {
				primitiveKeys.push(key);
			} else {
				lazyKeys.push(key);
			}
		}

		// Fetch all primitive attribute contents in parallel
		const primitiveContents = await Promise.all(
			primitiveKeys.map((key) => attributes.entries[key].getContent()),
		);

		for (let i = 0; i < primitiveKeys.length; i++) {
			const key = primitiveKeys[i];
			const typeHint =
				attributes.entries[key].typeHint === undefined
					? "undefined"
					: attributes.entries[key].typeHint!.name;
			data.attributes[key] = new SDTFAttributeData(
				typeHint,
				primitiveContents[i],
			);

			// Update overview inline to avoid a second pass
			this.updateOverview(key, typeHint, primitiveContents[i]);
		}

		// Non-primitive attributes stay lazy
		for (const key of lazyKeys) {
			const typeHint =
				attributes.entries[key].typeHint === undefined
					? "undefined"
					: attributes.entries[key].typeHint!.name;
			data.attributes[key] = new SDTFAttributeData(typeHint, async () => {
				return await attributes.entries[key].getContent();
			});
		}

		return data;
	}

	/**
	 * Load the chunk into a scene graph node.
	 *
	 * @param chunk
	 * @param chunkId
	 * @returns
	 */
	private async loadChunk(
		chunk: ISdtfReadableChunk,
		chunkId: number,
	): Promise<TreeNode> {
		const chunkDef = new TreeNode(chunk.name || "chunk_" + chunkId);

		// if there are attributes, add them to the chunk as data
		if (chunk.attributes !== undefined) {
			chunkDef.data.push(await this.loadAttributes(chunk.attributes));
		}

		// load items and nodes in parallel
		const [items, nodes] = await Promise.all([
			chunk.items !== undefined && chunk.items.length > 0
				? Promise.all(
						chunk.items.map((item, i) => this.loadItem(item, i)),
					)
				: [],
			chunk.nodes !== undefined && chunk.nodes.length > 0
				? Promise.all(chunk.nodes.map((n, i) => this.loadNode(n, i)))
				: [],
		]);

		if (items.length > 0) chunkDef.addChild(items);
		if (nodes.length > 0) chunkDef.addChild(nodes);

		return chunkDef;
	}

	/**
	 * Load the item into a scene graph node.
	 *
	 * @param item
	 * @param itemId
	 * @returns
	 */
	private async loadItem(
		item: ISdtfReadableDataItem,
		itemId: number,
	): Promise<TreeNode> {
		const itemDef = new TreeNode(itemId + "");

		// if there are attributes, add them to the item
		let attributes;
		if (item.attributes !== undefined)
			attributes = await this.loadAttributes(item.attributes);

		// create the typehint
		const typeHint =
			item.typeHint === undefined ? "undefined" : item.typeHint!.name;

		const isPrimitive =
			SdtfPrimitiveTypeGuard.isBooleanType(typeHint) ||
			SdtfPrimitiveTypeGuard.isColorType(typeHint) ||
			SdtfPrimitiveTypeGuard.isNumberType(typeHint) ||
			SdtfPrimitiveTypeGuard.isStringType(typeHint);

		// For primitive items, fetch content in parallel with attributes (already done above)
		const itemData = isPrimitive
			? new SDTFItemData(
					typeHint,
					await item.getContent(),
					attributes?.attributes!,
				)
			: new SDTFItemData(
					typeHint,
					async () => {
						return await item.getContent();
					},
					attributes?.attributes!,
				);
		itemDef.data.push(itemData);

		return itemDef;
	}

	/**
	 * Load the node into a scene graph node.
	 *
	 * @param node
	 * @param nodeId
	 * @returns
	 */
	private async loadNode(
		node: ISdtfReadableNode,
		nodeId: number,
	): Promise<TreeNode> {
		const nodeDef = new TreeNode(node.name || "node_" + nodeId);

		// if there are attributes, add them to the node as data
		if (node.attributes !== undefined) {
			nodeDef.data.push(await this.loadAttributes(node.attributes));
		}

		// load items and nodes in parallel
		const [items, nodes] = await Promise.all([
			node.items !== undefined && node.items.length > 0
				? Promise.all(
						node.items.map((item, i) => this.loadItem(item, i)),
					)
				: [],
			node.nodes !== undefined && node.nodes.length > 0
				? Promise.all(node.nodes.map((n, i) => this.loadNode(n, i)))
				: [],
		]);

		if (items.length > 0) nodeDef.addChild(items);
		if (nodes.length > 0) nodeDef.addChild(nodes);

		return nodeDef;
	}

	// #endregion Private Methods (5)
}
