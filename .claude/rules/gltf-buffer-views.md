---
paths:
    - "data-engine/geometry-engine/src/**"
---

# glTF buffer views

- Overlapping `bufferView`s on one BIN are valid glTF. Do **not** `ArrayBuffer.slice()` each view; thousands of line primitives will copy ~1 GB from ~1–2 MB of data and can throw `RangeError: Array buffer allocation failed`.
- Share the source buffer and pass `byteOffset` / `byteLength` into typed arrays, Draco `Int8Array`, and image `Uint8Array`/`Blob`s. Sparse accessors must still copy before write (Three.js already `.slice()`s in that path).
- `BufferViewLoader` is internal to `geometry-engine`; do not change its return type as a public API.
