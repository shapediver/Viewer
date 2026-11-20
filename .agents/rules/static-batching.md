# Static triangle batches and shared primitive geometry

## Static triangle batches

- Static triangle meshes that share a material, aside from color, are one `BatchedMesh` per chunk. Do not key the batch on `material.id`. Color-only variants keep distinct ids; the tint is `setColorAt`. `renderer.sortObjects` does not reorder triangles inside one batch.
- Lines, points, morph targets, GPU-instanced meshes, and the node being dragged stay individual meshes. Put a dragged node back when the drag ends.
- A chunk of one mesh stays a mesh. It is already one draw. Wrapping it in a `BatchedMesh` hides the source, and that is what dropped the insect inside the MosquitoInAmber shell.
- A transparent material that writes depth stays one mesh per object. Modules Concept's glass is ten double-sided panes with opacity below 1 and `depthWrite` true. three.js draws a transparent double-sided object back faces first, then front faces. Batch-wide, the back faces of a near pane hide the front faces of a far one.
- Blended meshes with `depthWrite` false batch. `BatchedMesh` sorts its instances far-to-near, and the two-pass draw runs once for the batch, not once per pane. Do not set `forceSinglePass` on the batch: on stacked glass boxes it changed three times as many pixels as the two-pass draw.
- Copy the source `defines` onto the batch material. `MeshStandardMaterial.copy` and `MeshPhysicalMaterial.copy` reset them, which drops the environment map type and the legacy PBR mode. The batch is then shaded by stock three.js, and a metal without an environment map turns black. That was the cage floor. Double-sided metal batches.
- Meshes that share a `BufferGeometry` are one `addGeometry` and one `addInstance` each. Size the batch and the chunk limits by unique geometries.
- The node passed to god-ray `setLightSource`, and its descendants, stay their own meshes. The effect draws that mesh in a separate pass. A hidden batch member produces no rays. Removing the effect puts the node back in the batch.
- Picking reads `intersection.batchId` and the batch's node list. The hidden source mesh is not a second hit. Hiding or recoloring one member uses `setVisibleAt` / `setColorAt` and leaves the others in the batch. A material edit other than color draws that object on its own until the next scene rebuild.
- A node whose world matrix has a negative determinant stays its own mesh. The batch object is identity, and three.js flips winding only from `object.matrixWorld`, so a mirrored instance would drop `FrontSide` faces. A transform-only update that removes the mirror puts the mesh back in the batch and hides it. Leaving that mesh visible draws the surface twice until a full rebuild.
- A transform-only update writes batch matrices from `mesh.matrixWorld`. Apply the node matrix before converting children. Children used to run first, so `matrixWorld` was still the previous pose and descendants stayed there until a full rebuild.
- Outline and bloom extract the selected node and its descendants. Both effects traverse that subtree. A descendant left in the batch stays hidden, and the batch mesh is not in the selection.
- The batch material keeps the source `onBeforeCompile`. `Material.copy` does not copy it, and that hook declares the shadow uniforms. The compiled shader is stored on the batch material so soft-shadow updates reach it. Take that source from the material cache. A pulse clone keeps the cache key and drops the hook; building the chunk from the clone publishes hard shadows for the other members.
- Register the batch with the source material data. `materialData === null` means the material follows the viewport default, so a default change runs `material.copy` on it. That copy replaces color, maps, and `userData`. An authored batch must not use the null marker. A batch that does follow the default keeps a white color, the shadow hook, and the shader reference, then rewrites instance colors from the updated sources.
- A material's own environment map is assigned to every cached material that uses that material data, including the batch. `assignEnvironmentMap` moves on after an unlit, Lambert, or Phong material. A `return` there skips every later entry, and batches are registered after the scene materials.
- Cloning a mesh that is already in a batch must not `JSON.stringify` `userData.batchedMesh`. That reference is circular. Remove it for the clone and put it back on the original mesh.

## Shared primitive geometry

- A primitive-cache hit reuses the cached `BufferGeometry`. Do not `clone()` it there. In three r184, `BufferAttribute.clone` allocates a new typed array, so every reuse becomes a new CPU copy and a new GPU upload.
- Per-object ids (`SDid`, `SDversion`, `primitiveSDid`, `primitiveSDversion`) live on the `Object3D`. Removal reads them from the object. Do not stamp one object's userData onto a shared geometry.
- `convertToTriangleMode` replaces the index for `TRIANGLE_STRIP` and `TRIANGLE_FAN`. Clone before that write. The cached geometry stays as parsed. Dispose of the shared geometry only when the last primitive-cache user is gone.
- A gem's center and radius are the tight sphere around the positions. Measure that into a temporary sphere and restore the geometry's box and sphere. The shared `boundingSphere` stays the one AABB sphere used for culling.
- This is not GPU instancing. Leave that path alone.
