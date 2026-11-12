---
paths:
    - "rendering-engine/rendering-engine-threejs/src/**"
    - "data-engine/geometry-engine/src/**"
    - "data-engine/gltf-converter/src/**"
    - "shared/node-tree/src/**"
    - "tests/instancing/**"
---

# GPU instancing

- Default is **off**. Detection uses glTF accessor identity and a count/type fingerprint; byte hashing and baked-transform vertex walks run only when a second primitive shares that fingerprint.
- Enable with `viewport.gpuInstancing.enabled = true`. Detection is reference-counted across viewports; enabling also scans already-loaded opaque triangle geometry and reconverts the current scene. That scan must match parse-time grouping: same primitive or byte-identical attributes, material **except color**. Do **not** key on `material.id` or the runtime scan will miss color variants. Disabling drops instance groups and reconverts to regular meshes. Baked-transform recovery still runs only at glTF parse time.
- `EXT_mesh_gpu_instancing` is unchanged and does not go through this path.
- Instance world bounds use the same local AABB × (`worldMatrix` × offset) as regular meshes. Do not vertex-walk placeholders.
- Color-only variants of a batched primitive keep distinct `material.id`s; the tint lives in `instanceColor`. Do **not** treat that id mismatch as a per-occurrence material override (`effectMeshCount`). Overrides are for interaction highlights and for a material assigned after the occurrence joined the batch.
- Toggling instancing disposes and recreates meshes. Refresh outline/bloom selections after that conversion so they do not keep disposed objects.
- Exporting baked instances: near-identical `instanceOffsetMatrix` values (epsilon) share a transform. Fold that offset into the parent node only when the node has **no children**; if it has descendants (or mixed offsets), put the geometry on a synthetic child so the original children do not inherit the offset.
- Instanced picking stores `${node.id}:${geometry.id}` on each slot (`instanceKeys`). Do not resolve a hit as "first GeometryData with this instanceHash" when one node has several identical primitives.
