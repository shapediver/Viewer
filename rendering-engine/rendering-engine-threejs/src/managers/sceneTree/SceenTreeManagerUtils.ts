import {Box, type IBox} from "@shapediver/viewer.shared.math";
import {
	GeometryData,
	type ITreeNode,
	type ITreeNodeData,
} from "@shapediver/viewer.shared.node-tree";
import {vec3} from "gl-matrix";
import * as THREE from "three";
import {SDObject, SD_DATA_TYPE} from "../../objects/SDObject";
import {RenderingEngine} from "../../RenderingEngine";
import {ThreejsData} from "../../types/ThreejsData";

export const removeData = (
	renderingEngine: RenderingEngine,
	dataObject: THREE.Object3D,
) => {
	if (dataObject.userData.removed === true) return;
	dataObject.userData.removed = true;

	switch (true) {
		case dataObject.userData.SDtype === SD_DATA_TYPE.GEOMETRY:
			// Instanced-geometry placeholder: delegate removal to InstanceGroupManager
			if (dataObject.userData.isInstanced) {
				const instanceNode = dataObject.userData
					.instanceNode as ITreeNode | undefined;
				if (
					instanceNode &&
					renderingEngine.instanceGroupManager.removeNode(instanceNode)
				)
					renderingEngine.geometryLoader.removeFromPrimitiveCache(
						dataObject.userData.primitiveCacheKey as string,
					);
				break;
			}
			dataObject.traverse((o) => {
				if (dataObject.id !== o.id && o.userData.removed === true)
					return;
				o.userData.removed = true;

				if (
					o instanceof THREE.Mesh ||
					o instanceof THREE.Line ||
					o instanceof THREE.Points ||
					o instanceof THREE.LineSegments ||
					o instanceof THREE.LineLoop
				) {
					renderingEngine.scene.remove(o);
					renderingEngine.pulseEffectManager.remove(o);

					renderingEngine.geometryLoader.removeFromGeometryCache(
						o.geometry.userData.cacheKey,
					);
					renderingEngine.materialLoader.removeFromMaterialCache(
						o.material.userData.cacheKey,
					);

					const texturesToRemove: THREE.Texture[] = [];
					for (const t in o.material) {
						if (o.material[t] instanceof THREE.Texture) {
							o.material[t].name = t;
							if (t !== "envMap") {
								if (!texturesToRemove.includes(o.material[t]))
									texturesToRemove.push(o.material[t]);
							}
						}
					}

					for (const texture of texturesToRemove) {
						if (
							texture.userData.cacheKey &&
							renderingEngine.materialLoader.threeJsTextureCache[
								texture.userData.cacheKey
							]
						) {
							renderingEngine.materialLoader.threeJsTextureCache[
								texture.userData.cacheKey
							].usage--;
						} else {
							if (texture.name === "sphericalNormalMap") {
								renderingEngine.geometryLoader.removeFromGemSphericalMapsCache(
									o.geometry.userData.primitiveSDid +
										"_" +
										o.geometry.userData.primitiveSDversion,
								);
								texture.dispose();
							} else {
								texture.dispose();
							}
						}
					}
				}
			});
			break;
		case dataObject.userData.SDtype === SD_DATA_TYPE.THREEJS:
			break;
		case dataObject.userData.SDtype === SD_DATA_TYPE.MATERIAL:
			break;
		case dataObject.userData.SDtype === SD_DATA_TYPE.LIGHT:
			dataObject.traverse((o) => {
				if (o instanceof THREE.Light) o.dispose();
			});
			break;
		case dataObject.userData.SDtype === SD_DATA_TYPE.HTML_ELEMENT_ANCHOR:
			renderingEngine.htmlElementAnchorLoader.removeData(
				dataObject.userData.SDid,
				dataObject.userData.SDversion,
			);
			break;
		case dataObject.userData.SDtype === SD_DATA_TYPE.ANIMATION:
			break;
		default:
			// if there is no valid conversion here, call the convertData of the implementation
			break;
	}
};

export const updateMorphWeights = (node: ITreeNode, obj: SDObject) => {
	if (!node || !obj) return;

	for (let i = 0, len = node.data.length; i < len; i++) {
		if (node.data[i] instanceof GeometryData) {
			const data: GeometryData = <GeometryData>node.data[i];
			const dataChild = <SDObject>(
				obj.children.find(
					(oc) =>
						(<SDObject>oc).SDid === data.id &&
						(<SDObject>oc).SDversion === data.version,
				)
			);
			if (dataChild)
				dataChild.traverse((o) => {
					if (
						o instanceof THREE.Points ||
						o instanceof THREE.LineSegments ||
						o instanceof THREE.LineLoop ||
						o instanceof THREE.Line ||
						o instanceof THREE.Mesh
					)
						o.morphTargetInfluences = data.morphWeights;
				});
		}
	}

	for (let i = 0, len = node.children.length; i < len; i++) {
		const nodeChild = node.children[i];
		if (!nodeChild) continue;
		const objChild = <SDObject>(
			obj.children.find((oc) => (<SDObject>oc).SDid === nodeChild.id)
		);
		if (objChild) updateMorphWeights(nodeChild, objChild);
	}
};

export const assignBoundingBox = (
	node: ITreeNode,
	data: ITreeNodeData,
	renderingEngineId: string,
	convertedObjectData: THREE.Object3D,
) => {
	// assign the bb
	if (data instanceof GeometryData) {
		const geometry = data as GeometryData;
		let bb: IBox = new Box();
		const clone = convertedObjectData.clone();

		clone.matrix.identity();
		clone.matrixWorld.identity();
		clone.position.set(0, 0, 0);
		clone.scale.set(1, 1, 1);
		clone.quaternion.set(0, 0, 0, 1);
		clone.applyMatrix4(new THREE.Matrix4().fromArray(node.worldMatrix));

		const threeBox = new THREE.Box3().setFromObject(clone, true);
		bb = new Box(
			vec3.fromValues(threeBox.min.x, threeBox.min.y, threeBox.min.z),
			vec3.fromValues(threeBox.max.x, threeBox.max.y, threeBox.max.z),
		);

		// adjust the general BB
		node.boundingBox.union(bb);

		// create the specific BB if it doesn't exist yet
		if (!node.boundingBoxViewport[renderingEngineId])
			node.boundingBoxViewport[renderingEngineId] = new Box();

		// adjust the specific BB
		node.boundingBoxViewport[renderingEngineId].union(bb);
	} else if (data instanceof ThreejsData) {
		const threejsData = <ThreejsData>data;
		const bbThree = new THREE.Box3().setFromObject(threejsData.obj);

		// adjust the general BB
		node.boundingBox.union(
			new Box(
				vec3.fromValues(...bbThree.min.toArray()),
				vec3.fromValues(...bbThree.max.toArray()),
			),
		);

		// create the specific BB if it doesn't exist yet
		if (!node.boundingBoxViewport[renderingEngineId])
			node.boundingBoxViewport[renderingEngineId] = new Box();

		// adjust the specific BB
		node.boundingBoxViewport[renderingEngineId].union(
			new Box(
				vec3.fromValues(...bbThree.min.toArray()),
				vec3.fromValues(...bbThree.max.toArray()),
			),
		);
	}
};
