# Standard and physical material classes

- A `MaterialStandardData` is drawn with three.js `MeshStandardMaterial` unless `needsPhysicalMaterial` (`MaterialLoader.ts`) says physical: clearcoat, sheen or transmission above 0, ior not 1.5, specular intensity not 1, specular colour not white, or a specular map. The picture is the same. The viewport default material follows the same rule. The "gem" material override, and non-standard data under the "standard" override, stay physical.
- Check `instanceof THREE.MeshStandardMaterial` when code means "a PBR material of the loader". That covers physical, gem and specular-glossiness too. `instanceof MeshPhysicalMaterial` misses plain materials: they lose the environment map type define, and metals turn black.
- `getMaterialProperties` builds physical keys and their textures only for physical materials. Do not pass its result for a standard material to `new MeshPhysicalMaterial` and expect the data's physical values.
- `Material.copy` cannot change the class, and `MeshPhysicalMaterial.copy(standard)` reads `undefined` physical fields. Copy from a source of the target's own class.
- An existing mesh reloads its material on a scene update only when the material data id changes (`GeometryLoader.isMaterialReplaced`). Dropping a cache entry and calling `root.updateVersion()` alone leaves the old material on the mesh. A default material dropped for the other class is caught through `MaterialLoader.isDropped`.
- An in-place edit of material data needs `updateVersion()` on the geometry, the material and the node before `viewport.update()`. With only the material's version the mesh keeps its material.
- GPU instance materials (`gpu-instance/*` cache keys) are not reloaded by a scene update. They keep their class and are copied in place.
