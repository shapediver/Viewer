import {
	GeometryData,
	type ITreeNode,
} from "@shapediver/viewer.shared.node-tree";
import {EventEngine, EVENTTYPE} from "@shapediver/viewer.shared.services";
import {PRIMITIVE_MODE} from "@shapediver/viewer.shared.types";
import * as THREE from "three";
import {GemMaterial} from "../materials/GemMaterial";
import {SD_DATA_TYPE, SDObject, setBatchHidden} from "../objects/SDObject";
import {RenderingEngine} from "../RenderingEngine";

/**
 * One three.js batch. Every member uses the same material aside from color,
 * which is stored per instance. A chunk stops before the buffer limits.
 */
interface MaterialBatch {
	key: string;
	cacheKey: string;
	mesh: THREE.BatchedMesh;
	indexed: boolean;
	members: Set<BatchMember>;
	/** The geometries stored in the batch and how many members draw each. */
	geometries: Map<THREE.BufferGeometry, BatchGeometry>;
	maxInstances: number;
	maxVertices: number;
	maxIndices: number;
	/** Space of deleted geometries. It is free again after `optimize()`. */
	wastedVertices: number;
	wastedIndices: number;
}

interface BatchGeometry {
	id: number;
	count: number;
}

interface BatchMember {
	/** `nodeId:geometryDataId`. The version of the data is not part of it. */
	id: string;
	batch: MaterialBatch;
	geometryId: number;
	instanceId: number;
	mesh: THREE.Mesh;
	/** The geometry the batch holds for this member. */
	buffer: THREE.BufferGeometry;
	node: ITreeNode;
	geometry: GeometryData;
	/**
	 * The source mesh was removed from the scene. The member waits for the
	 * mesh that replaces it, or leaves the batch at the end of the update.
	 */
	orphan: boolean;
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
/** A full chunk grows by this factor, so a series of additions stays linear. */
const GROWTH = 1.5;

/**
 * Meta for the non-root `Material.toJSON` call of the batch key. Every texture
 * is answered with a stub that holds its uuid, so `Texture.toJSON` returns
 * early and no image is encoded to a data URL. The key needs only the uuid.
 */
const TEXTURE_META = {
	textures: new Proxy({} as Record<string, {uuid: string}>, {
		get: (_target, uuid) => (typeof uuid === "string" ? {uuid} : undefined),
	}),
	images: {},
} as unknown as THREE.JSONMeta;

/**
 * Draws static triangle meshes that share a material as one BatchedMesh.
 *
 * Color-only variants keep distinct material ids. The batch key ignores that
 * id and the base color; the tint is setColorAt. Lines, points, morph
 * targets, GPU instances, and a node that is being dragged stay individual
 * meshes. The batch is a rendering structure: the scene tree is unchanged.
 *
 * A scene update touches only the nodes it visited. `markNode` collects them,
 * `rebuild` compares their meshes with the members of the batches and changes
 * only the difference: a member is added, removed, or gets a new geometry in
 * its own chunk. The other chunks are not touched.
 */
export class MaterialBatchManager {
	readonly root: THREE.Group = new THREE.Group();

	private readonly _eventEngine: EventEngine = EventEngine.instance;
	private readonly _listeners: string[] = [];
	/** Members by `nodeId:geometryDataId`. */
	private readonly _members = new Map<string, BatchMember>();
	private readonly _byNode = new Map<string, BatchMember[]>();
	private readonly _byMesh = new Map<THREE.Object3D, BatchMember>();
	private readonly _batches = new Set<MaterialBatch>();
	private readonly _batchesByKey = new Map<string, MaterialBatch[]>();
	/**
	 * Batchable meshes that are alone with their key. They stay meshes until
	 * a second one with the same key arrives.
	 */
	private readonly _lone = new Map<THREE.Mesh, BatchEntry>();
	private readonly _loneByKey = new Map<string, Set<THREE.Mesh>>();
	private readonly _orphans = new Set<BatchMember>();
	/** The nodes the scene updates visited since the last `rebuild`. */
	private readonly _touched = new Map<string, ITreeNode>();
	private readonly _dragged = new Set<string>();
	private readonly _held = new Set<string>();
	private readonly _lightSources = new Set<string>();
	private readonly _matrix = new THREE.Matrix4();
	private readonly _color = new THREE.Color();
	private readonly _materialKeys = new WeakMap<
		THREE.Material,
		{version: number; key: string}
	>();

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

	/**
	 * A scene update visited this node. Its meshes are compared with the
	 * batches at the next `rebuild`. The set is kept per viewport, because
	 * every viewport updates on its own schedule.
	 */
	public markNode(node: ITreeNode): void {
		if (!this._closed) this._touched.set(node.id, node);
	}

	/**
	 * A source mesh is removed from the scene. Its member keeps the instance
	 * until the next `rebuild` decides whether a new mesh of the same data
	 * takes it over.
	 */
	public releaseMesh(mesh: THREE.Object3D): void {
		if (this._closed) return;
		if (mesh instanceof THREE.Mesh) this.forgetLone(mesh);
		const member = this._byMesh.get(mesh);
		if (!member || member.orphan) return;
		member.orphan = true;
		this._orphans.add(member);
		this._byMesh.delete(mesh);
		member.batch.mesh.setVisibleAt(member.instanceId, false);
		// The geometry cache can hand this mesh (or a clone of it) to another
		// node. It must not stay hidden, and must not point at the batch.
		setBatchHidden(mesh, false);
		delete mesh.userData.batchedMesh;
		delete mesh.userData.batchId;
	}

	/** Update the batches of the nodes the scene update visited. */
	public rebuild(): void {
		if (this._closed) {
			this._touched.clear();
			return;
		}
		this.refreshLightSources();
		const scene = this._renderingEngine.sceneTreeManager.scene;
		if (this.root.parent !== scene) scene.add(this.root);
		const nodes = [...this._touched.values()];
		this._touched.clear();
		// The world matrices of the nodes in `nodes` are made current one by
		// one. Members that are not among them did not move, so their matrix
		// is current as well and they do not walk their parents again.
		this._worldMatricesFresh = true;
		try {
			this.reconcile(nodes);
		} finally {
			this._worldMatricesFresh = false;
		}
	}

	private reconcile(nodes: ITreeNode[]): void {
		this.freshenMatrices(nodes);
		const entries: BatchEntry[] = [];
		for (const node of nodes) this.collectNode(node, entries);

		const matched = new Set<BatchMember>();
		const stale = new Set<BatchMember>();
		const adds: BatchEntry[] = [];
		const replaced: {member: BatchMember; entry: BatchEntry}[] = [];
		const apply: BatchMember[] = [];
		for (const entry of entries) {
			const member = this._members.get(entry.id);
			if (!member) {
				adds.push(entry);
				continue;
			}
			// A material replacement, such as the attribute visualization,
			// moves the member to another batch. Hover, selection, and pulse
			// effects keep the key of the batch the member is in, so they
			// draw that one object on its own and do not recopy anything.
			if (this.signatureKey(entry) !== member.batch.key) {
				stale.add(member);
				adds.push(entry);
				continue;
			}
			matched.add(member);
			if (member.buffer !== entry.mesh.geometry) {
				replaced.push({member, entry});
			} else {
				this.adopt(member, entry);
				apply.push(member);
			}
		}

		// Members of a visited node without a mesh any more, and members whose
		// mesh was removed and not replaced, leave their batch.
		for (const node of nodes)
			for (const member of this._byNode.get(node.id) ?? [])
				if (!matched.has(member)) stale.add(member);
		for (const member of this._orphans)
			if (!matched.has(member)) stale.add(member);
		this._orphans.clear();

		const released: THREE.Mesh[] = [];
		let changed = stale.size > 0;
		// Batches that lost members. They are checked once the update is done:
		// a member that is still to be replaced or added can keep one alive.
		const shrunk = new Set<MaterialBatch>();
		this.removeMembers(stale, released, shrunk);

		const chunks = new Map<MaterialBatch, Map<BatchMember, BatchEntry>>();
		for (const {member, entry} of replaced) {
			changed = true;
			const pending = chunks.get(member.batch);
			if (pending) {
				pending.set(member, entry);
			} else if (this.replaceInPlace(member, entry)) {
				apply.push(member);
			} else {
				chunks.set(member.batch, new Map([[member, entry]]));
			}
		}
		for (const [batch, pending] of chunks)
			this.rebuildChunk(batch, pending, released);

		if (adds.length > 0) {
			changed = true;
			this.addEntries(adds);
		}
		for (const batch of shrunk)
			if (this._batches.has(batch) && batch.members.size < 2)
				this.dissolve(batch, released);
		for (const member of apply)
			if (this._members.get(member.id) === member)
				this.applyMember(member);

		// A source mesh that left its batch is drawn again with its own
		// program. Those that joined another batch stay hidden.
		for (const mesh of released)
			if (mesh.visible)
				this._renderingEngine.renderingManager.requestCompile(mesh);
		if (changed)
			this._renderingEngine.postProcessingManager.refreshInstancedEffectSelections();
	}

	private signatureKey(entry: BatchEntry): string {
		if (
			entry.geometry.effectMaterials.length === 0 &&
			entry.geometry.effectPulses.length === 0
		)
			return entry.key;
		return this._members.get(entry.id)?.batch.key ?? entry.key;
	}

	/**
	 * The node matrix or visibility changed without replacing geometry.
	 * Dragged and otherwise excluded members are drawn by their own mesh.
	 */
	public updateTransforms(node: ITreeNode, visible: boolean): void {
		const members = this._byNode.get(node.id);
		if (!members) return;
		for (const member of members) {
			// The mesh is gone. The next rebuild decides about the member.
			if (member.orphan) continue;
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
		for (const batch of this._batches) {
			if (batch.mesh.material !== material) continue;
			// The default-material copy can change transparency.
			this.applyDrawOrder(batch.mesh);
			// A default-material copy changes the source. The member can still
			// be drawn from the batch, so refresh its tint either way.
			for (const member of batch.members) {
				this.writeColor(member);
				// The copy can have changed the batch key of its members. The
				// next update checks them.
				this._touched.set(member.node.id, member.node);
			}
		}
	}

	/** A mesh material was replaced. Stay in the batch when only the color changed. */
	public syncObject(object: THREE.Object3D): void {
		const member = this._byMesh.get(object);
		if (member) {
			this.applyMember(member);
			// A change other than the color moved the member out of its
			// batch, or can bring it back. The next update decides.
			this._touched.set(member.node.id, member.node);
			return;
		}
		if (object instanceof THREE.Mesh) {
			const lone = this._lone.get(object);
			if (lone) this._touched.set(lone.node.id, lone.node);
		}
	}

	/**
	 * God rays draw the light source mesh in their own pass. A member left
	 * in the batch is hidden, so that pass has nothing to draw.
	 */
	public syncLightSources(): void {
		if (this._closed) return;
		this.syncIds(this._lightSources, this.lightSourceIds());
	}

	/**
	 * Outline and bloom have to draw the selected mesh on its own. The rest
	 * of its batch stays together.
	 */
	public syncHeldNodes(): void {
		this.syncIds(
			this._held,
			new Set(
				this._renderingEngine.postProcessingManager.effectNodeIds(),
			),
		);
	}

	public clear(): void {
		this._closed = true;
		for (const batch of [...this._batches]) this.disposeBatch(batch, []);
		this._lone.clear();
		this._loneByKey.clear();
		this._orphans.clear();
		this._touched.clear();
		for (const token of this._listeners)
			this._eventEngine.removeListener(token);
		this._listeners.length = 0;
	}

	/**
	 * Make `current` the new set. Only the members of the nodes that entered
	 * or left the set are applied again.
	 */
	private syncIds(current: Set<string>, next: Set<string>): void {
		const changed: string[] = [];
		for (const id of next) if (!current.has(id)) changed.push(id);
		for (const id of current) if (!next.has(id)) changed.push(id);
		if (changed.length === 0) return;
		current.clear();
		for (const id of next) current.add(id);
		for (const id of changed)
			for (const member of this._byNode.get(id) ?? [])
				this.applyMember(member);
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

	/**
	 * Make the world matrices of the visited nodes current: the node objects
	 * and what hangs on them (meshes, lines, points, three.js objects). The
	 * matrix of a mesh decides whether it batches. The scene walk that did this
	 * for everything is gone, and three.js updates matrices only for the next
	 * frame, so others that read a matrix after an update (picking, anchors)
	 * need it as well.
	 */
	private freshenMatrices(nodes: ITreeNode[]): void {
		const done = new Set<THREE.Object3D>();
		const fresh = (object: THREE.Object3D) => {
			if (done.has(object)) return;
			done.add(object);
			if (object.parent) fresh(object.parent);
			object.updateWorldMatrix(false, false);
		};
		for (const node of nodes) {
			const converted = node.convertedObject[this._renderingEngine.id] as
				| THREE.Object3D
				| undefined;
			if (!converted) continue;
			fresh(converted);
			// Child nodes are visited or unchanged. The rest hangs on this one.
			for (const child of converted.children)
				if (!(child instanceof SDObject))
					child.updateWorldMatrix(false, true);
		}
	}

	/** The batchable meshes of one node, as entries. */
	private collectNode(node: ITreeNode, entries: BatchEntry[]): void {
		const converted = node.convertedObject[this._renderingEngine.id] as
			| THREE.Object3D
			| undefined;
		if (!converted) return;
		// The node is looked at again, so none of its meshes is lone any more.
		for (const child of converted.children)
			if (child instanceof THREE.Mesh) this.forgetLone(child);
		for (const data of node.data) {
			if (!(data instanceof GeometryData)) continue;
			const mesh = this.findMesh(converted, data);
			if (!mesh) continue;
			if (!this.isBatchable(mesh, data)) continue;
			const id = `${node.id}:${data.id}`;
			// A hover or selection material is temporary. A mesh that is
			// batchable only while it wears one would leave its batch again
			// when the effect ends.
			if (
				(data.effectMaterials.length > 0 ||
					data.effectPulses.length > 0) &&
				!this._members.has(id)
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
				// A removed node keeps its meshes, and its data still points at them.
				child.userData.removed !== true &&
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
		// The same string object for an unchanged mesh. Keys are about a
		// kilobyte, and a new string has to be hashed again each time.
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
			const json = material.toJSON(TEXTURE_META) as unknown as Record<
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

	/** The member follows a new mesh of the same data. */
	private adopt(member: BatchMember, entry: BatchEntry): void {
		if (member.mesh !== entry.mesh) this._byMesh.delete(member.mesh);
		member.mesh = entry.mesh;
		member.geometry = entry.geometry;
		member.node = entry.node;
		member.orphan = false;
		this._byMesh.set(entry.mesh, member);
		const batchMesh = member.batch.mesh;
		(batchMesh.userData.batchNodes as (ITreeNode | undefined)[])[
			member.instanceId
		] = entry.node;
		(batchMesh.userData.batchGeometries as (GeometryData | undefined)[])[
			member.instanceId
		] = entry.geometry;
	}

	/**
	 * Place new entries. A key with a chunk that has room (or can grow)
	 * takes them. The rest is packed into new chunks.
	 */
	private addEntries(adds: BatchEntry[]): void {
		const groups = new Map<string, BatchEntry[]>();
		for (const entry of adds) {
			let group = groups.get(entry.key);
			if (!group) {
				group = [];
				groups.set(entry.key, group);
			}
			group.push(entry);
		}
		for (const [key, group] of groups) {
			// A mesh that was alone with its key waits for a partner.
			const lone = this._loneByKey.get(key);
			if (lone) {
				const known = new Set(group.map((entry) => entry.mesh));
				for (const mesh of [...lone]) {
					const entry = this._lone.get(mesh);
					if (!entry || known.has(mesh)) continue;
					// Its node was not visited by this update. The material, the
					// matrix and the node may have changed since it was found.
					mesh.updateWorldMatrix(true, false);
					if (
						mesh.userData.removed === true ||
						this.batchKey(mesh) !== key ||
						!this.isBatchable(mesh, entry.geometry)
					) {
						this.forgetLone(mesh);
						continue;
					}
					group.push(entry);
				}
			}
			let rest = group;
			const existing = this._batchesByKey.get(key);
			if (existing)
				rest = group.filter(
					(entry) =>
						!existing.some((batch) => this.tryAdd(batch, entry)),
				);
			if (rest.length > 0) this.build(this.pack(rest));
		}
	}

	private build(chunks: BatchEntry[][]): void {
		const released: THREE.Mesh[] = [];
		for (const chunk of chunks) {
			// One mesh is already one draw. A single transmissive shell
			// (the amber around the insect) must stay a mesh. Several
			// panes that share a transmissive material still batch:
			// separate transmission draws stack and darken the volume.
			if (chunk.length < 2) {
				for (const entry of chunk) this.rememberLone(entry);
				continue;
			}
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
			const unique = new Set<THREE.BufferGeometry>();
			let vertices = 0;
			let indices = 0;
			for (const entry of chunk) {
				if (unique.has(entry.mesh.geometry)) continue;
				unique.add(entry.mesh.geometry);
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
				indexed,
				members: new Set(),
				geometries: new Map(),
				maxInstances: chunk.length,
				maxVertices: vertices,
				maxIndices: indexed ? indices : 1,
				wastedVertices: 0,
				wastedIndices: 0,
			};
			this._batches.add(batch);
			const sameKey = this._batchesByKey.get(batch.key);
			if (sameKey) sameKey.push(batch);
			else this._batchesByKey.set(batch.key, [batch]);
			this.root.add(batchMesh);
			this._renderingEngine.renderingManager.requestCompile(batchMesh);

			for (const entry of chunk) this.attach(batch, entry);
			// Entries that did not fit in three.js leave a batch of one or none.
			if (batch.members.size < 2) this.dissolve(batch, released);
		}
		for (const mesh of released)
			this._renderingEngine.renderingManager.requestCompile(mesh);
	}

	/**
	 * A batch of one mesh is one draw already, and it hides the source mesh
	 * (see the rule on single transmissive shells). The member goes back to
	 * being a mesh that waits for a partner.
	 */
	private dissolve(batch: MaterialBatch, released: THREE.Mesh[]): void {
		const entries = [...batch.members].map((member) =>
			this.entryOfMember(member),
		);
		this.disposeBatch(batch, released);
		for (const entry of entries) this.rememberLone(entry);
	}

	/** Add an entry to a batch that has room for it. */
	private attach(batch: MaterialBatch, entry: BatchEntry): boolean {
		const batchMesh = batch.mesh;
		this.rememberBounds(entry);
		let info = batch.geometries.get(entry.mesh.geometry);
		if (!info) {
			let id: number;
			try {
				id = batchMesh.addGeometry(entry.mesh.geometry);
			} catch {
				setBatchHidden(entry.mesh, false);
				return false;
			}
			info = {id, count: 0};
			batch.geometries.set(entry.mesh.geometry, info);
		}
		info.count++;
		const instanceId = batchMesh.addInstance(info.id);
		(batchMesh.userData.batchNodes as (ITreeNode | undefined)[])[
			instanceId
		] = entry.node;
		(batchMesh.userData.batchKeys as (string | undefined)[])[instanceId] =
			entry.id;
		(batchMesh.userData.batchGeometries as (GeometryData | undefined)[])[
			instanceId
		] = entry.geometry;

		const member: BatchMember = {
			id: entry.id,
			batch,
			geometryId: info.id,
			instanceId,
			mesh: entry.mesh,
			buffer: entry.mesh.geometry,
			node: entry.node,
			geometry: entry.geometry,
			orphan: false,
		};
		batch.members.add(member);
		this._members.set(entry.id, member);
		this._byMesh.set(entry.mesh, member);
		let nodeMembers = this._byNode.get(entry.node.id);
		if (!nodeMembers) {
			nodeMembers = [];
			this._byNode.set(entry.node.id, nodeMembers);
		}
		nodeMembers.push(member);
		this.forgetLone(entry.mesh);
		this.applyMember(member);
		return true;
	}

	/** Add an entry to a batch that already exists. False if it does not fit. */
	private tryAdd(batch: MaterialBatch, entry: BatchEntry): boolean {
		if (batch.members.size >= MAX_INSTANCES) return false;
		if (
			!batch.geometries.has(entry.mesh.geometry) &&
			!this.reserve(batch, entry.vertices, entry.indices)
		)
			return false;
		this.reserveInstance(batch);
		return this.attach(batch, entry);
	}

	/** Make room for a geometry of the given size, growing the buffers if needed. */
	private reserve(
		batch: MaterialBatch,
		vertices: number,
		indices: number,
	): boolean {
		const mesh = batch.mesh;
		const unusedIndices = () =>
			(mesh as unknown as {unusedIndexCount: number}).unusedIndexCount;
		const fits = () =>
			mesh.unusedVertexCount >= vertices &&
			(!batch.indexed || unusedIndices() >= indices);
		if (fits()) return true;
		// Deleted geometries leave holes. Packing the buffer is cheaper than
		// growing them.
		if (batch.wastedVertices > 0 || batch.wastedIndices > 0) {
			mesh.optimize();
			batch.wastedVertices = 0;
			batch.wastedIndices = 0;
			if (fits()) return true;
		}
		const usedVertices = batch.maxVertices - mesh.unusedVertexCount;
		const usedIndices = batch.maxIndices - unusedIndices();
		if (
			usedVertices + vertices > MAX_VERTICES ||
			(batch.indexed && usedIndices + indices > MAX_INDICES)
		)
			return false;
		const nextVertices = Math.min(
			MAX_VERTICES,
			Math.max(
				usedVertices + vertices,
				Math.ceil(batch.maxVertices * GROWTH),
			),
		);
		const nextIndices = batch.indexed
			? Math.min(
					MAX_INDICES,
					Math.max(
						usedIndices + indices,
						Math.ceil(batch.maxIndices * GROWTH),
					),
				)
			: batch.maxIndices;
		mesh.setGeometrySize(nextVertices, nextIndices);
		batch.maxVertices = nextVertices;
		batch.maxIndices = nextIndices;
		return true;
	}

	private reserveInstance(batch: MaterialBatch): void {
		if (batch.mesh.instanceCount < batch.mesh.maxInstanceCount) return;
		const next = Math.min(
			MAX_INSTANCES,
			Math.max(
				batch.mesh.maxInstanceCount + 1,
				Math.ceil(batch.mesh.maxInstanceCount * GROWTH),
			),
		);
		batch.mesh.setInstanceCount(next);
		batch.maxInstances = next;
	}

	/**
	 * Give a member the geometry of its new mesh without rebuilding the chunk.
	 * False when the chunk has to be rebuilt.
	 */
	private replaceInPlace(member: BatchMember, entry: BatchEntry): boolean {
		const batch = member.batch;
		const batchMesh = batch.mesh;
		const target = entry.mesh.geometry;
		const previous = batch.geometries.get(member.buffer);
		if (!previous) return false;
		try {
			this.rememberBounds(entry);
			let info = batch.geometries.get(target);
			if (info) {
				// The batch holds this geometry already.
				info.count++;
				batchMesh.setGeometryIdAt(member.instanceId, info.id);
			} else {
				const range = batchMesh.getGeometryRangeAt(previous.id);
				if (
					range &&
					previous.count === 1 &&
					entry.vertices <= range.reservedVertexCount &&
					(!batch.indexed ||
						entry.indices <= range.reservedIndexCount)
				) {
					// Nobody else draws the old geometry and the new one fits
					// into its space: overwrite it.
					batchMesh.setGeometryAt(previous.id, target);
					batch.geometries.delete(member.buffer);
					batch.geometries.set(target, previous);
					member.buffer = target;
					this.adopt(member, entry);
					return true;
				}
				if (!this.reserve(batch, entry.vertices, entry.indices))
					return false;
				const id = batchMesh.addGeometry(target);
				info = {id, count: 1};
				batch.geometries.set(target, info);
				batchMesh.setGeometryIdAt(member.instanceId, id);
			}
			this.markDrawListStale(batchMesh);
			previous.count--;
			if (previous.count === 0) this.deleteGeometry(batch, previous.id);
			if (previous.count === 0) batch.geometries.delete(member.buffer);
			member.buffer = target;
			member.geometryId = info.id;
			this.adopt(member, entry);
			return true;
		} catch {
			return false;
		}
	}

	/** three.js r184 does not flag a draw list change in setGeometryIdAt. */
	private markDrawListStale(mesh: THREE.BatchedMesh): void {
		(mesh as unknown as {_visibilityChanged: boolean})._visibilityChanged =
			true;
	}

	private deleteGeometry(batch: MaterialBatch, geometryId: number): void {
		const range = batch.mesh.getGeometryRangeAt(geometryId);
		if (range) {
			batch.wastedVertices += range.reservedVertexCount;
			batch.wastedIndices += batch.indexed ? range.reservedIndexCount : 0;
		}
		batch.mesh.deleteGeometry(geometryId);
	}

	/**
	 * Build the chunk again from its members, with the replacements. Only
	 * this chunk is touched.
	 */
	private rebuildChunk(
		batch: MaterialBatch,
		replacements: Map<BatchMember, BatchEntry>,
		released: THREE.Mesh[],
	): void {
		const entries: BatchEntry[] = [];
		for (const member of batch.members) {
			const replacement = replacements.get(member);
			// The replacement can wear a hover material. The chunk keeps its key.
			entries.push(
				replacement
					? {...replacement, key: member.batch.key}
					: this.entryOfMember(member),
			);
		}
		this.disposeBatch(batch, released);
		this.build(this.pack(entries));
	}

	private entryOfMember(member: BatchMember): BatchEntry {
		const index = member.mesh.geometry.getIndex();
		return {
			id: member.id,
			key: member.batch.key,
			mesh: member.mesh,
			node: member.node,
			geometry: member.geometry,
			vertices: member.mesh.geometry.getAttribute("position").count,
			indices: index ? index.count : 0,
		};
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

	private rememberLone(entry: BatchEntry): void {
		this._lone.set(entry.mesh, entry);
		let meshes = this._loneByKey.get(entry.key);
		if (!meshes) {
			meshes = new Set();
			this._loneByKey.set(entry.key, meshes);
		}
		meshes.add(entry.mesh);
	}

	private forgetLone(mesh: THREE.Mesh): void {
		const entry = this._lone.get(mesh);
		if (!entry) return;
		this._lone.delete(mesh);
		const meshes = this._loneByKey.get(entry.key);
		if (!meshes) return;
		meshes.delete(mesh);
		if (meshes.size === 0) this._loneByKey.delete(entry.key);
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
		// Material.copy does not copy onBeforeCompile. That hook declares the
		// shadow uniforms. It also stores the compiled shader on the
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
		// The mesh is gone. The member is removed with the next rebuild.
		if (member.orphan) return;
		if (this.isIndividual(member)) {
			member.batch.mesh.setVisibleAt(member.instanceId, false);
			// A source mesh that is drawn on its own from now on needs its
			// own program.
			if (!member.mesh.visible)
				this._renderingEngine.renderingManager.requestCompile(
					member.mesh,
				);
			setBatchHidden(member.mesh, false);
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
		setBatchHidden(member.mesh, true);
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

	/**
	 * Take members out of their batches. A batch that loses every member is
	 * disposed as a whole.
	 */
	private removeMembers(
		members: Set<BatchMember>,
		released: THREE.Mesh[],
		shrunk: Set<MaterialBatch>,
	): void {
		if (members.size === 0) return;
		const perBatch = new Map<MaterialBatch, BatchMember[]>();
		for (const member of members) {
			const list = perBatch.get(member.batch);
			if (list) list.push(member);
			else perBatch.set(member.batch, [member]);
		}
		for (const [batch, list] of perBatch) {
			if (list.length === batch.members.size) {
				this.disposeBatch(batch, released);
				continue;
			}
			for (const member of list) {
				this.detach(member);
				this.forget(member, released);
			}
			shrunk.add(batch);
		}
	}

	/** Free the instance of a member and, with the last user, its geometry. */
	private detach(member: BatchMember): void {
		const batch = member.batch;
		const batchMesh = batch.mesh;
		batchMesh.deleteInstance(member.instanceId);
		(batchMesh.userData.batchNodes as (ITreeNode | undefined)[])[
			member.instanceId
		] = undefined;
		(batchMesh.userData.batchKeys as (string | undefined)[])[
			member.instanceId
		] = undefined;
		(batchMesh.userData.batchGeometries as (GeometryData | undefined)[])[
			member.instanceId
		] = undefined;
		const info = batch.geometries.get(member.buffer);
		if (!info) return;
		info.count--;
		if (info.count > 0) return;
		batch.geometries.delete(member.buffer);
		this.deleteGeometry(batch, info.id);
	}

	/** Remove a member from the lookups. Its source mesh is drawn again. */
	private forget(member: BatchMember, released: THREE.Mesh[]): void {
		member.batch.members.delete(member);
		this._members.delete(member.id);
		this._orphans.delete(member);
		const nodeMembers = this._byNode.get(member.node.id);
		if (nodeMembers) {
			const index = nodeMembers.indexOf(member);
			if (index >= 0) nodeMembers.splice(index, 1);
			if (nodeMembers.length === 0) this._byNode.delete(member.node.id);
		}
		if (this._byMesh.get(member.mesh) === member)
			this._byMesh.delete(member.mesh);
		if (member.orphan) return;
		setBatchHidden(member.mesh, false);
		delete member.mesh.userData.batchedMesh;
		delete member.mesh.userData.batchId;
		released.push(member.mesh);
	}

	/** Dispose one chunk. Its members' meshes are drawn on their own again. */
	private disposeBatch(batch: MaterialBatch, released: THREE.Mesh[]): void {
		for (const member of [...batch.members]) this.forget(member, released);
		this.root.remove(batch.mesh);
		this.disposeBatchMesh(batch.mesh);
		this._renderingEngine.materialLoader.removeFromMaterialCache(
			batch.cacheKey,
		);
		this._batches.delete(batch);
		const sameKey = this._batchesByKey.get(batch.key);
		if (sameKey) {
			const index = sameKey.indexOf(batch);
			if (index >= 0) sameKey.splice(index, 1);
			if (sameKey.length === 0) this._batchesByKey.delete(batch.key);
		}
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
