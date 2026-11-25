import {
	AttributeData,
	GeometryData,
	InstanceData,
	MaterialGemData,
	type ITreeNode,
} from "@shapediver/viewer.shared.node-tree";
import {
	Logger,
	ShapeDiverViewerDataProcessingError,
} from "@shapediver/viewer.shared.services";
import {
	MATERIAL_SIDE,
	PRIMITIVE_MODE,
	RENDERER_TYPE,
	type IAttributeData,
	type IMaterialAbstractData,
	type IPrimitiveData,
} from "@shapediver/viewer.shared.types";
import {vec3} from "gl-matrix";
import * as THREE from "three";
import {type ILoader} from "../interfaces/ILoader";
import {GemMaterial} from "../materials/GemMaterial";
import {RenderingEngine} from "../RenderingEngine";

type GeometryType =
	| THREE.Mesh
	| THREE.Line
	| THREE.Points
	| THREE.LineSegments
	| THREE.LineLoop;

const _gemShapePoint = new THREE.Vector3();

export class GeometryLoader implements ILoader {
	// #region Properties (8)

	private _gemCubeCamera?: THREE.CubeCamera;
	private _gemNormalMaterial?: THREE.ShaderMaterial;
	private _gemPlaneTracingSupported?: boolean;
	private _gemScene?: THREE.Scene;
	private _gemSphericalMapsCache: {
		[key: string]: {
			texture: THREE.CubeTexture;
			renderTarget: THREE.WebGLCubeRenderTarget;
			counter: number;
			geometryData: GeometryData;
			geometry: THREE.BufferGeometry;
			requestedResolution: number | undefined;
			resolution: number;
			planeTracing: boolean;
			// centre and extent of the captured shape, to match identical shapes
			shapeCenter: THREE.Vector3;
			shapeExtent: number;
			shapeBucket: string;
		};
	} = {};
	// A map lives as long as a rendered object uses it. The key of the map an
	// object holds is kept per object, so a clone, a removal or a material
	// change moves exactly one reference.
	private _gemMapOfObject = new WeakMap<THREE.Object3D, string>();
	private _gemMapKeyOfTexture = new Map<THREE.Texture, string>();
	// maps whose last user switched to another material (hover or selection
	// effect): kept until a node removal finds them still unused, so the
	// effect ending does not capture them again
	private _pendingGemMaps = new Set<string>();
	// primitive key -> map key: one primitive always shows the same map
	private _gemMapAliases = new Map<string, string>();
	// coarse shape key -> map keys of the shapes behind it
	private _gemShapeBuckets = new Map<string, string[]>();
	private _gemMapCounter = 0;
	private _geometryCache: {
		[key: string]: {
			obj: GeometryType;
			primitiveCacheId: string;
			clones: GeometryType[];
			counter: number;
		};
	} = {};
	private _geometryObjects = new WeakMap<GeometryData, Set<GeometryType>>();
	// the reverse of _geometryObjects, so a removal can unregister the object
	private _geometryOfObject = new WeakMap<THREE.Object3D, GeometryData>();
	// The shared geometry of a mesh that shows a back and front material pair
	// meshes that left the scene, they are no users of a split geometry
	private _releasedMeshes = new WeakSet<THREE.Object3D>();
	// the split geometry of a shared geometry, one for all meshes that show it
	private _splitOfSource = new WeakMap<
		THREE.BufferGeometry,
		THREE.BufferGeometry
	>();
	// per split geometry: the shared geometry and the meshes that show it (a
	// clone of a mesh shares the split geometry of the original)
	private _sideSplits = new WeakMap<
		THREE.BufferGeometry,
		{source: THREE.BufferGeometry; users: Set<THREE.Mesh>}
	>();
	private _logger: Logger = Logger.instance;
	private _primitiveCache: {
		[key: string]: {
			counter: number;
			threeGeometry: THREE.BufferGeometry;
			clones: THREE.BufferGeometry[];
		};
	} = {};

	// #endregion Properties (8)

	// #region Constructors (1)

	constructor(private readonly _renderingEngine: RenderingEngine) {}

	// #endregion Constructors (1)

	// #region Public Methods (6)

	public emptyGeometryCache() {
		for (const key in this._geometryCache)
			this.removeFromGeometryCache(key);
		this._geometryCache = {};

		for (const key in this._primitiveCache)
			this.removeFromPrimitiveCache(key);
		this._primitiveCache = {};
	}

	public init(): void {}

	/**
	 * Create a geometry object with the provided geometry data.
	 *
	 * @param geometry the geometry data
	 * @returns the geometry object
	 */
	/**
	 * Create an instanced-geometry placeholder for a node.
	 * Registers the node with InstanceGroupManager and returns a lightweight
	 * THREE.Object3D placeholder that lives in the SDObject hierarchy so the
	 * normal data-lifecycle (cleanup, bounding-box, …) keeps working.
	 */
	public loadInstanced(
		parentNode: ITreeNode,
		geometry: GeometryData,
	): THREE.Object3D {
		// Base material for the batch. Effect materials (interaction
		// highlights) are per occurrence and applied as overrides below.
		const incomingMaterialData: IMaterialAbstractData | null =
			this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES
				? geometry.attributeMaterial
				: geometry.material;

		const existingMesh =
			this._renderingEngine.instanceGroupManager.getDefaultMesh(
				geometry.instanceHash,
				geometry,
			);

		const primitiveCacheKey =
			geometry.primitive.id + "_" + geometry.primitive.version;
		let bufferGeometry: THREE.BufferGeometry;
		if (existingMesh) {
			bufferGeometry = existingMesh.geometry;
		} else {
			const cachedPrimitive = this._primitiveCache[primitiveCacheKey];
			if (!cachedPrimitive) {
				bufferGeometry = this.loadPrimitive(geometry.primitive);
			} else {
				// Instanced meshes share the geometry – no clone needed.
				// The new group holds one primitive-cache retain until it is
				// disposed.
				bufferGeometry = cachedPrimitive.threeGeometry;
				cachedPrimitive.counter++;
			}
		}

		const materialSettings = {
			mode: geometry.mode,
			useVertexTangents: bufferGeometry.attributes.tangent !== undefined,
			useVertexColors:
				bufferGeometry.attributes.color !== undefined &&
				this._renderingEngine.type !== RENDERER_TYPE.ATTRIBUTES,
			useFlatShading: bufferGeometry.attributes.normal === undefined,
			useMorphTargets: false,
			useMorphNormals: false,
		};
		// Only build the shared batch material when the group does not exist
		// yet — an unused clone would leak on every re-conversion.
		// The base color moves into the per-instance color, so the batch
		// material is whitened — but only when actual material data supplied
		// that color. The fallback default material keeps its own color, and
		// the instance colors stay at neutral white.
		let material: THREE.Material | undefined;
		if (!existingMesh) {
			const loadedMaterial = this._renderingEngine.materialLoader.load(
				incomingMaterialData || geometry,
				materialSettings,
			);
			material = incomingMaterialData
				? this.createInstancedMaterial(loadedMaterial)
				: loadedMaterial.clone();
			material.userData.sourceMaterialUuid = loadedMaterial.uuid;
			material.needsUpdate = false;
			this._renderingEngine.materialLoader.trackMaterial(
				"gpu-instance/" +
					this._renderingEngine.instanceGroupManager.getGroupKey(
						geometry,
					),
				material,
				incomingMaterialData,
				materialSettings,
			);
		}

		// Delegate to InstanceGroupManager
		const instancedMesh =
			this._renderingEngine.instanceGroupManager.addNode(
				parentNode,
				geometry,
				bufferGeometry,
				material,
			);

		// Apply/remove the per-occurrence interaction material.
		if (geometry.effectMaterials.length > 0) {
			const effectMaterial = this._renderingEngine.materialLoader
				.load(
					geometry.effectMaterials[
						geometry.effectMaterials.length - 1
					].material,
					materialSettings,
				)
				.clone();
			this._renderingEngine.instanceGroupManager.setMaterialOverride(
				geometry.id,
				effectMaterial,
			);
		} else {
			this._renderingEngine.instanceGroupManager.clearMaterialOverride(
				geometry.id,
			);
			// Color-only variants keep unique material ids; instanceColor
			// already carries the tint. Override only when this occurrence's
			// material was replaced after it joined the batch.
			if (
				incomingMaterialData &&
				this._renderingEngine.instanceGroupManager.hasOccurrenceMaterialChanged(
					geometry.id,
					incomingMaterialData.id,
				)
			) {
				const overrideMaterial = this._renderingEngine.materialLoader
					.load(incomingMaterialData, materialSettings)
					.clone();
				this._renderingEngine.instanceGroupManager.setMaterialOverride(
					geometry.id,
					overrideMaterial,
				);
			}
		}

		// Store the InstancedMesh in geometry.convertedObject so IntersectionEngine
		// and effects can reach it via geometryData.convertedObject[viewportId].
		geometry.convertedObject[this._renderingEngine.id] = instancedMesh;

		// Return a lightweight placeholder that lives in the SDObject children.
		// It carries enough userData for the cleanup path and effect managers.
		const placeholder = new THREE.Object3D();
		placeholder.matrixAutoUpdate = false;
		placeholder.userData.isInstanced = true;
		placeholder.userData.instanceHash = geometry.instanceHash;
		placeholder.userData.instanceGroupKey =
			this._renderingEngine.instanceGroupManager.getGroupKey(geometry);
		placeholder.userData.instanceNode = parentNode; // strong ref for effects
		placeholder.userData.instanceGeometry = geometry;
		placeholder.userData.instanceNodeKey = `${parentNode.id}:${geometry.id}`;
		placeholder.userData.cacheKey = geometry.id + "_" + geometry.version;
		placeholder.userData.primitiveCacheKey = primitiveCacheKey;
		return placeholder;
	}

	public load(
		parentNode: ITreeNode,
		geometry: GeometryData,
		instanceData?: InstanceData,
	): GeometryType {
		let incomingMaterialData: IMaterialAbstractData | null;
		if (geometry.effectMaterials.length > 0) {
			incomingMaterialData =
				geometry.effectMaterials[geometry.effectMaterials.length - 1]
					.material;
		} else if (this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES) {
			incomingMaterialData = geometry.attributeMaterial;
		} else {
			incomingMaterialData = geometry.material;
		}

		// One primitive is one BufferGeometry. A second GeometryData with
		// the same primitive reuses it, so three does not copy every
		// attribute array. The geometry-cache hit below is the same
		// GeometryData again: that mesh already holds its retain.
		const primitiveCacheKey =
			geometry.primitive.id + "_" + geometry.primitive.version;
		const geometryCacheKey =
			geometry.id +
			"_" +
			geometry.version +
			(instanceData ? "_" + instanceData.id : "");
		const cachedGeometry = this._geometryCache[geometryCacheKey];
		const threeGeometry = cachedGeometry
			? cachedGeometry.obj.geometry
			: this.acquirePrimitiveGeometry(geometry, primitiveCacheKey);

		const attributes = threeGeometry.attributes;
		const morphAttributes = threeGeometry.morphAttributes;
		const hasMorphTargets = Object.keys(morphAttributes).length > 0;

		// Performance: Normalize settings to maximize shader program sharing
		// These settings affect shader generation, so keep them consistent across materials
		const materialSettings = {
			mode: geometry.mode,
			useVertexTangents: attributes.tangent !== undefined,
			useVertexColors:
				attributes.color !== undefined &&
				this._renderingEngine.type !== RENDERER_TYPE.ATTRIBUTES,
			useFlatShading: attributes.normal === undefined,
			useMorphTargets: hasMorphTargets,
			useMorphNormals:
				hasMorphTargets && morphAttributes.normal !== undefined,
		};

		let preparedGemMapKey: string | undefined;
		let gemShapeKey: string | undefined;
		if (incomingMaterialData instanceof MaterialGemData) {
			({mapKey: preparedGemMapKey, shapeKey: gemShapeKey} =
				this.prepareGemMaterialData(
					geometry,
					threeGeometry,
					incomingMaterialData,
				));
		}

		const material = this._renderingEngine.materialLoader.load(
			incomingMaterialData || geometry,
			materialSettings,
			gemShapeKey,
		);

		// Performance: Disable unnecessary material features for static materials
		if (!hasMorphTargets) {
			// For non-transparent materials, ensure depth write/test are optimized
			if (!material.transparent) {
				material.depthWrite = true;
				material.depthTest = true;
			}
		}

		// Performance: Mark material as not needing update to avoid shader recompilation
		// unless properties that affect the shader have changed
		material.needsUpdate = false;

		let threeGeometryObject: GeometryType;
		// One geometry can be shared by several nodes that each carry their own
		// InstanceData (EXT_mesh_gpu_instancing). Those must not share a cached
		// InstancedMesh, so the instance set is part of the cache identity.
		if (cachedGeometry) {
			cachedGeometry.counter++;
			threeGeometryObject = cachedGeometry.obj;
			// a mesh released on removal can be shown again
			this._releasedMeshes.delete(threeGeometryObject);
			// removeData flagged it. It is in use again.
			delete threeGeometryObject.userData.removed;
			threeGeometryObject.material = material;

			// Conventional InstancedMeshes are still used for explicit InstanceData.
			// Attribute rendering must not multiply its material by their stale colors.
			if (threeGeometryObject instanceof THREE.InstancedMesh) {
				if (this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES) {
					threeGeometryObject.instanceColor = null;
				} else if (instanceData && !threeGeometryObject.instanceColor) {
					for (let i = 0; i < instanceData.instanceColors.length; i++)
						threeGeometryObject.setColorAt(
							i,
							this._renderingEngine.createThreeJsColor(
								instanceData.instanceColors[i],
							),
						);
					threeGeometryObject.instanceColor!.needsUpdate = true;
				}
			}
		} else {
			threeGeometryObject = this.createMesh(
				parentNode,
				geometry,
				threeGeometry,
				material,
				instanceData,
			);
			threeGeometryObject.userData.cacheKey = geometryCacheKey;
			this._geometryCache[geometryCacheKey] = {
				obj: threeGeometryObject,
				counter: 1,
				clones: [],
				primitiveCacheId:
					geometry.primitive.id + "_" + geometry.primitive.version,
			};
		}

		this.applyMaterial(threeGeometryObject, material);
		this.syncGemNormalMap(threeGeometryObject);
		// the cached material can show another map than the one just prepared
		// for this geometry, then nothing holds the prepared one
		if (preparedGemMapKey) this.freeGemNormalMapIfUnused(preparedGemMapKey);

		threeGeometryObject.castShadow = geometry.castShadow;
		threeGeometryObject.receiveShadow = !(material instanceof GemMaterial)
			? geometry.receiveShadow
			: false;
		this._renderingEngine.pulseEffectManager.update(geometry, [
			threeGeometryObject,
		]);

		return threeGeometryObject;
	}

	public loadPrimitive(primitive: IPrimitiveData): THREE.BufferGeometry {
		const geometry = new THREE.BufferGeometry();
		if (primitive.indices)
			geometry.setIndex(
				new THREE.BufferAttribute(
					primitive.indices!.array,
					primitive.indices!.itemSize,
				),
			);

		for (const attributeId in primitive.attributes) {
			const buffer = this.loadAttribute(
				primitive.attributes[attributeId],
				attributeId,
			);
			const attributeName = this.getAttributeName(attributeId);

			if (attributeId === "NORMAL")
				if (this.checkNormals(primitive, attributeId, buffer, geometry))
					continue;

			geometry.setAttribute(attributeName, buffer);

			const morphAttributeData =
				primitive.attributes[attributeId].morphAttributeData;
			if (morphAttributeData.length > 0) {
				geometry.morphTargetsRelative = true;
				const buffers: (
					| THREE.BufferAttribute
					| THREE.InterleavedBufferAttribute
				)[] = [];
				for (let i = 0; i < morphAttributeData.length; i++)
					buffers.push(
						this.loadAttribute(morphAttributeData[i], attributeId),
					);
				(
					geometry.morphAttributes as Record<
						string,
						(
							| THREE.BufferAttribute
							| THREE.InterleavedBufferAttribute
						)[]
					>
				)[attributeName] = buffers;
			}

			// we copy the uv coordinates into the second set of uv coordinates if there are none
			// this allows for the usage of AO and light maps that share this coordinate set
			const attributeIdUV2 = "TEXCOORD_1",
				attributeNameUV2 = "uv1";
			if (
				attributeName === "uv" &&
				!primitive.attributes[attributeIdUV2]
			) {
				geometry.setAttribute(attributeNameUV2, buffer);

				const morphAttributeData =
					primitive.attributes[attributeId].morphAttributeData;
				if (morphAttributeData.length > 0) {
					geometry.morphTargetsRelative = true;
					const buffers: (
						| THREE.BufferAttribute
						| THREE.InterleavedBufferAttribute
					)[] = [];
					for (let i = 0; i < morphAttributeData.length; i++)
						buffers.push(
							this.loadAttribute(
								morphAttributeData[i],
								attributeId,
							),
						);
					(
						geometry.morphAttributes as Record<
							string,
							(
								| THREE.BufferAttribute
								| THREE.InterleavedBufferAttribute
							)[]
						>
					)[attributeNameUV2] = buffers;
				}
			}
		}
		primitive.convertedObject[this._renderingEngine.id] = geometry;

		const primitiveCacheKey = primitive.id + "_" + primitive.version;
		this._primitiveCache[primitiveCacheKey] = {
			threeGeometry: geometry,
			counter: 1,
			clones: [],
		};
		return geometry;
	}

	/** Whether the texture is a gem normal map that is still in use. */
	public isGemNormalMap(texture: THREE.Texture): boolean {
		return this._gemMapKeyOfTexture.has(texture);
	}

	/** Number and size of the live gem normal maps, for measurements. */
	public gemNormalMapStats(): {maps: number; bytes: number} {
		let bytes = 0;
		const entries = Object.values(this._gemSphericalMapsCache);
		for (const entry of entries)
			bytes +=
				entry.resolution *
				entry.resolution *
				6 *
				(entry.planeTracing ? 8 : 4);
		return {maps: entries.length, bytes};
	}

	/** An object left the scene: it no longer holds its gem normal map. */
	public releaseGemNormalMap(object: THREE.Object3D): void {
		const key = this._gemMapOfObject.get(object);
		if (key === undefined) return;
		this._gemMapOfObject.delete(object);
		this.releaseGemNormalMapKey(key);
	}

	/**
	 * Make the object hold the gem normal map its material shows now, and let
	 * go of the one it held before.
	 */
	private syncGemNormalMap(object: THREE.Object3D): void {
		const material = (<THREE.Mesh>object).material;
		let key: string | undefined;
		if (material) {
			for (const m of Array.isArray(material) ? material : [material]) {
				if (m instanceof GemMaterial && m.sphericalNormalMap) {
					key = this._gemMapKeyOfTexture.get(m.sphericalNormalMap);
					if (key !== undefined) break;
				}
			}
		}

		const previous = this._gemMapOfObject.get(object);
		if (key === previous) return;
		if (key !== undefined) {
			this._gemSphericalMapsCache[key].counter++;
			this._pendingGemMaps.delete(key);
			this._gemMapOfObject.set(object, key);
		} else {
			this._gemMapOfObject.delete(object);
		}
		if (previous !== undefined) {
			// a material change is no removal: the map may be needed again
			const entry = this._gemSphericalMapsCache[previous];
			if (entry && --entry.counter <= 0)
				this._pendingGemMaps.add(previous);
		}
	}

	/** Free the pending maps that still have no user, after a node removal. */
	public sweepPendingGemNormalMaps(): void {
		for (const key of [...this._pendingGemMaps]) {
			this._pendingGemMaps.delete(key);
			if (this._gemSphericalMapsCache[key]?.counter === 0)
				this.freeGemNormalMap(key);
		}
	}

	private releaseGemNormalMapKey(key: string): void {
		const entry = this._gemSphericalMapsCache[key];
		if (!entry) return;
		if (--entry.counter > 0) return;
		this.freeGemNormalMap(key);
	}

	private freeGemNormalMapIfUnused(key: string): void {
		// a pending map waits for the next removal sweep
		if (
			this._gemSphericalMapsCache[key]?.counter === 0 &&
			!this._pendingGemMaps.has(key)
		)
			this.freeGemNormalMap(key);
	}

	private freeGemNormalMap(key: string): void {
		this._pendingGemMaps.delete(key);
		const entry = this._gemSphericalMapsCache[key];
		// nothing shows the cached gem materials of this map, and a later
		// capture of the shape gets a new key, so they are never used again
		this._renderingEngine.materialLoader.removeGemMaterialsWithMap(
			entry.texture,
		);
		// the render target frees the GPU texture, the texture tells its users
		entry.renderTarget.dispose();
		entry.texture.dispose();
		this._gemMapKeyOfTexture.delete(entry.texture);
		delete this._gemSphericalMapsCache[key];
		for (const [alias, target] of this._gemMapAliases)
			if (target === key) this._gemMapAliases.delete(alias);
		const bucket = this._gemShapeBuckets.get(entry.shapeBucket);
		if (bucket) {
			const index = bucket.indexOf(key);
			if (index >= 0) bucket.splice(index, 1);
			if (bucket.length === 0)
				this._gemShapeBuckets.delete(entry.shapeBucket);
		}
	}

	/**
	 * Fill in the geometry dependent parts of a gem material: tight bounding
	 * sphere (center, radius), the spherical normal cube map and the side.
	 * Returns the key of the normal map, which nothing holds yet, and the
	 * shape key the material loader caches the gem material under: one gem
	 * material data shared by stones of different shapes or positions must
	 * give each of them its own map, center and radius.
	 */
	private prepareGemMaterialData(
		geometry: GeometryData,
		threeGeometry: THREE.BufferGeometry,
		gemMaterialData: MaterialGemData,
	): {mapKey: string; shapeKey: string} {
		// Gem shading wants the tight sphere around the vertices. The
		// shared geometry keeps the AABB sphere createMesh stores for
		// culling. Leaving the tight sphere on the geometry makes the
		// next gem read whichever sphere was stored first.
		const savedSphere = threeGeometry.boundingSphere;
		const savedBox = threeGeometry.boundingBox;
		const gemSphere = new THREE.Sphere();
		threeGeometry.boundingSphere = gemSphere;
		threeGeometry.boundingBox = null;
		threeGeometry.computeBoundingSphere();
		threeGeometry.boundingSphere = savedSphere;
		threeGeometry.boundingBox = savedBox;

		const {key, texture: sphericalNormalMap} = this.createCubeNormalMap(
			geometry,
			threeGeometry,
			gemMaterialData.normalMapResolution,
		);

		const center = gemSphere.center,
			radius = gemSphere.radius;

		gemMaterialData.side = MATERIAL_SIDE.FRONT;

		gemMaterialData.center = vec3.fromValues(center.x, center.y, center.z);
		gemMaterialData.radius = radius;
		// cached gem materials built with a map that was freed in between get
		// the new one. A live map stays: the data may be shared by other shapes.
		const previous = <THREE.CubeTexture | undefined>(
			(<unknown>gemMaterialData.sphericalNormalMap)
		);
		if (
			previous &&
			previous !== sphericalNormalMap &&
			!this.isGemNormalMap(previous)
		)
			this._renderingEngine.materialLoader.replaceGemNormalMap(
				previous,
				sphericalNormalMap,
			);
		(<unknown>gemMaterialData.sphericalNormalMap) = sphericalNormalMap;
		return {
			mapKey: key,
			shapeKey: `${key}_${center.x}_${center.y}_${center.z}_${radius}`,
		};
	}

	/**
	 * Whether the material data of the geometry is a different material
	 * (other id) than the one currently applied to the given object.
	 * Versions are not compared: in-place edits keep the existing handling.
	 */
	public isMaterialReplaced(
		geometry: GeometryData,
		object: THREE.Object3D,
	): boolean {
		let source: IMaterialAbstractData | null;
		if (geometry.effectMaterials.length > 0) {
			source =
				geometry.effectMaterials[geometry.effectMaterials.length - 1]
					.material;
		} else if (this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES) {
			source = geometry.attributeMaterial;
		} else {
			source = geometry.material;
		}
		const current = (object as THREE.Mesh).material;
		if (!current) return false;
		// a back and front pair carries the ids of its source
		const shown = Array.isArray(current) ? current[0] : current;
		if (!shown) return false;
		return shown.userData.SDid !== (source || geometry).id;
	}

	/**
	 * Show the material on the object. A transparent double-sided material
	 * is shown as a fixed back and front pair over two geometry groups, see
	 * MaterialLoader.renderMaterialFor.
	 */
	private applyMaterial(
		object: GeometryType,
		material: THREE.Material,
	): void {
		// a released mesh is no user of a split
		if (
			!(object instanceof THREE.Mesh) ||
			object instanceof THREE.InstancedMesh ||
			this._releasedMeshes.has(object)
		) {
			object.material = material;
			return;
		}
		const shown =
			this._renderingEngine.materialLoader.renderMaterialFor(material);
		if (Array.isArray(shown) && this.splitGeometry(object)) {
			object.material = shown;
			return;
		}
		this.mergeGeometry(object);
		object.material = Array.isArray(shown) ? material : shown;
	}

	/**
	 * Give the mesh its own geometry with a back and a front group. It
	 * shares the attributes of the primitive geometry, which stays as it is
	 * for the meshes that share it (a batch rejects a geometry with groups).
	 */
	private splitGeometry(mesh: THREE.Mesh): boolean {
		const existing = this._sideSplits.get(mesh.geometry);
		if (existing) {
			existing.users.add(mesh);
			return true;
		}
		const source = mesh.geometry;
		const shared = this._splitOfSource.get(source);
		if (shared) {
			this._sideSplits.get(shared)?.users.add(mesh);
			mesh.geometry = shared;
			return true;
		}
		const index = source.getIndex();
		const count = index
			? index.count
			: source.getAttribute("position")?.count;
		if (!count) return false;
		const split = new THREE.BufferGeometry();
		if (index) split.setIndex(index);
		for (const name in source.attributes)
			split.setAttribute(name, source.attributes[name]);
		split.morphAttributes = {...source.morphAttributes};
		split.morphTargetsRelative = source.morphTargetsRelative;
		split.boundingBox = source.boundingBox?.clone() ?? null;
		split.boundingSphere = source.boundingSphere?.clone() ?? null;
		split.drawRange = {...source.drawRange};
		split.addGroup(0, count, 0);
		split.addGroup(0, count, 1);
		this._sideSplits.set(split, {source, users: new Set([mesh])});
		this._splitOfSource.set(source, split);
		mesh.geometry = split;
		return true;
	}

	/** Give the mesh its shared geometry back. */
	private mergeGeometry(mesh: THREE.Mesh): void {
		const split = mesh.geometry;
		const entry = this._sideSplits.get(split);
		if (!entry) return;
		entry.users.delete(mesh);
		mesh.geometry = entry.source;
		// a clone may still show it
		if (entry.users.size > 0) return;
		this._sideSplits.delete(split);
		this._splitOfSource.delete(entry.source);
		// dispose frees the buffers of the attributes it holds, and those
		// belong to the shared geometry
		for (const name of Object.keys(split.attributes))
			split.deleteAttribute(name);
		split.setIndex(null);
		split.morphAttributes = {};
		split.dispose();
	}

	/** Release what a mesh holds for its back and front pair. */
	public releaseSideSplit(object: THREE.Object3D): void {
		if (!(object instanceof THREE.Mesh)) return;
		this.mergeGeometry(object);
		this._releasedMeshes.add(object);
	}

	public updateGeometryMaterial(geometry: GeometryData): void {
		// Instanced-data meshes carry an InstanceData suffix in their cache key.
		const cacheKey = geometry.id + "_" + geometry.version;
		const cached =
			this._geometryCache[cacheKey] ??
			Object.entries(this._geometryCache).find(([key]) =>
				key.startsWith(cacheKey + "_"),
			)?.[1];

		let incomingMaterialData: IMaterialAbstractData | null;
		if (geometry.effectMaterials.length > 0) {
			incomingMaterialData =
				geometry.effectMaterials[geometry.effectMaterials.length - 1]
					.material;
		} else if (this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES) {
			incomingMaterialData = geometry.attributeMaterial;
		} else {
			incomingMaterialData = geometry.material;
		}

		if (!cached) {
			if (!geometry.instantiable) return;

			const instanceMesh =
				this._renderingEngine.instanceGroupManager.getDefaultMesh(
					geometry.instanceHash,
				);
			if (!instanceMesh) return;

			const attributes = instanceMesh.geometry.attributes;
			const instancedMaterialSettings = {
				mode: geometry.mode,
				useVertexTangents: attributes.tangent !== undefined,
				useVertexColors:
					attributes.color !== undefined &&
					this._renderingEngine.type !== RENDERER_TYPE.ATTRIBUTES,
				useFlatShading: attributes.normal === undefined,
				useMorphTargets: false,
				useMorphNormals: false,
			};

			// Effect materials (interaction highlights) are per occurrence:
			// only this geometry's instances move into an override batch, the
			// rest of the group keeps its shared material. The same applies to
			// a non-opaque attribute material, which needs its own transparent
			// batch instead of poisoning the group's shared material.
			if (
				geometry.effectMaterials.length > 0 ||
				(this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES &&
					(incomingMaterialData?.opacity ?? 1) < 1)
			) {
				const overrideMaterial = this._renderingEngine.materialLoader
					.load(
						incomingMaterialData || geometry,
						instancedMaterialSettings,
					)
					.clone();
				this._renderingEngine.instanceGroupManager.setMaterialOverride(
					geometry.id,
					overrideMaterial,
				);
				this.updateInstancedPulse(geometry);
				return;
			}
			this._renderingEngine.instanceGroupManager.clearMaterialOverride(
				geometry.id,
			);

			// Attribute visualization carries per-occurrence flat colors via
			// the per-instance color attribute; refresh only this occurrence.
			if (this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES) {
				this._renderingEngine.instanceGroupManager.updateNodeColor(
					geometry,
				);
				this.updateInstancedPulse(geometry);
				return;
			}

			// Material data can change without changing its id (for example after
			// changing material override settings). Refresh the shared white batch
			// material when this occurrence owns the group's source material.
			if (
				incomingMaterialData &&
				incomingMaterialData.id ===
					this._renderingEngine.instanceGroupManager.getSharedMaterialId(
						geometry.instanceHash,
					)
			) {
				const sourceMaterial =
					this._renderingEngine.materialLoader.load(
						incomingMaterialData,
						instancedMaterialSettings,
					);
				if (
					this._renderingEngine.instanceGroupManager.hasSharedMaterialSourceChanged(
						geometry.instanceHash,
						sourceMaterial.uuid,
					)
				) {
					const sharedMaterial =
						this.createInstancedMaterial(sourceMaterial);
					sharedMaterial.userData.sourceMaterialUuid =
						sourceMaterial.uuid;
					this._renderingEngine.instanceGroupManager.updateMaterial(
						geometry.instanceHash,
						sharedMaterial,
					);
				}
				this._renderingEngine.instanceGroupManager.updateNodeColor(
					geometry,
				);
				this.updateInstancedPulse(geometry);
				return;
			}

			// A base-material change on one occurrence must not re-material
			// the whole group. Color variants keep their original material ids
			// and stay in the default batch; a later assignment of a different
			// material gets its own override batch.
			if (
				incomingMaterialData &&
				this._renderingEngine.instanceGroupManager.hasOccurrenceMaterialChanged(
					geometry.id,
					incomingMaterialData.id,
				)
			) {
				const overrideMaterial = this._renderingEngine.materialLoader
					.load(incomingMaterialData, instancedMaterialSettings)
					.clone();
				this._renderingEngine.instanceGroupManager.setMaterialOverride(
					geometry.id,
					overrideMaterial,
				);
			} else {
				this._renderingEngine.instanceGroupManager.updateNodeColor(
					geometry,
				);
			}
			this.updateInstancedPulse(geometry);
			return;
		}

		const threeGeometry = cached.obj.geometry;
		const attributes = threeGeometry.attributes;
		const morphAttributes = threeGeometry.morphAttributes;
		const hasMorphTargets = Object.keys(morphAttributes).length > 0;

		const materialSettings = {
			mode: geometry.mode,
			useVertexTangents: attributes.tangent !== undefined,
			useVertexColors:
				attributes.color !== undefined &&
				this._renderingEngine.type !== RENDERER_TYPE.ATTRIBUTES,
			useFlatShading: attributes.normal === undefined,
			useMorphTargets: hasMorphTargets,
			useMorphNormals:
				hasMorphTargets && morphAttributes.normal !== undefined,
		};

		// Always for this geometry: the gem material data may already be set
		// up for another stone shape. A map captured before is reused.
		let preparedGemMapKey: string | undefined;
		let gemShapeKey: string | undefined;
		if (incomingMaterialData instanceof MaterialGemData) {
			({mapKey: preparedGemMapKey, shapeKey: gemShapeKey} =
				this.prepareGemMaterialData(
					geometry,
					threeGeometry,
					incomingMaterialData,
				));
		}

		const material = this._renderingEngine.materialLoader.load(
			incomingMaterialData || geometry,
			materialSettings,
			gemShapeKey,
		);

		const geometryObjects = this._geometryObjects.get(geometry) ?? [
			cached.obj,
		];
		geometryObjects.forEach((geometryObject) => {
			this._renderingEngine.pulseEffectManager.clear(geometryObject);
			this.applyMaterial(geometryObject, material);
			geometryObject.receiveShadow =
				material instanceof GemMaterial
					? false
					: geometry.receiveShadow;
			if (geometryObject instanceof THREE.InstancedMesh) {
				if (this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES) {
					geometryObject.instanceColor = null;
				}
			}
		});
		for (const geometryObject of geometryObjects)
			this.syncGemNormalMap(geometryObject);
		if (preparedGemMapKey) this.freeGemNormalMapIfUnused(preparedGemMapKey);
		this._renderingEngine.pulseEffectManager.update(
			geometry,
			geometryObjects,
		);
		for (const geometryObject of geometryObjects)
			this._renderingEngine.materialBatchManager.syncObject(
				geometryObject,
			);
	}

	public registerGeometryObject(
		geometry: GeometryData,
		object: THREE.Object3D,
	): void {
		let geometryObjects = this._geometryObjects.get(geometry);
		if (!geometryObjects) {
			geometryObjects = new Set();
			this._geometryObjects.set(geometry, geometryObjects);
		}
		this._releasedMeshes.delete(object);
		geometryObjects.add(object as GeometryType);
		this._geometryOfObject.set(object, geometry);
		// a clone shows the map of its original and holds it on its own
		this.syncGemNormalMap(object);
		// a clone of a mesh with a back and front pair shares its geometry
		if (object instanceof THREE.Mesh)
			this._sideSplits.get(object.geometry)?.users.add(object);
		this._renderingEngine.pulseEffectManager.update(geometry, [
			object as GeometryType,
		]);
	}

	/**
	 * The object left the scene. A scene update converts a node anew and
	 * registers a new object (often a clone) for the same GeometryData, so a
	 * removed object that stayed registered would keep its old tree, through
	 * its parents, alive for as long as the GeometryData lives.
	 */
	public unregisterGeometryObject(object: THREE.Object3D): void {
		const geometry = this._geometryOfObject.get(object);
		if (!geometry) return;
		this._geometryOfObject.delete(object);
		const geometryObjects = this._geometryObjects.get(geometry);
		if (!geometryObjects) return;
		geometryObjects.delete(object as GeometryType);
		if (geometryObjects.size === 0) this._geometryObjects.delete(geometry);
	}

	private updateInstancedPulse(geometry: GeometryData): void {
		this._renderingEngine.pulseEffectManager.update(
			geometry,
			this._geometryObjects.get(geometry) ?? [],
		);
	}

	private createInstancedMaterial(material: THREE.Material): THREE.Material {
		const instanceMaterial = material.clone();
		if (
			"color" in instanceMaterial &&
			instanceMaterial.color instanceof THREE.Color
		)
			instanceMaterial.color.setRGB(1, 1, 1);
		return instanceMaterial;
	}

	public removeFromGeometryCache(id: string) {
		const cachedGeometry = this._geometryCache[id];
		if (cachedGeometry) {
			if (cachedGeometry.counter === 1) {
				this.removeFromPrimitiveCache(cachedGeometry.primitiveCacheId);
				cachedGeometry.clones.forEach(() => {
					this.removeFromPrimitiveCache(
						cachedGeometry.primitiveCacheId,
					);
				});
				delete this._geometryCache[id];
			} else {
				cachedGeometry.counter--;
			}
		}
	}

	// #endregion Public Methods (6)

	// #region Private Methods (7)

	private checkNormals(
		primitive: IPrimitiveData,
		attributeId: string,
		buffer: THREE.InterleavedBufferAttribute | THREE.BufferAttribute,
		geometry: THREE.BufferGeometry,
	): boolean {
		let blnNormalsOk = false;
		for (let index = 0; index < 10; ++index) {
			if (Math.abs(buffer.array[index * 3]) > 0.001) {
				blnNormalsOk = true;
				break;
			}
			if (Math.abs(buffer.array[index * 3 + 1]) > 0.001) {
				blnNormalsOk = true;
				break;
			}
			if (Math.abs(buffer.array[index * 3 + 2]) > 0.001) {
				blnNormalsOk = true;
				break;
			}
		}
		if (!blnNormalsOk) {
			geometry.computeVertexNormals();
			const computedNormalAttribute = <THREE.BufferAttribute>(
				geometry.getAttribute("normal")
			);

			// store the computed normals in the attribute data
			primitive.attributes[attributeId] = new AttributeData(
				new Float32Array(computedNormalAttribute.array),
				computedNormalAttribute.itemSize,
				0,
				0,
				3,
				computedNormalAttribute.normalized,
				computedNormalAttribute.array.length / 3,
			);
			return true;
		}
		return false;
	}

	/**
	 * Retain the cached geometry for a new mesh. Triangle strips and fans
	 * rewrite the index, so those get a clone and the cached geometry stays
	 * as it was parsed.
	 */
	private acquirePrimitiveGeometry(
		geometry: GeometryData,
		primitiveCacheKey: string,
	): THREE.BufferGeometry {
		const cachedPrimitive = this._primitiveCache[primitiveCacheKey];
		let bufferGeometry: THREE.BufferGeometry;
		if (!cachedPrimitive) {
			bufferGeometry = this.loadPrimitive(geometry.primitive);
		} else {
			cachedPrimitive.counter++;
			bufferGeometry = cachedPrimitive.threeGeometry;
		}

		if (!this.indexIsRewritten(geometry.mode)) return bufferGeometry;

		const clone = bufferGeometry.clone();
		this._primitiveCache[primitiveCacheKey].clones.push(clone);
		return clone;
	}

	private indexIsRewritten(mode: PRIMITIVE_MODE): boolean {
		return (
			mode === PRIMITIVE_MODE.TRIANGLE_STRIP ||
			mode === PRIMITIVE_MODE.TRIANGLE_FAN
		);
	}

	private convertToTriangleMode(
		geometry: THREE.BufferGeometry,
		drawMode: PRIMITIVE_MODE,
	) {
		let index = geometry.getIndex();
		// generate index if not present
		if (index === null) {
			const indices = [];
			const position = geometry.getAttribute("position");
			if (position !== undefined) {
				for (let i = 0; i < position.count; i++) indices.push(i);
				geometry.setIndex(indices);
				index = geometry.getIndex();
			} else {
				throw new ShapeDiverViewerDataProcessingError(
					"GeometryLoader.convertToTriangleMode: Undefined position attribute. Processing not possible.",
				);
			}
		}

		if (index === null)
			throw new ShapeDiverViewerDataProcessingError(
				"GeometryLoader.convertToTriangleMode: Undefined index. Processing not possible.",
			);

		const numberOfTriangles = index.count - 2;
		const newIndices = [];
		if (drawMode === PRIMITIVE_MODE.TRIANGLE_FAN) {
			for (let i = 1; i <= numberOfTriangles; i++) {
				newIndices.push(index.getX(0));
				newIndices.push(index.getX(i));
				newIndices.push(index.getX(i + 1));
			}
		} else {
			for (let i = 0; i < numberOfTriangles; i++) {
				if (i % 2 === 0) {
					newIndices.push(index.getX(i));
					newIndices.push(index.getX(i + 1));
					newIndices.push(index.getX(i + 2));
				} else {
					newIndices.push(index.getX(i + 2));
					newIndices.push(index.getX(i + 1));
					newIndices.push(index.getX(i));
				}
			}
		}

		if (newIndices.length / 3 !== numberOfTriangles)
			throw new ShapeDiverViewerDataProcessingError(
				"GeometryLoader.convertToTriangleMode: Unable to generate correct amount of triangle.",
			);

		geometry.setIndex(newIndices);
	}

	/**
	 * Whether the renderer can render to half-float colour targets, which the
	 * facet plane capture of gems needs.
	 */
	private gemPlaneTracingSupported(): boolean {
		if (this._gemPlaneTracingSupported === undefined) {
			const extensions = this._renderingEngine.renderer.extensions;
			this._gemPlaneTracingSupported =
				extensions.has("EXT_color_buffer_float") ||
				extensions.has("EXT_color_buffer_half_float");
		}

		return this._gemPlaneTracingSupported;
	}

	private createGemCubeRenderTarget(
		resolution: number,
		planeTracing: boolean,
		depthBuffer: boolean,
	): THREE.WebGLCubeRenderTarget {
		const renderTarget = new THREE.WebGLCubeRenderTarget(resolution, {
			depthBuffer,
			format: THREE.RGBAFormat,
			type: planeTracing ? THREE.HalfFloatType : THREE.UnsignedByteType,
			magFilter: THREE.LinearFilter,
			minFilter: THREE.LinearFilter,
		});
		renderTarget.texture.generateMipmaps = false;
		renderTarget.texture.minFilter = THREE.NearestFilter;
		renderTarget.texture.magFilter = THREE.NearestFilter;
		renderTarget.texture.format = THREE.RGBAFormat;

		return renderTarget;
	}

	/**
	 * Centre and largest side of the bounding box of the positions, as
	 * BufferGeometry.center() computes them for the capture.
	 */
	private gemShapeBox(geometry: THREE.BufferGeometry): {
		center: THREE.Vector3;
		extent: number;
	} {
		const position = geometry.attributes.position;
		const box = new THREE.Box3();
		// getX and friends, the positions can be interleaved
		for (let i = 0; position && i < position.count; i++)
			box.expandByPoint(
				_gemShapePoint.set(
					position.getX(i),
					position.getY(i),
					position.getZ(i),
				),
			);
		const size = box.getSize(new THREE.Vector3());
		return {
			center: box.getCenter(new THREE.Vector3()),
			extent: Math.max(size.x, size.y, size.z),
		};
	}

	/**
	 * Key of what float noise cannot change: counts, draw range, indices and
	 * normals (translating a shape leaves them as they are). The positions
	 * are compared separately with a tolerance, because a hash of rounded
	 * positions splits identical shapes whose coordinates are off by one
	 * float step across a rounding boundary.
	 */
	private gemShapeBucket(
		geometry: THREE.BufferGeometry,
		requestedResolution: number | undefined,
	): string {
		let h1 = 0x811c9dc5;
		let h2 = 0x9747b28c;
		const add = (value: number) => {
			// FNV-1a
			h1 = Math.imul(h1 ^ value, 16777619);
			// murmur3 style mix
			let k = Math.imul(value, 0xcc9e2d51);
			k = (k << 15) | (k >>> 17);
			k = Math.imul(k, 0x1b873593);
			h2 ^= k;
			h2 = (h2 << 13) | (h2 >>> 19);
			h2 = (Math.imul(h2, 5) + 0xe6546b64) | 0;
		};

		const normal = geometry.attributes.normal;
		if (normal) {
			for (let i = 0; i < normal.count; i++) {
				add(Math.round(normal.getX(i) * 1e4));
				add(Math.round(normal.getY(i) * 1e4));
				add(Math.round(normal.getZ(i) * 1e4));
			}
		} else {
			add(-1);
		}
		const index = geometry.index;
		if (index) for (let i = 0; i < index.count; i++) add(index.getX(i));

		return (
			"shape_" +
			(h1 >>> 0).toString(16) +
			"_" +
			(h2 >>> 0).toString(16) +
			"_" +
			(geometry.attributes.position?.count ?? 0) +
			"_" +
			(index?.count ?? 0) +
			"_" +
			geometry.drawRange.start +
			"_" +
			geometry.drawRange.count +
			"_" +
			requestedResolution
		);
	}

	/** Whether the positions match those of a captured shape, centred. */
	private isSameGemShape(
		geometry: THREE.BufferGeometry,
		center: THREE.Vector3,
		extent: number,
		entry: {
			geometry: THREE.BufferGeometry;
			shapeCenter: THREE.Vector3;
			shapeExtent: number;
		},
	): boolean {
		const a = geometry.attributes.position;
		const b = entry.geometry.attributes.position;
		if (!a || !b || a.count !== b.count) return false;
		// Only float32 noise: translated copies differ by about one step of
		// the largest original coordinate (rounding of the translation, and of
		// the centring). 2^-20 is 8 or more steps. Anything larger is a
		// different shape, which must keep its own map to render the same.
		let maxAbs = 0;
		for (let i = 0; i < a.count; i++)
			maxAbs = Math.max(
				maxAbs,
				Math.abs(a.getX(i)),
				Math.abs(a.getY(i)),
				Math.abs(a.getZ(i)),
			);
		for (let i = 0; i < b.count; i++)
			maxAbs = Math.max(
				maxAbs,
				Math.abs(b.getX(i)),
				Math.abs(b.getY(i)),
				Math.abs(b.getZ(i)),
			);
		const tolerance = Math.max(maxAbs * 2 ** -20, 1e-9);
		if (Math.abs(extent - entry.shapeExtent) > 2 * tolerance) return false;
		const c = entry.shapeCenter;
		for (let i = 0; i < a.count; i++) {
			if (
				Math.abs(a.getX(i) - center.x - (b.getX(i) - c.x)) >
					tolerance ||
				Math.abs(a.getY(i) - center.y - (b.getY(i) - c.y)) >
					tolerance ||
				Math.abs(a.getZ(i) - center.z - (b.getZ(i) - c.z)) > tolerance
			)
				return false;
		}
		return true;
	}

	/**
	 * The normal map of a primitive. Primitives with the same shape (e.g. the
	 * stones of a pavé, each with its own mesh) share one map. The map starts
	 * without a user: objects take their reference in syncGemNormalMap.
	 */
	private createCubeNormalMap(
		geometryData: GeometryData,
		geometry: THREE.BufferGeometry,
		requestedResolution: number | undefined,
	): {key: string; texture: THREE.CubeTexture} {
		// the same primitive always shows the same map, whatever its
		// resolution was when it was captured
		const primitiveKey =
			geometryData.primitive.id + "_" + geometryData.primitive.version;
		const aliased = this._gemMapAliases.get(primitiveKey);
		if (aliased && this._gemSphericalMapsCache[aliased])
			return {
				key: aliased,
				texture: this._gemSphericalMapsCache[aliased].texture,
			};

		const bucket = this.gemShapeBucket(geometry, requestedResolution);
		const {center, extent} = this.gemShapeBox(geometry);
		for (const candidate of this._gemShapeBuckets.get(bucket) ?? []) {
			const entry = this._gemSphericalMapsCache[candidate];
			if (entry && this.isSameGemShape(geometry, center, extent, entry)) {
				this._gemMapAliases.set(primitiveKey, candidate);
				return {key: candidate, texture: entry.texture};
			}
		}

		const {renderTarget, resolution, planeTracing} =
			this.captureGemCubeNormalMap(
				geometryData,
				geometry,
				requestedResolution,
			);

		const key = bucket + "_" + this._gemMapCounter++;
		this._gemSphericalMapsCache[key] = {
			texture: renderTarget.texture,
			renderTarget,
			counter: 0,
			geometryData,
			geometry,
			requestedResolution,
			resolution,
			planeTracing,
			shapeCenter: center,
			shapeExtent: extent,
			shapeBucket: bucket,
		};
		this._gemMapKeyOfTexture.set(renderTarget.texture, key);
		this._gemMapAliases.set(primitiveKey, key);
		const siblings = this._gemShapeBuckets.get(bucket);
		if (siblings) siblings.push(key);
		else this._gemShapeBuckets.set(bucket, [key]);
		return {key, texture: renderTarget.texture};
	}

	/**
	 * Resolution and tracing mode a capture uses with the current settings.
	 */
	private resolveGemCaptureSettings(requestedResolution: number | undefined) {
		let resolution = requestedResolution;
		const allowedResolutions = [256, 512, 1024];
		if (
			resolution === undefined ||
			!allowedResolutions.includes(resolution)
		)
			resolution = this._renderingEngine.gemNormalMapResolution;
		if (!allowedResolutions.includes(resolution)) resolution = 1024;

		// facet plane tracing is opt-in, sphere tracing is the legacy look
		const planeTracing =
			this._renderingEngine.gemTracing === "facets" &&
			this.gemPlaneTracingSupported();

		return {resolution, planeTracing};
	}

	private captureGemCubeNormalMap(
		geometryData: GeometryData,
		geometry: THREE.BufferGeometry,
		requestedResolution: number | undefined,
	) {
		const {resolution, planeTracing} =
			this.resolveGemCaptureSettings(requestedResolution);

		// the capture needs a depth buffer, the kept map does not
		const captureTarget = this.createGemCubeRenderTarget(
			resolution,
			planeTracing,
			true,
		);

		if (!this._gemScene) {
			this._gemScene = new THREE.Scene();
			this._gemCubeCamera = new THREE.CubeCamera(
				0.001,
				10000,
				captureTarget,
			);
			this._gemScene.add(this._gemCubeCamera);
		} else {
			this._gemCubeCamera!.renderTarget = captureTarget;
		}

		if (!this._gemNormalMaterial) {
			const _normalShader = {
				defines: {},
				uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.common]),
				vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;

                void main() {
                  vNormal = normal;
                  vPosition = position;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                }
                `,
				fragmentShader: `
                varying highp vec3 vNormal;

                float decodeFloat(float f) {
                    float r = mod(f, 1.0/255.0);
                    return /*r > 0.5/256.0 ? f + (1.0/256.0) - r : */f - r;
                }
                
                vec3 decodeVec3(vec3 v) {
                    return vec3(decodeFloat(v.x), decodeFloat(v.y), decodeFloat(v.z));
                }
                
                float signEncoding(vec3 v) {
                    float code = 1.0;
                     if(v.x < 0.0 && v.y < 0.0 && v.z < 0.0) {
                        code = 0.0;
                    } else if (v.x < 0.0 && v.y < 0.0) {
                        code = 2.0/256.0;
                    } else if (v.x < 0.0 && v.z < 0.0) {
                        code = 4.0/256.0;
                    } else if (v.y < 0.0 && v.z < 0.0) {
                        code = 6.0/256.0;
                    } else if (v.x < 0.0) {
                        code = 8.0/256.0;
                    } else if (v.y < 0.0) {
                        code = 10.0/256.0;
                    } else if (v.z < 0.0) {
                        code = 12.0/256.0;
                    }
                    return code;
                }
                
                varying highp vec3 vPosition;

                void main() {
                    vec3 n = normalize(vNormal);
                    #ifdef GEM_PLANE_DISTANCE
                        // normal and distance of the facet plane from the center
                        gl_FragColor = vec4(n, dot(vPosition, n));
                    #else
                        gl_FragColor = vec4(decodeVec3(abs(n)), signEncoding(n));
                    #endif
                }
                `,
			};

			this._gemNormalMaterial = new THREE.ShaderMaterial({
				uniforms: THREE.UniformsUtils.clone(_normalShader.uniforms),
				defines: _normalShader.defines,
				vertexShader: _normalShader.vertexShader,
				fragmentShader: _normalShader.fragmentShader,
			});

			this._gemNormalMaterial.blending = THREE.NoBlending;
			this._gemNormalMaterial.side = THREE.DoubleSide;
			this._gemScene.overrideMaterial = this._gemNormalMaterial;
		}

		// the capture mode can change between captures
		const normalDefines = this._gemNormalMaterial.defines ?? {};
		if (planeTracing !== "GEM_PLANE_DISTANCE" in normalDefines) {
			if (planeTracing) normalDefines.GEM_PLANE_DISTANCE = "";
			else delete normalDefines.GEM_PLANE_DISTANCE;
			this._gemNormalMaterial.defines = normalDefines;
			this._gemNormalMaterial.needsUpdate = true;
		}

		const mesh = new THREE.Mesh(geometry.clone(), this._gemNormalMaterial);
		mesh.geometry.center();
		this._gemScene.add(mesh);

		this._gemCubeCamera!.update(
			this._renderingEngine.renderer,
			this._gemScene,
		);
		this._gemScene.remove(mesh);
		mesh.geometry.dispose();
		mesh.material.dispose();

		const renderTarget = this.createGemCubeRenderTarget(
			resolution,
			planeTracing,
			false,
		);
		this.copyGemCubeFaces(captureTarget, renderTarget, resolution);
		captureTarget.dispose();

		renderTarget.texture.userData = {
			SDid: geometryData.primitive.id,
			SDversion: geometryData.primitive.version,
		};

		return {
			renderTarget,
			resolution,
			planeTracing,
		};
	}

	/**
	 * Copy the colour of the six faces of one cube target into another. The
	 * capture target carries a depth buffer that nothing needs afterwards.
	 */
	private copyGemCubeFaces(
		source: THREE.WebGLCubeRenderTarget,
		target: THREE.WebGLCubeRenderTarget,
		resolution: number,
	): void {
		const renderer = this._renderingEngine.renderer;
		const gl = renderer.getContext() as WebGL2RenderingContext;
		const properties = (
			renderer as unknown as {
				properties: {
					get: (object: unknown) => {
						__webglFramebuffer?: WebGLFramebuffer[];
					};
				};
			}
		).properties;

		renderer.initRenderTarget(target);
		const sourceFramebuffers = properties.get(source).__webglFramebuffer!;
		const targetFramebuffers = properties.get(target).__webglFramebuffer!;
		const previous = renderer.getRenderTarget();
		const previousFace = renderer.getActiveCubeFace();
		const previousLevel = renderer.getActiveMipmapLevel();

		for (let i = 0; i < 6; i++) {
			renderer.state.bindFramebuffer(
				gl.READ_FRAMEBUFFER,
				sourceFramebuffers[i],
			);
			renderer.state.bindFramebuffer(
				gl.DRAW_FRAMEBUFFER,
				targetFramebuffers[i],
			);
			gl.blitFramebuffer(
				0,
				0,
				resolution,
				resolution,
				0,
				0,
				resolution,
				resolution,
				gl.COLOR_BUFFER_BIT,
				gl.NEAREST,
			);
		}
		renderer.state.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
		renderer.state.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
		// three bound the framebuffer of this target last, bring it back
		renderer.setRenderTarget(previous, previousFace, previousLevel);
	}

	/**
	 * Capture the gem normal maps again if the gem settings (tracing mode,
	 * default resolution) changed since they were captured, and swap the
	 * new maps into the gem materials that use the old ones.
	 */
	public recaptureGemNormalMaps(): void {
		for (const key in this._gemSphericalMapsCache) {
			const entry = this._gemSphericalMapsCache[key];
			const settings = this.resolveGemCaptureSettings(
				entry.requestedResolution,
			);
			if (
				settings.resolution === entry.resolution &&
				settings.planeTracing === entry.planeTracing
			)
				continue;

			const {renderTarget, resolution, planeTracing} =
				this.captureGemCubeNormalMap(
					entry.geometryData,
					entry.geometry,
					entry.requestedResolution,
				);
			const oldTexture = entry.texture;
			const oldRenderTarget = entry.renderTarget;
			const newTexture = renderTarget.texture;

			this._renderingEngine.materialLoader.replaceGemNormalMap(
				oldTexture,
				newTexture,
			);
			this._renderingEngine.sceneTreeManager.scene.traverse((object) => {
				const material = (<THREE.Mesh>object).material;
				if (!material) return;
				for (const m of Array.isArray(material)
					? material
					: [material]) {
					if (
						m instanceof GemMaterial &&
						m.sphericalNormalMap === oldTexture
					)
						m.sphericalNormalMap = newTexture;
				}
			});

			entry.texture = newTexture;
			entry.renderTarget = renderTarget;
			entry.resolution = resolution;
			entry.planeTracing = planeTracing;
			this._gemMapKeyOfTexture.delete(oldTexture);
			this._gemMapKeyOfTexture.set(newTexture, key);

			oldRenderTarget.dispose();
			oldTexture.dispose();
		}
	}

	private createMesh(
		_parentNode: ITreeNode,
		geometry: GeometryData,
		threeGeometry: THREE.BufferGeometry,
		material: THREE.Material,
		instanceData?: InstanceData,
	): GeometryType {
		let threeGeometryObject: GeometryType;
		if (geometry.mode === PRIMITIVE_MODE.POINTS) {
			const points = new THREE.Points(threeGeometry, material);
			geometry.convertedObject[this._renderingEngine.id] = points;
			threeGeometryObject = points;
		} else if (geometry.mode === PRIMITIVE_MODE.LINES) {
			const lineSegments = new THREE.LineSegments(
				threeGeometry,
				material,
			);
			geometry.convertedObject[this._renderingEngine.id] = lineSegments;
			threeGeometryObject = lineSegments;
		} else if (geometry.mode === PRIMITIVE_MODE.LINE_LOOP) {
			const lineLoop = new THREE.LineLoop(threeGeometry, material);
			geometry.convertedObject[this._renderingEngine.id] = lineLoop;
			threeGeometryObject = lineLoop;
		} else if (geometry.mode === PRIMITIVE_MODE.LINE_STRIP) {
			const line = new THREE.Line(threeGeometry, material);
			geometry.convertedObject[this._renderingEngine.id] = line;
			threeGeometryObject = line;
		} else if (
			geometry.mode === PRIMITIVE_MODE.TRIANGLES ||
			geometry.mode === PRIMITIVE_MODE.TRIANGLE_STRIP ||
			geometry.mode === PRIMITIVE_MODE.TRIANGLE_FAN
		) {
			const bufferGeometry = threeGeometry;
			if (this.indexIsRewritten(geometry.mode))
				this.convertToTriangleMode(bufferGeometry, geometry.mode);

			if (instanceData && instanceData.instanceMatrices.length > 0) {
				const instanceCount = instanceData.instanceMatrices.length;
				const instancedMesh = new THREE.InstancedMesh(
					bufferGeometry,
					material,
					instanceCount,
				);
				// Reuse matrix object to reduce allocations
				const tempMatrix = new THREE.Matrix4();
				const useInstanceColors =
					this._renderingEngine.type !== RENDERER_TYPE.ATTRIBUTES;
				for (let i = 0; i < instanceCount; i++) {
					tempMatrix.fromArray(instanceData.instanceMatrices[i]);
					instancedMesh.setMatrixAt(i, tempMatrix);
					if (useInstanceColors) {
						instancedMesh.setColorAt(
							i,
							this._renderingEngine.createThreeJsColor(
								instanceData.instanceColors[i],
							),
						);
					}
				}

				if (instancedMesh.instanceColor)
					instancedMesh.instanceColor.needsUpdate = true;
				instancedMesh.instanceMatrix.needsUpdate = true;

				// Enable frustum culling for instanced meshes
				instancedMesh.frustumCulled = true;

				geometry.convertedObject[this._renderingEngine.id] =
					instancedMesh;
				threeGeometryObject = instancedMesh;
			} else {
				const mesh = new THREE.Mesh(bufferGeometry, material);
				geometry.convertedObject[this._renderingEngine.id] = mesh;
				threeGeometryObject = mesh;
			}
		} else {
			throw new ShapeDiverViewerDataProcessingError(
				`GeometryLoader.load: Unrecognized primitive mode ${geometry.mode}.`,
			);
		}

		// These ids belong to this object. The geometry may be shared, so
		// they must not be written onto it.
		threeGeometryObject.userData.SDid = geometry.id;
		threeGeometryObject.userData.SDversion = geometry.version;
		threeGeometryObject.userData.primitiveSDid = geometry.primitive.id;
		threeGeometryObject.userData.primitiveSDversion =
			geometry.primitive.version;

		const threeGeom = threeGeometryObject.geometry;
		threeGeometryObject.renderOrder = geometry.renderOrder;

		// Performance: Disable matrixAutoUpdate for static geometry (no animations/transforms)
		// This prevents Three.js from recalculating matrices every frame
		if (!instanceData) {
			threeGeometryObject.matrixAutoUpdate = false;
		}

		if (
			threeGeometryObject instanceof THREE.Mesh &&
			threeGeometryObject.userData.transparencyPlaceholder !== true
		) {
			// The local box matches the shared vertices. A later object keeps
			// the box already stored on that geometry.
			if (!threeGeom.boundingBox) {
				const bbox = geometry.boundingBox;
				threeGeom.boundingBox = new THREE.Box3(
					new THREE.Vector3(bbox.min[0], bbox.min[1], bbox.min[2]),
					new THREE.Vector3(bbox.max[0], bbox.max[1], bbox.max[2]),
				);
				threeGeom.boundingSphere = new THREE.Sphere(
					new THREE.Vector3(
						bbox.boundingSphere.center[0],
						bbox.boundingSphere.center[1],
						bbox.boundingSphere.center[2],
					),
					bbox.boundingSphere.radius,
				);
			}
			(<THREE.Mesh>threeGeometryObject).morphTargetInfluences =
				geometry.morphWeights;
		}

		return threeGeometryObject;
	}

	private getAttributeName(attributeId: string): string {
		switch (attributeId) {
			case "POSITION":
				return "position";
			case "NORMAL":
				return "normal";
			case "TEXCOORD_0":
			case "TEXCOORD0":
			case "TEXCOORD":
			case "UV":
				return "uv";
			case "TEXCOORD_1":
				return "uv1";
			case "TEXCOORD_2":
				return "uv2";
			case "TEXCOORD_3":
				return "uv3";
			case "COLOR_0":
			case "COLOR0":
			case "COLOR":
				return "color";
			case "TANGENT":
				return "tangent";
			case "POSITION_INDEX":
				return "positionIndex";
			default:
				this._logger.warn(
					`GeometryLoader.loadPrimitive: Unrecognized attribute id ${attributeId}.`,
				);
		}
		return "";
	}

	private loadAttribute(
		bufferAttribute: IAttributeData,
		attributeId: string,
	) {
		let buffer: THREE.InterleavedBufferAttribute | THREE.BufferAttribute;

		if (
			bufferAttribute.byteStride &&
			bufferAttribute.byteStride !== bufferAttribute.itemBytes
		) {
			// Integer parameters to IB/IBA are in array elements, not bytes.
			const ib = new THREE.InterleavedBuffer(
				bufferAttribute.array,
				bufferAttribute.byteStride / bufferAttribute.elementBytes,
			);
			buffer = new THREE.InterleavedBufferAttribute(
				ib,
				bufferAttribute.itemSize,
				(bufferAttribute.byteOffset % bufferAttribute.byteStride) /
					bufferAttribute.elementBytes,
				bufferAttribute.normalized,
			);
		} else {
			buffer = new THREE.BufferAttribute(
				bufferAttribute.array,
				bufferAttribute.itemSize,
				attributeId === "COLOR_0" ||
					attributeId === "COLOR0" ||
					attributeId === "COLOR"
					? true
					: bufferAttribute.normalized,
			);
		}

		if (bufferAttribute.sparse) {
			if (bufferAttribute.array !== null) {
				// Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
				buffer = new THREE.BufferAttribute(
					bufferAttribute.array.slice(),
					bufferAttribute.itemSize,
					bufferAttribute.normalized,
				);
			}

			for (
				let i = 0, il = bufferAttribute.sparseIndices!.length;
				i < il;
				i++
			) {
				const index = bufferAttribute.sparseIndices![i];
				buffer.setX(
					index,
					bufferAttribute.sparseValues![i * bufferAttribute.itemSize],
				);
				if (bufferAttribute.itemSize >= 2)
					buffer.setY(
						index,
						bufferAttribute.sparseValues![
							i * bufferAttribute.itemSize + 1
						],
					);
				if (bufferAttribute.itemSize >= 3)
					buffer.setZ(
						index,
						bufferAttribute.sparseValues![
							i * bufferAttribute.itemSize + 2
						],
					);
				if (bufferAttribute.itemSize >= 4)
					buffer.setW(
						index,
						bufferAttribute.sparseValues![
							i * bufferAttribute.itemSize + 3
						],
					);
				if (bufferAttribute.itemSize >= 5)
					throw new ShapeDiverViewerDataProcessingError(
						"GeometryLoader.loadPrimitive: Unsupported itemSize in sparse BufferAttribute.",
					);
			}
		}
		return buffer;
	}

	public removeFromPrimitiveCache(id: string) {
		if (this._primitiveCache[id]) {
			if (this._primitiveCache[id].counter === 1) {
				this._primitiveCache[id].threeGeometry.dispose();
				for (const key in this._primitiveCache[id].threeGeometry
					.attributes)
					this._primitiveCache[id].threeGeometry.deleteAttribute(key);
				this._primitiveCache[id].threeGeometry.setIndex(null);

				this._primitiveCache[id].clones.forEach((c) => {
					c.dispose();
					for (const key in c.attributes) c.deleteAttribute(key);
					c.setIndex(null);
				});

				delete this._primitiveCache[id];
			} else {
				this._primitiveCache[id].counter--;
			}
		}
	}

	// #endregion Private Methods (7)
}
