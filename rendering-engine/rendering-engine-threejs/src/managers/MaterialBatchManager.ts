import {
	GeometryData,
	type ITreeNode,
	Tree,
} from "@shapediver/viewer.shared.node-tree";
import {EventEngine, EVENTTYPE} from "@shapediver/viewer.shared.services";
import {PRIMITIVE_MODE} from "@shapediver/viewer.shared.types";
import * as THREE from "three";
import {GemMaterial} from "../materials/GemMaterial";
import {SD_DATA_TYPE} from "../objects/SDObject";
import {RenderingEngine} from "../RenderingEngine";

/**
 * One three.js batch. Every member uses the same material aside from color,
 * which is stored per instance. A chunk stops before the buffer limits.
 */
interface MaterialBatch {
	key: string;
	cacheKey: string;
	mesh: THREE.BatchedMesh;
}

interface BatchMember {
	id: string;
	batch: MaterialBatch;
	geometryId: number;
	instanceId: number;
	mesh: THREE.Mesh;
	node: ITreeNode;
	geometry: GeometryData;
}

interface BatchEntry {
	id: string;
	key: string;
	mesh: THREE.Mesh;
	node: ITreeNode;
	geometry: GeometryData;
	vertices: number;
	indices: number;
}

interface DragBatchEvent {
	viewportId?: string;
	node?: ITreeNode;
	groupedNodes?: ITreeNode[];
}

const MAX_INSTANCES = 4096;
const MAX_VERTICES = 1_000_000;
const MAX_INDICES = 3_000_000;

/**
 * Draws static triangle meshes that share a material as one BatchedMesh.
 *
 * Color-only variants keep distinct material ids. The batch key ignores that
 * id and the base color; the tint is setColorAt. Lines, points, morph
 * targets, GPU instances, and a node that is being dragged stay individual
 * meshes. The batch is a rendering structure: the scene tree is unchanged.
 */
export class MaterialBatchManager {
	readonly root: THREE.Group = new THREE.Group();

	private readonly _eventEngine: EventEngine = EventEngine.instance;
	private readonly _listeners: string[] = [];
	private readonly _members = new Map<string, BatchMember>();
	private readonly _byNode = new Map<string, BatchMember[]>();
	private readonly _byMesh = new Map<THREE.Object3D, BatchMember>();
	private readonly _batches: MaterialBatch[] = [];
	private readonly _dragged = new Set<string>();
	private readonly _held = new Set<string>();
	private readonly _lightSources = new Set<string>();
	private readonly _matrix = new THREE.Matrix4();
	private readonly _color = new THREE.Color();
	private readonly _materialKeys = new WeakMap<
		THREE.Material,
		{version: number; key: string}
	>();

	private readonly _keyIds = new Map<string, number>();
	private _worldMatricesFresh = false;
	private readonly _batchKeys = new WeakMap<
		THREE.Mesh,
		{
			material: THREE.Material;
			version: number;
			geometry: THREE.BufferGeometry;
			attributes: number;
			renderOrder: number;
			castShadow: boolean;
			receiveShadow: boolean;
			key: string;
		}
	>();
	private readonly _memberByData = new Map<string, BatchMember>();
	private _signature: string | undefined;
	private _chunkSerial = 0;
	private _closed = false;

	constructor(private readonly _renderingEngine: RenderingEngine) {
		this.root.matrixAutoUpdate = false;
		this.root.name = "materialBatchRoot";
		this._listeners.push(
			this._eventEngine.addListener(
				EVENTTYPE.INTERACTION.DRAG_START,
				(event: DragBatchEvent) => this.onDrag(event, true),
			),
			this._eventEngine.addListener(
				EVENTTYPE.INTERACTION.DRAG_END,
				(event: DragBatchEvent) => this.onDrag(event, false),
			),
		);
	}

	/** Rebuild membership after the scene tree has been converted. */
	public rebuild(): void {
		if (this._closed) return;
		this.refreshLightSources();
		const scene = this._renderingEngine.sceneTreeManager.scene;
		if (this.root.parent !== scene) scene.add(this.root);
		scene.updateMatrixWorld(true);
		// Every world matrix is current until rebuild returns. Members do
		// not walk their parents again; with thousands of members that walk
		// was most of a one-node update.
		this._worldMatricesFresh = true;
		try {
			this.rebuildEntries();
		} finally {
			this._worldMatricesFresh = false;
		}
	}

	private rebuildEntries(): void {
		const entries = this.collect();
		// The signature is geometry identity plus the batch key. A material
		// replacement, such as the attribute visualization, rebuilds the
		// batches. Hover, selection, and pulse effects keep the key of the
		// batch the member is in, so they draw that one object on its own
		// and do not recopy every vertex in the batch.
		const signature = entries
			.map(
				(entry) =>
					`${entry.id}|${this.keyId(this.signatureKey(entry))}`,
			)
			.sort()
			.join("\n");
		if (this._signature === signature) {
			this.applyEntries(entries);
			return;
		}

		this._signature = signature;
		this.disposeBatches();
		this.build(entries);
		this._renderingEngine.postProcessingManager.refreshInstancedEffectSelections();
	}

	private signatureKey(entry: BatchEntry): string {
		if (
			entry.geometry.effectMaterials.length === 0 &&
			entry.geometry.effectPulses.length === 0
		)
			return entry.key;
		return (
			this._memberByData.get(`${entry.node.id}:${entry.geometry.id}`)
				?.batch.key ?? entry.key
		);
	}

	/** A short id per batch key, so the signature stays small. */
	private keyId(key: string): number {
		let id = this._keyIds.get(key);
		if (id === undefined) {
			id = this._keyIds.size;
			this._keyIds.set(key, id);
		}
		return id;
	}

	/**
	 * The node matrix or visibility changed without replacing geometry.
	 * Dragged and otherwise excluded members are drawn by their own mesh.
	 */
	public updateTransforms(node: ITreeNode, visible: boolean): void {
		const members = this._byNode.get(node.id);
		if (!members) return;
		for (const member of members) {
			// applyMember hides the source mesh again when the member is no
			// longer individual. Updating only the instance leaves that mesh
			// visible, so an un-mirror draws the surface twice.
			this.applyMember(member);
			if (member.mesh.userData.batchedMesh)
				member.batch.mesh.setVisibleAt(member.instanceId, visible);
		}
	}

	/**
	 * The viewport default was copied onto a batch that follows it.
	 * Instance colors are snapshots of the source color, so write them again.
	 */
	public syncBatchColors(material: THREE.Material): void {
		// The default-material copy can change transparency.
		for (const batch of this._batches)
			if (batch.mesh.material === material)
				this.applyDrawOrder(batch.mesh);
		for (const member of this._members.values()) {
			if (member.batch.mesh.material !== material) continue;
			// A default-material copy changes the source. The member can still
			// be drawn from the batch, so refresh its tint either way.
			this.writeColor(member);
		}
	}

	/** A mesh material was replaced. Stay in the batch when only the color changed. */
	public syncObject(object: THREE.Object3D): void {
		const member = this._byMesh.get(object);
		if (!member || !this._members.has(member.id)) return;
		this.applyMember(member);
	}

	/**
	 * God rays draw the light source mesh in their own pass. A member left
	 * in the batch is hidden, so that pass has nothing to draw.
	 */
	public syncLightSources(): void {
		if (this._closed) return;
		const next = this.lightSourceIds();
		if (this.sameIds(next, this._lightSources)) return;
		this._lightSources.clear();
		for (const id of next) this._lightSources.add(id);
		for (const member of this._members.values()) this.applyMember(member);
	}

	/**
	 * Outline and bloom have to draw the selected mesh on its own. The rest
	 * of its batch stays together.
	 */
	public syncHeldNodes(): void {
		const next = new Set(
			this._renderingEngine.postProcessingManager.effectNodeIds(),
		);
		if (next.size === this._held.size) {
			let same = true;
			for (const id of next) {
				if (!this._held.has(id)) {
					same = false;
					break;
				}
			}
			if (same) return;
		}
		this._held.clear();
		for (const id of next) this._held.add(id);
		for (const member of this._members.values()) this.applyMember(member);
	}

	public clear(): void {
		this._closed = true;
		this.disposeBatches();
		this._signature = undefined;
		for (const token of this._listeners)
			this._eventEngine.removeListener(token);
		this._listeners.length = 0;
	}

	private onDrag(event: DragBatchEvent, active: boolean): void {
		if (event.viewportId !== this._renderingEngine.id) return;
		const nodes: ITreeNode[] = [];
		if (event.node) nodes.push(event.node);
		for (const node of event.groupedNodes ?? []) {
			if (!nodes.includes(node)) nodes.push(node);
		}
		for (const node of nodes) {
			if (active) this._dragged.add(node.id);
			else this._dragged.delete(node.id);
			const members = this._byNode.get(node.id);
			if (!members) continue;
			for (const member of members) this.applyMember(member);
		}
	}

	private collect(): BatchEntry[] {
		const entries: BatchEntry[] = [];
		const viewportId = this._renderingEngine.id;
		// Batch membership by node and geometry, ignoring the version: an
		// effect can bump the version of a member.
		this._memberByData.clear();
		for (const member of this._members.values())
			this._memberByData.set(
				`${member.node.id}:${member.geometry.id}`,
				member,
			);
		Tree.instance.root.traverse((node) => {
			const converted = node.convertedObject[viewportId] as
				| THREE.Object3D
				| undefined;
			if (!converted) return;
			for (const data of node.data) {
				if (!(data instanceof GeometryData)) continue;
				const mesh = this.findMesh(converted, data);
				if (!mesh || !this.isBatchable(mesh, data)) continue;
				const id = `${node.id}:${data.id}:${data.version}`;
				// A hover or selection material is temporary. A mesh that is
				// batchable only while it wears one would change the
				// signature and rebuild every batch on each hover.
				if (
					(data.effectMaterials.length > 0 ||
						data.effectPulses.length > 0) &&
					!this._memberByData.has(`${node.id}:${data.id}`)
				)
					continue;
				const position = mesh.geometry.getAttribute("position");
				const vertices = position?.count ?? 0;
				if (vertices === 0 || vertices > MAX_VERTICES) continue;
				const index = mesh.geometry.getIndex();
				const indices = index ? index.count : 0;
				if (indices > MAX_INDICES) continue;
				entries.push({
					id,
					key: this.batchKey(mesh),
					mesh,
					node,
					geometry: data,
					vertices,
					indices,
				});
			}
		});
		return entries;
	}

	private findMesh(
		converted: THREE.Object3D,
		geometry: GeometryData,
	): THREE.Mesh | undefined {
		for (const child of converted.children) {
			if (
				child.userData.SDtype === SD_DATA_TYPE.GEOMETRY &&
				child.userData.SDid === geometry.id &&
				child.userData.SDversion === geometry.version &&
				child instanceof THREE.Mesh &&
				!(child instanceof THREE.InstancedMesh) &&
				!(child instanceof THREE.SkinnedMesh) &&
				child.userData.isInstanced !== true
			)
				return child;
		}
		return undefined;
	}

	private isBatchable(mesh: THREE.Mesh, geometry: GeometryData): boolean {
		if (Array.isArray(mesh.material)) return false;
		if (mesh.material instanceof GemMaterial) return false;
		// Blended panes that do not write depth batch: the batch sorts its
		// instances far-to-near and three.js draws their back faces, then
		// their front faces. A transparent material that writes depth
		// stays one mesh per pane. Drawn batch-wide, the back faces of a
		// near pane would hide the front faces of a far one.
		if (mesh.material.transparent && mesh.material.depthWrite) return false;
		if (geometry.mode !== PRIMITIVE_MODE.TRIANGLES) return false;
		if (geometry.morphWeights.length > 0) return false;
		if (Object.keys(mesh.geometry.morphAttributes).length > 0) return false;
		if (mesh.geometry.groups.length > 1) return false;
		if (!mesh.geometry.getAttribute("position")) return false;
		// The batch object stays at identity. three.js flips winding only
		// from object.matrixWorld, so a mirrored instance would drop FrontSide
		// faces. The source mesh still flips.
		if (mesh.matrixWorld.determinant() < 0) return false;
		return true;
	}

	/**
	 * Material identity is not the key. Color-only variants have different
	 * material ids and the same other properties; the tint lives on the
	 * instance.
	 */
	private batchKey(mesh: THREE.Mesh): string {
		const material = mesh.material as THREE.Material;
		// The same string object for an unchanged mesh. A rebuild compares
		// and looks up keys of about a kilobyte for every entry, and a new
		// string has to be hashed again each time.
		const cached = this._batchKeys.get(mesh);
		if (
			cached &&
			cached.material === material &&
			cached.version === material.version &&
			cached.geometry === mesh.geometry &&
			cached.attributes === this.attributeCount(mesh.geometry) &&
			cached.renderOrder === mesh.renderOrder &&
			cached.castShadow === mesh.castShadow &&
			cached.receiveShadow === mesh.receiveShadow
		)
			return cached.key;
		const key = [
			this.materialKey(material),
			this.geometryKey(mesh.geometry),
			mesh.renderOrder,
			mesh.castShadow ? 1 : 0,
			mesh.receiveShadow ? 1 : 0,
		].join("|");
		this._batchKeys.set(mesh, {
			material,
			version: material.version,
			geometry: mesh.geometry,
			attributes: this.attributeCount(mesh.geometry),
			renderOrder: mesh.renderOrder,
			castShadow: mesh.castShadow,
			receiveShadow: mesh.receiveShadow,
			key,
		});
		return key;
	}

	/** Changes when an attribute or the index is added or removed. */
	private attributeCount(geometry: THREE.BufferGeometry): number {
		let count = geometry.getIndex() ? 1 : 0;
		for (const name in geometry.attributes) if (name) count += 2;
		return count;
	}

	private materialKey(material: THREE.Material): string {
		const cached = this._materialKeys.get(material);
		if (cached && cached.version === material.version) return cached.key;
		const saved = material.userData;
		material.userData = {};
		let key: string;
		try {
			const json = material.toJSON() as unknown as Record<
				string,
				unknown
			>;
			delete json.uuid;
			delete json.metadata;
			delete json.name;
			delete json.color;
			delete json.userData;
			key = JSON.stringify(json);
		} catch {
			key = material.uuid;
		} finally {
			material.userData = saved;
		}
		this._materialKeys.set(material, {version: material.version, key});
		return key;
	}

	private geometryKey(geometry: THREE.BufferGeometry): string {
		const names = Object.keys(geometry.attributes)
			.sort()
			.map((name) => {
				const attribute = geometry.getAttribute(name);
				return `${name}:${attribute.itemSize}:${attribute.normalized ? 1 : 0}`;
			})
			.join(",");
		return `${geometry.getIndex() ? "i" : "n"}:${names}`;
	}

	private applyEntries(entries: BatchEntry[]): void {
		for (const entry of entries) {
			const member = this._members.get(entry.id);
			if (!member) continue;
			if (member.mesh !== entry.mesh) this._byMesh.delete(member.mesh);
			member.mesh = entry.mesh;
			member.geometry = entry.geometry;
			member.node = entry.node;
			this._byMesh.set(entry.mesh, member);
			this.applyMember(member);
		}
	}

	private build(entries: BatchEntry[]): void {
		const chunks = this.pack(entries);
		for (const chunk of chunks) {
			// One mesh is already one draw. A single transmissive shell
			// (the amber around the insect) must stay a mesh. Several
			// panes that share a transmissive material still batch:
			// separate transmission draws stack and darken the volume.
			if (chunk.length < 2) continue;
			// A pulse replaces the mesh material with a clone that has no
			// compile hook. The cache still holds the source material.
			const displayed = chunk[0].mesh.material as THREE.Material;
			const record =
				this._renderingEngine.materialLoader.recordFor(displayed);
			const source = record?.material ?? displayed;
			const batchMaterial = this.createBatchMaterial(source);
			batchMaterial.userData.materialBatch = true;
			const cacheKey = `material-batch/${this._chunkSerial++}`;
			this._renderingEngine.materialLoader.trackMaterial(
				cacheKey,
				batchMaterial,
				record ? record.materialData : null,
			);
			const indexed = chunk[0].indices > 0;
			// Meshes that share a primitive share its BufferGeometry. The
			// batch stores each one once and draws it per instance.
			const geometryIds = new Map<THREE.BufferGeometry, number>();
			let vertices = 0;
			let indices = 0;
			for (const entry of chunk) {
				if (geometryIds.has(entry.mesh.geometry)) continue;
				geometryIds.set(entry.mesh.geometry, -1);
				vertices += entry.vertices;
				indices += entry.indices;
			}
			const batchMesh = new THREE.BatchedMesh(
				chunk.length,
				vertices,
				indexed ? indices : 1,
				batchMaterial,
			);
			batchMesh.name = "materialBatch";
			batchMesh.frustumCulled = false;
			this.applyDrawOrder(batchMesh);
			batchMesh.matrixAutoUpdate = false;
			batchMesh.castShadow = chunk[0].mesh.castShadow;
			batchMesh.receiveShadow = chunk[0].mesh.receiveShadow;
			batchMesh.renderOrder = chunk[0].mesh.renderOrder;
			batchMesh.userData.batchNodes = [] as (ITreeNode | undefined)[];
			batchMesh.userData.batchKeys = [] as (string | undefined)[];
			batchMesh.userData.batchGeometries = [] as (
				| GeometryData
				| undefined
			)[];
			const batch: MaterialBatch = {
				key: chunk[0].key,
				cacheKey,
				mesh: batchMesh,
			};
			this._batches.push(batch);
			this.root.add(batchMesh);

			for (const entry of chunk) {
				this.rememberBounds(entry);
				let geometryId = geometryIds.get(entry.mesh.geometry) ?? -1;
				if (geometryId < 0) {
					try {
						geometryId = batchMesh.addGeometry(entry.mesh.geometry);
					} catch {
						entry.mesh.visible = true;
						continue;
					}
					geometryIds.set(entry.mesh.geometry, geometryId);
				}
				const instanceId = batchMesh.addInstance(geometryId);
				const nodes = batchMesh.userData.batchNodes as (
					| ITreeNode
					| undefined
				)[];
				const keys = batchMesh.userData.batchKeys as (
					| string
					| undefined
				)[];
				const geometries = batchMesh.userData.batchGeometries as (
					| GeometryData
					| undefined
				)[];
				nodes[instanceId] = entry.node;
				keys[instanceId] = `${entry.node.id}:${entry.geometry.id}`;
				geometries[instanceId] = entry.geometry;

				const member: BatchMember = {
					id: entry.id,
					batch,
					geometryId,
					instanceId,
					mesh: entry.mesh,
					node: entry.node,
					geometry: entry.geometry,
				};
				this._members.set(entry.id, member);
				this._byMesh.set(entry.mesh, member);
				let nodeMembers = this._byNode.get(entry.node.id);
				if (!nodeMembers) {
					nodeMembers = [];
					this._byNode.set(entry.node.id, nodeMembers);
				}
				nodeMembers.push(member);
				this.applyMember(member);
			}
		}
	}

	private pack(entries: BatchEntry[]): BatchEntry[][] {
		const chunks: {
			key: string;
			entries: BatchEntry[];
			geometries: Set<THREE.BufferGeometry>;
			vertices: number;
			indices: number;
		}[] = [];
		for (const entry of entries) {
			// A geometry the chunk already holds adds an instance and no
			// vertices.
			let chunk = chunks.find(
				(candidate) =>
					candidate.key === entry.key &&
					candidate.entries.length < MAX_INSTANCES &&
					(candidate.geometries.has(entry.mesh.geometry) ||
						(candidate.vertices + entry.vertices <= MAX_VERTICES &&
							candidate.indices + entry.indices <= MAX_INDICES)),
			);
			if (!chunk) {
				chunk = {
					key: entry.key,
					entries: [],
					geometries: new Set(),
					vertices: 0,
					indices: 0,
				};
				chunks.push(chunk);
			}
			chunk.entries.push(entry);
			if (chunk.geometries.has(entry.mesh.geometry)) continue;
			chunk.geometries.add(entry.mesh.geometry);
			chunk.vertices += entry.vertices;
			chunk.indices += entry.indices;
		}
		return chunks.map((chunk) => chunk.entries);
	}

	private createBatchMaterial(source: THREE.Material): THREE.Material {
		const saved = source.userData;
		source.userData = {};
		let batchMaterial: THREE.Material;
		try {
			batchMaterial = source.clone();
		} finally {
			source.userData = saved;
		}
		batchMaterial.userData = {...saved};
		delete batchMaterial.userData.shader;
		// MeshStandardMaterial.copy and MeshPhysicalMaterial.copy reset
		// defines to STANDARD / PHYSICAL. The source also carries the
		// environment map type and the legacy PBR mode. Without them the
		// batch is shaded by the stock three.js path, and a metal with no
		// environment map turns black.
		if (source.defines) batchMaterial.defines = {...source.defines};
		// Material.copy does not copy onBeforeCompile. That hook declares
		// the shadow uniforms. It also stores the compiled shader on the
		// source material, so keep that reference and record the batch program
		// on this material instead.
		const compile = source.onBeforeCompile;
		batchMaterial.onBeforeCompile = (shader, renderer) => {
			const previous = source.userData.shader;
			compile.call(source, shader, renderer);
			if (!shader.uniforms.lightSizeUV) {
				shader.uniforms.lightSizeUV = {value: 0};
				shader.uniforms.blending = {value: 0};
			}
			batchMaterial.userData.shader = shader;
			if (source.userData.shader === shader) {
				if (previous === undefined) delete source.userData.shader;
				else source.userData.shader = previous;
			}
		};
		if (
			"color" in batchMaterial &&
			batchMaterial.color instanceof THREE.Color
		)
			batchMaterial.color.setRGB(1, 1, 1);
		batchMaterial.needsUpdate = false;
		return batchMaterial;
	}

	/**
	 * BatchedMesh sorts and frustum-culls every instance before each draw:
	 * the colour pass, every shadow map, and each effect pass. A
	 * transparent batch needs the far-to-near order. An opaque batch does
	 * not, and without culling the draw list does not depend on the
	 * camera, so three.js rebuilds it only when an instance is added or
	 * its visibility changes. The GPU then draws off-screen instances of
	 * an opaque batch. That is vertex work only: the rasterizer clips them.
	 */
	private applyDrawOrder(mesh: THREE.BatchedMesh): void {
		const transparent = (mesh.material as THREE.Material).transparent;
		if (
			mesh.sortObjects === transparent &&
			mesh.perObjectFrustumCulled === transparent
		)
			return;
		mesh.sortObjects = transparent;
		mesh.perObjectFrustumCulled = transparent;
		// The last list was culled for the previous camera. With culling
		// off, three.js keeps it until visibility changes, so mark it.
		(mesh as unknown as {_visibilityChanged: boolean})._visibilityChanged =
			true;
	}

	private rememberBounds(entry: BatchEntry): void {
		if (entry.mesh.geometry.boundingBox) return;
		const box = entry.geometry.boundingBox;
		if (!box || box.isEmpty()) return;
		entry.mesh.geometry.boundingBox = new THREE.Box3(
			new THREE.Vector3(box.min[0], box.min[1], box.min[2]),
			new THREE.Vector3(box.max[0], box.max[1], box.max[2]),
		);
	}

	private applyMember(member: BatchMember): void {
		if (this.isIndividual(member)) {
			member.batch.mesh.setVisibleAt(member.instanceId, false);
			member.mesh.visible = true;
			delete member.mesh.userData.batchedMesh;
			delete member.mesh.userData.batchId;
			return;
		}
		this.writeMatrix(member);
		this.writeColor(member);
		member.batch.mesh.setVisibleAt(
			member.instanceId,
			this.hierarchyVisible(member.mesh),
		);
		// Keep the source mesh and its geometry. Drag, outline, and a
		// material edit show that mesh again without rebuilding the chunk.
		// three.js does not raycast an instance hidden with setVisibleAt.
		member.mesh.visible = false;
		member.mesh.userData.batchedMesh = member.batch.mesh;
		member.mesh.userData.batchId = member.instanceId;
	}

	private isIndividual(member: BatchMember): boolean {
		if (this._dragged.has(member.node.id)) return true;
		if (this._held.has(member.node.id)) return true;
		if (this._lightSources.has(member.node.id)) return true;
		if (member.geometry.effectMaterials.length > 0) return true;
		if (member.geometry.effectPulses.length > 0) return true;
		if (member.geometry.morphWeights.length > 0) return true;
		if (Object.keys(member.mesh.geometry.morphAttributes).length > 0)
			return true;
		if (Array.isArray(member.mesh.material)) return true;
		if (this.mirrored(member.mesh)) return true;
		return this.batchKey(member.mesh) !== member.batch.key;
	}

	private refreshLightSources(): void {
		const next = this.lightSourceIds();
		this._lightSources.clear();
		for (const id of next) this._lightSources.add(id);
	}

	private lightSourceIds(): Set<string> {
		const ids = new Set<string>();
		const managers =
			this._renderingEngine.postProcessingManager.godRaysManagers;
		for (const token in managers) {
			const node = managers[token].lightSourceNode;
			if (!node) continue;
			node.traverse((child) => {
				ids.add(child.id);
			});
		}
		return ids;
	}

	private sameIds(a: Set<string>, b: Set<string>): boolean {
		if (a.size !== b.size) return false;
		for (const id of a) if (!b.has(id)) return false;
		return true;
	}

	private mirrored(mesh: THREE.Object3D): boolean {
		if (!this._worldMatricesFresh) mesh.updateWorldMatrix(true, false);
		return mesh.matrixWorld.determinant() < 0;
	}

	private hierarchyVisible(mesh: THREE.Object3D): boolean {
		let current = mesh.parent;
		while (current) {
			if (!current.visible) return false;
			current = current.parent;
		}
		return true;
	}

	private writeMatrix(member: BatchMember): void {
		if (!this._worldMatricesFresh)
			member.mesh.updateWorldMatrix(true, false);
		this._matrix.copy(member.mesh.matrixWorld);
		member.batch.mesh.setMatrixAt(member.instanceId, this._matrix);
	}

	private writeColor(member: BatchMember): void {
		const material = member.mesh.material;
		if (
			!Array.isArray(material) &&
			"color" in material &&
			material.color instanceof THREE.Color
		)
			this._color.copy(material.color);
		else this._color.setRGB(1, 1, 1);
		member.batch.mesh.setColorAt(member.instanceId, this._color);
	}

	private disposeBatches(): void {
		for (const member of this._members.values()) {
			member.mesh.visible = true;
			delete member.mesh.userData.batchedMesh;
			delete member.mesh.userData.batchId;
			this._byMesh.delete(member.mesh);
		}
		for (const batch of this._batches) {
			this.root.remove(batch.mesh);
			this.disposeBatchMesh(batch.mesh);
			this._renderingEngine.materialLoader.removeFromMaterialCache(
				batch.cacheKey,
			);
		}
		this._batches.length = 0;
		this._members.clear();
		this._byNode.clear();
	}

	private disposeBatchMesh(mesh: THREE.BatchedMesh): void {
		const textures = mesh as THREE.BatchedMesh & {
			_matricesTexture: {dispose(): void} | null;
			_colorsTexture: {dispose(): void} | null;
			_indirectTexture: {dispose(): void} | null;
		};
		textures._matricesTexture?.dispose();
		textures._colorsTexture?.dispose();
		textures._indirectTexture?.dispose();
		mesh.geometry.dispose();
	}
}
