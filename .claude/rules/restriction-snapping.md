---
paths:
    - "rendering-engine/intersection-restriction-engine/src/**"
    - "features/drawing-tools/src/**"
    - "features/interaction/src/**"
    - "features/transformation-tools/src/**"
---

# Restriction snapping: grids, picking, occlusion

Placement on a mesh uses drawing-tool geometry restrictions. A missing cursor means `RestrictionManager.rayTrace` returned nothing.

## Grids and picking

- `gridSize` is the snap spacing in world units; `radius` is the pick radius. A square cell is fully covered only when the point/line threshold is at least `gridSize / sqrt(2)`. Ignoring `gridSize` leaves gaps between points.
- Point clouds report every point inside the radius. Choose the one closest to the ray, and only among hits near the front of that run. The first hit along the ray is often a neighbor, and on a fine grid that neighbor is rejected as hidden.
- `radius: 0` without `gridSize` must stay a zero threshold. Boundary restrictions rely on it to avoid picking nearby points.

## Occlusion of `hideable` snaps

- A `hideable` snap is dropped when a fully opaque scene hit is closer along the same ray (compare with a small slack). The invisible rectangle pick mesh does not count; its opacity is 0.
- The occlusion test must skip the dragged node, its grouped nodes, and the nodes the transform tool is moving (`occlusionExcludedNodes`). Never treat that object's own mesh as an occluder. A face-on orthographic ray hits the dragged object's face before snap lines just behind it; perspective rays often meet the line first, so the same model snaps in one camera and not the other.
- The pick radius is a distance across the hit face. Accept a snap that lies on that face within the radius, even when it is farther along the ray than the hit (angled views). Judge with the hit plane, not depth along the ray.
- The plane is the first hit that has a face normal. Grid lines and points are often closer, have no normal, and their raycast distance is the foot on the ray. A line hit alone must not hide a snap on the face behind it.
- A parallel surface on the hidden side of the plane, such as the boundary mesh 0.05 behind the lines, stays hidden.
