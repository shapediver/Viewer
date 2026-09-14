# Opt-in GPU Instancing

The viewer can batch repeated glTF geometry into `THREE.InstancedMesh`
groups, reducing draw calls for scenes that contain the same part many times
(screws, mullions, panels, …). Batching is decided per primitive while a
glTF/GLB is parsed, and applied when the scene is rendered.

**This is opt-in.** Load-time detection and runtime batching default to off so
ordinary loads are unchanged. Unique meshes are matched with accessor identity
and a count/type fingerprint; byte hashing and baked-transform walks run only
when a second primitive looks similar. Enabling scans already-loaded opaque
triangle geometry (shared primitives and byte-identical copies; baked
transforms are recovered only while parsing).

```js
viewport.gpuInstancing.enabled = true;
```

`viewport.gpuInstancing` is internal (not part of the public API). Setting
`enabled` retains `GeometryEngine` detection for this page (reference-counted
across viewports).

## When a primitive is batched

Detection happens in
`data-engine/geometry-engine/src/gltfv2/loaders/GeometryLoader.ts`
(`canPrimitiveBeInstanced`). A primitive participates in a GPU instance group only
if **all** of the following hold:

1. GPU instancing is enabled (`viewport.gpuInstancing.enabled = true`).
2. It comes from a glTF/GLB load (other content formats never batch).
3. **At least two occurrences of the same geometry** are loaded from the same
   asset URL. An occurrence counts when either
    - a primitive's content is byte-identical (all vertex attributes, the index
      buffer, primitive extensions and mode, and the material **excluding its
      base color factor and name**) — occurrences differing only in base color
      still batch, the color is applied per instance; or
    - one glTF **mesh is referenced by several nodes**; or
    - a primitive is a **baked-transform copy** of an earlier one: the same
      vertices pre-transformed by a rigid transform (rotation + translation).
      The transform is recovered by vertex-by-vertex verification and applied
      as a per-instance offset matrix (`GeometryData.instanceOffsetMatrix`).
      Restricted to densely packed float32 positions/normals without tangents;
      mirrored copies are rejected.
4. The primitive is a plain triangle mesh (`mode === 4`, the default).
5. The referencing node does not use `EXT_mesh_gpu_instancing` (the explicit
   extension keeps its own, conventional `InstancedMesh` path).
6. No morph targets, no skinning (`JOINTS_0` / `WEIGHTS_0`), no
   `KHR_materials_variants`.
7. The material is fully opaque (`alphaMode` unset or `OPAQUE`, base color
   alpha = 1). Transparent geometry needs per-object depth sorting that a batch
   cannot provide.

A single occurrence renders as a regular mesh.

Detection does **not** walk vertex bytes for unique meshes. It first matches
glTF accessor identity (same buffer range) and a count/type fingerprint.
Byte hashing and baked-transform vertex walks run only when a second
primitive shares that fingerprint.

## Attribute visualization

The attribute renderer (`RENDERER_TYPE.ATTRIBUTES`) also batches: the flat
attribute color of each occurrence is carried by the per-instance color
attribute over a white batch material. An occurrence whose attribute material
is not fully opaque leaves the batch (its own transparent batch at runtime, or
the regular path at load time).

## Interaction highlights

Interaction effect materials (hover/selection) apply **per occurrence**: the
highlighted instances move into their own batch carrying the highlight
material, while the rest of the group keeps its shared material
(`InstanceGroupManager.setMaterialOverride`).

## Debugging

`viewport.gpuInstancing` (internal, not part of the public API):

- `.enabled = true` → retain load-time detection (reference-counted across
  viewports), scan already-loaded opaque triangle geometry, and batch on the
  next scene conversion
- `.enabled = false` → newly converted scenes use the regular per-mesh path;
  detection stays on if another viewport still holds a retain
- `.stats` → `{groupCount, instanceCount, effectMeshCount, drawCallCount}`

## How it works at runtime

`rendering-engine/rendering-engine-threejs/src/managers/InstanceGroupManager.ts`
owns one `InstancedMesh` per content hash under an `instancedRoot` group. Each
occurrence's tree node contributes its world matrix (× offset matrix for
baked-transform occurrences) and color as one instance slot; a lightweight
placeholder object represents it in the regular scene-object hierarchy so
cleanup, bounding boxes and effects keep working.

- **Picking**: the intersection engine raycasts the batches and maps
  `instanceId` back to the owning tree node.
- **Post-processing effects** (outline, selective bloom): instances are
  partitioned into per-effect-combination meshes, so effects apply per instance
  without rendering anything twice.
- **Visibility**: hidden instances are removed from the InstancedMesh count
  (swap-and-pop) and restored when shown.
- **Frustum culling**: each batch recomputes its bounding sphere from instance
  matrices once per scene conversion.
- **Shadows**: batches inherit `castShadow`/`receiveShadow` from their source
  geometry.

## Tests

`tests/instancing/` contains the Playwright suite; its `.glb` assets are
generated by `tests/instancing/generate-assets.js` and served via request
interception. The suite turns instancing on in the worker setup. It covers
duplicated meshes, shared meshes, baked transforms, per-instance visibility,
interaction highlights, and the regular-path fallback (pixel-identical
rendering with instancing disabled).

## Guidance for producing instancing-friendly glTFs

- Repeat geometry as byte-identical meshes, or reference one mesh from many
  nodes, within one file. Baked rigid transforms are recovered automatically,
  but keeping transforms on nodes is cheaper and exact.
- Keep repeated parts opaque and give them the same material except for the
  base color factor.

## Known limitations

- Baked-transform recovery only handles rigid transforms (no scaling or
  mirroring) on packed float32 data without tangents, and only while parsing
  a glTF (not when scanning an already-loaded tree).
- Non-opaque attribute materials fall back to the regular path / per-occurrence
  batches.

Material-color handling: the glTF base color factor moves into the
per-instance color and the shared batch material is whitened — but only when
the primitive has actual glTF material data. Geometry without a material keeps
the default viewer material (and its color) on the batch, with neutral white
instance colors.
