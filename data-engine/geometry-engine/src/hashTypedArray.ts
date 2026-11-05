/**
 * MurmurHash3 (x86, 32 bit) over the bytes of a typed array.
 *
 * Every input bit must reach every output bit. A word-wise FNV-1a only
 * carries bits upward, so a float's sign bit flips just the top bit of the
 * hash and two negated components cancel: a copy rotated by 180° about an
 * axis hashes like the original.
 */
export const hashTypedArray = (
	array: ArrayBufferView & {length: number},
): string => {
	const bytes = new Uint8Array(
		array.buffer,
		array.byteOffset,
		array.byteLength,
	);
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const len = bytes.length;
	let hash = 0;
	let i = 0;
	for (; i + 4 <= len; i += 4) {
		let k = Math.imul(view.getUint32(i, true), 0xcc9e2d51);
		k = Math.imul((k << 15) | (k >>> 17), 0x1b873593);
		hash ^= k;
		hash = (hash << 13) | (hash >>> 19);
		hash = (Math.imul(hash, 5) + 0xe6546b64) | 0;
	}
	if (i < len) {
		let k = 0;
		for (let shift = 0; i < len; i++, shift += 8) k |= bytes[i] << shift;
		k = Math.imul(k, 0xcc9e2d51);
		k = Math.imul((k << 15) | (k >>> 17), 0x1b873593);
		hash ^= k;
	}
	hash ^= len;
	hash ^= hash >>> 16;
	hash = Math.imul(hash, 0x85ebca6b);
	hash ^= hash >>> 13;
	hash = Math.imul(hash, 0xc2b2ae35);
	hash ^= hash >>> 16;
	return `${array.constructor.name}:${array.length}:${hash >>> 0}`;
};
