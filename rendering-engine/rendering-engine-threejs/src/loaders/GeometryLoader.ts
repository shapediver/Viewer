import {
	AttributeData,
	GeometryData,
	InstanceData,
	MaterialGemData,
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

export class GeometryLoader implements ILoader {
	// #region Properties (8)

	private _gemCubeCamera?: THREE.CubeCamera;
	private _gemCubeCameraRenderTarget?: THREE.WebGLCubeRenderTarget;
	private _gemNormalMaterial?: THREE.ShaderMaterial;
	private _gemScene?: THREE.Scene;
	private _gemSphericalMapsCache: {
		[key: string]: {
			texture: THREE.CubeTexture;
			renderTarget: THREE.WebGLCubeRenderTarget;
			counter: number;
		};
	} = {};
	private _geometryCache: {
		[key: string]: {
			obj: GeometryType;
			primitiveCacheId: string;
			clones: GeometryType[];
			counter: number;
		};
	} = {};
	private _geometryObjects = new WeakMap<GeometryData, Set<GeometryType>>();
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
	public load(
		geometry: GeometryData,
		instanceData?: InstanceData,
	): GeometryType {
		// Cache key to avoid repeated string concatenation
		const primitiveCacheKey =
			geometry.primitive.id + "_" + geometry.primitive.version;

		const threeGeometry = (() => {
			const cachedPrimitive = this._primitiveCache[primitiveCacheKey];
			if (!cachedPrimitive) {
				return this.loadPrimitive(geometry.primitive);
			} else {
				cachedPrimitive.counter++;
				const clone = cachedPrimitive.threeGeometry.clone();
				cachedPrimitive.clones.push(clone);
				return clone;
			}
		})();

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

		if (incomingMaterialData instanceof MaterialGemData) {
			const gemMaterialData = <MaterialGemData>incomingMaterialData;
			// Only compute if not already computed
			if (!threeGeometry.boundingSphere) {
				threeGeometry.computeBoundingSphere();
			}

			const sphericalNormalMap = this.createCubeNormalMap(
				geometry,
				threeGeometry,
			);

			const center = threeGeometry.boundingSphere!.center,
				radius = threeGeometry.boundingSphere!.radius;

			gemMaterialData.side = MATERIAL_SIDE.FRONT;

			gemMaterialData.center = vec3.fromValues(
				center.x,
				center.y,
				center.z,
			);
			gemMaterialData.radius = radius;
			(<unknown>gemMaterialData.sphericalNormalMap) = sphericalNormalMap;
		}

		const material = this._renderingEngine.materialLoader.load(
			incomingMaterialData || geometry,
			materialSettings,
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
		if (this._geometryCache[geometry.id + "_" + geometry.version]) {
			this._geometryCache[geometry.id + "_" + geometry.version].counter++;
			threeGeometryObject =
				this._geometryCache[geometry.id + "_" + geometry.version].obj;

			threeGeometryObject.material = material;

			// Clear instance colors when in ATTRIBUTES mode to prevent them
			// from multiplying with the attribute material color
			if (threeGeometryObject instanceof THREE.InstancedMesh) {
				if (this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES) {
					threeGeometryObject.instanceColor = null;
				} else if (instanceData && !threeGeometryObject.instanceColor) {
					for (
						let i = 0;
						i < instanceData.instanceColors.length;
						i++
					) {
						threeGeometryObject.setColorAt(
							i,
							this._renderingEngine.createThreeJsColor(
								instanceData.instanceColors[i],
							),
						);
					}
					// setColorAt creates instanceColor; re-read after mutation
					(
						threeGeometryObject as THREE.InstancedMesh
					).instanceColor!.needsUpdate = true;
				}
			}
		} else {
			threeGeometryObject = this.createMesh(
				geometry,
				threeGeometry,
				material,
				instanceData,
			);
			threeGeometryObject.userData.cacheKey =
				geometry.id + "_" + geometry.version;
			this._geometryCache[geometry.id + "_" + geometry.version] = {
				obj: threeGeometryObject,
				counter: 1,
				clones: [],
				primitiveCacheId:
					geometry.primitive.id + "_" + geometry.primitive.version,
			};
		}

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

	public removeFromGemSphericalMapsCache(id: string) {
		if (this._gemSphericalMapsCache[id]) {
			if (this._gemSphericalMapsCache[id].counter === 1) {
				this._gemSphericalMapsCache[id].renderTarget.dispose();
				this._gemSphericalMapsCache[id].texture.dispose();
				delete this._gemSphericalMapsCache[id];
			} else {
				this._gemSphericalMapsCache[id].counter--;
			}
		}
	}

	public updateGeometryMaterial(geometry: GeometryData): void {
		const cacheKey = geometry.id + "_" + geometry.version;
		const cached = this._geometryCache[cacheKey];
		if (!cached) return;

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

		const material = this._renderingEngine.materialLoader.load(
			incomingMaterialData || geometry,
			materialSettings,
		);

		const geometryObjects = this._geometryObjects.get(geometry) ?? [
			cached.obj,
		];
		geometryObjects.forEach((geometryObject) => {
			this._renderingEngine.pulseEffectManager.clear(geometryObject);
			geometryObject.material = material;

			// Clear instance colors when in ATTRIBUTES mode to prevent them
			// from multiplying with the attribute material color.
			if (geometryObject instanceof THREE.InstancedMesh) {
				if (this._renderingEngine.type === RENDERER_TYPE.ATTRIBUTES) {
					geometryObject.instanceColor = null;
				}
			}
		});
		this._renderingEngine.pulseEffectManager.update(
			geometry,
			geometryObjects,
		);
	}

	/**
	 * Associate a tree's geometry data with the exact rendered object created for
	 * it. Geometry cache entries can be reused by multiple tree nodes, but their
	 * interaction materials are instance-specific.
	 */
	public registerGeometryObject(
		geometry: GeometryData,
		object: THREE.Object3D,
	): void {
		let geometryObjects = this._geometryObjects.get(geometry);
		if (!geometryObjects) {
			geometryObjects = new Set();
			this._geometryObjects.set(geometry, geometryObjects);
		}
		geometryObjects.add(object as GeometryType);
		this._renderingEngine.pulseEffectManager.update(geometry, [
			object as GeometryType,
		]);
	}

	public removeFromGeometryCache(id: string) {
		if (this._geometryCache[id]) {
			if (this._geometryCache[id].counter === 1) {
				this.removeFromPrimitiveCache(
					this._geometryCache[id].primitiveCacheId,
				);

				this._geometryCache[id].clones.forEach((c) => {
					this.removeFromPrimitiveCache(
						this._geometryCache[id].primitiveCacheId,
					);
				});
				delete this._geometryCache[id];
			} else {
				this._geometryCache[id].counter--;
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

	private createCubeNormalMap(
		geometryData: GeometryData,
		geometry: THREE.BufferGeometry,
		resolution = 1024,
	) {
		if (
			this._gemSphericalMapsCache[
				geometryData.primitive.id + "_" + geometryData.primitive.version
			]
		) {
			this._gemSphericalMapsCache[
				geometryData.primitive.id + "_" + geometryData.primitive.version
			].counter++;
			return this._gemSphericalMapsCache[
				geometryData.primitive.id + "_" + geometryData.primitive.version
			].texture;
		}

		if (!this._gemScene) {
			this._gemScene = new THREE.Scene();
			this._gemCubeCameraRenderTarget = new THREE.WebGLCubeRenderTarget(
				resolution,
				{
					format: THREE.RGBAFormat,
					magFilter: THREE.LinearFilter,
					minFilter: THREE.LinearFilter,
				},
			);
			this._gemCubeCameraRenderTarget.texture.generateMipmaps = false;
			this._gemCubeCameraRenderTarget.texture.minFilter =
				THREE.NearestFilter;
			this._gemCubeCameraRenderTarget.texture.magFilter =
				THREE.NearestFilter;
			this._gemCubeCameraRenderTarget.texture.format = THREE.RGBAFormat;
			this._gemCubeCamera = new THREE.CubeCamera(
				0.001,
				10000,
				this._gemCubeCameraRenderTarget,
			);
			this._gemScene.add(this._gemCubeCamera);
		} else {
			this._gemCubeCameraRenderTarget = new THREE.WebGLCubeRenderTarget(
				resolution,
				{
					format: THREE.RGBAFormat,
					magFilter: THREE.LinearFilter,
					minFilter: THREE.LinearFilter,
				},
			);
			this._gemCubeCameraRenderTarget.texture.generateMipmaps = false;
			this._gemCubeCameraRenderTarget.texture.minFilter =
				THREE.NearestFilter;
			this._gemCubeCameraRenderTarget.texture.magFilter =
				THREE.NearestFilter;
			this._gemCubeCameraRenderTarget.texture.format = THREE.RGBAFormat;
			this._gemCubeCamera!.renderTarget = this._gemCubeCameraRenderTarget;
		}

		if (!this._gemNormalMaterial) {
			const _normalShader = {
				defines: {},
				uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.common]),
				vertexShader: `
                varying vec3 vNormal;

                void main() {
                  vNormal = normal;
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
                
                void main() {
                    vec3 n = normalize(vNormal);
                    gl_FragColor = vec4(decodeVec3(abs(n)), signEncoding(n));
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

		this._gemCubeCamera!.renderTarget.texture.userData = {
			SDid: geometryData.primitive.id,
			SDversion: geometryData.primitive.version,
		};

		this._gemSphericalMapsCache[
			geometryData.primitive.id + "_" + geometryData.primitive.version
		] = {
			texture: this._gemCubeCameraRenderTarget.texture,
			renderTarget: this._gemCubeCameraRenderTarget,
			counter: 1,
		};
		return this._gemSphericalMapsCache[
			geometryData.primitive.id + "_" + geometryData.primitive.version
		].texture;
	}

	private createMesh(
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
			if (
				geometry.mode === PRIMITIVE_MODE.TRIANGLE_STRIP ||
				geometry.mode === PRIMITIVE_MODE.TRIANGLE_FAN
			)
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

		// Cache userData and bounding box data to reduce allocations
		const userDataCache = {
			SDid: geometry.id,
			SDversion: geometry.version,
			primitiveSDid: geometry.primitive.id,
			primitiveSDversion: geometry.primitive.version,
		};
		const bbox = geometry.boundingBox;
		const bboxMin = new THREE.Vector3(
			bbox.min[0],
			bbox.min[1],
			bbox.min[2],
		);
		const bboxMax = new THREE.Vector3(
			bbox.max[0],
			bbox.max[1],
			bbox.max[2],
		);
		const bsphereCenter = new THREE.Vector3(
			bbox.boundingSphere.center[0],
			bbox.boundingSphere.center[1],
			bbox.boundingSphere.center[2],
		);
		const renderOrder = geometry.renderOrder;

		const threeGeom = threeGeometryObject.geometry;
		threeGeom.userData = userDataCache;
		threeGeometryObject.renderOrder = renderOrder;

		// Performance: Disable matrixAutoUpdate for static geometry (no animations/transforms)
		// This prevents Three.js from recalculating matrices every frame
		if (!instanceData) {
			threeGeometryObject.matrixAutoUpdate = false;
		}

		if (
			threeGeometryObject instanceof THREE.Mesh &&
			threeGeometryObject.userData.transparencyPlaceholder !== true
		) {
			// Assign bounding box directly without unnecessary clones
			threeGeom.boundingBox = new THREE.Box3(bboxMin, bboxMax);
			threeGeom.boundingSphere = new THREE.Sphere(
				bsphereCenter,
				bbox.boundingSphere.radius,
			);
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

	private removeFromPrimitiveCache(id: string) {
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
