---
paths:
    - "rendering-engine/rendering-engine-threejs/src/**"
    - "api/viewport/src/**"
    - "shared/node-tree/src/**"
    - "examples/simple/**"
    - "tests/**"
---

# Viewer load: visibility, bounds, lines

## When the viewport is actually visible

- Default viewport `visibility` is `SESSION`. The branding logo stays up, and the canvas is `display: none`, until session settings apply, a non-empty bounding box exists, **and** the first WebGL frame has run.
- `createSession()` resolving is not "the model is on screen." Measure `EVENTTYPE.VIEWPORT.VIEWPORT_VISIBLE` (logo off), not session wall clock alone.
- Do not time `createSession` on an already-created viewport and treat that as cold-load UX. A ticket URL on `localhost:8080` also pays bundle parse plus the first GPU upload of every object.

## Scene bounding boxes and lines

- `GeometryData.boundingBox` is already the local AABB. World box: `geometry.boundingBox.clone().applyMatrix(node.worldMatrix)`.
- Do **not** `clone()` every object and `Box3.setFromObject(clone, true)` per node; that vertex-walked ~6k lines in ~8 s.
- The viewer does **not** merge line primitives. Each exported line is its own node / `THREE.LineSegments` / draw call. First-frame upload of thousands of them dominates remaining load time; batch in Grasshopper or a dedicated merge pass, not ad-hoc clones.
