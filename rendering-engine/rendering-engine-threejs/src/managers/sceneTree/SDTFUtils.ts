import {ITreeNode, ITreeNodeData} from "@shapediver/viewer.shared.node-tree";
import {InputValidator} from "@shapediver/viewer.shared.services";
import {
	GeometryData,
	IMaterialAbstractData,
	ISDTFOverview,
	MaterialStandardData,
	SDTFItemData,
	SDTFOverviewData,
} from "@shapediver/viewer.shared.types";
import {mat4} from "gl-matrix";
import {RenderingEngine} from "../..";

const inputValidator = InputValidator.instance;

export const collectSDTFItemData = (
	node: ITreeNode,
): SDTFItemData | undefined => {
	for (let i = 0, len = node.data.length; i < len; i++)
		if (node.data[i] instanceof SDTFItemData)
			return <SDTFItemData>node.data[i];

	if (!node.parent) return;
	return collectSDTFItemData(node.parent);
};

export const createSDTFOverview = (node: ITreeNode): ISDTFOverview => {
	const out: SDTFOverviewData = new SDTFOverviewData({});
	for (let i = 0, len = node.data.length; i < len; i++)
		if (node.data[i] instanceof SDTFOverviewData)
			out.merge(<SDTFOverviewData>node.data[i]);

	for (let i = 0, len = node.children.length; i < len; i++)
		out.merge(new SDTFOverviewData(createSDTFOverview(node.children[i])));

	return out.overview;
};

export const injectAttributeData = (
	renderingEngine: RenderingEngine,
	currentSDTFOverview: ISDTFOverview,
	node: ITreeNode,
	data: ITreeNodeData,
) => {
	const itemData = collectSDTFItemData(node);
	const visData: {
		material: IMaterialAbstractData;
		matrix: mat4;
	} = {
		material: new MaterialStandardData({
			color: renderingEngine.defaultMaterialColor,
			opacity: 1,
		}),
		matrix: mat4.create(),
	};

	if (renderingEngine.visualizeAttributes) {
		const userVisData = renderingEngine.visualizeAttributes(
			currentSDTFOverview,
			itemData,
		);
		inputValidator.validateAndError(
			"Viewer.visualizeAttributes",
			userVisData,
			"object",
			true,
		);
		inputValidator.validateAndError(
			"Viewer.visualizeAttributes",
			userVisData.matrix,
			"mat4",
			true,
		);
		visData.material = userVisData.material;
		visData.matrix = userVisData.matrix;
	}

	node.addTransformation({
		id: "sdtf",
		matrix: visData.matrix,
	});

	if (data instanceof GeometryData) data.attributeMaterial = visData.material;
};
